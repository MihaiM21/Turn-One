/**
 * Telemetry analysis primitives.
 *
 * Pure functions over the `MultiChannelChartData` the backend returns — no React, no fetching —
 * so they can be unit-tested and reused by charts, the coach and the export cards alike.
 *
 * The central idea: raw traces are plotted against wall-clock time, which makes two laps
 * impossible to compare. Everything here first converts a lap onto a *distance* axis, after which
 * laps overlay exactly and a real time-delta can be computed.
 */

import type { MultiChannelChartData } from "@/components/dashboard/simracing/charts/multi-channel-chart";

export interface DistanceSample {
    /** Metres from the start/finish line. */
    distance: number;
    /** Seconds since the start of the lap. */
    time: number;
    /** Original wall-clock timestamp, for cursor sync with time-based components. */
    timestamp: number;
    speedKmh: number;
    gas: number;
    brake: number;
    gear: number;
    rpms: number;
    steerAngle: number;
    accGx: number;
    accGy: number;
}

export interface DistanceSeries {
    samples: DistanceSample[];
    /** Total distance covered, in metres. */
    length: number;
    /** Elapsed lap time, in seconds. */
    duration: number;
    /** True when distance came from the track-spline channel rather than integrated speed. */
    fromTrackPosition: boolean;
}

const num = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Channel values arrive as 0–1 for pedals in ACC, but some sources use 0–100. */
function normalizePedal(v: number) {
    return v > 1.5 ? v / 100 : v;
}

// ---------------------------------------------------------------------------
// Distance
// ---------------------------------------------------------------------------

/**
 * Convert a time-series lap into a distance-indexed series.
 *
 * Prefers `normalizedCarPosition` (ACC's 0–1 track spline) scaled by the track length. When that
 * channel is unavailable — BASIC plan, or sessions recorded before the channel was exposed —
 * falls back to trapezoidal integration of speed, which is accurate to a couple of percent over
 * a lap and is enough to make two laps comparable.
 */
export function toDistanceSeries(data: MultiChannelChartData, trackLengthM?: number): DistanceSeries {
    const points = data.points ?? [];
    if (points.length < 2) {
        return { samples: [], length: 0, duration: 0, fromTrackPosition: false };
    }

    const hasPosition =
        data.channels?.includes("normalizedCarPosition") &&
        points.some(p => typeof p.values.normalizedCarPosition === "number");

    const t0 = points[0].timestamp;
    const samples: DistanceSample[] = [];

    let distance = 0;
    let prevTs = t0;
    let prevSpeedMs = num(points[0].values.speedKmh) / 3.6;
    let prevPos: number | null = null;
    let lapsWrapped = 0;

    for (const p of points) {
        const timestamp = p.timestamp;
        const dt = Math.max(0, (timestamp - prevTs) / 1000);
        const speedMs = num(p.values.speedKmh) / 3.6;

        if (hasPosition && trackLengthM && trackLengthM > 0) {
            const raw = num(p.values.normalizedCarPosition);
            // The spline wraps 1 -> 0 at the line; keep distance monotonic across it.
            if (prevPos != null && raw < prevPos - 0.5) lapsWrapped += 1;
            prevPos = raw;
            distance = (lapsWrapped + raw) * trackLengthM;
        } else {
            // Trapezoidal: average of the two speeds over the interval.
            distance += ((prevSpeedMs + speedMs) / 2) * dt;
        }

        samples.push({
            distance,
            time: (timestamp - t0) / 1000,
            timestamp,
            speedKmh: num(p.values.speedKmh),
            gas: normalizePedal(num(p.values.gas)),
            brake: normalizePedal(num(p.values.brake)),
            gear: num(p.values.gear),
            rpms: num(p.values.rpms),
            steerAngle: num(p.values.steerAngle),
            accGx: num(p.values.accG_x),
            accGy: num(p.values.accG_y),
        });

        prevTs = timestamp;
        prevSpeedMs = speedMs;
    }

    return {
        samples,
        length: samples[samples.length - 1]?.distance ?? 0,
        duration: samples[samples.length - 1]?.time ?? 0,
        fromTrackPosition: !!(hasPosition && trackLengthM),
    };
}

