import { describe, expect, it } from "vitest";
import { lap, lapClock, localLoss, sampleAt } from "@/components/landing/hero-lap";

describe("hero lap helpers", () => {
    it("has one clock tick and one loss value per sample", () => {
        expect(lapClock).toHaveLength(lap.channels.speed.length);
        expect(localLoss).toHaveLength(lap.channels.deltaS.length);
    });

    it("runs the lap clock forwards to roughly the lap time", () => {
        for (let i = 1; i < lapClock.length; i++) expect(lapClock[i]).toBeGreaterThan(lapClock[i - 1]);
        // Integrated from speed, so within a few percent of the recorded lap time.
        expect(lapClock[lapClock.length - 1]).toBeGreaterThan((lap.lap.timeMs / 1000) * 0.9);
        expect(lapClock[lapClock.length - 1]).toBeLessThan((lap.lap.timeMs / 1000) * 1.1);
    });

    it("finds the sample reached at a given time", () => {
        expect(sampleAt(0)).toBe(0);
        expect(sampleAt(lapClock[lapClock.length - 1] + 10)).toBe(lapClock.length - 1);
        const mid = sampleAt(lapClock[500]);
        expect(mid).toBe(500);
    });
});
