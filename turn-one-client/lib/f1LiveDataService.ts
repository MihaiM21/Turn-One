'use client';

import * as pako from 'pako';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.t1f1.com/api';

// Browser-compatible F1 Live Data Service
export interface F1LiveData {
  CarData?: any;
  Position?: any;
  TimingData?: any;
  SessionInfo?: any;
  WeatherData?: any;
  TrackStatus?: any;
  DriverList?: any;
  RaceControlMessages?: any;
  SessionData?: any;
  LapCount?: any;
  TeamRadio?: any;
  Heartbeat?: any;
  ExtrapolatedClock?: any;
  TimingStats?: any;
  TimingAppData?: any;
  [key: string]: any; // Allow dynamic field access
}

interface SignalRMessage {
  H?: string;
  M?: string;
  A?: any[];
  I?: string;
}

interface SignalRResponse {
  M?: SignalRMessage[];
  R?: any;
  I?: string;
}

interface NegotiationResponse {
  ConnectionToken: string;
}

export type F1DataCallback = (data: F1LiveData) => void;
export type F1StatusCallback = (status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'no-session') => void;

export class F1LiveDataService {
  private readonly signalrUrl = "livetiming.formula1.com/signalr";
  private readonly signalrHub = "Streaming";
  private readonly proxyUrl = `${API_URL}/f1livetiming`; // Use backend proxy
  private readonly retryFreq = 15000;
  private readonly maxRetries = 5;

  private state: F1LiveData = {};
  private lastReceivedData: F1LiveData = {}; // Store the last data permanently
  private messageCount = 0;
  private emptyMessageCount = 0;
  private websocket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private keepAliveTimer: NodeJS.Timeout | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private lastActivity = 0;
  private lastDataReceived = 0;

  private dataCallbacks: F1DataCallback[] = [];
  private statusCallbacks: F1StatusCallback[] = [];

  constructor() {
    // Load persisted data from localStorage if available
    this.loadPersistedData();

    // Check for session activity periodically
    setInterval(() => {
      this.checkSessionActivity();
    }, 30000); // Check every 30 seconds

    // Send keep-alive ping every 15 seconds to maintain connection
    setInterval(() => {
      this.sendKeepAlive();
    }, 15000);
  }

  private loadPersistedData(): void {
    try {
      const stored = localStorage.getItem('f1-last-data');
      if (stored) {
        this.lastReceivedData = JSON.parse(stored);
        this.state = { ...this.lastReceivedData }; // Initialize state with persisted data
        console.log('Loaded persisted F1 data from localStorage');
      }
    } catch (error) {
      console.warn('Failed to load persisted F1 data:', error);
    }
  }

  private persistData(): void {
    try {
      localStorage.setItem('f1-last-data', JSON.stringify(this.lastReceivedData));
      localStorage.setItem('f1-last-update', new Date().toISOString());
    } catch (error) {
      console.warn('Failed to persist F1 data:', error);
    }
  }