/** Linear interpolation of a lap onto a fixed distance grid, so two laps line up sample-for-sample. */
export function resampleByDistance(series: DistanceSeries, stepM = 5): DistanceSample[] {
    const { samples } = series;
    if (samples.length < 2) return [];

    const out: DistanceSample[] = [];
    let i = 0;

    for (let d = 0; d <= series.length; d += stepM) {
        while (i < samples.length - 2 && samples[i + 1].distance < d) i++;

        const a = samples[i];
        const b = samples[i + 1] ?? a;
        const span = b.distance - a.distance;
        const t = span > 0 ? (d - a.distance) / span : 0;
        const lerp = (x: number, y: number) => x + (y - x) * t;

        out.push({
            distance: d,
            time: lerp(a.time, b.time),
            timestamp: lerp(a.timestamp, b.timestamp),
            speedKmh: lerp(a.speedKmh, b.speedKmh),
            gas: lerp(a.gas, b.gas),
            brake: lerp(a.brake, b.brake),
            // Gear is discrete — interpolating it would invent half-gears.
            gear: a.gear,
            rpms: lerp(a.rpms, b.rpms),
            steerAngle: lerp(a.steerAngle, b.steerAngle),
            accGx: lerp(a.accGx, b.accGx),
            accGy: lerp(a.accGy, b.accGy),
        });
    }

    return out;
}

// ---------------------------------------------------------------------------
// Delta
// ---------------------------------------------------------------------------

export interface DeltaPoint {
    distance: number;
    /** Seconds. Positive = the lap is slower than the reference at this point. */
    delta: number;
    speed: number;
    referenceSpeed: number;
}

/**
 * Cumulative time delta of `lap` against `reference`, sampled by distance.
 *
 * At each distance the delta is simply (time taken by lap) − (time taken by reference) to reach
 * that point, so the final value equals the lap-time difference. That end-point identity is what
 * makes this trustworthy, and is worth asserting in tests.
 */
export function deltaTrace(lap: DistanceSeries, reference: DistanceSeries, stepM = 5): DeltaPoint[] {
    const a = resampleByDistance(lap, stepM);
    const b = resampleByDistance(reference, stepM);
    if (!a.length || !b.length) return [];

    const n = Math.min(a.length, b.length);
    const out: DeltaPoint[] = [];

    for (let i = 0; i < n; i++) {
        out.push({
            distance: a[i].distance,
            delta: a[i].time - b[i].time,
            speed: a[i].speedKmh,
            referenceSpeed: b[i].speedKmh,
        });
    }

    return out;
}

export interface TimeLoss {
    /** Metres from the line where the loss starts / ends. */
    startM: number;
    endM: number;
    /** Seconds lost across the window (always positive). */
    lostSeconds: number;
    /** Speed difference at the worst point, km/h (negative = slower than the reference). */
    speedDeltaKmh: number;
    /** Plain-language description of what likely went wrong. */
    cause: string;
}

/**
 * The headline feature: turn a delta trace into a ranked list of *where* time was lost, in words.
 *
 * Walks the trace, groups contiguous stretches where the delta is climbing, and classifies each
 * by what the pedal and speed traces were doing there.
 */
export function biggestLoss(delta: DeltaPoint[], lap: DistanceSample[], topN = 5): TimeLoss[] {
    if (delta.length < 3) return [];

    const losses: TimeLoss[] = [];
    let start: number | null = null;
    let startDelta = 0;

    const sampleAt = (distance: number) =>
        lap.reduce((best, s) => (Math.abs(s.distance - distance) < Math.abs(best.distance - distance) ? s : best), lap[0]);

    /** Emit the window [start, endIndex] if it lost enough time to be worth mentioning. */
    const flush = (endIndex: number) => {
        if (start === null) return;
        const lost = delta[endIndex].delta - startDelta;
        // Ignore noise; a hundredth over a few metres isn't actionable.
        if (lost >= 0.03) {
            const startM = delta[start].distance;
            const endM = delta[endIndex].distance;
            const mid = sampleAt((startM + endM) / 2);
            const worst = delta
                .slice(start, endIndex + 1)
                .reduce((w, d) => (d.speed - d.referenceSpeed < w.speed - w.referenceSpeed ? d : w), delta[start]);

            losses.push({
                startM,
                endM,
                lostSeconds: lost,
                speedDeltaKmh: worst.speed - worst.referenceSpeed,
                cause: classifyLoss(mid, worst.speed - worst.referenceSpeed),
            });
        }
        start = null;
    };

    for (let i = 1; i < delta.length; i++) {
        const rising = delta[i].delta > delta[i - 1].delta;

        if (rising && start === null) {
            start = i - 1;
            startDelta = delta[i - 1].delta;
        } else if (!rising && start !== null) {
            flush(i - 1);
        }
    }

    // A lap that keeps losing time all the way to the line leaves a window open.
    flush(delta.length - 1);

    return losses.sort((x, y) => y.lostSeconds - x.lostSeconds).slice(0, topN);
}

