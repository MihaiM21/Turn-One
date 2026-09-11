"use client";

import { useMemo } from "react";
import {
    ComposedChart,
    Line,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Cell,
} from "recharts";
import type { LapLike } from "@/lib/simracing/analysis";
import { consistency } from "@/lib/simracing/analysis";
import { formatLapTime } from "@/lib/simracing/api";
import { CHART, TOOLTIP_STYLE, AXIS_TICK, asNumber, asString } from "./chart-theme";

interface LapEvolutionChartProps {
    laps: LapLike[];
    height?: number;
    selectedLap?: number | null;
    onSelectLap?: (lapNumber: number) => void;
}

/** Lap times over the session, with invalid laps marked and a rolling average for the trend. */
export function LapEvolutionChart({ laps, height = 280, selectedLap = null, onSelectLap }: LapEvolutionChartProps) {
    const { data, best, stats } = useMemo(() => {
        const stats = consistency(laps);
        const rollingByLap = new Map(stats.rolling.map(r => [r.lapNumber, r.averageMs]));

        const timed = laps.filter(l => typeof l.lapTimeMs === "number" && l.lapTimeMs > 0);
        const validTimes = timed.filter(l => l.isValid).map(l => l.lapTimeMs as number);
        const best = validTimes.length ? Math.min(...validTimes) : null;

        return {
            best,
            stats,
            data: timed.map(l => ({
                lapNumber: l.lapNumber,
                lapTimeMs: l.lapTimeMs as number,
                seconds: (l.lapTimeMs as number) / 1000,
                isValid: l.isValid,
                isBest: l.isValid && l.lapTimeMs === best,
                rolling: rollingByLap.get(l.lapNumber) ? (rollingByLap.get(l.lapNumber) as number) / 1000 : null,
            })),
        };
    }, [laps]);

    if (data.length < 2) {
        return (
            <div className="flex h-40 items-center justify-center font-mono text-sm text-zinc-600">
                Complete at least two timed laps to see the trend
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-6">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Best</p>
                    <p className="font-mono text-lg font-black tabular-nums text-primary">{formatLapTime(best)}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Consistency</p>
                    <p className="font-mono text-lg font-black tabular-nums text-white">
                        {stats.stdDevMs != null ? `±${(stats.stdDevMs / 1000).toFixed(3)}s` : "—"}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Valid laps</p>
                    <p className="font-mono text-lg font-black tabular-nums text-white">
                        {data.filter(d => d.isValid).length}/{data.length}
                    </p>
                </div>
            </div>

            <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{ top: 8, right: 10, left: -8, bottom: 5 }}
                        onClick={state => {
                            const label = (state as { activeLabel?: number })?.activeLabel;
                            if (typeof label === "number") onSelectLap?.(label);
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                        <XAxis
                            dataKey="lapNumber"
                            stroke={CHART.grid}
                            tick={AXIS_TICK}
                            label={{ value: "Lap", fill: CHART.axis, fontSize: 10, position: "insideBottom", offset: -2 }}
                        />
                        <YAxis
                            domain={["dataMin - 0.5", "dataMax + 0.5"]}
                            tickFormatter={v => formatLapTime(v * 1000)}
                            stroke={CHART.grid}
                            tick={AXIS_TICK}
                            width={62}
                        />
                        <Tooltip
                            contentStyle={TOOLTIP_STYLE}
                            labelFormatter={l => `Lap ${l}`}
                            formatter={(rawValue: unknown, rawName: unknown) => [
                                formatLapTime(asNumber(rawValue) * 1000),
                                asString(rawName) === "rolling" ? "3-lap average" : "Lap time",
                            ]}
                        />

                        {best ? (
                            <ReferenceLine
                                y={best / 1000}
                                stroke={CHART.primary}
                                strokeDasharray="4 3"
                                label={{ value: "Best", fill: CHART.primary, fontSize: 10, position: "insideTopLeft" }}
                            />
                        ) : null}

                        {selectedLap != null ? (
                            <ReferenceLine x={selectedLap} stroke="#fff" strokeOpacity={0.35} strokeDasharray="3 3" />
                        ) : null}

                        <Line
                            dataKey="seconds"
                            stroke={CHART.reference}
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                            connectNulls
                        />
                        <Line
                            dataKey="rolling"
                            stroke="#3b82f6"
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                            dot={false}
                            isAnimationActive={false}
                            connectNulls
                        />

                        {/* Invalid laps are drawn hollow so they don't read as legitimate pace. */}
                        <Scatter dataKey="seconds" isAnimationActive={false}>
                            {data.map(d => (
                                <Cell
                                    key={d.lapNumber}
                                    fill={d.isBest ? CHART.primary : d.isValid ? "#e4e4e7" : "transparent"}
                                    stroke={d.isValid ? "none" : CHART.slower}
                                />
                            ))}
                        </Scatter>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-4 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: CHART.primary }} />
                    Best lap
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-zinc-200" />
                    Valid
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full border" style={{ borderColor: CHART.slower }} />
                    Invalid
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-px w-4 border-t border-dashed border-blue-500" />
                    3-lap average
                </span>
            </div>
        </div>
    );
}
