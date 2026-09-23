/**
 * Hand-mirror of the backend telemetry protocol v2.
 *
 * Source of truth: `turn-one-backend/Domain/Telemetry/ChannelRegistry.cs` (channel keys, units,
 * plan gating, v1→v2 aliases) and `turn-one-backend/Application/DTOs/LapTelemetryDtos.cs` (DTO
 * shapes). See `docs/architecture/sim-telemetry-protocol-v2.md` for the wire format. Keep this
 * file in lockstep with those — the registry comment points back here.
 *
 * DTO property names are camelCase because the backend serialises with System.Text.Json's default
 * naming policy (PascalCase C# properties → camelCase JSON).
 */

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

export const V2_CHANNELS = [
    // BASIC — enough for a two-lap speed/pedal overlay on a map.
    "lap",
    "lapTimeMs",
    "lapDistM",
    "sector",
    "speed",
    "rpm",
    "gear",
    "throttle",
    "brake",
    "posX",
    "posY",
    "heading",
    "valid",
    "pit",
    "timeMs",

    // PRO
    "clutch",
    "steer",
    "steerDeg",
    "gLat",
    "gLong",
    "gVert",
    "posZ",
    "driverStatus",
    "fuel",
    "tc",
    "abs",
    "brakeBias",
    "frame",

    // PRO, F1-only
    "drs",
    "ers",
    "ersMode",
    "tyreCompound",
    "tyreAgeLaps",

    // PRO, per-corner (flattened _fl/_fr/_rl/_rr)
    "tyreTemp_fl",
    "tyreTemp_fr",
    "tyreTemp_rl",
    "tyreTemp_rr",
    "tyrePress_fl",
    "tyrePress_fr",
    "tyrePress_rl",
    "tyrePress_rr",
    "tyreWear_fl",
    "tyreWear_fr",
    "tyreWear_rl",
    "tyreWear_rr",
    "brakeTemp_fl",
    "brakeTemp_fr",
    "brakeTemp_rl",
    "brakeTemp_rr",
    "slip_fl",
    "slip_fr",
    "slip_rl",
    "slip_rr",
    // PRO, F1-only, per-corner
    "surface_fl",
    "surface_fr",
    "surface_rl",
    "surface_rr",
] as const;

export type V2Channel = (typeof V2_CHANNELS)[number];

interface ChannelMeta {
    label: string;
    unit: string;
    kind: "continuous" | "discrete" | "flag" | "angle";
    minPlan: "BASIC" | "PRO";
}

