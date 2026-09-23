/**
 * Columnar model + adapters for the lap-telemetry API v2.
 *
 * The server already returns a lap on a fixed distance grid (`LapTelemetryDto.channels`, one
 * `float?[]` per channel, `SampleCount` entries each). This module turns that columnar shape into
 * (a) `LapChannels`, a typed-array-backed structure cheap to hand to a chart library, and (b) a
 * `DistanceSeries` compatible with the existing `analysis.ts` primitives (`deltaTrace`,
 * `resampleByDistance`, etc.) so those functions work unmodified over server-built data.
 *
 * Because the server's grid is already uniform, callers must NOT run `toDistanceSeries` /
 * `resampleByDistance` again on the result of `fromLapTelemetryDto` — use `isOnGrid` to assert
 * that in tests or defensive code instead.
 */

import type { DistanceSample, DistanceSeries } from "@/lib/simracing/analysis";
import type { CornerCompareRowDto, DistanceSource, LapCornerDto, LapOverlayDto, LapTelemetryDto } from "@/lib/simracing/protocol";

// ---------------------------------------------------------------------------
// Columnar model
// ---------------------------------------------------------------------------

export interface LapChannels {
    /** Grid spacing, in metres. */
    stepM: number;
    /** Number of samples in every channel array. */
    n: number;
    /** Channel key -> values, NaN where the server sent `null`. */
    channels: Record<string, Float32Array>;
}

/** Builds `LapChannels` from a DTO's channel dictionary, converting `null` to `NaN`. */
function toLapChannels(stepM: number, sampleCount: number, dtoChannels: Record<string, (number | null)[]>): LapChannels {
    const channels: Record<string, Float32Array> = {};
    for (const [key, values] of Object.entries(dtoChannels)) {
        const arr = new Float32Array(sampleCount);
        for (let i = 0; i < sampleCount; i++) {
            const v = values[i];
            arr[i] = v == null ? NaN : v;
        }
        channels[key] = arr;
    }
    return { stepM, n: sampleCount, channels };
}

/** The distance (metres) at each grid point: `0, stepM, 2*stepM, ...`. */
export function distanceAxis(lc: LapChannels): Float32Array {
    const out = new Float32Array(lc.n);
    for (let i = 0; i < lc.n; i++) out[i] = i * lc.stepM;
    return out;
}

/** True when `series` sits on a fixed grid of spacing `stepM` (server-built data). */
export function isOnGrid(series: DistanceSeries, stepM: number): boolean {
    return series.source === "server" && series.stepM === stepM;
}

// ---------------------------------------------------------------------------
// LapTelemetryDto -> columnar + DistanceSeries
// ---------------------------------------------------------------------------

const chan = (lc: LapChannels, key: string, i: number): number => {
    const v = lc.channels[key]?.[i];
    return v == null || Number.isNaN(v) ? 0 : v;
};

const chanOpt = (lc: LapChannels, key: string, i: number): number | undefined => {
    const v = lc.channels[key]?.[i];
    return v == null || Number.isNaN(v) ? undefined : v;
};

export interface ToDistanceSeriesMeta {
    lapId?: string;
    trackProfileId?: string | null;
    distanceSource?: DistanceSource;
}

/**
 * Builds a `DistanceSeries` from a `LapChannels` columnar block. One sample per grid point,
 * distance = i * stepM. There is no wall-clock timestamp on server data (only lap-relative
 * `timeMs`), so `timestamp` is derived as `time * 1000` rather than an actual Unix time — treat it
 * as lap-relative, not absolute, when syncing against time-based UI.
 */
export function toDistanceSeriesFromColumnar(lc: LapChannels, meta: ToDistanceSeriesMeta = {}): DistanceSeries {
    const samples: DistanceSample[] = [];

    for (let i = 0; i < lc.n; i++) {
        const time = chan(lc, "timeMs", i) / 1000;
        samples.push({
            distance: i * lc.stepM,
            time,
            timestamp: time * 1000,
            speedKmh: chan(lc, "speed", i),
            gas: chan(lc, "throttle", i),
            brake: chan(lc, "brake", i),
            gear: chan(lc, "gear", i),
            rpms: chan(lc, "rpm", i),
            steerAngle: chan(lc, "steer", i),
            accGx: chan(lc, "gLat", i),
            // NOTE: legacy (v1/ACC) code used `accG_y`, which on ACC's axes is *vertical*. From the
            // v2 server data on, `accGy` on a `DistanceSample` means *longitudinal* G (`gLong`).
            accGy: chan(lc, "gLong", i),
            x: chanOpt(lc, "posX", i),
            y: chanOpt(lc, "posY", i),
            sector: chanOpt(lc, "sector", i),
            gLong: chanOpt(lc, "gLong", i),
            clutch: chanOpt(lc, "clutch", i),
            fuel: chanOpt(lc, "fuel", i),
            drs: chanOpt(lc, "drs", i),
            heading: chanOpt(lc, "heading", i),
        });
    }

    const length = (lc.n - 1) * lc.stepM;
    const duration = samples[samples.length - 1]?.time ?? 0;

    return {
        samples,
        length,
        duration,
        fromTrackPosition: (meta.distanceSource ?? "LapDistance") !== "SpeedIntegrated",
        stepM: lc.stepM,
        source: "server",
        lapId: meta.lapId,
        trackProfileId: meta.trackProfileId,
    };
}

