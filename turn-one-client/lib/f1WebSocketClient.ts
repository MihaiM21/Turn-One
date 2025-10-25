'use client';

import { F1LiveData } from './f1LiveDataService';

export type F1StatusCallback = (status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'max-retries' | 'no-session') => void;
export type F1DataCallback = (data: F1LiveData) => void;

export class F1WebSocketClient {
    private websocket: WebSocket | null = null;
    private state: F1LiveData = {};
    private lastReceivedData: F1LiveData = {};
    private connectionAttempts = 0;
    private readonly maxConnectionAttempts = 5;
    private reconnectDelay = 2000; // Start with 2 seconds
    private reconnectTimer: NodeJS.Timeout | null = null;
    private dataCallbacks: F1DataCallback[] = [];
    private statusCallbacks: F1StatusCallback[] = [];
    private lastActivity = 0;

    private readonly wsUrl = process.env.NEXT_PUBLIC_BACKEND_URL
        ? `wss://${process.env.NEXT_PUBLIC_BACKEND_URL.replace('https://', '')}/ws`
        : 'wss://api.t1f1.com/ws'; // Production fallback

    constructor() {
        // Load persisted data from localStorage if available
        this.loadPersistedData();
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

    private notifyDataCallbacks(): void {
        this.dataCallbacks.forEach(callback => {
            try {
                callback({ ...this.state });
            } catch (error) {
                console.error('Error in data callback:', error);
            }
        });
    }

    private notifyStatusCallbacks(status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'max-retries' | 'no-session'): void {
        this.statusCallbacks.forEach(callback => {
            try {
                callback(status);
            } catch (error) {
                console.error('Error in status callback:', error);
            }
        });
    }

    private updateState(data: F1LiveData): void {
        try {
            // Update state with new data
            this.state = { ...this.state, ...data };
            this.lastReceivedData = { ...this.lastReceivedData, ...data };
            this.lastActivity = Date.now();

            // Persist data and notify callbacks
            this.persistData();
            this.notifyDataCallbacks();
        } catch (error) {
            console.error('Could not update state:', error);
        }
    }

    public async connect(): Promise<void> {
        // Prevent multiple simultaneous connection attempts
        if (this.websocket?.readyState === WebSocket.CONNECTING) {
            console.log('Connection attempt already in progress');
            return;
        }

        // Close any existing connection
        this.disconnect();

        try {
            console.log('Connecting to F1 WebSocket server...');
            this.notifyStatusCallbacks('connecting');

            this.websocket = new WebSocket(this.wsUrl);

            this.websocket.onopen = () => {
                console.log('WebSocket connection established');
                this.state = {};
                this.connectionAttempts = 0;
                this.reconnectDelay = 2000;
                this.lastActivity = Date.now();
                this.notifyStatusCallbacks('connected');
            };

            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (Object.keys(data).length > 0) {
                        this.updateState(data);
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.notifyStatusCallbacks('error');
            };

            this.websocket.onclose = (event) => {
                console.log(`WebSocket closed (code: ${event.code}, reason: ${event.reason})`);

                if (event.code === 1000) {
                    this.notifyStatusCallbacks('no-session');
                } else {
                    this.notifyStatusCallbacks('disconnected');

                    if (this.connectionAttempts < this.maxConnectionAttempts) {
                        this.connectionAttempts++;
                        this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
                        console.log(`Reconnecting in ${this.reconnectDelay}ms... (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`);

                        this.reconnectTimer = setTimeout(() => {
                            void this.connect();
                        }, this.reconnectDelay);
                    } else {
                        console.log('Maximum connection attempts reached');
                        this.notifyStatusCallbacks('max-retries');
                    }
                }
            };

        } catch (error) {
            console.error('Connection failed:', error);
            this.notifyStatusCallbacks('error');

            if (this.connectionAttempts < this.maxConnectionAttempts) {
                this.connectionAttempts++;
                this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
                console.log(`Reconnecting in ${this.reconnectDelay}ms... (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`);

                this.reconnectTimer = setTimeout(() => {
                    void this.connect();
                }, this.reconnectDelay);
            } else {
                console.log('Maximum connection attempts reached');
                this.notifyStatusCallbacks('max-retries');
            }
        }
    }

    public disconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.websocket) {
            this.websocket.close(1000, 'Manual disconnect');
            this.websocket = null;
        }

        this.connectionAttempts = 0;
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

    public hasLiveConnection(): boolean {
        return this.websocket?.readyState === WebSocket.OPEN;
    }
}

// Singleton instance for global use
let f1Client: F1WebSocketClient | null = null;

export function getF1WebSocketClient(): F1WebSocketClient {
    if (!f1Client) {
        f1Client = new F1WebSocketClient();
    }
    return f1Client;
}