  private sendKeepAlive(): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      try {
        // Send a ping message to keep connection alive
        const pingMessage = {
          H: this.signalrHub,
          M: "Ping",
          A: [],
          I: Math.floor(Math.random() * 1000000)
        };
        this.websocket.send(JSON.stringify(pingMessage));
        console.log('Sent keep-alive ping');
      } catch (error) {
        console.warn('Failed to send keep-alive:', error);
      }
    }
  }

  private deepObjectMerge(original: Record<string, any> = {}, modifier?: Record<string, any>): Record<string, any> {
    if (!modifier) return original;
    const copy = { ...original };
    for (const [key, value] of Object.entries(modifier)) {
      const valueIsObject =
        typeof value === "object" && !Array.isArray(value) && value !== null;
      if (valueIsObject && !!Object.keys(value).length) {
        copy[key] = this.deepObjectMerge(copy[key], value);
      } else {
        copy[key] = value;
      }
    }
    return copy;
  }

  private parseCompressed(data: string): any {
    try {
      // Use pako for proper compression/decompression
      const binaryData = Uint8Array.from(atob(data), c => c.charCodeAt(0));
      const decompressed = pako.inflateRaw(binaryData, { to: 'string' });
      return JSON.parse(decompressed);
    } catch (error) {
      console.warn('Could not parse compressed data, trying as regular JSON:', error);
      try {
        return JSON.parse(atob(data));
      } catch (jsonError) {
        console.error('Failed to parse data as JSON:', jsonError);
        return {};
      }
    }
  }

  private updateState(data: string): void {
    try {
      const parsed: SignalRResponse = JSON.parse(data);

      if (!Object.keys(parsed).length) {
        this.emptyMessageCount++;
      } else {
        this.emptyMessageCount = 0;
        this.lastActivity = Date.now();
        this.lastDataReceived = Date.now();
      }

      let hasNewData = false;

      // Handle real-time feed updates
      if (Array.isArray(parsed.M)) {
        for (const message of parsed.M) {
          if (message.M === "feed") {
            this.messageCount++;
            hasNewData = true;

            let [field, value] = message.A || [];

            // Handle compressed data formats
            if (field === "CarData.z" || field === "Position.z") {
              const [parsedField] = field.split(".");
              field = parsedField;
              value = this.parseCompressed(value);
            }

            // Update state immediately for real-time data
            if (field === "TimingData" || field === "CarData" || field === "Position") {
              // These fields need immediate updates for live timing
              this.state = this.deepObjectMerge(this.state, { [field]: value });
              this.lastReceivedData = this.deepObjectMerge(this.lastReceivedData, { [field]: value });
              // Trigger callback immediately for critical real-time data
              this.notifyDataCallbacks();
            } else {
              // For other fields, merge them normally
              this.state = this.deepObjectMerge(this.state, { [field]: value });
              this.lastReceivedData = this.deepObjectMerge(this.lastReceivedData, { [field]: value });
            }
          }
        }
      } else if (Object.keys(parsed.R ?? {}).length && parsed.I === "1") {
        // Handle initial data load
        this.messageCount++;
        hasNewData = true;

        if (parsed.R["CarData.z"]) {
          parsed.R["CarData"] = this.parseCompressed(parsed.R["CarData.z"]);
          delete parsed.R["CarData.z"];
        }

        if (parsed.R["Position.z"]) {
          parsed.R["Position"] = this.parseCompressed(parsed.R["Position.z"]);
          delete parsed.R["Position.z"];
        }

        this.state = this.deepObjectMerge(this.state, parsed.R);
        this.lastReceivedData = this.deepObjectMerge(this.lastReceivedData, parsed.R);
      }

      // Persist and notify for non-realtime updates
      if (hasNewData) {
        this.persistData(); // Save to localStorage

        // For non-critical updates, debounce the notification
        if (!this.debounceTimer) {
          this.debounceTimer = setTimeout(() => {
            this.notifyDataCallbacks();
            this.debounceTimer = null;
          }, 100); // Debounce updates by 100ms
        }
      }
    } catch (error) {
      console.error(`Could not update data:`, error);
    }
  }

  private checkSessionActivity(): void {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;

    // Only mark as no-session if we never received any data AND no activity for 5+ minutes
    if (timeSinceLastActivity > 300000 && this.messageCount === 0) {
      console.log('No activity detected and no data ever received');
      this.notifyStatusCallbacks('no-session');
    } else if (timeSinceLastActivity > 120000 && this.messageCount > 0) {
      console.log('Connection seems inactive but keeping last data available');
      // Don't change status - keep showing last data
    }
  }

  private async setupStream(): Promise<void> {
    try {
      console.log(`[${this.signalrUrl}] Connecting to F1 live timing stream via proxy...`);
      this.notifyStatusCallbacks('connecting');

      const hub = encodeURIComponent(JSON.stringify([{ name: this.signalrHub }]));

      // Use backend proxy instead of direct connection
      const negotiationUrl = `${this.proxyUrl}/negotiate?connectionData=${hub}&clientProtocol=1.5`;

      const negotiationResponse = await fetch(negotiationUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include', // Include cookies if needed
      });

      if (!negotiationResponse.ok) {
        if (negotiationResponse.status === 404) {
          console.log('F1 live timing not available (404) - likely no active session');
          this.notifyStatusCallbacks('no-session');
          return;
        }
        throw new Error(`Negotiation failed: ${negotiationResponse.status}`);
      }

      const negotiationData: NegotiationResponse = await negotiationResponse.json();

      if (!negotiationData.ConnectionToken) {
        throw new Error("Missing connection token from negotiation");
      }

      console.log(`[${this.signalrUrl}] HTTP negotiation complete via proxy`);

      const wsUrl = `wss://${this.signalrUrl}/connect?clientProtocol=1.5&transport=webSockets&connectionToken=${encodeURIComponent(
        negotiationData.ConnectionToken
      )}&connectionData=${hub}`;

      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log(`[${this.signalrUrl}] WebSocket connection established`);

        // this.state = {}; // Keep previous state to avoid flickering
        this.messageCount = 0;
        this.emptyMessageCount = 0;
        this.retryCount = 0;
        this.lastActivity = Date.now();

        this.notifyStatusCallbacks('connected');

        // Subscribe to F1 live timing feeds
        const subscriptionMessage = {
          H: this.signalrHub,
          M: "Subscribe",
          A: [
            [
              "Heartbeat",
              "CarData.z",
              "Position.z",
              "ExtrapolatedClock",
              "TimingStats",
              "TimingAppData",
              "WeatherData",
              "TrackStatus",
              "DriverList",
              "RaceControlMessages",
              "SessionInfo",
              "SessionData",
              "LapCount",
              "TimingData",
              "TeamRadio",
            ],
          ],
          I: 1,
        };

        this.websocket?.send(JSON.stringify(subscriptionMessage));
      };

      this.websocket.onmessage = (event) => {
        this.updateState(event.data);
      };

      this.websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.notifyStatusCallbacks('error');
      };

      this.websocket.onclose = (event) => {
        console.log(`WebSocket closed (code: ${event.code}, reason: ${event.reason})`);

        if (event.code === 1000) {
          // Normal closure
          this.notifyStatusCallbacks('no-session');
        } else {
          this.notifyStatusCallbacks('disconnected');
        }

        // this.state = {}; // Keep state on disconnect to avoid UI clearing
        this.messageCount = 0;
        this.emptyMessageCount = 0;

        // Don't retry infinitely - but keep last data available
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`Retrying connection (${this.retryCount}/${this.maxRetries}) in ${this.retryFreq}ms...`);

          this.reconnectTimer = setTimeout(() => {
            this.setupStream();
          }, this.retryFreq);
        } else {
          console.log('Maximum retry attempts reached. Showing last received data.');
          // Keep showing last data instead of going to no-session
          this.notifyStatusCallbacks('disconnected');
        }
      };

    } catch (error) {
      console.error(`[${this.signalrUrl}] Connection failed:`, error);

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.log('Network error - likely CORS issue or no active session');
        this.notifyStatusCallbacks('no-session');
      } else {
        this.notifyStatusCallbacks('error');
      }
    }
  }

  private notifyDataCallbacks(): void {
    this.dataCallbacks.forEach(callback => {
      try {
        callback({ ...this.state });
      } catch (error) {
        console.error('Error in data callback:', error);
      }
    });
  }

  private notifyStatusCallbacks(status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'no-session'): void {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    });
  }

  // Public API
  public async connect(): Promise<void> {
    // Clear any existing connection
    this.disconnect();
    await this.setupStream();
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.keepAliveTimer) {
      clearTimeout(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }

    if (this.websocket) {
      this.websocket.close(1000, 'Manual disconnect');
      this.websocket = null;
    }

    this.retryCount = 0;
  }

  public onData(callback: F1DataCallback): void {
    this.dataCallbacks.push(callback);
  }

  public onStatus(callback: F1StatusCallback): void {
    this.statusCallbacks.push(callback);
  }

  public removeDataCallback(callback: F1DataCallback): void {
    const index = this.dataCallbacks.indexOf(callback);
    if (index > -1) {
      this.dataCallbacks.splice(index, 1);
    }
  }

  public removeStatusCallback(callback: F1StatusCallback): void {
    const index = this.statusCallbacks.indexOf(callback);
    if (index > -1) {
      this.statusCallbacks.splice(index, 1);
    }
  }

  public getCurrentData(): F1LiveData {
    // Always return the last received data, even if connection is down
    return Object.keys(this.state).length > 0 ? { ...this.state } : { ...this.lastReceivedData };
  }

  public getLastReceivedData(): F1LiveData {
    return { ...this.lastReceivedData };
  }

  public getLastDataTimestamp(): string | null {
    try {
      return localStorage.getItem('f1-last-update');
    } catch {
      return null;
    }
  }

  public clearPersistedData(): void {
    try {
      localStorage.removeItem('f1-last-data');
      localStorage.removeItem('f1-last-update');
      this.lastReceivedData = {};
      console.log('Cleared persisted F1 data');
    } catch (error) {
      console.warn('Failed to clear persisted data:', error);
    }
  }

  public getMessageCount(): number {
    return this.messageCount;
  }

  public isActive(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN || Object.keys(this.lastReceivedData).length > 0;
  }

  public hasSession(): boolean {
    return this.messageCount > 0 || Object.keys(this.lastReceivedData).length > 0;
  }

  public hasLiveConnection(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN && this.messageCount > 0;
  }

  public async checkF1Status(): Promise<{ available: boolean; hasActiveSession: boolean; timestamp: string }> {
    try {
      const response = await fetch(`${this.proxyUrl}/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        return {
          available: false,
          hasActiveSession: false,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error checking F1 status:', error);
      return {
        available: false,
        hasActiveSession: false,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Singleton instance for global use
let f1Service: F1LiveDataService | null = null;

export function getF1LiveDataService(): F1LiveDataService {
  if (!f1Service) {
    f1Service = new F1LiveDataService();
  }
  return f1Service;
}