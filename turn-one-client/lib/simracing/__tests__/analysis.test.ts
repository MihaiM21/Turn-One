import { describe, expect, it } from "vitest";

import type { MultiChannelChartData } from "@/lib/simracing/protocol";
import {
    biggestLoss,
    consistency,
    deltaTrace,
    drivingStyle,
    type DistanceSample,
    type DistanceSeries,
    type LapLike,
    resampleByDistance,
    sectorMatrix,
    shiftPoints,
    toDistanceSeries,
} from "@/lib/simracing/analysis";

/** Builds a synthetic time-series lap: constant speed for `durationS` seconds, sampled every `stepS`. */
function constantSpeedLap(speedKmh: number, durationS: number, stepS: number): MultiChannelChartData {
    const points: MultiChannelChartData["points"] = [];
    for (let t = 0; t <= durationS; t += stepS) {
        points.push({
            timestamp: Math.round(t * 1000),
            values: { speedKmh, gas: 1, brake: 0, gear: 4, rpms: 6000, steerAngle: 0, accG_x: 0, accG_y: 0 },
        });
    }
    return { channels: ["speedKmh", "gas", "brake", "gear", "rpms", "steerAngle", "accG_x", "accG_y"], points };
}

/**
 * Builds a lap from `normalizedCarPosition` (0..1) rather than integrated speed, so its distance
 * series is pinned exactly to `trackLengthM` regardless of how long each leg of the lap took. Used
 * to construct two laps that cover the *identical* physical distance but different durations —
 * the setup `deltaTrace`'s end-point identity assumes.
 *
 * `segmentDurationsMs` gives the wall-clock time of each of the `steps` legs (segment i runs from
 * position i/steps to (i+1)/steps).
 */
function positionLap(steps: number, segmentDurationsMs: number[], trackLengthM: number): MultiChannelChartData {
    const points: MultiChannelChartData["points"] = [];
    let t = 0;
    for (let i = 0; i <= steps; i++) {
        points.push({
            timestamp: t,
            values: {
                normalizedCarPosition: i / steps,
                speedKmh: 100,
                gas: 1,
                brake: 0,
                gear: 4,
                rpms: 6000,
                steerAngle: 0,
                accG_x: 0,
                accG_y: 0,
            },
        });
        if (i < steps) t += segmentDurationsMs[i];
    }
    void trackLengthM;
    return {
        channels: ["normalizedCarPosition", "speedKmh", "gas", "brake", "gear", "rpms", "steerAngle", "accG_x", "accG_y"],
        points,
    };
}

const lap = (overrides: Partial<LapLike>): LapLike => ({
    lapNumber: 1,
    lapTimeMs: null,
    sector1Ms: null,
    sector2Ms: null,
    sector3Ms: null,
    isValid: true,
    ...overrides,
});

const sample = (overrides: Partial<DistanceSample>): DistanceSample => ({
    distance: 0,
    time: 0,
    timestamp: 0,
    speedKmh: 100,
    gas: 0,
    brake: 0,
    gear: 1,
    rpms: 0,
    steerAngle: 0,
    accGx: 0,
    accGy: 0,
    ...overrides,
});

describe("toDistanceSeries", () => {
    it("integrates constant speed into distance (~1000m for 100km/h over 36s)", () => {
        const data = constantSpeedLap(100, 36, 0.5);
        const series = toDistanceSeries(data);

        expect(series.length).toBeGreaterThan(1000 * 0.99);
        expect(series.length).toBeLessThan(1000 * 1.01);
        expect(series.duration).toBeCloseTo(36, 5);
        expect(series.fromTrackPosition).toBe(false);
    });
});

describe("resampleByDistance", () => {
    it("resamples onto a fixed distance grid and holds gear rather than interpolating it", () => {
        const series: DistanceSeries = {
            samples: [
                sample({ distance: 0, time: 0, timestamp: 0, gear: 3 }),
                sample({ distance: 5, time: 1, timestamp: 1000, gear: 3 }),
                sample({ distance: 10, time: 2, timestamp: 2000, gear: 4 }),
            ],
            length: 10,
            duration: 2,
            fromTrackPosition: false,
        };

        const resampled = resampleByDistance(series, 5);

        expect(resampled.map(s => s.distance)).toEqual([0, 5, 10]);
        // The gear at d=10 comes from the sample *below* it (gear 3), never interpolated to a
        // fractional value and never jumped forward to the upper sample's gear (4).
        expect(resampled.map(s => s.gear)).toEqual([3, 3, 3]);
    });
});