function classifyLoss(sample: DistanceSample | undefined, speedDelta: number): string {
    if (!sample) return "Slower through this section.";

    const braking = sample.brake > 0.1;
    const onPower = sample.gas > 0.8;
    const coasting = sample.gas < 0.05 && sample.brake < 0.05;

    if (braking && speedDelta < -3) return "Braking too early or too hard into this corner.";
    if (braking) return "Losing time under braking — try carrying the brake deeper.";
    if (coasting) return "Coasting here — close the gap between lifting and getting back on the throttle.";
    if (onPower && speedDelta < -3) return "Slower on the exit — you're getting to full throttle later.";
    if (speedDelta < -3) return "Carrying less mid-corner speed here.";
    return "Small loss through this section.";
}

// ---------------------------------------------------------------------------
// Driving style
// ---------------------------------------------------------------------------

export interface DrivingStyle {
    /** Percentages of lap distance, 0–100. */
    fullThrottlePct: number;
    partialThrottlePct: number;
    brakingPct: number;
    coastingPct: number;
    /** Braking and throttle overlapping — trail braking / left-foot braking. */
    trailBrakePct: number;
    peakBrake: number;
    averageBrake: number;
    /** Distinct braking events in the lap. */
    brakeApplications: number;
    /** Mean absolute change in brake pressure per sample while releasing — lower is smoother. */
    brakeReleaseSmoothness: number;
}

export function drivingStyle(samples: DistanceSample[]): DrivingStyle | null {
    if (samples.length < 2) return null;

    let full = 0;
    let partial = 0;
    let braking = 0;
    let coasting = 0;
    let trail = 0;
    let peakBrake = 0;
    let brakeSum = 0;
    let brakeSamples = 0;
    let applications = 0;
    let wasBraking = false;
    let releaseDeltaSum = 0;
    let releaseCount = 0;

    for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        const isBraking = s.brake > 0.05;
        const isThrottle = s.gas > 0.05;

        if (s.gas > 0.98) full++;
        else if (isThrottle) partial++;

        if (isBraking) {
            braking++;
            brakeSum += s.brake;
            brakeSamples++;
            peakBrake = Math.max(peakBrake, s.brake);
            if (isThrottle) trail++;
            if (!wasBraking) applications++;
        } else if (!isThrottle) {
            coasting++;
        }

        // Smoothness of brake release: how abruptly pressure comes off.
        if (i > 0 && wasBraking && s.brake < samples[i - 1].brake) {
            releaseDeltaSum += samples[i - 1].brake - s.brake;
            releaseCount++;
        }

        wasBraking = isBraking;
    }

    const n = samples.length;
    const pct = (x: number) => (x / n) * 100;

    return {
        fullThrottlePct: pct(full),
        partialThrottlePct: pct(partial),
        brakingPct: pct(braking),
        coastingPct: pct(coasting),
        trailBrakePct: pct(trail),
        peakBrake,
        averageBrake: brakeSamples ? brakeSum / brakeSamples : 0,
        brakeApplications: applications,
        brakeReleaseSmoothness: releaseCount ? releaseDeltaSum / releaseCount : 0,
    };
}

// ---------------------------------------------------------------------------
// Shift points
// ---------------------------------------------------------------------------

export interface ShiftPoint {
    fromGear: number;
    toGear: number;
    rpm: number;
    distance: number;
}

/** Upshift RPMs, so a driver can see whether they're short-shifting or bouncing off the limiter. */
export function shiftPoints(samples: DistanceSample[]): ShiftPoint[] {
    const shifts: ShiftPoint[] = [];
    for (let i = 1; i < samples.length; i++) {
        const prev = samples[i - 1];
        const cur = samples[i];
        if (cur.gear > prev.gear && prev.gear > 0 && prev.rpms > 0) {
            shifts.push({ fromGear: prev.gear, toGear: cur.gear, rpm: prev.rpms, distance: cur.distance });
        }
    }
    return shifts;
}

// ---------------------------------------------------------------------------
// Friction circle
// ---------------------------------------------------------------------------

export interface GPoint {
    lateral: number;
    longitudinal: number;
    speedKmh: number;
}

/**
 * Lateral vs longitudinal G. A driver using the tyre well fills a circle; one who brakes in a
 * straight line and only then turns leaves a cross-shaped hole in the corners of it.
 */