export const CHANNEL_META_V2: Record<V2Channel, ChannelMeta> = {
    lap: { label: "Lap", unit: "", kind: "discrete", minPlan: "BASIC" },
    lapTimeMs: { label: "Lap time", unit: "ms", kind: "discrete", minPlan: "BASIC" },
    lapDistM: { label: "Lap distance", unit: "m", kind: "continuous", minPlan: "BASIC" },
    sector: { label: "Sector", unit: "", kind: "discrete", minPlan: "BASIC" },
    speed: { label: "Speed", unit: "km/h", kind: "continuous", minPlan: "BASIC" },
    rpm: { label: "RPM", unit: "rpm", kind: "continuous", minPlan: "BASIC" },
    gear: { label: "Gear", unit: "", kind: "discrete", minPlan: "BASIC" },
    throttle: { label: "Throttle", unit: "", kind: "continuous", minPlan: "BASIC" },
    brake: { label: "Brake", unit: "", kind: "continuous", minPlan: "BASIC" },
    posX: { label: "Position X", unit: "m", kind: "continuous", minPlan: "BASIC" },
    posY: { label: "Position Y", unit: "m", kind: "continuous", minPlan: "BASIC" },
    heading: { label: "Heading", unit: "rad", kind: "angle", minPlan: "BASIC" },
    valid: { label: "Lap valid", unit: "", kind: "flag", minPlan: "BASIC" },
    pit: { label: "Pit status", unit: "", kind: "discrete", minPlan: "BASIC" },
    timeMs: { label: "Lap time at point", unit: "ms", kind: "continuous", minPlan: "BASIC" },

    clutch: { label: "Clutch", unit: "", kind: "continuous", minPlan: "PRO" },
    steer: { label: "Steering input", unit: "", kind: "continuous", minPlan: "PRO" },
    steerDeg: { label: "Steering angle", unit: "°", kind: "continuous", minPlan: "PRO" },
    gLat: { label: "Lateral G", unit: "g", kind: "continuous", minPlan: "PRO" },
    gLong: { label: "Longitudinal G", unit: "g", kind: "continuous", minPlan: "PRO" },
    gVert: { label: "Vertical G", unit: "g", kind: "continuous", minPlan: "PRO" },
    posZ: { label: "Position Z", unit: "m", kind: "continuous", minPlan: "PRO" },
    driverStatus: { label: "Driver status", unit: "", kind: "discrete", minPlan: "PRO" },
    fuel: { label: "Fuel", unit: "L", kind: "continuous", minPlan: "PRO" },
    tc: { label: "Traction control", unit: "", kind: "discrete", minPlan: "PRO" },
    abs: { label: "ABS", unit: "", kind: "discrete", minPlan: "PRO" },
    brakeBias: { label: "Brake bias", unit: "%", kind: "continuous", minPlan: "PRO" },
    frame: { label: "Frame", unit: "", kind: "discrete", minPlan: "PRO" },

    drs: { label: "DRS", unit: "", kind: "flag", minPlan: "PRO" },
    ers: { label: "ERS stored", unit: "J", kind: "continuous", minPlan: "PRO" },
    ersMode: { label: "ERS mode", unit: "", kind: "discrete", minPlan: "PRO" },
    tyreCompound: { label: "Tyre compound", unit: "", kind: "discrete", minPlan: "PRO" },
    tyreAgeLaps: { label: "Tyre age", unit: "laps", kind: "discrete", minPlan: "PRO" },

    tyreTemp_fl: { label: "Front-left tyre temp", unit: "°C", kind: "continuous", minPlan: "PRO" },
    tyreTemp_fr: { label: "Front-right tyre temp", unit: "°C", kind: "continuous", minPlan: "PRO" },
    tyreTemp_rl: { label: "Rear-left tyre temp", unit: "°C", kind: "continuous", minPlan: "PRO" },
    tyreTemp_rr: { label: "Rear-right tyre temp", unit: "°C", kind: "continuous", minPlan: "PRO" },

    tyrePress_fl: { label: "Front-left tyre pressure", unit: "psi", kind: "continuous", minPlan: "PRO" },
    tyrePress_fr: { label: "Front-right tyre pressure", unit: "psi", kind: "continuous", minPlan: "PRO" },
    tyrePress_rl: { label: "Rear-left tyre pressure", unit: "psi", kind: "continuous", minPlan: "PRO" },
    tyrePress_rr: { label: "Rear-right tyre pressure", unit: "psi", kind: "continuous", minPlan: "PRO" },

    tyreWear_fl: { label: "Front-left tyre wear", unit: "", kind: "continuous", minPlan: "PRO" },
    tyreWear_fr: { label: "Front-right tyre wear", unit: "", kind: "continuous", minPlan: "PRO" },
    tyreWear_rl: { label: "Rear-left tyre wear", unit: "", kind: "continuous", minPlan: "PRO" },
    tyreWear_rr: { label: "Rear-right tyre wear", unit: "", kind: "continuous", minPlan: "PRO" },

    brakeTemp_fl: { label: "Front-left brake temp", unit: "°C", kind: "continuous", minPlan: "PRO" },
    brakeTemp_fr: { label: "Front-right brake temp", unit: "°C", kind: "continuous", minPlan: "PRO" },
    brakeTemp_rl: { label: "Rear-left brake temp", unit: "°C", kind: "continuous", minPlan: "PRO" },
    brakeTemp_rr: { label: "Rear-right brake temp", unit: "°C", kind: "continuous", minPlan: "PRO" },

    slip_fl: { label: "Front-left slip", unit: "", kind: "continuous", minPlan: "PRO" },
    slip_fr: { label: "Front-right slip", unit: "", kind: "continuous", minPlan: "PRO" },
    slip_rl: { label: "Rear-left slip", unit: "", kind: "continuous", minPlan: "PRO" },
    slip_rr: { label: "Rear-right slip", unit: "", kind: "continuous", minPlan: "PRO" },

    surface_fl: { label: "Front-left surface", unit: "", kind: "continuous", minPlan: "PRO" },
    surface_fr: { label: "Front-right surface", unit: "", kind: "continuous", minPlan: "PRO" },
    surface_rl: { label: "Rear-left surface", unit: "", kind: "continuous", minPlan: "PRO" },
    surface_rr: { label: "Rear-right surface", unit: "", kind: "continuous", minPlan: "PRO" },
};

