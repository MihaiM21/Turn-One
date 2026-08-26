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
    ReferenceLine,
} from "recharts";
import type { DistanceSample } from "@/lib/simracing/analysis";
import { CHART, TOOLTIP_STYLE, AXIS_TICK, CHANNEL_META, formatDistance, asNumber, asString } from "./chart-theme";

type TraceKey = "speedKmh" | "gas" | "brake" | "gear" | "rpms" | "steerAngle";

const PANES: { key: TraceKey; from: (s: DistanceSample) => number }[] = [
    { key: "speedKmh", from: s => s.speedKmh },
    { key: "gas", from: s => s.gas * 100 },
    { key: "brake", from: s => s.brake * 100 },
    { key: "gear", from: s => s.gear },
    { key: "rpms", from: s => s.rpms },
    { key: "steerAngle", from: s => s.steerAngle },
];

interface DistanceTraceChartProps {
    samples: DistanceSample[];
    /** Optional second lap drawn as a dashed overlay. */
    compareSamples?: DistanceSample[] | null;
    compareLabel?: string;
    availableChannels?: string[];
    cursorDistance?: number | null;
    onCursorChange?: (distance: number | null) => void;
    paneHeight?: number;
}

/**
 * Telemetry traces on a distance axis, one stacked pane per channel.
 *
 * The previous chart crammed seven channels onto two shared Y axes, which made everything but
 * speed unreadable. Separate panes give each channel its own scale while keeping a single shared
 * X axis and cursor, which is how telemetry is actually read.
 */
export function DistanceTraceChart({
    samples,
    compareSamples = null,
    compareLabel = "Reference",
    availableChannels,
    cursorDistance = null,
    onCursorChange,
    paneHeight = 110,
}: DistanceTraceChartProps) {
    const panes = useMemo(
        () => PANES.filter(p => !availableChannels || availableChannels.includes(p.key)),
        [availableChannels]
    );

    const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(panes.map((p, i) => [p.key, i < 3]))
    );

    const data = useMemo(() => {
        const byDistance = new Map<number, Record<string, number>>();
        for (const s of samples) {
            const row: Record<string, number> = { distance: s.distance };
            for (const pane of PANES) row[pane.key] = pane.from(s);
            byDistance.set(s.distance, row);
        }
        if (compareSamples) {
            for (const s of compareSamples) {
                // Snap onto the nearest existing row so both laps share an X value.
                const row = byDistance.get(s.distance) ?? { distance: s.distance };
                for (const pane of PANES) row[`${pane.key}__cmp`] = pane.from(s);
                byDistance.set(s.distance, row);
            }
        }
        return Array.from(byDistance.values()).sort((a, b) => a.distance - b.distance);
    }, [samples, compareSamples]);

    const visible = panes.filter(p => enabled[p.key]);

    if (!samples.length) {
        return (
            <div className="flex h-48 items-center justify-center font-mono text-sm text-zinc-600">
                No telemetry for this lap
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
                {panes.map(pane => {
                    const meta = CHANNEL_META[pane.key];
                    const on = enabled[pane.key];
                    return (
                        <button
                            key={pane.key}
                            onClick={() => setEnabled(e => ({ ...e, [pane.key]: !e[pane.key] }))}
                            aria-pressed={on}
                            className={`inline-flex h-7 items-center gap-1.5 border px-2.5 text-[11px] font-bold transition-colors ${
                                on
                                    ? "border-zinc-700 bg-zinc-900 text-white"
                                    : "border-zinc-800 bg-transparent text-zinc-600 hover:text-zinc-400"
                            }`}
                        >
                            <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: on ? meta.color : "#3f3f46" }}
                            />
                            {meta.label}
                        </button>
                    );
                })}
            </div>

            <div className="space-y-px">
                {visible.map((pane, i) => {
                    const meta = CHANNEL_META[pane.key];
                    const isLast = i === visible.length - 1;
                    return (
                        <div key={pane.key} style={{ height: isLast ? paneHeight + 22 : paneHeight }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={data}
                                    margin={{ top: 6, right: 10, left: -18, bottom: isLast ? 4 : 0 }}
                                    syncId="distance-traces"
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
                                        tick={isLast ? AXIS_TICK : false}
                                        height={isLast ? 22 : 0}
                                    />
                                    <YAxis
                                        domain={meta.domain ?? ["auto", "auto"]}
                                        stroke={CHART.grid}
                                        tick={AXIS_TICK}
                                        width={44}
                                        label={{
                                            value: meta.label,
                                            angle: -90,
                                            position: "insideLeft",
                                            fill: CHART.axis,
                                            fontSize: 9,
                                            offset: 16,
                                        }}
                                    />
                                    <Tooltip
                                        contentStyle={TOOLTIP_STYLE}
                                        labelFormatter={d => formatDistance(d as number)}
                                        formatter={(rawValue: unknown, rawName: unknown) => [
                                            `${asNumber(rawValue).toFixed(
                                                meta.unit === "%" || meta.unit === "" ? 0 : 1
                                            )}${meta.unit}`,
                                            asString(rawName).endsWith("__cmp") ? compareLabel : meta.label,
                                        ]}
                                    />

                                    {cursorDistance != null ? (
                                        <ReferenceLine
                                            x={cursorDistance}
                                            stroke="#fff"
                                            strokeOpacity={0.4}
                                            strokeDasharray="3 3"
                                        />
                                    ) : null}

                                    {compareSamples ? (
                                        <Line
                                            dataKey={`${pane.key}__cmp`}
                                            stroke={meta.color}
                                            strokeOpacity={0.45}
                                            strokeDasharray="4 3"
                                            strokeWidth={1.5}
                                            dot={false}
                                            isAnimationActive={false}
                                            connectNulls
                                        />
                                    ) : null}

                                    <Line
                                        dataKey={pane.key}
                                        stroke={meta.color}
                                        strokeWidth={1.75}
                                        dot={false}
                                        isAnimationActive={false}
                                        connectNulls
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    );
                })}
            </div>

            {!visible.length ? (
                <p className="py-8 text-center font-mono text-sm text-zinc-600">Select a channel above</p>
            ) : null}
        </div>
    );
}
