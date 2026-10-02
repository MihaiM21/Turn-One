"use client";

import { useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { CHART, TOOLTIP_STYLE, AXIS_TICK, asNumber, asString } from "@/components/dashboard/simracing/charts/chart-theme";
import type { SimPlotContext } from "@/lib/simracing/plot-catalog";

interface GPoint {
    lateral: number;
    longitudinal: number;
    lapId: string;
}

/** Lateral vs longitudinal G for every lap, overlaid and coloured by lap. */
export function FrictionOverlayPlot({ ctx }: { ctx: SimPlotContext }) {
    const { overlay, colors, labels } = ctx;

    const { seriesByLap, limit } = useMemo(() => {
        const seriesByLap = new Map<string, GPoint[]>();
        let peak = 1;

        for (const lap of overlay.laps) {
            const gLat = lap.channels.gLat;
            const gLong = lap.channels.gLong;
            const speed = lap.channels.speed;
            if (!gLat || !gLong) continue;

            const points: GPoint[] = [];
            for (let i = 0; i < overlay.sampleCount; i++) {
                const lat = gLat[i];
                const lon = gLong[i];
                const spd = speed?.[i];
                if (lat == null || lon == null || Number.isNaN(lat) || Number.isNaN(lon)) continue;
                if (spd != null && !Number.isNaN(spd) && spd <= 20) continue;
                points.push({ lateral: lat, longitudinal: lon, lapId: lap.lapId });
                peak = Math.max(peak, Math.hypot(lat, lon));
            }
            seriesByLap.set(lap.lapId, points);
        }

        return { seriesByLap, limit: Math.ceil(peak * 2) / 2 || 1.5 };
    }, [overlay]);

    const hasAny = [...seriesByLap.values()].some(pts => pts.length > 0);

    if (!hasAny) {
        return (
            <div className="flex h-32 items-center justify-center font-mono text-sm text-zinc-600">
                No G-force data for these laps
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div style={{ height: 340 }}>
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
                            formatter={(rawValue: unknown, rawName: unknown) => [`${asNumber(rawValue).toFixed(2)} g`, asString(rawName)]}
                        />
                        <Legend formatter={(v: string) => labels[v] ?? v} wrapperStyle={{ fontSize: 11 }} />
                        {[...seriesByLap.entries()].map(([lapId, points]) => (
                            <Scatter
                                key={lapId}
                                name={lapId}
                                data={points}
                                fill={colors[lapId] ?? CHART.primary}
                                opacity={0.55}
                                isAnimationActive={false}
                            />
                        ))}
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            <p className="text-[11px] leading-relaxed text-zinc-600">
                Each colour is one lap. A fuller, rounder cloud means the lap combines braking and cornering; a
                cross-shaped hole in the diagonals means braking happens before turning in.
            </p>
        </div>
    );
}
