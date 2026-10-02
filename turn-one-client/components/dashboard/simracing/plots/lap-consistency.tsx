"use client";

import { useMemo } from "react";
import { LapEvolutionChart } from "@/components/dashboard/simracing/charts/lap-evolution-chart";
import type { LapLike } from "@/lib/simracing/analysis";
import type { SimPlotContext } from "@/lib/simracing/plot-catalog";

/** Reuses `LapEvolutionChart` over the overlay's selected laps to show pace trend + consistency. */
export function LapConsistencyPlot({ ctx }: { ctx: SimPlotContext }) {
    const { overlay } = ctx;

    const laps = useMemo<LapLike[]>(
        () =>
            overlay.laps.map(lap => ({
                lapNumber: lap.lapNumber,
                lapTimeMs: lap.lapTimeMs,
                sector1Ms: lap.sectorsMs[0] ?? null,
                sector2Ms: lap.sectorsMs[1] ?? null,
                sector3Ms: lap.sectorsMs[2] ?? null,
                isValid: lap.isValid,
            })),
        [overlay]
    );

    return <LapEvolutionChart laps={laps} />;
}
