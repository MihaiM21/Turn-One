"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { UPlotTraces, type TraceLap } from "@/components/dashboard/simracing/charts/uplot";
import type { SimPlotContext } from "@/lib/simracing/plot-catalog";

const TEMP_PANES = ["tyreTemp_fl", "tyreTemp_fr", "tyreTemp_rl", "tyreTemp_rr"];
const PRESSURE_PANES = ["tyrePress_fl", "tyrePress_fr", "tyrePress_rl", "tyrePress_rr"];

/** Four mini panels (FL/FR/RL/RR) of tyre temperature vs distance per lap, with a pressure toggle. */
export function TyrePerLapPlot({ ctx }: { ctx: SimPlotContext }) {
    const { overlay, refLapId, colors, labels } = ctx;
    const [metric, setMetric] = useState<"temp" | "pressure">("temp");

    const x = useMemo(() => {
        const arr = new Float32Array(overlay.sampleCount);
        for (let i = 0; i < overlay.sampleCount; i++) arr[i] = i * overlay.stepM;
        return arr;
    }, [overlay]);

    const panes = metric === "temp" ? TEMP_PANES : PRESSURE_PANES;
    const availablePanes = panes.filter(p => overlay.channels.includes(p));

    const laps = useMemo<TraceLap[]>(
        () =>
            overlay.laps.map(lap => {
                const channels: Record<string, Float32Array> = {};
                for (const key of [...TEMP_PANES, ...PRESSURE_PANES]) {
                    const values = lap.channels[key];
                    if (!values) continue;
                    const arr = new Float32Array(overlay.sampleCount);
                    for (let i = 0; i < overlay.sampleCount; i++) {
                        const v = values[i];
                        arr[i] = v == null ? NaN : v;
                    }
                    channels[key] = arr;
                }
                return {
                    id: lap.lapId,
                    label: labels[lap.lapId] ?? `Lap ${lap.lapNumber}`,
                    color: colors[lap.lapId],
                    corners: lap.corners,
                    dashed: lap.lapId === refLapId,
                    channels,
                };
            }),
        [overlay, refLapId, colors, labels]
    );

    const cornerSource = laps.find(l => l.dashed) ?? laps[0];

    if (!availablePanes.length) {
        return (
            <div className="flex h-32 items-center justify-center font-mono text-sm text-zinc-600">
                No tyre {metric} data for these laps
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-1">
                {(["temp", "pressure"] as const).map(m => (
                    <button
                        key={m}
                        type="button"
                        aria-pressed={metric === m}
                        onClick={() => setMetric(m)}
                        className={cn(
                            "border px-2 py-0.5 text-[11px] font-medium capitalize transition-colors",
                            metric === m
                                ? "border-zinc-700 bg-zinc-800 text-white"
                                : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        {m}
                    </button>
                ))}
            </div>
            <UPlotTraces x={x} laps={laps} panes={availablePanes} cornerSource={cornerSource} channelToggles={false} paneHeight={100} ribbon={false} />
        </div>
    );
}
