"use client";

import { useMemo } from "react";
import {
    ComposedChart,
    Area,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import type { DeltaPoint } from "@/lib/simracing/analysis";
import { CHART, TOOLTIP_STYLE, AXIS_TICK, formatDistance, asNumber, asString } from "./chart-theme";

interface DeltaTraceChartProps {
    delta: DeltaPoint[];
    height?: number;
    lapLabel?: string;
    referenceLabel?: string;
    cursorDistance?: number | null;
    onCursorChange?: (distance: number | null) => void;
}

/**
 * Cumulative time delta against a reference lap, plotted on a distance axis.
 *
 * Reading it: the line rising means time is being lost right there; falling means it's being
 * gained. The value at the finish equals the lap-time difference, so the chart always reconciles
 * with the timing screen.
 */
export function DeltaTraceChart({
    delta,
    height = 260,
    lapLabel = "This lap",
    referenceLabel = "Reference",
    cursorDistance = null,
    onCursorChange,
}: DeltaTraceChartProps) {
    const { data, finalDelta, maxAbs } = useMemo(() => {
        const rows = delta.map(d => ({
            distance: d.distance,
            delta: d.delta,
            ahead: d.delta < 0 ? d.delta : 0,
            behind: d.delta > 0 ? d.delta : 0,
            speed: d.speed,
            referenceSpeed: d.referenceSpeed,
        }));
        const final = rows.length ? rows[rows.length - 1].delta : 0;
        const max = rows.reduce((m, r) => Math.max(m, Math.abs(r.delta)), 0.1);
        return { data: rows, finalDelta: final, maxAbs: max };
    }, [delta]);

    if (!data.length) {
        return (
            <div className="flex h-48 items-center justify-center font-mono text-sm text-zinc-600">
                Not enough telemetry to build a delta
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Lap delta</p>
                    <p
                        className={`font-mono text-2xl font-black tabular-nums ${
                            finalDelta <= 0 ? "text-green-500" : "text-red-500"
                        }`}
                    >
                        {finalDelta > 0 ? "+" : ""}
                        {finalDelta.toFixed(3)}s
                    </p>
                </div>
                <p className="text-xs text-zinc-500">
                    {lapLabel} vs {referenceLabel}
                </p>
            </div>

            <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{ top: 5, right: 10, left: -18, bottom: 5 }}
                        onMouseMove={state => {
                            if (!onCursorChange) return;
                            const label = (state as { activeLabel?: number })?.activeLabel;
                            onCursorChange(typeof label === "number" ? label : null);
                        }}
                        onMouseLeave={() => onCursorChange?.(null)}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                        <XAxis
                            dataKey="distance"
                            type="number"
                            domain={["dataMin", "dataMax"]}
                            tickFormatter={formatDistance}
                            stroke={CHART.grid}
                            tick={AXIS_TICK}
                        />
                        <YAxis
                            domain={[-maxAbs * 1.1, maxAbs * 1.1]}
                            tickFormatter={v => `${v > 0 ? "+" : ""}${v.toFixed(2)}`}
                            stroke={CHART.grid}
                            tick={AXIS_TICK}
                        />
                        <Tooltip
                            contentStyle={TOOLTIP_STYLE}
                            labelFormatter={d => formatDistance(d as number)}
                            formatter={(rawValue: unknown, rawName: unknown) => {
                                const value = asNumber(rawValue);
                                const name = asString(rawName);
                                if (name === "delta")
                                    return [`${value > 0 ? "+" : ""}${value.toFixed(3)}s`, "Delta"];
                                return [`${Math.round(value)} km/h`, name === "speed" ? "Speed" : "Reference"];
                            }}
                        />

                        <ReferenceLine y={0} stroke={CHART.reference} strokeWidth={1} />
                        {cursorDistance != null ? (
                            <ReferenceLine x={cursorDistance} stroke="#fff" strokeOpacity={0.4} strokeDasharray="3 3" />
                        ) : null}

                        {/* Split fills so losing and gaining read differently at a glance. */}
                        <Area
                            dataKey="behind"
                            stroke="none"
                            fill={CHART.slower}
                            fillOpacity={0.25}
                            isAnimationActive={false}
                            legendType="none"
                        />
                        <Area
                            dataKey="ahead"
                            stroke="none"
                            fill={CHART.faster}
                            fillOpacity={0.25}
                            isAnimationActive={false}
                            legendType="none"
                        />
                        <Line
                            dataKey="delta"
                            stroke="#fff"
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-4 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-3" style={{ background: CHART.faster, opacity: 0.5 }} />
                    Gaining
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-3" style={{ background: CHART.slower, opacity: 0.5 }} />
                    Losing
                </span>
            </div>
        </div>
    );
}
