import { describe, expect, it } from "vitest";

import { deltaTrace } from "@/lib/simracing/analysis";
import {
    brakingPointDeltas,
    cornerDeltas,
    fromLapTelemetryDto,
    overlayDelta,
    overlayToAligned,
} from "@/lib/simracing/lap-telemetry";
import { canonicalChannel } from "@/lib/simracing/protocol";
import type { CornerCompareRowDto, LapCornerDto, LapOverlayDto, LapTelemetryDto } from "@/lib/simracing/protocol";

const SAMPLE_COUNT = 11; // 0, 2, 4, ..., 20 metres at stepM = 2

/** A minimal but well-formed `LapTelemetryDto`, with one `null` sample in `speed`. */
function makeLapTelemetryDto(overrides: Partial<Record<string, (number | null)[]>> = {}): LapTelemetryDto {
    const timeMs = Array.from({ length: SAMPLE_COUNT }, (_, i) => i * 200);
    const speed: (number | null)[] = Array.from({ length: SAMPLE_COUNT }, () => 150);
    speed[4] = null; // one missing sample, mid-lap

    const throttle = Array.from({ length: SAMPLE_COUNT }, () => 1);
    const brake = Array.from({ length: SAMPLE_COUNT }, () => 0);
    const gear = Array.from({ length: SAMPLE_COUNT }, () => 4);
    const gLat = Array.from({ length: SAMPLE_COUNT }, () => 0.2);

    return {
        lapId: "lap-1",
        sessionId: "session-1",
        lapNumber: 1,
        stepM: 2,
        sampleCount: SAMPLE_COUNT,
        lapLengthM: 20,
        distanceSource: "LapDistance",
        quality: null,
        trackProfileId: "track-1",
        profileVersion: 1,
        channels: { timeMs, speed, throttle, brake, gear, gLat, ...overrides },
        corners: [],
        summary: {
            lapTimeMs: timeMs[SAMPLE_COUNT - 1],
            sectorsMs: [null, null, null],
            isValid: true,
            kind: "Flying",
            lapDistanceM: 20,
            averageSpeedKmh: 150,
            maxSpeedKmh: 150,
            minSpeedKmh: 150,
            averageThrottle: 1,
            averageBrake: 0,
            fullThrottlePct: 100,
            brakingPct: 0,
            coastingPct: 0,
            fuelUsed: 0,
            gearShifts: 0,
            peakGLat: 0.2,
            peakGLong: null,
            brakingScore: null,
            throttleScore: null,
            consistencyScore: null,
        },
    };
}

describe("fromLapTelemetryDto", () => {
    const dto = makeLapTelemetryDto();
    const { columnar, series } = fromLapTelemetryDto(dto);

    it("produces one sample per grid point, on a 0..20 distance axis", () => {
        expect(series.samples.length).toBe(SAMPLE_COUNT);
        expect(series.samples.map(s => s.distance)).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
    });

    it("keeps NaN in the columnar block but zeroes the missing value in the sample row", () => {
        expect(Number.isNaN(columnar.channels.speed[4])).toBe(true);
        expect(series.samples[4].speedKmh).toBe(0);
    });

    it("leaves discrete channels like gear untouched", () => {
        expect(series.samples.every(s => s.gear === 4)).toBe(true);
    });

    it("carries stepM and marks the series as server-sourced", () => {
        expect(series.stepM).toBe(2);
        expect(series.source).toBe("server");
    });
});

describe("deltaTrace over server-shaped series", () => {
    const dto = makeLapTelemetryDto();
    const { series } = fromLapTelemetryDto(dto);

    it("is all-zero against itself", () => {
        const delta = deltaTrace(series, series);
        expect(delta.every(d => d.delta === 0)).toBe(true);
    });

    it("end value equals the duration difference for a uniformly slower lap", () => {
        const slowTimeMs = Array.from({ length: SAMPLE_COUNT }, (_, i) => i * 200 * 1.05);
        const slowDto = makeLapTelemetryDto({ timeMs: slowTimeMs });
        const { series: slowSeries } = fromLapTelemetryDto(slowDto);

        const delta = deltaTrace(slowSeries, series);
        const finalDelta = delta[delta.length - 1].delta;
        const expected = slowSeries.duration - series.duration;

        expect(finalDelta).toBeCloseTo(expected, 9);
    });
});

