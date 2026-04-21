import * as signalR from "@microsoft/signalr";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

export interface SimPhysics {
    speedKmh: number;
    gear: number;
    rpms: number;
    gas: number;
    brake: number;
    clutch: number;
    tyreCoreTemperature: [number, number, number, number];
    wheelsPressure: [number, number, number, number];
    brakeTemp: [number, number, number, number];
    padLife: [number, number, number, number];
    discLife: [number, number, number, number];
    fuel: number;
}

export interface SimGraphics {
    completedLaps: number;
    position: number;
    currentTime: string;
    lastTime: string;
    bestTime: string;
    deltaLapTime: string;
    iLastTime: number;
    iBestTime: number;
    sessionTimeLeft: number;
    fuelEstimatedLaps: number;
    trackGripStatus: string;
    rainIntensity: string;
    tc: number;
    abs: number;
    engineMap: number;
    status: string;
}

export interface SimStatic {
    carModel: string;
    track: string;
    playerName: string;
    maxRpm: number;
}

export interface SessionInfo {
    id: string;
    userId: string;
    carModel: string;
    track: string;
    driverName: string;
    sessionType: string;
    mode: number;
    isActive: boolean;
    lapCount: number;
}

class SimTelemetryService {
    private connection: signalR.HubConnection | null = null;
    private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
    private physicsListeners: Set<(data: SimPhysics) => void> = new Set();
    private graphicsListeners: Set<(data: SimGraphics) => void> = new Set();
    private staticListeners: Set<(data: SimStatic) => void> = new Set();
    private sessionEndedListeners: Set<(sessionId: string) => void> = new Set();

    public async connect(spectateSessionId?: string) {
        if (this.connection) return;

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271";
        const token = localStorage.getItem("token");

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${backendUrl}/hubs/simtelemetry`, {
                accessTokenFactory: () => token || "",
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        this.connection.onreconnecting(() => this.notifyStatus("reconnecting"));
        this.connection.onreconnected(async () => {
             this.notifyStatus("connected");
             await this.joinGroups(spectateSessionId);
        });
        this.connection.onclose(() => this.notifyStatus("disconnected"));

        this.connection.on("ReceiveTelemetry", (type: string, payload: any, timestamp: number) => {
            if (type === "physics") this.notifyPhysics(payload);
            else if (type === "graphics") this.notifyGraphics(payload);
            else if (type === "static") this.notifyStatic(payload);
        });

        this.connection.on("SessionEnded", (sessionId: string) => {
            this.sessionEndedListeners.forEach(listener => listener(sessionId));
        });

        this.notifyStatus("connecting");

        try {
            await this.connection.start();
            this.notifyStatus("connected");
            await this.joinGroups(spectateSessionId);
        } catch (err) {
            console.error("SignalR Connection Error: ", err);
            this.notifyStatus("disconnected");
        }
    }

    private async joinGroups(spectateSessionId?: string) {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
        
        if (spectateSessionId) {
             await this.connection.invoke("SpectateSession", spectateSessionId);
        } else {
             await this.connection.invoke("SubscribeToOwnTelemetry");
        }
    }

    public async disconnect(spectateSessionId?: string) {
        if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
            if (spectateSessionId) {
                await this.connection.invoke("StopSpectating",spectateSessionId);
            }
            await this.connection.stop();
        }
        this.connection = null;
        this.notifyStatus("disconnected");
    }

    // Event Registration
    public onStatusChange(callback: (status: ConnectionStatus) => void) { this.statusListeners.add(callback); }
    public offStatusChange(callback: (status: ConnectionStatus) => void) { this.statusListeners.delete(callback); }

    public onPhysics(callback: (data: SimPhysics) => void) { this.physicsListeners.add(callback); }
    public offPhysics(callback: (data: SimPhysics) => void) { this.physicsListeners.delete(callback); }

    public onGraphics(callback: (data: SimGraphics) => void) { this.graphicsListeners.add(callback); }
    public offGraphics(callback: (data: SimGraphics) => void) { this.graphicsListeners.delete(callback); }

    public onStatic(callback: (data: SimStatic) => void) { this.staticListeners.add(callback); }
    public offStatic(callback: (data: SimStatic) => void) { this.staticListeners.delete(callback); }

    // Private Notifiers
    private notifyStatus(status: ConnectionStatus) { this.statusListeners.forEach(cb => cb(status)); }
    private notifyPhysics(data: SimPhysics) { this.physicsListeners.forEach(cb => cb(data)); }
    private notifyGraphics(data: SimGraphics) { this.graphicsListeners.forEach(cb => cb(data)); }
    private notifyStatic(data: SimStatic) { this.staticListeners.forEach(cb => cb(data)); }
}

export const simTelemetryService = new SimTelemetryService();
