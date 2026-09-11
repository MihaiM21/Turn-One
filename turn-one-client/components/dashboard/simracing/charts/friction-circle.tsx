"use client";

import { useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { DistanceSample } from "@/lib/simracing/analysis";
import { frictionCircle } from "@/lib/simracing/analysis";
import { speedToColor } from "@/lib/color-scale";
import { CHART, TOOLTIP_STYLE, AXIS_TICK, asNumber, asString } from "./chart-theme";

interface FrictionCircleProps {
    samples: DistanceSample[];
    height?: number;
}

/**
 * Lateral vs longitudinal G.
 *
 * A driver using all of the tyre fills a rough circle. Braking in a straight line and only then
 * turning leaves the diagonals empty — a visible cross rather than a circle — which is the single
 * clearest picture of "you're not trail braking".
 */
export function FrictionCircleChart({ samples, height = 340 }: FrictionCircleProps) {
    const { points, peakLateral, peakCombined, rings } = useMemo(() => {
        const result = frictionCircle(samples);
        const limit = Math.ceil(Math.max(result.peakCombined, 1) * 2) / 2;
        return {
            ...result,
            rings: [limit * 0.25, limit * 0.5, limit * 0.75, limit],
        };
    }, [samples]);

    const limit = rings[rings.length - 1] || 1.5;

    const speeds = points.map(p => p.speedKmh);
    const minSpeed = speeds.length ? Math.min(...speeds) : 0;
    const maxSpeed = speeds.length ? Math.max(...speeds) : 1;

    if (!points.length) {
        return (
            <div className="flex h-48 items-center justify-center font-mono text-sm text-zinc-600">
                No G-force data for this lap
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-6">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Peak lateral</p>
                    <p className="font-mono text-lg font-black tabular-nums text-white">{peakLateral.toFixed(2)} g</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Peak combined</p>
                    <p className="font-mono text-lg font-black tabular-nums text-primary">{peakCombined.toFixed(2)} g</p>
                </div>
            </div>

            <div style={{ height }} className="relative">
                {/* Reference rings, drawn behind the scatter so the envelope is readable. */}
                <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {rings.map((r, i) => (
                        <ellipse
                            key={i}
                            cx="50"
                            cy="50"
                            rx={(r / limit) * 44}
                            ry={(r / limit) * 44}
                            fill="none"
                            stroke={CHART.grid}
                            strokeWidth={0.3}
                            strokeDasharray="1 1"
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                </svg>

                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, left: -18, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                        <XAxis
                            type="number"
                            dataKey="lateral"
                            domain={[-limit, limit]}
                            tickFormatter={v => `${v}g`}
                            stroke={CHART.grid}
                            tick={AXIS_TICK}
                            name="Lateral"
                        />
                        <YAxis
                            type="number"
                            dataKey="longitudinal"
                            domain={[-limit, limit]}
                            tickFormatter={v => `${v}g`}
                            stroke={CHART.grid}
                            tick={AXIS_TICK}
                            name="Longitudinal"
                        />
                        <ReferenceLine x={0} stroke={CHART.reference} strokeOpacity={0.4} />
                        <ReferenceLine y={0} stroke={CHART.reference} strokeOpacity={0.4} />
                        <Tooltip
                            contentStyle={TOOLTIP_STYLE}
                            cursor={{ strokeDasharray: "3 3", stroke: CHART.grid }}
                            formatter={(rawValue: unknown, rawName: unknown) => {
                                const value = asNumber(rawValue);
                                const name = asString(rawName);
                                return name === "speedKmh"
                                    ? [`${Math.round(value)} km/h`, "Speed"]
                                    : [`${value.toFixed(2)} g`, name];
                            }}
                        />
                        <Scatter data={points} isAnimationActive={false}>
                            {points.map((p, i) => (
                                <circle key={i} r={1.5} fill={speedToColor(p.speedKmh, minSpeed, maxSpeed)} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            <p className="text-[11px] leading-relaxed text-zinc-600">
                Points are coloured by speed. A filled circle means you&apos;re combining braking and cornering;
                empty diagonals mean you brake in a straight line before turning in.
            </p>
        </div>
    );
}
