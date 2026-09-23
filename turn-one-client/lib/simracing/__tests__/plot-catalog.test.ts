import { describe, expect, it } from "vitest";

import { SIM_PLOTS } from "@/lib/simracing/plot-catalog";
import type { SimPlotContext } from "@/lib/simracing/plot-catalog";
import type { LapOverlayDto } from "@/lib/simracing/protocol";

/** An overlay with a single lap and no channels — every plot should call this empty. */
function emptyOverlay(): LapOverlayDto {
    return {
        stepM: 5,
        sampleCount: 0,
        refLapId: "lap-1",
        track: null,
        lengthMismatch: false,
        channels: [],
        laps: [
            {
                lapId: "lap-1",
                sessionId: "session-1",
                lapNumber: 1,
                lapTimeMs: null,
                sectorsMs: [null, null, null],
                isValid: true,
                kind: "Flying",
                sessionStartedAt: "2026-01-01T00:00:00Z",
                car: "car",
                driver: "driver",
                quality: null,
                channels: {},
                deltaMs: null,
                corners: [],
            },
        ],
    };
}

function emptyContext(): SimPlotContext {
    const overlay = emptyOverlay();
    return {
        overlay,
        corners: null,
        refLapId: overlay.refLapId,
        colors: { "lap-1": "#ffffff" },
        labels: { "lap-1": "Lap 1" },
    };
}

describe("SIM_PLOTS", () => {
    it("has a unique key per plot", () => {
        const keys = SIM_PLOTS.map(p => p.key);
        expect(new Set(keys).size).toBe(keys.length);
    });

    it("gives every plot a non-empty explainer", () => {
        for (const plot of SIM_PLOTS) {
            expect(plot.explainer.what.length).toBeGreaterThan(0);
            expect(plot.explainer.howToRead.length).toBeGreaterThan(0);
            expect(plot.explainer.lookFor.length).toBeGreaterThan(0);
            for (const item of plot.explainer.lookFor) expect(item.length).toBeGreaterThan(0);
        }
    });

    it("reports empty for an overlay with no channels and too few laps", () => {
        const ctx = emptyContext();
        for (const plot of SIM_PLOTS) {
            expect(plot.isEmpty?.(ctx)).toBe(true);
        }
    });

    it("has at least two plots in the corners category", () => {
        expect(SIM_PLOTS.filter(p => p.category === "corners").length).toBeGreaterThanOrEqual(2);
    });
});
