import { describe, expect, it } from "vitest";
import { buildTimeAxis, cornerOnAxis } from "@/lib/simracing/time-axis";

// 2 m grid; 0.05 s per step on the straight half, 0.2 s per step through the slow half.
const times = Array.from({ length: 101 }, (_, i) => (i <= 50 ? i * 0.05 : 2.5 + (i - 50) * 0.2));

describe("buildTimeAxis", () => {
    it("uses the lap's elapsed time as the x value of each grid point", () => {
        const { x } = buildTimeAxis(times, 2, 101);
        expect(x[0]).toBe(0);
        expect(x[50]).toBeCloseTo(2.5, 5);
        expect(x[100]).toBeCloseTo(12.5, 5);
    });

    it("converts metres to time and back", () => {
        const { toX, fromX } = buildTimeAxis(times, 2, 101);
        for (const m of [0, 1, 37, 100, 151, 200]) expect(fromX(toX(m))).toBeCloseTo(m, 3);
        // The slow half takes more time per metre.
        expect(toX(150) - toX(100)).toBeGreaterThan(toX(50) - toX(0));
    });

    it("extends past the lap when the reference is longer, and stays increasing", () => {
        const { x } = buildTimeAxis(times, 2, 120);
        for (let i = 1; i < x.length; i++) expect(x[i]).toBeGreaterThan(x[i - 1]);
    });

    it("never goes backwards on noisy timing", () => {
        const { x } = buildTimeAxis([0, 0.1, 0.09, 0.3, NaN, 0.5], 2, 6);
        for (let i = 1; i < x.length; i++) expect(x[i]).toBeGreaterThan(x[i - 1]);
    });
});

describe("cornerOnAxis", () => {
    it("moves every landmark and keeps missing ones missing", () => {
        const { toX } = buildTimeAxis(times, 2, 101);
        const c = cornerOnAxis({ index: 0, entryM: 100, apexM: 120, exitM: 150, brakingPointM: 90, throttleOnM: null }, toX);
        expect(c.entryM).toBeCloseTo(toX(100), 6);
        expect(c.brakingPointM).toBeCloseTo(toX(90), 6);
        expect(c.throttleOnM).toBeNull();
        expect(c.index).toBe(0);
    });
});
