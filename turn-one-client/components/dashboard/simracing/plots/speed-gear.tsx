"use client";

import { useMemo } from "react";
import { UPlotTraces, type TraceLap } from "@/components/dashboard/simracing/charts/uplot";
import type { SimPlotContext } from "@/lib/simracing/plot-catalog";

/** Speed vs distance for every lap, with the reference lap's gear shown in the pane beneath it. */
export function SpeedGearPlot({ ctx }: { ctx: SimPlotContext }) {
    const { overlay, refLapId, colors, labels } = ctx;

    const x = useMemo(() => {
        const arr = new Float32Array(overlay.sampleCount);
        for (let i = 0; i < overlay.sampleCount; i++) arr[i] = i * overlay.stepM;
        return arr;
    }, [overlay]);

    const laps = useMemo<TraceLap[]>(
        () =>
            overlay.laps.map(lap => {
                const channels: Record<string, Float32Array> = {};
                for (const key of ["speed", "gear"]) {
                    const values = lap.channels[key];
                    const arr = new Float32Array(overlay.sampleCount);
                    for (let i = 0; i < overlay.sampleCount; i++) {
                        const v = values?.[i];
                        arr[i] = v == null ? NaN : v;
                    }
                    channels[key] = arr;
                }
                return {
                    id: lap.lapId,
                    label: labels[lap.lapId] ?? `Lap ${lap.lapNumber}`,
                    color: colors[lap.lapId],
                    channels,
                    corners: lap.corners,
                    dashed: lap.lapId === refLapId,
                };
            }),
        [overlay, refLapId, colors, labels]
    );

    const cornerSource = laps.find(l => l.dashed) ?? laps[0];

    return <UPlotTraces x={x} laps={laps} panes={["speed", "gear"]} cornerSource={cornerSource} channelToggles={false} />;
}
