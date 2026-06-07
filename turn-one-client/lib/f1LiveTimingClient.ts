'use client';

// Direct SignalR Core client for F1 live timing, talking to the Cloudflare
// Worker proxy from the browser. No backend hop, no @microsoft/signalr.
//
// Wire protocol:
//   POST {proxy}/negotiate?negotiateVersion=1   -> { connectionToken, ... }
//   WSS  {proxy}?id={connectionToken}
//   send  '{"protocol":"json","version":1}\x1e'                                 (handshake)
//   send  '{"type":1,"invocationId":"<g>","target":"Subscribe","arguments":[[..feeds..]]}\x1e'
//   recv  frames containing one or more JSON objects delimited by \x1e:
//         {type:1, target:"feed", arguments:[field, value]}        -> patch state
//         {type:3, invocationId:"<g>", result:{...initial snapshot...}} -> seed state
//         {type:6}                                                  -> ping (ignore)
//         {type:7}                                                  -> server close

const RECORD_SEPARATOR = '';

const DEFAULT_FEEDS = [
  'Heartbeat',
  'CarData.z',
  'Position.z',
  'ExtrapolatedClock',
  'TimingStats',
  'TimingAppData',
  'WeatherData',
  'TrackStatus',
  'DriverList',
  'RaceControlMessages',
  'SessionInfo',
  'SessionData',
  'LapCount',
  'TimingData',
  'TeamRadio',
] as const;

export type F1LiveTimingState = Record<string, unknown>;
export type F1Status = 'connected' | 'connecting' | 'disconnected' | 'error' | 'no-session';

type StateListener = (state: F1LiveTimingState) => void;
type StatusListener = (status: F1Status) => void;
type FieldListener = (field: string, value: unknown) => void;

interface ClientOptions {
  proxyUrl?: string;
  feeds?: readonly string[];
}

function resolveProxyUrl(explicit?: string): string {
  const url =
    explicit ||
    process.env.NEXT_PUBLIC_F1_PROXY_URL ||
    'https://f1-proxy.YOUR-WORKER.workers.dev';
  return url.replace(/\/$/, '');
}

function toWsUrl(httpUrl: string): string {
  if (httpUrl.startsWith('https://')) return 'wss://' + httpUrl.slice('https://'.length);
  if (httpUrl.startsWith('http://')) return 'ws://' + httpUrl.slice('http://'.length);
  return httpUrl;
}

export class F1LiveTimingClient {
  private readonly proxyUrl: string;
  private readonly feeds: readonly string[];
  private ws: WebSocket | null = null;
  private subscribeInvocationId = '';
  private state: F1LiveTimingState = {};
  private status: F1Status = 'disconnected';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private retries = 0;
  private readonly maxRetries = 8;
  private explicitlyClosed = false;
  private messageCount = 0;
  private lastUpdateAt: number | null = null;
  private incomingBuffer = '';

  private readonly stateListeners = new Set<StateListener>();
  private readonly statusListeners = new Set<StatusListener>();
  private readonly fieldListeners = new Set<FieldListener>();

  constructor(options: ClientOptions = {}) {
    this.proxyUrl = resolveProxyUrl(options.proxyUrl);
    this.feeds = options.feeds ?? DEFAULT_FEEDS;
  }

