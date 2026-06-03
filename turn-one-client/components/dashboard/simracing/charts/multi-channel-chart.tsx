"use client";

import { useMemo, useState } from "react";
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
} from "recharts";
import { format } from "date-fns";

export interface MultiChannelPoint {
    timestamp: number;
    values: Record<string, number | null>;
}

export interface MultiChannelChartData {
    channels: string[];
    points: MultiChannelPoint[];
}

export interface ChannelConfig {
    key: string;
    label: string;
    color: string;
    axis: "left" | "right";
    unit?: string;
}

export const DEFAULT_CHANNELS: ChannelConfig[] = [
    { key: "speedKmh", label: "Speed", color: "#ef4444", axis: "left", unit: "km/h" },
    { key: "rpms", label: "RPM", color: "#3b82f6", axis: "right", unit: "rpm" },
    { key: "gas", label: "Throttle", color: "#22c55e", axis: "left", unit: "%" },
    { key: "brake", label: "Brake", color: "#f97316", axis: "left", unit: "%" },
    { key: "gear", label: "Gear", color: "#a855f7", axis: "right", unit: "" },
    { key: "steerAngle", label: "Steer", color: "#06b6d4", axis: "right", unit: "°" },
    { key: "clutch", label: "Clutch", color: "#eab308", axis: "left", unit: "%" },
];

interface MultiChannelChartProps {
    data: MultiChannelChartData;
    channels?: ChannelConfig[];
    height?: number;
    cursorTimestamp?: number | null;
    onCursorChange?: (timestamp: number | null) => void;
    compareData?: MultiChannelChartData | null;
    compareLabel?: string;
}

function flatten(data: MultiChannelChartData) {
    return data.points.map(p => ({ timestamp: p.timestamp, ...p.values }));
}

function flattenWithSuffix(data: MultiChannelChartData, suffix: string) {
    return data.points.map(p => {
        const row: Record<string, number | string | null> = { timestamp: p.timestamp };
        for (const [k, v] of Object.entries(p.values)) row[`${k}${suffix}`] = v;
        return row;
    });
}

export function MultiChannelChart({
    data,
    channels = DEFAULT_CHANNELS,
    height = 360,
    cursorTimestamp = null,
    onCursorChange,
    compareData = null,
    compareLabel = "Compare",
}: MultiChannelChartProps) {
    const available = useMemo(
        () => channels.filter(c => data.channels.includes(c.key)),
        [channels, data.channels]
    );

    const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
        const m: Record<string, boolean> = {};
        available.forEach((c, i) => (m[c.key] = i < 2));
        return m;
    });

    const merged = useMemo(() => {
        if (!compareData) return flatten(data);
        const a = flattenWithSuffix(data, "");
        const b = flattenWithSuffix(compareData, "__cmp");
        const byTs = new Map<number, Record<string, number | string | null>>();
        for (const row of a) byTs.set(row.timestamp as number, { ...row });
        for (const row of b) {
            const existing = byTs.get(row.timestamp as number) ?? { timestamp: row.timestamp };
            byTs.set(row.timestamp as number, { ...existing, ...row });
        }
        return Array.from(byTs.values()).sort((x, y) => (x.timestamp as number) - (y.timestamp as number));
    }, [data, compareData]);

    if (!data.points.length) {
        return (
            <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse font-mono text-sm">
                No telemetry data
            </div>
        );
    }

    const handleMove = (state: { activeLabel?: number | string } | null) => {
        if (!onCursorChange) return;
        if (!state || state.activeLabel == null) {
            onCursorChange(null);
            return;
        }
        const ts = typeof state.activeLabel === "number" ? state.activeLabel : Number(state.activeLabel);
        onCursorChange(Number.isFinite(ts) ? ts : null);
    };

    return (
        <div className="w-full">
            <div className="flex flex-wrap gap-2 mb-4">
                {available.map(c => {
                    const on = enabled[c.key];
                    return (
                        <button
                            key={c.key}
                            onClick={() => setEnabled(e => ({ ...e, [c.key]: !e[c.key] }))}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-all ${
                                on
                                    ? "bg-black/60 text-white border-primary/40"
                                    : "bg-transparent text-muted-foreground border-white/10 hover:text-white"
                            }`}
                            style={on ? { boxShadow: `inset 0 0 0 1px ${c.color}55` } : undefined}
                        >
                            <span
                                className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                                style={{ backgroundColor: on ? c.color : "#555" }}
                            />
                            {c.label}
                            {c.unit ? <span className="opacity-50 ml-1">({c.unit})</span> : null}
                        </button>
                    );
                })}
            </div>

            <div style={{ height }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={merged}
                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                        onMouseMove={handleMove}
                        onMouseLeave={() => onCursorChange?.(null)}
                    >
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} stroke="#555" />
                        <XAxis
                            dataKey="timestamp"
                            type="number"
                            domain={["dataMin", "dataMax"]}
                            tickFormatter={t => format(new Date(t), "HH:mm:ss")}
                            stroke="#555"
                            tick={{ fill: "#888", fontSize: 10 }}
                        />
                        <YAxis yAxisId="left" stroke="#555" tick={{ fill: "#888", fontSize: 10 }} />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#555"
                            tick={{ fill: "#888", fontSize: 10 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "rgba(0,0,0,0.85)",
                                borderColor: "#ef4444",
                                borderRadius: "8px",
                                backdropFilter: "blur(4px)",
                            }}
                            labelFormatter={t => format(new Date(t as number), "HH:mm:ss.SSS")}
                        />
                        <Legend wrapperStyle={{ paddingTop: 12 }} />

                        {cursorTimestamp != null ? (
                            <ReferenceLine
                                x={cursorTimestamp}
                                yAxisId="left"
                                stroke="#fff"
                                strokeOpacity={0.4}
                                strokeDasharray="3 3"
                            />
                        ) : null}

                        {available
                            .filter(c => enabled[c.key])
                            .map(c => (
                                <Line
                                    key={c.key}
                                    yAxisId={c.axis}
                                    type="monotone"
                                    dataKey={c.key}
                                    stroke={c.color}
                                    dot={false}
                                    strokeWidth={2}
                                    name={c.label}
                                    isAnimationActive={false}
                                    connectNulls
                                />
                            ))}

                        {compareData
                            ? available
                                  .filter(c => enabled[c.key])
                                  .map(c => (
                                      <Line
                                          key={`${c.key}__cmp`}
                                          yAxisId={c.axis}
                                          type="monotone"
                                          dataKey={`${c.key}__cmp`}
                                          stroke={c.color}
                                          strokeOpacity={0.5}
                                          strokeDasharray="4 4"
                                          dot={false}
                                          strokeWidth={2}
                                          name={`${c.label} · ${compareLabel}`}
                                          isAnimationActive={false}
                                          connectNulls
                                      />
                                  ))
                            : null}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