export function frictionCircle(samples: DistanceSample[]): { points: GPoint[]; peakLateral: number; peakCombined: number } {
    const points = samples
        .filter(s => s.speedKmh > 20)
        .map(s => ({ lateral: s.accGx, longitudinal: s.accGy, speedKmh: s.speedKmh }));

    let peakLateral = 0;
    let peakCombined = 0;
    for (const p of points) {
        peakLateral = Math.max(peakLateral, Math.abs(p.lateral));
        peakCombined = Math.max(peakCombined, Math.hypot(p.lateral, p.longitudinal));
    }

    return { points, peakLateral, peakCombined };
}

// ---------------------------------------------------------------------------
// Lap / sector statistics
// ---------------------------------------------------------------------------

export interface LapLike {
    lapNumber: number;
    lapTimeMs: number | null;
    sector1Ms: number | null;
    sector2Ms: number | null;
    sector3Ms: number | null;
    isValid: boolean;
}

export interface SectorMatrix {
    laps: {
        lapNumber: number;
        lapTimeMs: number | null;
        isValid: boolean;
        sectors: (number | null)[];
        /** Index-aligned with `sectors`: true where this lap owns the session best. */
        sectorIsBest: boolean[];
        isBestLap: boolean;
    }[];
    bestSectors: (number | null)[];
    theoreticalBestMs: number | null;
    bestLapMs: number | null;
    /** Gap between the actual best lap and the theoretical best, in ms. */
    timeLeftOnTableMs: number | null;
}

export function sectorMatrix(laps: LapLike[]): SectorMatrix {
    const valid = laps.filter(l => l.isValid);
    const sectorsOf = (l: LapLike) => [l.sector1Ms, l.sector2Ms, l.sector3Ms];

    const bestSectors = [0, 1, 2].map(i => {
        const times = valid.map(l => sectorsOf(l)[i]).filter((t): t is number => typeof t === "number" && t > 0);
        return times.length ? Math.min(...times) : null;
    });

    const lapTimes = valid.map(l => l.lapTimeMs).filter((t): t is number => typeof t === "number" && t > 0);
    const bestLapMs = lapTimes.length ? Math.min(...lapTimes) : null;

    const theoreticalBestMs = bestSectors.every(s => s != null)
        ? (bestSectors as number[]).reduce((a, b) => a + b, 0)
        : null;

    return {
        laps: laps.map(l => {
            const sectors = sectorsOf(l);
            return {
                lapNumber: l.lapNumber,
                lapTimeMs: l.lapTimeMs,
                isValid: l.isValid,
                sectors,
                sectorIsBest: sectors.map((s, i) => l.isValid && s != null && s === bestSectors[i]),
                isBestLap: l.isValid && l.lapTimeMs != null && l.lapTimeMs === bestLapMs,
            };
        }),
        bestSectors,
        theoreticalBestMs,
        bestLapMs,
        timeLeftOnTableMs: bestLapMs != null && theoreticalBestMs != null ? bestLapMs - theoreticalBestMs : null,
    };
}

export interface Consistency {
    /** Standard deviation of valid lap times, in ms. */
    stdDevMs: number | null;
    /** Interquartile range, in ms — robust to a single scrappy lap. */
    iqrMs: number | null;
    meanMs: number | null;
    /** 0–100; 100 means every valid lap was identical. */
    score: number | null;
    rolling: { lapNumber: number; averageMs: number }[];
}

export function consistency(laps: LapLike[], window = 3): Consistency {
    const timed = laps
        .filter(l => l.isValid && typeof l.lapTimeMs === "number" && l.lapTimeMs > 0)
        .map(l => ({ lapNumber: l.lapNumber, ms: l.lapTimeMs as number }));

    if (timed.length < 2) {
        return { stdDevMs: null, iqrMs: null, meanMs: null, score: null, rolling: [] };
    }

    const values = timed.map(t => t.ms);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1));

    const sorted = [...values].sort((a, b) => a - b);
    const quantile = (q: number) => {
        const pos = (sorted.length - 1) * q;
        const lo = Math.floor(pos);
        const hi = Math.ceil(pos);
        return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
    };
    const iqr = quantile(0.75) - quantile(0.25);

    const rolling = timed.map((t, i) => {
        const slice = timed.slice(Math.max(0, i - window + 1), i + 1);
        return { lapNumber: t.lapNumber, averageMs: slice.reduce((a, b) => a + b.ms, 0) / slice.length };
    });

    // A 1% spread relative to lap time is roughly the line between "tidy" and "scrappy".
    const score = Math.max(0, Math.min(100, 100 - (stdDev / mean) * 100 * 100));

    return { stdDevMs: stdDev, iqrMs: iqr, meanMs: mean, score, rolling };
}