  async connect(): Promise<void> {
    if (this.status === 'connected' || this.status === 'connecting') return;
    this.explicitlyClosed = false;
    this.setStatus('connecting');

    try {
      const negotiateUrl = `${this.proxyUrl}/negotiate?negotiateVersion=1`;
      const response = await fetch(negotiateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: '',
      });
      if (!response.ok) throw new Error(`negotiate ${response.status}`);
      const body = await response.json();
      const connectionToken: string | undefined = body.connectionToken ?? body.ConnectionToken;
      if (!connectionToken) throw new Error('no connectionToken in negotiate response');

      const wsUrl = `${toWsUrl(this.proxyUrl)}?id=${encodeURIComponent(connectionToken)}`;
      this.openSocket(wsUrl);
    } catch (err) {
      console.error('[F1LiveTiming] connect failed:', err);
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  private openSocket(url: string): void {
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      ws.send(`{"protocol":"json","version":1}${RECORD_SEPARATOR}`);
      this.subscribeInvocationId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `inv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const subscribe = {
        type: 1,
        invocationId: this.subscribeInvocationId,
        target: 'Subscribe',
        arguments: [this.feeds],
      };
      ws.send(JSON.stringify(subscribe) + RECORD_SEPARATOR);
      this.retries = 0;
      this.setStatus('connected');
    };

    ws.onmessage = (event) => {
      this.handleFrame(typeof event.data === 'string' ? event.data : '');
    };

    ws.onerror = (err) => {
      console.warn('[F1LiveTiming] ws error', err);
    };

    ws.onclose = () => {
      this.ws = null;
      if (this.explicitlyClosed) {
        this.setStatus('disconnected');
        return;
      }
      this.setStatus('disconnected');
      this.scheduleReconnect();
    };
  }

  private handleFrame(text: string): void {
    this.incomingBuffer += text;
    const parts = this.incomingBuffer.split(RECORD_SEPARATOR);
    this.incomingBuffer = parts.pop() ?? '';
    for (const part of parts) {
      if (!part) continue;
      this.handleMessage(part);
    }
  }

  private handleMessage(raw: string): void {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (typeof msg !== 'object' || msg === null) return;
    const type = msg.type;

    if (type === undefined) {
      // Empty handshake ack {}
      return;
    }

    switch (type) {
      case 1: {
        // Invocation: target should be "feed"
        if (msg.target !== 'feed' || !Array.isArray(msg.arguments) || msg.arguments.length < 2) return;
        const field: unknown = msg.arguments[0];
        const value: unknown = msg.arguments[1];
        if (typeof field !== 'string') return;
        this.applyFieldUpdate(field, value);
        break;
      }
      case 3: {
        // Completion: initial state snapshot from Subscribe
        if (msg.invocationId !== this.subscribeInvocationId) return;
        const result = msg.result;
        if (result && typeof result === 'object') {
          for (const [field, value] of Object.entries(result)) {
            this.applyFieldUpdate(field, value);
          }
        }
        break;
      }
      case 6: // ping
        return;
      case 7: // close
        console.warn('[F1LiveTiming] server close:', msg);
        return;
      default:
        return;
    }
  }

  private applyFieldUpdate(field: string, value: unknown): void {
    const key = field === 'CarData.z' || field === 'Position.z' ? field.split('.')[0] : field;
    this.state = { ...this.state, [key]: value };
    this.messageCount++;
    this.lastUpdateAt = Date.now();
    for (const fn of this.fieldListeners) fn(key, value);
    for (const fn of this.stateListeners) fn(this.state);
    this.persistState();
  }

  private persistState(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem('f1-last-data', JSON.stringify(this.state));
      localStorage.setItem('f1-last-update', new Date().toISOString());
    } catch {
      /* swallow quota errors */
    }
  }

  private loadState(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const stored = localStorage.getItem('f1-last-data');
      if (stored) this.state = JSON.parse(stored);
    } catch {
      /* ignore */
    }
  }

  private setStatus(next: F1Status): void {
    if (this.status === next) return;
    this.status = next;
    for (const fn of this.statusListeners) fn(next);
  }

  private scheduleReconnect(): void {
    if (this.explicitlyClosed) return;
    if (this.retries >= this.maxRetries) {
      this.setStatus('error');
      return;
    }
    const delay = Math.min(1000 * Math.pow(2, this.retries), 30000);
    this.retries++;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }

  async disconnect(): Promise<void> {
    this.explicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch { /* ignore */ }
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  // Listeners
  onState(fn: StateListener): () => void { this.stateListeners.add(fn); return () => this.stateListeners.delete(fn); }
  onStatus(fn: StatusListener): () => void { this.statusListeners.add(fn); return () => this.statusListeners.delete(fn); }
  onField(fn: FieldListener): () => void { this.fieldListeners.add(fn); return () => this.fieldListeners.delete(fn); }

  // Read access
  getState(): F1LiveTimingState {
    if (Object.keys(this.state).length === 0) this.loadState();
    return { ...this.state };
  }
  getStatus(): F1Status { return this.status; }
  isConnected(): boolean { return this.status === 'connected'; }
  getMessageCount(): number { return this.messageCount; }
  getLastUpdate(): string | null {
    if (this.lastUpdateAt) return new Date(this.lastUpdateAt).toISOString();
    try { return typeof localStorage !== 'undefined' ? localStorage.getItem('f1-last-update') : null; }
    catch { return null; }
  }
  clearPersisted(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem('f1-last-data');
      localStorage.removeItem('f1-last-update');
    } catch { /* ignore */ }
    this.state = {};
  }
}

let singleton: F1LiveTimingClient | null = null;
export function getF1LiveTimingClient(): F1LiveTimingClient {
  if (!singleton) singleton = new F1LiveTimingClient();
  return singleton;
}