/** v1 (ACC shared-memory) key → v2 (sim-neutral) key. Mirrors `ChannelRegistry.V1ToV2`. */
export const V1_TO_V2: Record<string, string> = {
    speedKmh: "speed",
    rpms: "rpm",
    gas: "throttle",
    steerAngle: "steer",
    accG_x: "gLat",
    accG_z: "gLong",
    accG_y: "gVert",
    iCurrentTime: "lapTimeMs",
    isValidLap: "valid",
    currentSectorIndex: "sector",
    isInPitLane: "pit",
    normalizedCarPosition: "lapDistM",
    tyreCoreTemperature: "tyreTemp",
    wheelsPressure: "tyrePress",
    wheelSlip: "slip",
};

const CORNER_SUFFIXES = ["_fl", "_fr", "_rl", "_rr"];

/** v2 key for a v1 key (corner-suffixed keys are handled), or the key itself when already canonical. */
export function canonicalChannel(key: string): string {
    if (key in V1_TO_V2) return V1_TO_V2[key];

    for (const suffix of CORNER_SUFFIXES) {
        if (key.endsWith(suffix)) {
            const stem = key.slice(0, -suffix.length);
            if (stem in V1_TO_V2) return V1_TO_V2[stem] + suffix;
        }
    }

    return key;
}

// ---------------------------------------------------------------------------
// Enum-ish strings
// ---------------------------------------------------------------------------

export type LapKind = "Flying" | "OutLap" | "InLap" | "Pit" | "Partial" | "Aborted";

export type DistanceSource = "LapDistance" | "NormalizedPosition" | "SpeedIntegrated";

export type SimSource = "Acc" | "Ac" | "IRacing" | "F1_25" | "F1_26" | "Unknown";

export type TrackProfileStatus = "Provisional" | "Stable" | "Curated";

export const SIM_SOURCE_LABEL: Record<SimSource, string> = {
    Acc: "ACC",
    Ac: "Assetto Corsa",
    IRacing: "iRacing",
    F1_25: "F1 25",
    F1_26: "F1 26",
    Unknown: "Unknown",
};

// ---------------------------------------------------------------------------
// DTOs — mirrors of Application/DTOs/LapTelemetryDtos.cs
// ---------------------------------------------------------------------------

export interface LapCornerDto {
    index: number;
    refIndex: number | null;
    name: string | null;
    direction: number;
    isKink: boolean;
    entryM: number;
    apexM: number;
    exitM: number;
    brakingPointM: number | null;
    brakeReleaseM: number | null;
    throttleOnM: number | null;
    fullThrottleM: number | null;
    entrySpeedKmh: number;
    minSpeedKmh: number;
    exitSpeedKmh: number;
    peakBrake: number;
    peakGLat: number;
    gearAtApex: number;
    minGear: number;
    timeInCornerMs: number;
    brakeToThrottleMs: number | null;
    trailBrakeM: number | null;
}

export interface LapSummaryDto {
    lapTimeMs: number | null;
    sectorsMs: (number | null)[];
    isValid: boolean;
    kind: LapKind | string;
    lapDistanceM: number | null;
    averageSpeedKmh: number | null;
    maxSpeedKmh: number;
    minSpeedKmh: number | null;
    averageThrottle: number;
    averageBrake: number;
    fullThrottlePct: number | null;
    brakingPct: number | null;
    coastingPct: number | null;
    fuelUsed: number;
    gearShifts: number | null;
    peakGLat: number | null;
    peakGLong: number | null;
    brakingScore: number | null;
    throttleScore: number | null;
    consistencyScore: number | null;
}

export interface LapTelemetryDto {
    lapId: string;
    sessionId: string;
    lapNumber: number;
    stepM: number;
    sampleCount: number;
    lapLengthM: number;
    distanceSource: DistanceSource | string;
    /** `"legacy"` when built from decimated v1 ticks; null otherwise. */
    quality: string | null;
    trackProfileId: string | null;
    profileVersion: number | null;
    /** Channel key -> sampleCount values; null entries in the array mean "no data at that point". */
    channels: Record<string, (number | null)[]>;
    corners: LapCornerDto[];
    summary: LapSummaryDto;
}

