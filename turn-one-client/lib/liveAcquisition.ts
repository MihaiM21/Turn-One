import * as zlib from 'zlib';
import WebSocket from 'ws';

interface F1LiveData {
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

class F1LiveDataAcquisition {
  private readonly signalrUrl = "livetiming.formula1.com/signalr";
  private readonly signalrHub = "Streaming";
  private readonly retryFreq = 10000;
  
  private state: F1LiveData = {};
  private messageCount = 0;
  private emptyMessageCount = 0;
  private websocket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  private dataCallbacks: ((data: F1LiveData) => void)[] = [];
  private statusCallbacks: ((status: 'connected' | 'disconnected' | 'error') => void)[] = [];

  constructor() {
    this.deepObjectMerge = this.deepObjectMerge.bind(this);
    this.parseCompressed = this.parseCompressed.bind(this);
    this.updateState = this.updateState.bind(this);
    this.setupStream = this.setupStream.bind(this);
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
      return JSON.parse(zlib.inflateRawSync(Buffer.from(data, "base64")).toString());
    } catch (error) {
      console.error('Error parsing compressed data:', error);
      return {};
    }
  }

  private updateState(data: Buffer | string): void {
    try {
      const parsed: SignalRResponse = JSON.parse(data.toString());

      if (!Object.keys(parsed).length) {
        this.emptyMessageCount++;
      } else {
        this.emptyMessageCount = 0;
      }

      // Reset state if too many empty messages (indicates session ended)
      if (this.emptyMessageCount > 5) {
        this.state = {};
        this.messageCount = 0;
        this.notifyStatusCallbacks('disconnected');
        return;
      }

      if (Array.isArray(parsed.M)) {
        for (const message of parsed.M) {
          if (message.M === "feed") {
            this.messageCount++;

            let [field, value] = message.A || [];

            if (field === "CarData.z" || field === "Position.z") {
              const [parsedField] = field.split(".");
              field = parsedField;
              value = this.parseCompressed(value);
            }

            this.state = this.deepObjectMerge(this.state, { [field]: value });
            this.notifyDataCallbacks();
          }
        }
      } else if (Object.keys(parsed.R ?? {}).length && parsed.I === "1") {
        this.messageCount++;

        if (parsed.R["CarData.z"]) {
          parsed.R["CarData"] = this.parseCompressed(parsed.R["CarData.z"]);
          delete parsed.R["CarData.z"];
        }

        if (parsed.R["Position.z"]) {
          parsed.R["Position"] = this.parseCompressed(parsed.R["Position.z"]);
          delete parsed.R["Position.z"];
        }

        this.state = this.deepObjectMerge(this.state, parsed.R);
        this.notifyDataCallbacks();
      }
    } catch (error) {
      console.error(`Could not update data: ${error}`);
    }
  }

  private async setupStream(): Promise<void> {
    try {
      console.log(`[${this.signalrUrl}] Connecting to live timing stream`);

      const hub = encodeURIComponent(JSON.stringify([{ name: this.signalrHub }]));
      const negotiationResponse = await fetch(
        `https://${this.signalrUrl}/negotiate?connectionData=${hub}&clientProtocol=1.5`
      );

      if (!negotiationResponse.ok) {
        throw new Error(`Negotiation failed: ${negotiationResponse.status}`);
      }

      const cookie = negotiationResponse.headers.get("Set-Cookie") ?? 
                     negotiationResponse.headers.get("set-cookie");
      const negotiationData: NegotiationResponse = await negotiationResponse.json();

      if (!cookie || !negotiationData.ConnectionToken) {
        throw new Error("Missing required negotiation data");
      }

      console.log(`[${this.signalrUrl}] HTTP negotiation complete`);

      const wsUrl = `wss://${this.signalrUrl}/connect?clientProtocol=1.5&transport=webSockets&connectionToken=${encodeURIComponent(
        negotiationData.ConnectionToken
      )}&connectionData=${hub}`;

      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log(`[${this.signalrUrl}] WebSocket open`);
        
        this.state = {};
        this.messageCount = 0;
        this.emptyMessageCount = 0;
        
        this.notifyStatusCallbacks('connected');

        // Subscribe to F1 live timing feeds
        this.websocket?.send(
          JSON.stringify({
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
          })
        );
      };

      this.websocket.onmessage = (event) => {
        this.updateState(event.data.toString());
      };

      this.websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.notifyStatusCallbacks('error');
      };

      this.websocket.onclose = () => {
        console.log("WebSocket closed");
        this.state = {};
        this.messageCount = 0;
        this.emptyMessageCount = 0;
        this.notifyStatusCallbacks('disconnected');

        // Retry connection after delay
        this.reconnectTimer = setTimeout(() => {
          this.setupStream();
        }, this.retryFreq);
      };

    } catch (error) {
      console.error(`[${this.signalrUrl}] Connection failed:`, error);
      this.notifyStatusCallbacks('error');
      
      // Retry connection after delay
      this.reconnectTimer = setTimeout(() => {
        this.setupStream();
      }, this.retryFreq);
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

  private notifyStatusCallbacks(status: 'connected' | 'disconnected' | 'error'): void {
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
    await this.setupStream();
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  public onData(callback: (data: F1LiveData) => void): void {
    this.dataCallbacks.push(callback);
  }

  public onStatus(callback: (status: 'connected' | 'disconnected' | 'error') => void): void {
    this.statusCallbacks.push(callback);
  }

  public getCurrentData(): F1LiveData {
    return { ...this.state };
  }

  public getMessageCount(): number {
    return this.messageCount;
  }

  public isActive(): boolean {
    return this.messageCount > 5;
  }
}

export default F1LiveDataAcquisition;

// CommonJS compatibility
module.exports = F1LiveDataAcquisition;
module.exports.default = F1LiveDataAcquisition;
