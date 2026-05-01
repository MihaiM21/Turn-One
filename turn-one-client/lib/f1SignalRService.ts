'use client';

import * as signalR from '@microsoft/signalr';

// Get the base URL without the '/api' suffix for SignalR connections
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.t1f1.com';
// Remove the trailing '/api' if it exists
const API_URL = BACKEND_URL.endsWith('/api') ? BACKEND_URL.slice(0, -4) : BACKEND_URL;
// Fallback URLs in case the main one fails
const FALLBACK_URLS = [
  API_URL,
  BACKEND_URL,
  'https://backend.t1f1.com',
  API_URL.replace('http://', 'https://'),
  API_URL.replace('https://', 'http://')
];

export interface F1LiveData {
  FeedName?: string;
  Data?: any;
  Timestamp?: string;
  RawMessage?: string;
  [key: string]: any;
}

export interface F1RawData {
  Type: 'RawMessage' | 'RawText' | 'RawF1Data';
  Data: string;
  Timestamp: string;
}

export type F1DataCallback = (data: F1LiveData) => void;
export type F1RawDataCallback = (data: F1RawData) => void;
export type F1StatusCallback = (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void;

export class F1SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;
  private onDataCallback?: F1DataCallback;
  private onRawDataCallback?: F1RawDataCallback;
  private onStatusCallback?: F1StatusCallback;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000; // 5 seconds
  
  // State management for data persistence
  private currentState: Record<string, any> = {};
  private lastReceivedData: Record<string, any> = {};
  private messageCount = 0;
  private lastActivity = Date.now();

  constructor() {
    // Load any persisted data from local storage
    this.loadPersistedData();
    
    // Use cached URL only if it matches the current hub path (clears stale entries after hub renames)
    const savedUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('successfulSignalRUrl') : null;
    const hubUrl = savedUrl?.includes('/hubs/f1live') ? savedUrl : `${API_URL}/hubs/f1live`;
    if (savedUrl && !savedUrl.includes('/hubs/f1live') && typeof localStorage !== 'undefined') {
      localStorage.removeItem('successfulSignalRUrl');
    }
    
    // Log the API URL we're connecting to for debugging
    console.log(`Connecting to SignalR hub at: ${hubUrl}`);
    
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => {
          // Get token from localStorage using the correct key
          const token = localStorage.getItem('token');
          console.log('SignalR token:', token ? `${token.substring(0, 20)}...` : 'No token found');
          return token || '';
        },
        skipNegotiation: false, // Ensure negotiation happens properly
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        headers: {
          'Accept': 'application/json',
          'Origin': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
        }
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount < 5) {
            return 2000 + (retryContext.previousRetryCount * 1000);
          }
          return 10000; // 10 seconds after 5 attempts
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    this.connection.on('ReceiveF1Data', (data: F1LiveData) => {
      console.log('Received F1 Data:', data);
      
      // Update state and persist data
      if (data.FeedName && data.Data) {
        // Store data by feed name
        this.currentState[data.FeedName] = data.Data;
        this.lastReceivedData[data.FeedName] = data.Data;
        this.persistData();
      }
      this.messageCount++;
      this.lastActivity = Date.now();
      
      // Notify callback with data
      this.onDataCallback?.(data);
    });

    this.connection.on('ReceiveRawData', (data: F1RawData) => {
      //console.log('Received Raw Data:', data);
      
      // Try to extract and store structured data from raw data if possible
      try {
        if (data.Type === 'RawF1Data' && data.Data) {
          const parsedData = JSON.parse(data.Data);
          if (parsedData) {
            // For raw data, we only count it as a message but don't attempt to parse it further
            this.messageCount++;
            this.lastActivity = Date.now();
          }
        }
      } catch (error) {
        // Silently ignore parsing errors for raw data
      }
      
      this.onRawDataCallback?.(data);
    });

    this.connection.on('ReceiveFeedData', (data: F1LiveData) => {
      console.log('Received Feed Data:', data);
      //console.log('🔧 Service: Calling onDataCallback with ReceiveFeedData:', data);
      //console.log('🔧 Service: onDataCallback exists:', !!this.onDataCallback);
      this.onDataCallback?.(data);
      //onsole.log('🔧 Service: onDataCallback called for ReceiveFeedData');
    });

    this.connection.on('SessionStatus', (status: any) => {
      console.log('Session Status:', status);
    });

    this.connection.onreconnecting(() => {
      console.log('SignalR reconnecting...');
      this.onStatusCallback?.('connecting');
    });

    this.connection.onreconnected(() => {
      console.log('SignalR reconnected');
      this.onStatusCallback?.('connected');
      this.reconnectAttempts = 0;
    });

    this.connection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      this.onStatusCallback?.('disconnected');
      
      if (error) {
        this.onStatusCallback?.('error');
        this.handleReconnection();
      }
    });
  }

  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.onStatusCallback?.('error');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.handleReconnection();
      }
    }, this.reconnectDelay);
  }

  public async connect(): Promise<void> {
    if (!this.connection || this.isConnecting) return;

    if (this.connection.state === signalR.HubConnectionState.Connected) {
      console.log('Already connected to SignalR hub');
      return;
    }

    try {
      this.isConnecting = true;
      this.onStatusCallback?.('connecting');
      
      // Debug the URL construction in detail
      console.log('Environment URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
      console.log('Base API_URL:', API_URL);
      console.log(`Full hub URL: ${API_URL}/hubs/f1live`);
      console.log(`Connection state: ${this.connection.state}`);
      
      // Add useful diagnostics for CORS and connection issues
      console.log('Origin:', typeof window !== 'undefined' ? window.location.origin : 'running server-side');
      
      // Check backend availability first with multiple URL attempts
      let backendAvailable = false;
      const urlsToTry = [
        `${API_URL}/health`,
        `${API_URL}/health`, 
        `${API_URL}/hubs/f1live/negotiate`,
        `${BACKEND_URL}/health`
      ];
      
      for (const url of urlsToTry) {
        try {
          console.log(`Trying health check at: ${url}`);
          const response = await fetch(url);
          if (response.ok) {
            console.log(`Backend check succeeded at ${url}`);
            backendAvailable = true;
            break;
          } else {
            console.warn(`Backend check at ${url} failed: ${response.status}`);
          }
        } catch (healthError) {
          console.warn(`Backend check at ${url} failed:`, healthError);
        }
      }
      
      if (!backendAvailable) {
        console.warn('All backend health checks failed. Continuing connection attempt anyway.');
      }

      // Try connecting with multiple URL formats
      let connectionSuccess = false;
      let lastError = null;
      
      // Store the original connection URL
      const originalUrl = this.connection.baseUrl;
      
      for (const baseUrl of FALLBACK_URLS) {
        if (connectionSuccess) break;
        
        try {
          const hubUrl = `${baseUrl}/hubs/f1live`;
          console.log(`Attempting connection to: ${hubUrl}`);
          
          // Update the connection URL
          this.connection.baseUrl = hubUrl;
          
          // Try to start the connection
          await this.connection.start();
          connectionSuccess = true;
          console.log(`Successfully connected to ${hubUrl}`);
          
          // Save the successful URL to localStorage for future use
          localStorage.setItem('successfulSignalRUrl', hubUrl);
        } catch (err) {
          console.error(`Connection failed to ${baseUrl}/hubs/f1live:`, err);
          
          // Log more details about the error
          if (typeof err === 'object' && err !== null) {
            const errorObj = err as any;
            if (errorObj.statusCode === 404) {
              console.error('SignalR hub endpoint not found. Trying next URL...');
            } else if (errorObj.errorType === 'FailedToNegotiateWithServerError') {
              console.error('SignalR negotiation failed. Might be CORS issues. Trying next URL...');
            } else {
              console.error('Unknown error type:', errorObj);
            }
          }
          
          lastError = err;
        }
      }
      
      // If all connection attempts failed, throw the last error
      if (!connectionSuccess) {
        console.error('All connection attempts failed');
        this.connection.baseUrl = originalUrl; // Restore original URL
        throw lastError || new Error('Failed to connect to SignalR hub');
      }
      
      console.log('Connected to F1 Live Data Hub');
      this.onStatusCallback?.('connected');
      this.reconnectAttempts = 0;

      // Try to request session status
      try {
        await this.connection.invoke('RequestSessionStatus');
      } catch (invokeError) {
        console.warn('Failed to request session status:', invokeError);
        // Continue even if this fails
      }

    } catch (error) {
      console.error('Failed to connect to SignalR hub:', error);
      this.onStatusCallback?.('error');
      
      // If we're getting consistent 404 errors, try alternative connection paths
      if (this.reconnectAttempts >= 2) {
        console.log('Multiple connection failures. The hub URL might be incorrect.');
        // Log as much detail as possible to help debugging
        console.log(`Current API_URL: ${API_URL}`);
        console.log(`Original BACKEND_URL: ${BACKEND_URL}`);
      }
      
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.connection) return;

    try {
      await this.connection.stop();
      console.log('Disconnected from F1 Live Data Hub');
      this.onStatusCallback?.('disconnected');
    } catch (error) {
      console.error('Error disconnecting from SignalR hub:', error);
    }
  }

  public async subscribeToFeed(feedName: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Not connected to SignalR hub');
    }

    try {
      await this.connection.invoke('SubscribeToFeed', feedName);
      //console.log(`Subscribed to feed: ${feedName}`);
    } catch (error) {
      console.error(`Failed to subscribe to feed ${feedName}:`, error);
      throw error;
    }
  }

  public async unsubscribeFromFeed(feedName: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Not connected to SignalR hub');
    }

    try {
      await this.connection.invoke('UnsubscribeFromFeed', feedName);
      console.log(`Unsubscribed from feed: ${feedName}`);
    } catch (error) {
      console.error(`Failed to unsubscribe from feed ${feedName}:`, error);
      throw error;
    }
  }

  public setOnDataReceived(callback: F1DataCallback): void {
    console.log('🔧 Service: Setting onDataCallback:', !!callback);
    this.onDataCallback = callback;
    console.log('🔧 Service: onDataCallback set successfully');
  }

  public setOnRawDataReceived(callback: F1RawDataCallback): void {
    this.onRawDataCallback = callback;
  }

  public setOnStatusChanged(callback: F1StatusCallback): void {
    this.onStatusCallback = callback;
  }

  public getConnectionState(): string {
    if (!this.connection) return 'Disconnected';
    
    switch (this.connection.state) {
      case signalR.HubConnectionState.Connected:
        return 'Connected';
      case signalR.HubConnectionState.Connecting:
        return 'Connecting';
      case signalR.HubConnectionState.Reconnecting:
        return 'Reconnecting';
      case signalR.HubConnectionState.Disconnected:
        return 'Disconnected';
      case signalR.HubConnectionState.Disconnecting:
        return 'Disconnecting';
      default:
        return 'Unknown';
    }
  }

  public isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  // Method to get backend F1 service status
  public async getF1ServiceStatus(): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/f1livedata/status`, {
        headers: {
          'Authorization': token || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get F1 service status:', error);
      throw error;
    }
  }

  // Method to restart the backend F1 service
  public async restartF1Service(): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/f1livedata/restart`, {
        method: 'POST',
        headers: {
          'Authorization': token || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to restart F1 service:', error);
      throw error;
    }
  }
  
  // Data persistence methods
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
  
  /**
   * Get the current accumulated F1 data state
   */
  public getCurrentData(): Record<string, any> {
    return Object.keys(this.currentState).length > 0 
      ? { ...this.currentState } 
      : { ...this.lastReceivedData };
  }

  /**
   * Get the last received F1 data
   */
  public getLastReceivedData(): Record<string, any> {
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
   * Check if there's an active F1 session with data
   */
  public hasSession(): boolean {
    return this.messageCount > 0 || Object.keys(this.lastReceivedData).length > 0;
  }
  
  /**
   * Get the number of messages received
   */
  public getMessageCount(): number {
    return this.messageCount;
  }
}