export interface ReferenceCornerDto {
    index: number;
    name: string | null;
    entryM: number;
    apexM: number;
    exitM: number;
    direction: number;
    isKink: boolean;
}

export interface TrackProfileDto {
    id: string;
    source: SimSource | string;
    trackId: string;
    displayName: string;
    status: TrackProfileStatus | string;
    lengthM: number;
    sectorCount: number;
    sectorBoundariesM: number[];
    corners: ReferenceCornerDto[];
    version: number;
    lapSampleCount: number;
    /** XY centreline as [x0, y0, x1, y1, ...] at 5 m spacing, when captured. */
    centerline: number[] | null;
}

export interface LapOverlayEntryDto {
    lapId: string;
    sessionId: string;
    lapNumber: number;
    lapTimeMs: number | null;
    sectorsMs: (number | null)[];
    isValid: boolean;
    kind: LapKind | string;
    sessionStartedAt: string;
    car: string;
    driver: string;
    quality: string | null;
    channels: Record<string, (number | null)[]>;
    /** Cumulative delta vs the reference lap, ms, positive = slower. Null for the reference itself. */
    deltaMs: (number | null)[] | null;
    corners: LapCornerDto[];
}

export interface LapOverlayDto {
    stepM: number;
    /** Shared sample count = min over laps. */
    sampleCount: number;
    refLapId: string;
    track: TrackProfileDto | null;
    lengthMismatch: boolean;
    channels: string[];
    laps: LapOverlayEntryDto[];
}

export interface CornerCompareRowDto {
    refIndex: number;
    name: string | null;
    /** Index-aligned with the request's lap ids; null when the lap had no matching corner. */
    perLap: (LapCornerDto | null)[];
    /** Time in corner vs the first lap, ms. */
    deltaTimeInCornerMs: (number | null)[];
}

export interface CornerCompareDto {
    track: TrackProfileDto | null;
    lapIds: string[];
    rows: CornerCompareRowDto[];
}

export interface TrackLapListItemDto {
    lapId: string;
    sessionId: string;
    lapNumber: number;
    sessionStartedAt: string;
    car: string;
    carId: string | null;
    driver: string;
    sessionKind: string;
    lapTimeMs: number | null;
    sectorsMs: (number | null)[];
    isValid: boolean;
    kind: LapKind | string;
    hasTelemetry: boolean;
    quality: string | null;
    isMine: boolean;
}

export interface MyTrackDto {
    profile: TrackProfileDto;
    sessionCount: number;
    lapCount: number;
    validLapCount: number;
    bestLapMs: number | null;
    bestLapId: string | null;
    lastDrivenAt: string;
    cars: string[];
}

export interface ReprocessRequestDto {
    sessionIds?: string[] | null;
    from?: string | null;
    to?: string | null;
    onlyLegacy?: boolean;
    force?: boolean;
}

export interface ReprocessStatusDto {
    jobId: string;
    state: string;
    sessionsTotal: number;
    sessionsDone: number;
    lapsProcessed: number;
    lapsFailed: number;
    startedAt: string;
    finishedAt: string | null;
    lastError: string | null;
}

// ---------------------------------------------------------------------------
// Chart data types
// ---------------------------------------------------------------------------

export interface MultiChannelPoint {
    timestamp: number;
    values: Record<string, number | null>;
}

export interface MultiChannelChartData {
    channels: string[];
    points: MultiChannelPoint[];
}

export interface ChannelConfig {
    key: string;
    label: string;
    color: string;
    axis: "left" | "right";
    unit?: string;
}

export const DEFAULT_CHANNELS: ChannelConfig[] = [
    { key: "speedKmh", label: "Speed", color: "#ef4444", axis: "left", unit: "km/h" },
    { key: "rpms", label: "RPM", color: "#3b82f6", axis: "right", unit: "rpm" },
    { key: "gas", label: "Throttle", color: "#22c55e", axis: "left", unit: "%" },
    { key: "brake", label: "Brake", color: "#f97316", axis: "left", unit: "%" },
    { key: "gear", label: "Gear", color: "#a855f7", axis: "right", unit: "" },
    { key: "steerAngle", label: "Steer", color: "#06b6d4", axis: "right", unit: "°" },
    { key: "clutch", label: "Clutch", color: "#eab308", axis: "left", unit: "%" },
];
