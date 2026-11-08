import { describe, expect, it } from "vitest";
import { SAMPLE_LAP, biggestLosses, formatLap, type SampleLap } from "@/components/landing/sample-lap";

const lap = (deltaS: number[]): SampleLap => ({
    ...SAMPLE_LAP,
    stepM: 10,
    channels: {
        ...SAMPLE_LAP.channels,
        deltaS,
        speed: deltaS.map(() => 100),
        refSpeed: deltaS.map(() => 110),
    },
});

describe("biggestLosses", () => {
    it("finds the stretch that lost the most, without overlaps", () => {
        // flat, then +0.5 s over 40 m, flat, then +0.2 s
        const d = [0, 0, 0, 0.1, 0.3, 0.5, 0.5, 0.5, 0.5, 0.6, 0.7, 0.7, 0.7];
        const [first, second] = biggestLosses(lap(d), 40, 2);
        expect(first.lostS).toBeCloseTo(0.5);
        expect(first.fromM).toBe(10);
        expect(second.fromM).toBeGreaterThanOrEqual(first.toM - 0);
        expect(first.minSpeed).toBe(100);
        expect(first.refMinSpeed).toBe(110);
    });

    it("returns nothing when the lap only gained time", () => {
        expect(biggestLosses(lap([0, -0.1, -0.2, -0.3, -0.4, -0.5]), 20)).toEqual([]);
    });

    it("agrees with the baked lap: losses never exceed the time actually lost along the lap", () => {
        // Gross loss can beat the net gap (the lap wins some back in between), but not the sum of every increase.
        const d = SAMPLE_LAP.channels.deltaS;
        const grossLoss = d.slice(1).reduce((s, v, i) => s + Math.max(0, v - d[i]), 0);
        const total = biggestLosses(SAMPLE_LAP).reduce((s, w) => s + w.lostS, 0);
        expect(total).toBeGreaterThan(0);
        expect(total).toBeLessThanOrEqual(grossLoss + 0.01);
        // And the baked delta ends where the lap times say it should.
        const gap = (SAMPLE_LAP.lap.timeMs - SAMPLE_LAP.ref.timeMs) / 1000;
        expect(Math.abs(d[d.length - 1] - gap)).toBeLessThan(0.05);
    });
});

describe("formatLap", () => {
    it.each([
        [124442, "2:04.442"],
        [59999, "0:59.999"],
        [61005, "1:01.005"],
    ])("%i → %s", (ms, text) => {
        expect(formatLap(ms)).toBe(text);
    });
});
