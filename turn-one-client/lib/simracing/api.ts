/**
 * Single API surface for the simracing section.
 *
 * Replaces the identical local `apiBase()` / `authHeaders()` pairs that were duplicated across
 * eight pages, and surfaces the HTTP status via `SimApiError` so callers can tell a plan gate
 * (403) apart from a genuine failure instead of showing a blank panel or an alert().
 */

import type { MultiChannelChartData } from "@/components/dashboard/simracing/charts/multi-channel-chart";

export class SimApiError extends Error {
    constructor(
        public readonly status: number,
        message: string
    ) {
        super(message);
        this.name = "SimApiError";
    }

    /** The backend returns 403 for features above the user's plan. */
    get isPlanGated() {
        return this.status === 403;
    }

    get isUnauthorized() {
        return this.status === 401;
    }
}

/** Backend origin without the trailing `/api`, since routes below include it explicitly. */
export function simApiBase() {
    const raw =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        (process.env.NODE_ENV === "development" ? "http://localhost:5271/api" : "https://backend.t1f1.com/api");
    return raw.replace(/\/api\/?$/, "");
}

function authHeaders(): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${simApiBase()}${path}`, {
        ...init,
        headers: { ...authHeaders(), ...(init.headers ?? {}) },
    });

    if (!res.ok) {
        let message = `${res.status} ${res.statusText}`;
        try {
            const body = await res.json();
            if (body?.message) message = body.message;
            else if (typeof body === "string") message = body;
        } catch {
            /* non-JSON error body — keep the status line */
        }
        throw new SimApiError(res.status, message);
    }

    if (res.status === 204) return undefined as T;

    try {
        return (await res.json()) as T;
    } catch {
        return undefined as T;
    }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SimStats {
    totalSessions: number;
    activeSessions: number;
    totalLaps: number;
    totalDistanceKm: number;
    totalPlayTimeSeconds: number;
    highestSpeedKmh: number;
    lastSessionAt: string | null;
    bestLap: {
        lapTimeMs: number | null;
        track: string;
        carModel: string;
        lapNumber: number;
        sessionId: string;
    } | null;
}

export interface SimSession {
    id: string;
    carModel: string;
    track: string;
    driverName: string;
    sessionType: string;
    visibility: number;
    isActive: boolean;
    lapCount: number;
    bestLapMs: number;
    startedAt: string;
    endedAt?: string;
    clientVersion?: string | null;
    lastSeenAt?: string | null;
}

export interface SimLap {
    id: string;
    sessionId: string;
    lapNumber: number;
    lapTimeMs: number | null;
    sector1Ms: number | null;
    sector2Ms: number | null;
    sector3Ms: number | null;
    isValid: boolean;
    maxSpeedKmh: number;
    maxRpm: number;
    averageThrottle: number;
    averageBrake: number;
    fuelUsed: number;
    brakingScore: number | null;
    throttleScore: number | null;
    consistencyScore: number | null;
    recordedAt: string;
}

export interface SimSessionSummary {
    sessionId: string;
    totalLaps: number;
    validLaps: number;
    invalidLaps: number;
    bestLapMs: number | null;
    medianLapMs: number | null;
    worstLapMs: number | null;
    theoreticalBestMs: number | null;
    bestSector1Ms: number | null;
    bestSector2Ms: number | null;
    bestSector3Ms: number | null;
    timeLeftOnTableMs: number | null;
    consistencyStdDevMs: number | null;
    topSpeedKmh: number;
    averageFuelPerLap: number | null;
}

export interface SimLeaderboardRow {
    userId: string;
    username: string;
    totalDistanceKm: number;
    totalLaps: number;
    totalSessions: number;
    highestSpeedKmh: number;
    totalPlayTimeSeconds: number;
    lastSessionAt: string | null;
}

export interface SimCompareResult {
    primary: { sessionId: string; lap: number | null; data: MultiChannelChartData };
    secondary: { sessionId: string; lap: number | null; data: MultiChannelChartData };
}

export interface LinkReleaseInfo {
    available: boolean;
    version: string | null;
    releasedAt: string | null;
    downloadUrl: string | null;
    sha256: string | null;
    sizeBytes: number | null;
    minWindowsBuild: string;
    changelog: { version: string; date: string | null; changes: string[] }[];
}

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

export const getMyStats = () => request<SimStats>("/api/telemetry/me/stats");
export const getMySessions = () => request<SimSession[]>("/api/telemetry/sessions/me");
export const getSession = (id: string) => request<SimSession>(`/api/telemetry/sessions/${id}`);
export const getLaps = (id: string) => request<SimLap[]>(`/api/telemetry/sessions/${id}/laps`);
export const getSummary = (id: string) => request<SimSessionSummary>(`/api/telemetry/sessions/${id}/summary`);
export const getLiveSessions = () => request<SimSession[]>("/api/telemetry/live");
export const getLeaderboards = () => request<SimLeaderboardRow[]>("/api/telemetry/leaderboards");

export const getMetrics = (id: string) =>
    request<
        {
            lapNumber: number;
            brakingScore: number | null;
            throttleScore: number | null;
            consistencyScore: number | null;
        }[]
    >(`/api/telemetry/sessions/${id}/metrics`);

export const getChannels = (id: string, channels?: string[]) =>
    request<MultiChannelChartData>(
        `/api/telemetry/sessions/${id}/channels${channels?.length ? `?channels=${channels.join(",")}` : ""}`
    );

export const getLapChart = (id: string, lap: number, channels?: string[]) =>
    request<MultiChannelChartData>(
        `/api/telemetry/sessions/${id}/laps/${lap}/chart${channels?.length ? `?channels=${channels.join(",")}` : ""}`
    );

export const compare = (
    id: string,
    against: string,
    opts: { lap?: number | null; againstLap?: number | null; channels?: string[] } = {}
) => {
    const params = new URLSearchParams({ against });
    if (opts.lap != null) params.set("lap", String(opts.lap));
    if (opts.againstLap != null) params.set("againstLap", String(opts.againstLap));
    if (opts.channels?.length) params.set("channels", opts.channels.join(","));
    return request<SimCompareResult>(`/api/telemetry/sessions/${id}/compare?${params}`);
};

export const setVisibility = (id: string, visibility: number) =>
    request<void>(`/api/telemetry/sessions/${id}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visibility),
    });

export const deleteSession = (id: string) =>
    request<void>(`/api/telemetry/sessions/${id}`, { method: "DELETE" });

export const getLinkRelease = () => request<LinkReleaseInfo>("/api/simracing/link/release");

// ---------------------------------------------------------------------------
// Formatting helpers (were duplicated inline across the section)
// ---------------------------------------------------------------------------

/** `1:23.45`, or an em dash when there is no time. */
export function formatLapTime(ms: number | null | undefined) {
    if (ms == null || ms <= 0) return "—";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${m}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

/** Signed delta in seconds, e.g. `+0.312` / `-1.044`. */
export function formatDelta(ms: number | null | undefined) {
    if (ms == null || !Number.isFinite(ms)) return "—";
    const sign = ms > 0 ? "+" : ms < 0 ? "-" : "";
    return `${sign}${(Math.abs(ms) / 1000).toFixed(3)}`;
}

export function formatPlayTime(seconds: number) {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatBytes(bytes: number | null | undefined) {
    if (!bytes || bytes <= 0) return "—";
    const mb = bytes / (1024 * 1024);
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}
