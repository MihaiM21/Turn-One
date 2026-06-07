'use client';

// Adapter over the backend SignalR hub at /hubs/f1livedata.
// Backend is the single F1 consumer (via Cloudflare Worker → livetiming/signalrcore)
// and fans out telemetry to all clients via ReceiveStateData / ReceiveRawData.

import * as signalR from '@microsoft/signalr';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.t1f1.com';
// Strip trailing /api if present so we can form /hubs/f1livedata correctly.
const HUB_BASE = BACKEND_URL.endsWith('/api') ? BACKEND_URL.slice(0, -4) : BACKEND_URL;

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
  [key: string]: any;
}

export type F1DataCallback = (data: F1LiveData) => void;
export type F1StatusCallback = (status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'no-session') => void;

export class F1LiveDataService {
  private readonly hubUrl = `${HUB_BASE}/hubs/f1livedata`;
  private connection: signalR.HubConnection | null = null;
  private connectionState: 'connected' | 'connecting' | 'disconnected' | 'error' | 'no-session' = 'disconnected';

  private state: F1LiveData = {};
  private lastReceivedData: F1LiveData = {};
  private messageCount = 0;

  private dataCallbacks: F1DataCallback[] = [];
  private statusCallbacks: F1StatusCallback[] = [];

  constructor() {
    this.loadPersistedData();
  }

  private loadPersistedData(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const stored = localStorage.getItem('f1-last-data');
      if (stored) {
        this.lastReceivedData = JSON.parse(stored);
        this.state = { ...this.lastReceivedData };
      }
    } catch (err) {
      console.warn('Failed to load persisted F1 data:', err);
    }
  }

  private persistData(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem('f1-last-data', JSON.stringify(this.lastReceivedData));
      localStorage.setItem('f1-last-update', new Date().toISOString());
    } catch (err) {
      console.warn('Failed to persist F1 data:', err);
    }
  }

  private notifyDataCallbacks(): void {
    const snapshot = { ...this.state };
    for (const cb of this.dataCallbacks) {
      try { cb(snapshot); } catch (err) { console.error('Data callback error:', err); }
    }
  }

  private notifyStatusCallbacks(status: typeof this.connectionState): void {
    this.connectionState = status;
    for (const cb of this.statusCallbacks) {
      try { cb(status); } catch (err) { console.error('Status callback error:', err); }
    }
  }

  public async connect(): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) return;

    this.notifyStatusCallbacks('connecting');

    try {
      if (this.connection) {
        try { await this.connection.stop(); } catch { /* ignore */ }
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(this.hubUrl, {
          accessTokenFactory: () => {
            try { return localStorage.getItem('token') || ''; } catch { return ''; }
          },
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (ctx) =>
            Math.min(1000 * Math.pow(2, ctx.previousRetryCount), 30000),
        })
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.connection.on('ReceiveStateData', (stateData: F1LiveData) => {
        if (!stateData || typeof stateData !== 'object') return;
        this.state = { ...stateData };
        this.lastReceivedData = { ...stateData };
        this.messageCount++;
        this.persistData();
        this.notifyDataCallbacks();
      });

      this.connection.on('ReceiveRawData', () => {
        // Raw envelope — counted but state arrives via ReceiveStateData
        this.messageCount++;
      });

      this.connection.onreconnecting(() => this.notifyStatusCallbacks('connecting'));
      this.connection.onreconnected(() => this.notifyStatusCallbacks('connected'));
      this.connection.onclose(() => this.notifyStatusCallbacks('disconnected'));

      await this.connection.start();
      this.notifyStatusCallbacks('connected');
    } catch (err) {
      console.error('Failed to connect to F1 hub:', err);
      this.notifyStatusCallbacks('error');
    }
  }

  public async disconnect(): Promise<void> {
    if (this.connection) {
      try { await this.connection.stop(); } catch { /* ignore */ }
      this.connection = null;
    }
    this.notifyStatusCallbacks('disconnected');
  }

  public onData(cb: F1DataCallback): void { this.dataCallbacks.push(cb); }
  public onStatus(cb: F1StatusCallback): void { this.statusCallbacks.push(cb); }
  public removeDataCallback(cb: F1DataCallback): void {
    const i = this.dataCallbacks.indexOf(cb);
    if (i >= 0) this.dataCallbacks.splice(i, 1);
  }
  public removeStatusCallback(cb: F1StatusCallback): void {
    const i = this.statusCallbacks.indexOf(cb);
    if (i >= 0) this.statusCallbacks.splice(i, 1);
  }

  public getCurrentData(): F1LiveData {
    return Object.keys(this.state).length > 0 ? { ...this.state } : { ...this.lastReceivedData };
  }
  public getLastReceivedData(): F1LiveData { return { ...this.lastReceivedData }; }
  public getLastDataTimestamp(): string | null {
    try { return typeof localStorage !== 'undefined' ? localStorage.getItem('f1-last-update') : null; }
    catch { return null; }
  }
  public hasSession(): boolean {
    return this.messageCount > 0 || Object.keys(this.lastReceivedData).length > 0;
  }
  public isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
  public clearPersistedData(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem('f1-last-data');
      localStorage.removeItem('f1-last-update');
    } catch { /* ignore */ }
    this.lastReceivedData = {};
    this.state = {};
  }
}

let instance: F1LiveDataService | null = null;
export function getF1LiveDataService(): F1LiveDataService {
  if (!instance) instance = new F1LiveDataService();
  return instance;
}