/** Parses a `LapTelemetryDto` into the columnar block, an analysis-ready `DistanceSeries`, and its corners. */
export function fromLapTelemetryDto(dto: LapTelemetryDto): {
    columnar: LapChannels;
    series: DistanceSeries;
    corners: LapCornerDto[];
} {
    const columnar = toLapChannels(dto.stepM, dto.sampleCount, dto.channels);
    const series = toDistanceSeriesFromColumnar(columnar, {
        lapId: dto.lapId,
        trackProfileId: dto.trackProfileId,
        distanceSource: (dto.distanceSource as DistanceSource) ?? undefined,
    });
    return { columnar, series, corners: dto.corners };
}

// ---------------------------------------------------------------------------
// Overlay adapters (uPlot AlignedData-ready)
// ---------------------------------------------------------------------------

/** `x` = shared distance axis, one `y` per lap. Missing channel on a lap -> an all-NaN array. */
export function overlayToAligned(overlay: LapOverlayDto, channel: string): { x: Float32Array; ys: Float32Array[] } {
    const n = overlay.sampleCount;
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) x[i] = i * overlay.stepM;

    const ys = overlay.laps.map(lap => {
        const values = lap.channels[channel];
        const arr = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const v = values?.[i];
            arr[i] = v == null ? NaN : v;
        }
        return arr;
    });

    return { x, ys };
}

/** Same shape as `overlayToAligned`, but for the per-lap cumulative delta trace. Ref lap -> null. */
export function overlayDelta(overlay: LapOverlayDto): { x: Float32Array; ys: (Float32Array | null)[] } {
    const n = overlay.sampleCount;
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) x[i] = i * overlay.stepM;

    const ys = overlay.laps.map(lap => {
        if (lap.lapId === overlay.refLapId || lap.deltaMs == null) return null;
        const arr = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const v = lap.deltaMs?.[i];
            arr[i] = v == null ? NaN : v;
        }
        return arr;
    });

    return { x, ys };
}

// ---------------------------------------------------------------------------
// Corner comparisons
// ---------------------------------------------------------------------------

export interface CornerDeltaRow {
    refIndex: number;
    name: string | null;
    minSpeedDeltaKmh: (number | null)[];
    brakingPointDeltaM: (number | null)[];
    throttleOnDeltaM: (number | null)[];
    timeDeltaMs: (number | null)[];
}

/** Per-row deltas of every lap in `rows[].perLap` against the first lap (index 0). */
export function cornerDeltas(rows: CornerCompareRowDto[]): CornerDeltaRow[] {
    return rows.map(row => {
        const base = row.perLap[0] ?? null;

        const deltaOf = (pick: (c: LapCornerDto) => number | null | undefined) =>
            row.perLap.map(c => {
                if (!c || !base) return null;
                const a = pick(c);
                const b = pick(base);
                if (a == null || b == null) return null;
                return a - b;
            });

        return {
            refIndex: row.refIndex,
            name: row.name,
            minSpeedDeltaKmh: deltaOf(c => c.minSpeedKmh),
            brakingPointDeltaM: deltaOf(c => c.brakingPointM),
            throttleOnDeltaM: deltaOf(c => c.throttleOnM),
            timeDeltaMs: row.deltaTimeInCornerMs,
        };
    });
}

export interface BrakingPointDelta {
    refIndex: number | null;
    deltaM: number | null;
    aM: number | null;
    bM: number | null;
}

/**
 * Matches corners of two laps by `refIndex` (falling back to array index) and returns the braking
 * point delta `a - b` for each — positive means `a` brakes later (further down the straight).
 */
export function brakingPointDeltas(a: LapCornerDto[], b: LapCornerDto[]): BrakingPointDelta[] {
    const bByRef = new Map<number, LapCornerDto>();
    b.forEach((corner, i) => bByRef.set(corner.refIndex ?? i, corner));

    return a.map((corner, i) => {
        const refIndex = corner.refIndex ?? i;
        const match = bByRef.get(refIndex);
        const aM = corner.brakingPointM ?? null;
        const bM = match?.brakingPointM ?? null;
        return {
            refIndex,
            deltaM: aM != null && bM != null ? aM - bM : null,
            aM,
            bM,
        };
    });
}

// ---------------------------------------------------------------------------
// Colours
// ---------------------------------------------------------------------------

export const LAP_COLORS = ["#DC2626", "#3B82F6", "#22C55E", "#F59E0B", "#A855F7", "#06B6D4", "#EC4899", "#84CC16"];

export function lapColor(i: number): string {
    return LAP_COLORS[i % LAP_COLORS.length];
}
