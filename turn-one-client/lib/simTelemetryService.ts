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
    /** Populated when the source is a v2 `tick` frame; absent from legacy ACC physics/graphics packets. */
    isValidLap?: boolean;
    isInPitLane?: boolean;
    /** 0..1 track spline position, derived from `lapDistM / trackLengthM` when a length is known. */
    normalizedCarPosition?: number;
    currentSectorIndex?: number;
}

export interface SimStatic {
    carModel: string;
    track: string;
    playerName: string;
    maxRpm: number;
}

/**
 * One protocol-v2 `tick` frame — see `lib/simracing/protocol.ts` for the full channel registry and
 * `docs/architecture/sim-telemetry-protocol-v2.md` for the wire format. Only the fields every tick is
 * guaranteed to carry are required; everything else depends on plan/sim and may be missing.
 */
export interface SimTick {
    lap: number;
    speed: number;
    throttle: number;
    brake: number;
    gear: number;
    rpm: number;

    lapTimeMs?: number;
    lapDistM?: number;
    sector?: number;
    valid?: boolean;
    pit?: number;
    timeMs?: number;

    clutch?: number;
    steer?: number;
    steerDeg?: number;
    gLat?: number;
    gLong?: number;
    gVert?: number;
    fuel?: number;
    tc?: number;
    abs?: number;
    brakeBias?: number;

    posX?: number;
    posY?: number;
    posZ?: number;
    heading?: number;

    tyreTemp_fl?: number;
    tyreTemp_fr?: number;
    tyreTemp_rl?: number;
    tyreTemp_rr?: number;
    tyrePress_fl?: number;
    tyrePress_fr?: number;
    tyrePress_rl?: number;
    tyrePress_rr?: number;
    tyreWear_fl?: number;
    tyreWear_fr?: number;
    tyreWear_rl?: number;
    tyreWear_rr?: number;
    brakeTemp_fl?: number;
    brakeTemp_fr?: number;
    brakeTemp_rl?: number;
    brakeTemp_rr?: number;
}

export interface LapProcessedEvent {
    sessionId: string;
    lapNumber: number;
    lapId: string;
    isValid: boolean;
    lapTimeMs: number | null;
    cornerCount: number;
}

const ACC_INVALID_TIME = 2147483647;

