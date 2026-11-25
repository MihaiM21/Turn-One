import { describe, expect, it } from "vitest";
import type { DeltaPoint } from "@/lib/simracing/analysis";
import { buildSegments, deltaAt, segmentDeltas } from "@/lib/simracing/segments";

const corner = (index: number, entryM: number, exitM: number, name?: string) => ({ index, entryM, exitM, name });

describe("buildSegments", () => {
    it("covers the whole lap with corners and the straights between them", () => {
        const segs = buildSegments([corner(1, 900, 1100), corner(0, 200, 400)], 2000);
        expect(segs.map(s => s.label)).toEqual(["Start → T1", "T1", "T1 → T2", "T2", "T2 → Line"]);
        expect(segs[0].startM).toBe(0);
        expect(segs[segs.length - 1].endM).toBe(2000);
        for (let i = 1; i < segs.length; i++) expect(segs[i].startM).toBe(segs[i - 1].endM);
    });

    it("folds short gaps into the corner instead of making a tiny straight", () => {
        const segs = buildSegments([corner(0, 10, 300), corner(1, 310, 500)], 510);
        expect(segs.map(s => s.label)).toEqual(["T1", "T2"]);
        expect(segs[0].startM).toBe(0);
        expect(segs[1].endM).toBe(510);
    });

    it("clips overlapping corners so segments never go backwards", () => {
        const segs = buildSegments([corner(0, 100, 400), corner(1, 350, 600)], 1000);
        for (const s of segs) expect(s.endM).toBeGreaterThanOrEqual(s.startM);
        for (let i = 1; i < segs.length; i++) expect(segs[i].startM).toBe(segs[i - 1].endM);
    });

    it("uses corner names and the reference numbering when present", () => {
        const segs = buildSegments([{ index: 4, refIndex: 2, entryM: 100, exitM: 200 }, corner(5, 300, 400, "Signes")], 500);
        expect(segs.filter(s => s.kind === "corner").map(s => s.label)).toEqual(["T3", "Signes"]);
    });

    it("returns one segment for a lap without corners and none without a length", () => {
        expect(buildSegments([], 1500)).toEqual([{ label: "Lap", kind: "straight", startM: 0, endM: 1500 }]);
        expect(buildSegments([corner(0, 1, 2)], 0)).toEqual([]);
    });
});

describe("segmentDeltas", () => {
    const delta: DeltaPoint[] = Array.from({ length: 401 }, (_, i) => ({
        distance: i * 5,
        // Loses time in the first half, gains some back in the second.
        delta: i <= 200 ? i * 0.004 : 0.8 - (i - 200) * 0.0015,
        speed: 0,
        referenceSpeed: 0,
    }));

    it("interpolates between grid points", () => {
        expect(deltaAt(delta, 0)).toBe(0);
        expect(deltaAt(delta, 7.5)).toBeCloseTo(0.006, 6);
        expect(deltaAt(delta, 99_999)).toBeCloseTo(delta[delta.length - 1].delta, 6);
    });

    it("adds up to the lap delta within 0.01 s", () => {
        const segs = buildSegments([corner(0, 180, 420), corner(1, 700, 1050), corner(2, 1500, 1800)], 2000);
        const sum = segmentDeltas(segs, delta).reduce((a, b) => a + b, 0);
        expect(Math.abs(sum - delta[delta.length - 1].delta)).toBeLessThan(0.01);
    });
});
