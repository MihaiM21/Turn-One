"use client";

import { useMemo } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { CHART, TOOLTIP_STYLE, AXIS_TICK, asNumber } from "@/components/dashboard/simracing/charts/chart-theme";
import { formatLapTime } from "@/lib/simracing/api";
import type { SimPlotContext } from "@/lib/simracing/plot-catalog";

function lastFinite(values: (number | null)[] | undefined): number | null {
    if (!values) return null;
    for (let i = values.length - 1; i >= 0; i--) {
        const v = values[i];
        if (v != null) return v;
    }
    return null;
}

function firstFinite(values: (number | null)[] | undefined): number | null {
    if (!values) return null;
    for (const v of values) if (v != null) return v;
    return null;
}

/** Fuel used per lap (first reading minus last) alongside that lap's time. */
export function FuelPerLapPlot({ ctx }: { ctx: SimPlotContext }) {
    const { overlay, colors, labels } = ctx;

    const data = useMemo(
        () =>
            overlay.laps.map(lap => {
                const first = firstFinite(lap.channels.fuel);
                const last = lastFinite(lap.channels.fuel);
                const used = first != null && last != null ? Math.max(0, first - last) : null;
                return {
                    lapId: lap.lapId,
                    lapLabel: labels[lap.lapId] ?? `Lap ${lap.lapNumber}`,
                    fuelUsed: used,
                    lapTimeS: lap.lapTimeMs != null ? lap.lapTimeMs / 1000 : null,
                };
            }),
        [overlay, labels]
    );

    const hasFuel = data.some(d => d.fuelUsed != null);

    if (!hasFuel) {
        return (
            <div className="flex h-32 items-center justify-center font-mono text-sm text-zinc-600">
                No fuel data for these laps
            </div>
        );
    }

    return (
        <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 8, right: 10, left: -8, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                    <XAxis dataKey="lapLabel" stroke={CHART.grid} tick={AXIS_TICK} />
                    <YAxis
                        yAxisId="fuel"
                        stroke={CHART.grid}
                        tick={AXIS_TICK}
                        tickFormatter={v => `${Number(v).toFixed(1)}L`}
                        width={48}
                    />
                    <YAxis
                        yAxisId="time"
                        orientation="right"
                        stroke={CHART.grid}
                        tick={AXIS_TICK}
                        tickFormatter={v => formatLapTime(Number(v) * 1000)}
                        width={56}
                    />
                    <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(rawValue: unknown, rawName: unknown) => {
                            if (rawName === "fuelUsed") return [`${asNumber(rawValue).toFixed(2)} L`, "Fuel used"];
                            return [formatLapTime(asNumber(rawValue) * 1000), "Lap time"];
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} formatter={v => (v === "fuelUsed" ? "Fuel used" : "Lap time")} />
                    <Bar yAxisId="fuel" dataKey="fuelUsed" isAnimationActive={false}>
                        {data.map(d => (
                            <Cell key={d.lapId} fill={colors[d.lapId] ?? CHART.primary} />
                        ))}
                    </Bar>
                    <Line
                        yAxisId="time"
                        dataKey="lapTimeS"
                        stroke="#3b82f6"
                        strokeWidth={1.5}
                        dot={{ r: 2 }}
                        isAnimationActive={false}
                        connectNulls
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