describe("overlayToAligned / overlayDelta", () => {
    const overlay: LapOverlayDto = {
        stepM: 2,
        sampleCount: 5,
        refLapId: "lap-a",
        track: null,
        lengthMismatch: false,
        channels: ["speed"],
        laps: [
            {
                lapId: "lap-a",
                sessionId: "s1",
                lapNumber: 1,
                lapTimeMs: 10000,
                sectorsMs: [null, null, null],
                isValid: true,
                kind: "Flying",
                sessionStartedAt: "2026-01-01T00:00:00Z",
                car: "car",
                driver: "driver",
                quality: null,
                channels: { speed: [100, 110, 120, 130, 140] },
                deltaMs: null,
                corners: [],
            },
            {
                lapId: "lap-b",
                sessionId: "s1",
                lapNumber: 2,
                lapTimeMs: 10500,
                sectorsMs: [null, null, null],
                isValid: true,
                kind: "Flying",
                sessionStartedAt: "2026-01-01T00:00:00Z",
                car: "car",
                driver: "driver",
                quality: null,
                // No `speed` channel on this lap -> missing-channel case.
                channels: { throttle: [1, 1, 1, 1, 1] },
                deltaMs: [0, 10, 25, 40, 60],
                corners: [],
            },
        ],
    };

    it("aligns one y-array per lap, filling missing channels with NaN", () => {
        const { x, ys } = overlayToAligned(overlay, "speed");

        expect(x.length).toBe(5);
        expect(Array.from(x)).toEqual([0, 2, 4, 6, 8]);
        expect(ys.length).toBe(overlay.laps.length);
        expect(Array.from(ys[0])).toEqual([100, 110, 120, 130, 140]);
        expect(Array.from(ys[1]).every(v => Number.isNaN(v))).toBe(true);
    });

    it("returns null for the reference lap and the delta trace for others", () => {
        const { ys } = overlayDelta(overlay);

        expect(ys[0]).toBeNull();
        expect(ys[1]).not.toBeNull();
        expect(Array.from(ys[1] as Float32Array)).toEqual([0, 10, 25, 40, 60]);
    });
});

const makeCorner = (overrides: Partial<LapCornerDto>): LapCornerDto => ({
    index: 0,
    refIndex: 0,
    name: "Turn 1",
    direction: 1,
    isKink: false,
    entryM: 100,
    apexM: 120,
    exitM: 140,
    brakingPointM: 90,
    brakeReleaseM: 110,
    throttleOnM: 125,
    fullThrottleM: 145,
    entrySpeedKmh: 200,
    minSpeedKmh: 90,
    exitSpeedKmh: 180,
    peakBrake: 0.9,
    peakGLat: 1.2,
    gearAtApex: 3,
    minGear: 2,
    timeInCornerMs: 2500,
    brakeToThrottleMs: 300,
    trailBrakeM: 15,
    ...overrides,
});

describe("cornerDeltas", () => {
    it("computes deltas against the first lap, keeping the sign of (lap - base)", () => {
        const rows: CornerCompareRowDto[] = [
            {
                refIndex: 0,
                name: "Turn 1",
                perLap: [
                    makeCorner({ minSpeedKmh: 90, brakingPointM: 90, throttleOnM: 125 }),
                    // Slower min speed, later braking point (bigger M = later), later throttle-on.
                    makeCorner({ minSpeedKmh: 85, brakingPointM: 95, throttleOnM: 130 }),
                ],
                deltaTimeInCornerMs: [0, 120],
            },
        ];

        const [row] = cornerDeltas(rows);

        expect(row.minSpeedDeltaKmh).toEqual([0, -5]);
        expect(row.brakingPointDeltaM).toEqual([0, 5]);
        expect(row.throttleOnDeltaM).toEqual([0, 5]);
        expect(row.timeDeltaMs).toEqual([0, 120]);
    });
});

describe("brakingPointDeltas", () => {
    it("matches corners by refIndex and reports a positive delta when `a` brakes later", () => {
        const a: LapCornerDto[] = [makeCorner({ refIndex: 0, brakingPointM: 100 })];
        const b: LapCornerDto[] = [makeCorner({ refIndex: 0, brakingPointM: 90 })];

        const [delta] = brakingPointDeltas(a, b);

        expect(delta.refIndex).toBe(0);
        expect(delta.aM).toBe(100);
        expect(delta.bM).toBe(90);
        expect(delta.deltaM).toBe(10);
    });
});

describe("canonicalChannel", () => {
    it("maps v1 acceleration keys to v2", () => {
        expect(canonicalChannel("accG_x")).toBe("gLat");
    });

    it("maps corner-suffixed v1 keys to their v2 stem", () => {
        expect(canonicalChannel("tyreCoreTemperature_fl")).toBe("tyreTemp_fl");
    });

    it("returns already-canonical keys unchanged", () => {
        expect(canonicalChannel("gear")).toBe("gear");
    });
});