describe("deltaTrace", () => {
    // Both laps traverse the exact same 20 position nodes (0/20 .. 20/20) over a 1000m track, so
    // their DistanceSeries.length is bit-identical — only the timing of each leg differs. This
    // isolates the end-point identity from any distance-grid quantization.
    const STEPS = 20;
    const TRACK_LENGTH = 1000;
    const referenceLegMs = 1800; // 20 * 1.8s = 36s lap
    const referenceLap = positionLap(STEPS, new Array(STEPS).fill(referenceLegMs), TRACK_LENGTH);

    // Same nodes, but legs 8-12 (a "slow corner") take twice as long: +9s overall -> 45s lap.
    const lapLegs = new Array(STEPS).fill(referenceLegMs);
    for (let i = 8; i < 13; i++) lapLegs[i] = referenceLegMs * 2;
    const slowLap = positionLap(STEPS, lapLegs, TRACK_LENGTH);

    const refSeries = toDistanceSeries(referenceLap, TRACK_LENGTH);
    const lapSeries = toDistanceSeries(slowLap, TRACK_LENGTH);

    it("has identical lengths and a duration difference of ~9s", () => {
        expect(lapSeries.length).toBeCloseTo(refSeries.length, 9);
        expect(lapSeries.duration - refSeries.duration).toBeCloseTo(9, 6);
    });

    it("end-point delta equals lap.duration - reference.duration", () => {
        const delta = deltaTrace(lapSeries, refSeries, 5);
        const finalDelta = delta[delta.length - 1].delta;
        const expected = lapSeries.duration - refSeries.duration;

        expect(Math.abs(finalDelta - expected) / Math.abs(expected)).toBeLessThan(1e-6);
    });

    it("is all-zero when the lap is compared against itself", () => {
        const delta = deltaTrace(refSeries, refSeries, 5);
        expect(delta.every(d => d.delta === 0)).toBe(true);
    });

    it("biggestLoss finds nothing for identical laps and at least one loss for the slow lap", () => {
        const zeroDelta = deltaTrace(refSeries, refSeries, 5);
        expect(biggestLoss(zeroDelta, refSeries.samples)).toEqual([]);

        const delta = deltaTrace(lapSeries, refSeries, 5);
        const losses = biggestLoss(delta, lapSeries.samples);
        expect(losses.length).toBeGreaterThan(0);
        expect(losses[0].lostSeconds).toBeGreaterThan(0);
    });
});

describe("sectorMatrix", () => {
    it("picks best sectors from valid laps only and computes the theoretical best / time left on the table", () => {
        const laps: LapLike[] = [
            lap({ lapNumber: 1, isValid: true, sector1Ms: 30000, sector2Ms: 40000, sector3Ms: 35000, lapTimeMs: 105000 }),
            // Faster S1 but invalid — must not count toward bestSectors.
            lap({ lapNumber: 2, isValid: false, sector1Ms: 20000, sector2Ms: 41000, sector3Ms: 36000, lapTimeMs: 97000 }),
            lap({ lapNumber: 3, isValid: true, sector1Ms: 29000, sector2Ms: 39000, sector3Ms: 34000, lapTimeMs: 102000 }),
        ];

        const matrix = sectorMatrix(laps);

        expect(matrix.bestSectors).toEqual([29000, 39000, 34000]);
        expect(matrix.theoreticalBestMs).toBe(29000 + 39000 + 34000);
        expect(matrix.bestLapMs).toBe(102000);
        expect(matrix.timeLeftOnTableMs).toBe(102000 - (29000 + 39000 + 34000));
        expect(matrix.laps[1].sectorIsBest).toEqual([false, false, false]);
        expect(matrix.laps[2].isBestLap).toBe(true);
    });
});

describe("consistency", () => {
    it("is perfectly consistent (stdDev 0, score 100) across identical lap times", () => {
        const laps: LapLike[] = [1, 2, 3, 4].map(n => lap({ lapNumber: n, lapTimeMs: 100000 }));
        const result = consistency(laps);

        expect(result.stdDevMs).toBe(0);
        expect(result.score).toBe(100);
        expect(result.meanMs).toBe(100000);
    });

    it("returns nulls with fewer than two valid laps", () => {
        const result = consistency([lap({ lapNumber: 1, lapTimeMs: 100000 })]);

        expect(result.stdDevMs).toBeNull();
        expect(result.score).toBeNull();
        expect(result.meanMs).toBeNull();
        expect(result.rolling).toEqual([]);
    });
});

describe("shiftPoints", () => {
    it("records upshifts only, not downshifts", () => {
        const samples: DistanceSample[] = [
            sample({ distance: 0, gear: 2, rpms: 7000 }),
            sample({ distance: 10, gear: 3, rpms: 7200 }), // upshift
            sample({ distance: 20, gear: 3, rpms: 5000 }),
            sample({ distance: 30, gear: 2, rpms: 6000 }), // downshift - ignored
            sample({ distance: 40, gear: 4, rpms: 7500 }), // upshift
        ];

        const shifts = shiftPoints(samples);

        expect(shifts).toHaveLength(2);
        expect(shifts[0]).toMatchObject({ fromGear: 2, toGear: 3, rpm: 7000, distance: 10 });
        expect(shifts[1]).toMatchObject({ fromGear: 2, toGear: 4, rpm: 6000, distance: 40 });
    });
});

describe("drivingStyle", () => {
    it("reports 100% full-throttle for an all-throttle lap", () => {
        const samples: DistanceSample[] = new Array(10).fill(0).map((_, i) => sample({ distance: i * 10, gas: 1, brake: 0 }));

        const style = drivingStyle(samples);

        expect(style).not.toBeNull();
        expect(style!.fullThrottlePct).toBe(100);
        expect(style!.brakingPct).toBe(0);
        expect(style!.coastingPct).toBe(0);
    });
});