function num(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** ACC's "M:SS:mmm" lap-time display format. */
function formatAccTime(ms: number | undefined): string | undefined {
    if (ms == null || !Number.isFinite(ms) || ms < 0) return undefined;
    const totalMs = Math.round(ms);
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const millis = totalMs % 1000;
    return `${minutes}:${String(seconds).padStart(2, "0")}:${String(millis).padStart(3, "0")}`;
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
    private viewerCountListeners: Set<(sessionId: string, count: number) => void> = new Set();
    private tickListeners: Set<(data: SimTick) => void> = new Set();
    private lapProcessedListeners: Set<(data: LapProcessedEvent) => void> = new Set();

    // Carried-forward state for fields a `tick` frame doesn't (re)supply, so the synthesised
    // SimPhysics/SimGraphics objects always satisfy the full legacy shape the cards expect.
    private lastPhysics: SimPhysics | null = null;
    private lastGraphics: SimGraphics | null = null;
    private lastStatic: SimStatic | null = null;
    /** Track length in metres, learned from a v2 `session_start`, used to derive `normalizedCarPosition`. */
    private trackLengthM: number | null = null;

    public async connect(spectateSessionId?: string, overrideAccessToken?: string) {
        if (this.connection) return;

        const backendUrlStr = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api";
        const backendUrl = backendUrlStr.replace(/\/api\/?$/, "");
        const token = overrideAccessToken ?? localStorage.getItem("token");

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${backendUrl}/api/hubs/simtelemetry`, {
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

        this.connection.on("ReceiveTelemetry", (type: string, payload: unknown) => {
            if (type === "physics") this.notifyPhysics(payload as SimPhysics);
            else if (type === "graphics") this.notifyGraphics(payload as SimGraphics);
            else if (type === "static") this.notifyStatic(payload as SimStatic);
            else if (type === "tick") this.handleTick(payload as SimTick);
            else if (type === "session_start") this.handleSessionStart(payload as Record<string, unknown>);
        });

        this.connection.on("SessionEnded", (sessionId: string) => {
            this.sessionEndedListeners.forEach(listener => listener(sessionId));
        });

        this.connection.on("ViewerCountChanged", (sessionId: string, count: number) => {
            this.viewerCountListeners.forEach(listener => listener(sessionId, count));
        });

        this.connection.on("LapProcessed", (payload: LapProcessedEvent) => {
            this.lapProcessedListeners.forEach(listener => listener(payload));
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

    public onViewerCount(callback: (sessionId: string, count: number) => void) { this.viewerCountListeners.add(callback); }
    public offViewerCount(callback: (sessionId: string, count: number) => void) { this.viewerCountListeners.delete(callback); }

    public onTick(callback: (data: SimTick) => void) { this.tickListeners.add(callback); }
    public offTick(callback: (data: SimTick) => void) { this.tickListeners.delete(callback); }

    public onLapProcessed(callback: (data: LapProcessedEvent) => void) { this.lapProcessedListeners.add(callback); }
    public offLapProcessed(callback: (data: LapProcessedEvent) => void) { this.lapProcessedListeners.delete(callback); }

    public async getViewerCount(sessionId: string): Promise<number> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return 0;
        try { return await this.connection.invoke<number>("GetViewerCount", sessionId); }
        catch { return 0; }
    }

    public async subscribeOwnerById(): Promise<void> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
        await this.connection.invoke("SubscribeToOwnTelemetry");
    }

    // Private Notifiers
    private notifyStatus(status: ConnectionStatus) { this.statusListeners.forEach(cb => cb(status)); }
    private notifyPhysics(data: SimPhysics) { this.lastPhysics = data; this.physicsListeners.forEach(cb => cb(data)); }
    private notifyGraphics(data: SimGraphics) { this.lastGraphics = data; this.graphicsListeners.forEach(cb => cb(data)); }
    private notifyStatic(data: SimStatic) { this.lastStatic = data; this.staticListeners.forEach(cb => cb(data)); }

    // --- protocol-v2 tick handling ----------------------------------------

    private handleSessionStart(payload: Record<string, unknown>) {
        const trackLengthM = num(payload.trackLengthM);
        if (trackLengthM != null) this.trackLengthM = trackLengthM;

        const car = payload.car as Record<string, unknown> | undefined;

        const staticInfo: SimStatic = {
            carModel: typeof car?.name === "string" ? car.name : "",
            track: typeof payload.trackName === "string" ? payload.trackName : "",
            playerName: typeof payload.driver === "string" ? payload.driver : "",
            // Max RPM isn't part of session_start; keep whatever we last knew (0 on a fresh connection).
            maxRpm: this.lastStatic?.maxRpm ?? 0,
        };
        this.notifyStatic(staticInfo);
    }

    private handleTick(tick: SimTick) {
        this.tickListeners.forEach(cb => cb(tick));
        this.notifyPhysics(this.synthesizePhysics(tick));
        this.notifyGraphics(this.synthesizeGraphics(tick));
    }

    private synthesizePhysics(tick: SimTick): SimPhysics {
        const prev = this.lastPhysics;
        const gearRaw = num(tick.gear);
        return {
            speedKmh: num(tick.speed) ?? prev?.speedKmh ?? 0,
            // Mobile/legacy convention: 0 = R, 1 = N, 2 = 1st, ... — v2 ticks send 0-based gear (-1 = R, 0 = N, 1 = 1st).
            gear: gearRaw != null ? gearRaw + 1 : (prev?.gear ?? 1),
            rpms: num(tick.rpm) ?? prev?.rpms ?? 0,
            gas: num(tick.throttle) ?? prev?.gas ?? 0,
            brake: num(tick.brake) ?? prev?.brake ?? 0,
            clutch: num(tick.clutch) ?? prev?.clutch ?? 0,
            tyreCoreTemperature: [
                num(tick.tyreTemp_fl) ?? prev?.tyreCoreTemperature[0] ?? 0,
                num(tick.tyreTemp_fr) ?? prev?.tyreCoreTemperature[1] ?? 0,
                num(tick.tyreTemp_rl) ?? prev?.tyreCoreTemperature[2] ?? 0,
                num(tick.tyreTemp_rr) ?? prev?.tyreCoreTemperature[3] ?? 0,
            ],
            wheelsPressure: [
                num(tick.tyrePress_fl) ?? prev?.wheelsPressure[0] ?? 0,
                num(tick.tyrePress_fr) ?? prev?.wheelsPressure[1] ?? 0,
                num(tick.tyrePress_rl) ?? prev?.wheelsPressure[2] ?? 0,
                num(tick.tyrePress_rr) ?? prev?.wheelsPressure[3] ?? 0,
            ],
            brakeTemp: [
                num(tick.brakeTemp_fl) ?? prev?.brakeTemp[0] ?? 0,
                num(tick.brakeTemp_fr) ?? prev?.brakeTemp[1] ?? 0,
                num(tick.brakeTemp_rl) ?? prev?.brakeTemp[2] ?? 0,
                num(tick.brakeTemp_rr) ?? prev?.brakeTemp[3] ?? 0,
            ],
            // Not on the v2 tick — carry forward whatever we last knew (0 on a fresh connection).
            padLife: prev?.padLife ?? [0, 0, 0, 0],
            discLife: prev?.discLife ?? [0, 0, 0, 0],
            fuel: num(tick.fuel) ?? prev?.fuel ?? 0,
        };
    }

    private synthesizeGraphics(tick: SimTick): SimGraphics {
        const prev = this.lastGraphics;
        const lapTimeMs = num(tick.lapTimeMs);
        const normalizedCarPosition =
            this.trackLengthM && this.trackLengthM > 0 && num(tick.lapDistM) != null
                ? (tick.lapDistM as number) / this.trackLengthM
                : 0;

        return {
            completedLaps: Math.max(0, (num(tick.lap) ?? 1) - 1),
            position: prev?.position ?? 0,
            currentTime: formatAccTime(lapTimeMs) ?? prev?.currentTime ?? "0:00:000",
            lastTime: prev?.lastTime ?? "-:--:---",
            bestTime: prev?.bestTime ?? "-:--:---",
            deltaLapTime: prev?.deltaLapTime ?? "-:--:---",
            iLastTime: prev?.iLastTime ?? ACC_INVALID_TIME,
            iBestTime: prev?.iBestTime ?? ACC_INVALID_TIME,
            sessionTimeLeft: prev?.sessionTimeLeft ?? 0,
            fuelEstimatedLaps: prev?.fuelEstimatedLaps ?? 0,
            trackGripStatus: prev?.trackGripStatus ?? "",
            rainIntensity: prev?.rainIntensity ?? "",
            tc: num(tick.tc) ?? prev?.tc ?? 0,
            abs: num(tick.abs) ?? prev?.abs ?? 0,
            engineMap: prev?.engineMap ?? 0,
            status: "AC_LIVE",
            isValidLap: tick.valid ?? prev?.isValidLap ?? true,
            isInPitLane: (num(tick.pit) ?? 0) >= 1,
            normalizedCarPosition,
            currentSectorIndex: num(tick.sector) ?? prev?.currentSectorIndex ?? 0,
        };
    }
}

export const simTelemetryService = new SimTelemetryService();
