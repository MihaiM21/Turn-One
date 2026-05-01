'use client';

import * as signalR from "@microsoft/signalr";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.t1f1.com';

// Types
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

// Raw message structure from backend
interface RawF1Data {
  Type: string;
  Data: string;
  Timestamp: string;
}

// Event callback types
export type F1DataCallback = (data: F1LiveData) => void;
export type F1StatusCallback = (status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'no-session') => void;

/**
 * F1SignalRLiveDataService - A service that connects to the backend SignalR hub
 * for receiving F1 live timing data. This service is designed for the /livev2 page.
 */
export class F1SignalRLiveDataService {
  // Connection management
  private readonly hubUrl = `${API_URL}/hubs/f1live`;
  private connection: signalR.HubConnection | null = null;
  private connectionState: 'connected' | 'connecting' | 'disconnected' | 'error' | 'no-session' = 'disconnected';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private readonly maxRetries = 5;
  private readonly retryFreq = 5000; // 5 seconds

  // Data management
  private state: F1LiveData = {};
  private lastReceivedData: F1LiveData = {};
  private lastActivity = 0;
  private messageCount = 0;

  // Event callbacks
  private dataCallbacks: F1DataCallback[] = [];
  private statusCallbacks: F1StatusCallback[] = [];
  
  constructor() {
    // Load persisted data from localStorage if available
    this.loadPersistedData();
    
    // Set up automatic reconnection on window focus
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        if (this.connectionState === 'disconnected' || this.connectionState === 'error') {
          console.log('Window focused, attempting to reconnect to F1 data hub');
          this.connect();
        }
      });
    }
  }
  
  private loadPersistedData(): void {
    try {
      const stored = localStorage.getItem('f1-last-data');
      if (stored) {
        this.lastReceivedData = JSON.parse(stored);
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

  private async setupSignalRConnection(): Promise<void> {
    try {
      this.connectionState = 'connecting';
      this.notifyStatusCallbacks('connecting');
      
      // Close any existing connection
      if (this.connection) {
        await this.connection.stop();
        this.connection = null;
      }
      
      console.log(`Connecting to SignalR hub at ${this.hubUrl}...`);
      
      // Create new connection with automatic reconnection
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(this.hubUrl, {
          withCredentials: true,
          skipNegotiation: false,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Implement exponential backoff
            const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
            console.log(`SignalR reconnecting in ${delay}ms, attempt ${retryContext.previousRetryCount + 1}`);
            return delay;
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();
        
      // Set up event handlers
      
      // Raw F1 data handler
      this.connection.on("ReceiveRawData", (rawData: RawF1Data) => {
        console.log(`Received raw F1 data: ${rawData.Type}, timestamp: ${rawData.Timestamp}`);
        this.processRawData(rawData);
      });
      
      // Structured state data handler
      this.connection.on("ReceiveStateData", (stateData: F1LiveData) => {
        console.log(`Received structured F1 state data with ${Object.keys(stateData).length} properties`);
        this.updateFromStateData(stateData);
      });
      
      // Connection lifecycle events
      this.connection.onreconnecting(() => {
        console.log('SignalR reconnecting...');
        this.connectionState = 'connecting';
        this.notifyStatusCallbacks('connecting');
      });
      
      this.connection.onreconnected(() => {
        console.log('SignalR reconnected');
        this.connectionState = 'connected';
        this.notifyStatusCallbacks('connected');
        this.joinF1DataGroup();
      });
      
      this.connection.onclose((error) => {
        console.log('SignalR connection closed', error);
        this.connectionState = 'disconnected';
        this.notifyStatusCallbacks('disconnected');
        
        // Attempt to reconnect if not max retries
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`Will attempt to reconnect in ${this.retryFreq}ms (${this.retryCount}/${this.maxRetries})`);
          
          this.reconnectTimer = setTimeout(() => {
            this.connect();
          }, this.retryFreq);
        } else {
          console.log('Maximum retry attempts reached');
          this.notifyStatusCallbacks('disconnected');
        }
      });
      
      // Start the connection
      await this.connection.start();
      console.log('Connected to SignalR hub');
      this.connectionState = 'connected';
      this.notifyStatusCallbacks('connected');
      this.retryCount = 0; // Reset retry count on successful connection
      
      // Join the F1 data group to receive updates
      await this.joinF1DataGroup();
      
    } catch (error) {
      console.error('Error connecting to SignalR hub:', error);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Connection failed. Retrying in ${this.retryFreq}ms (${this.retryCount}/${this.maxRetries})`);
        
        this.reconnectTimer = setTimeout(() => {
          this.setupSignalRConnection();
        }, this.retryFreq);
        
        this.connectionState = 'connecting';
        this.notifyStatusCallbacks('connecting');
      } else {
        console.log('Maximum retry attempts reached');
        this.connectionState = 'error';
        this.notifyStatusCallbacks('error');
      }
    }
  }
  
  private async joinF1DataGroup(): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      console.warn('Cannot join F1 data group: connection not established');
      return;
    }
    
    try {
      await this.connection.invoke('JoinF1DataGroup');
      console.log('Joined F1 data group');
    } catch (error) {
      console.error('Error joining F1 data group:', error);
    }
  }
  
  private async leaveF1DataGroup(): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }
    
    try {
      await this.connection.invoke('LeaveF1DataGroup');
      console.log('Left F1 data group');
    } catch (error) {
      console.error('Error leaving F1 data group:', error);
    }
  }
  
  private processRawData(rawData: RawF1Data): void {
    this.lastActivity = Date.now();
    this.messageCount++;
    
    try {
      // Process the raw SignalR message - keeping this in case it's needed
      // Most processing should happen on the backend instead
    } catch (error) {
      console.error('Error processing raw F1 data:', error);
    }
  }
  
  private updateFromStateData(stateData: F1LiveData): void {
    try {
      // Update our state with the processed data from backend
      this.state = { ...stateData };
      this.lastReceivedData = { ...stateData };
      this.lastActivity = Date.now();
      
      // Persist data to localStorage
      this.persistData();
      
      // Notify data subscribers
      this.notifyDataCallbacks();
    } catch (error) {
      console.error('Error updating from state data:', error);
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
  
  /**
   * Connect to the F1 live data hub
   */
  public async connect(): Promise<void> {
    // Clear any existing connection
    this.disconnect();
    await this.setupSignalRConnection();
  }

  /**
   * Disconnect from the F1 live data hub
   */
  public async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.connection) {
      await this.leaveF1DataGroup();
      await this.connection.stop();
      this.connection = null;
    }

    this.connectionState = 'disconnected';
    this.notifyStatusCallbacks('disconnected');
    this.retryCount = 0;
  }

  /**
   * Register a callback for when F1 data is received
   */
  public onData(callback: F1DataCallback): void {
    this.dataCallbacks.push(callback);
  }

  /**
   * Register a callback for connection status changes
   */
  public onStatus(callback: F1StatusCallback): void {
    this.statusCallbacks.push(callback);
  }

  /**
   * Remove a data callback
   */
  public removeDataCallback(callback: F1DataCallback): void {
    const index = this.dataCallbacks.indexOf(callback);
    if (index > -1) {
      this.dataCallbacks.splice(index, 1);
    }
  }

  /**
   * Remove a status callback
   */
  public removeStatusCallback(callback: F1StatusCallback): void {
    const index = this.statusCallbacks.indexOf(callback);
    if (index > -1) {
      this.statusCallbacks.splice(index, 1);
    }
  }

  /**
   * Get the current F1 data state
   */
  public getCurrentData(): F1LiveData {
    return Object.keys(this.state).length > 0 ? { ...this.state } : { ...this.lastReceivedData };
  }

  /**
   * Get the last received F1 data
   */
  public getLastReceivedData(): F1LiveData {
    return { ...this.lastReceivedData };
  }

  /**
   * Get the timestamp of the last data update
   */
  public getLastDataTimestamp(): string | null {
    try {
      return localStorage.getItem('f1-last-update');
    } catch {
      return null;
    }
  }

  /**
   * Clear persisted F1 data
   */
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

  /**
   * Get the number of messages received
   */
  public getMessageCount(): number {
    return this.messageCount;
  }

  /**
   * Check if there's an active F1 session with data
   */
  public hasSession(): boolean {
    return this.messageCount > 0 || Object.keys(this.lastReceivedData).length > 0;
  }

  /**
   * Check if there's currently a live connection to the F1 data hub
   */
  public hasLiveConnection(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected && this.messageCount > 0;
  }
  
  /**
   * Check if the service is currently active (connected or has data)
   */
  public isActive(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected || Object.keys(this.lastReceivedData).length > 0;
  }

  /**
   * Check the status of the F1 backend service
   */
  public async checkF1BackendStatus(): Promise<{ available: boolean; hasActiveSession: boolean; timestamp: string }> {
    try {
      const response = await fetch(`${API_URL}/api/f1livedata/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
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
      console.error('Error checking F1 backend status:', error);
      return {
        available: false,
        hasActiveSession: false,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Singleton instance for global use
let f1SignalRService: F1SignalRLiveDataService | null = null;

/**
 * Get the F1 SignalR Live Data Service instance
 * @returns F1SignalRLiveDataService
 */
export function getF1SignalRLiveDataService(): F1SignalRLiveDataService {
  if (!f1SignalRService) {
    f1SignalRService = new F1SignalRLiveDataService();
  }
  return f1SignalRService;
}