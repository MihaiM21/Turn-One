"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { useCursorSync } from "@/components/dashboard/simracing/charts/uplot";
import { CHART, TOOLTIP_STYLE, AXIS_TICK, asNumber, asString } from "@/components/dashboard/simracing/charts/chart-theme";
import { cornerDeltas } from "@/lib/simracing/lap-telemetry";
import type { SimPlotContext } from "@/lib/simracing/plot-catalog";

interface CornerDuelRow {
    corner: string;
    entryM: number;
    exitM: number;
    [lapKey: string]: string | number | null;
}

/**
 * Per reference corner: grouped bars of apex-speed delta (km/h) and time gained/lost (ms) for
 * every non-reference lap against the reference. Clicking a bar zooms every synced chart into
 * that corner; the speed chart's tooltip also surfaces the braking-point delta.
 */
export function CornerDuelPlot({ ctx }: { ctx: SimPlotContext }) {
    const { corners, refLapId, colors, labels } = ctx;

    const nonRefLapIds = useMemo(
        () => (corners?.lapIds ?? []).filter(id => id !== refLapId),
        [corners, refLapId]
    );

    const deltaRows = useMemo(() => (corners ? cornerDeltas(corners.rows) : []), [corners]);

    const { speedData, timeData, cornerBounds, brakingDeltaByCorner } = useMemo(() => {
        const bounds = new Map<string, [number, number]>();
        const braking = new Map<string, Record<string, number | null>>();
        const speed: CornerDuelRow[] = [];
        const time: CornerDuelRow[] = [];
        if (!corners) return { speedData: speed, timeData: time, cornerBounds: bounds, brakingDeltaByCorner: braking };

        const lapIndex = new Map(corners.lapIds.map((id, i) => [id, i]));

        corners.rows.forEach((row, rowIdx) => {
            const ref = row.perLap[0];
            const label = row.name ?? `T${row.refIndex + 1}`;
            if (ref) bounds.set(label, [ref.entryM, ref.exitM]);

            const speedRow: CornerDuelRow = { corner: label, entryM: ref?.entryM ?? 0, exitM: ref?.exitM ?? 0 };
            const timeRow: CornerDuelRow = { corner: label, entryM: ref?.entryM ?? 0, exitM: ref?.exitM ?? 0 };
            const brakingForRow: Record<string, number | null> = {};
            const delta = deltaRows[rowIdx];

            for (const lapId of nonRefLapIds) {
                const i = lapIndex.get(lapId);
                speedRow[lapId] = i != null ? delta?.minSpeedDeltaKmh[i] ?? null : null;
                timeRow[lapId] = i != null ? delta?.timeDeltaMs[i] ?? null : null;
                brakingForRow[lapId] = i != null ? delta?.brakingPointDeltaM[i] ?? null : null;
            }
            speed.push(speedRow);
            time.push(timeRow);
            braking.set(label, brakingForRow);
        });

        return { speedData: speed, timeData: time, cornerBounds: bounds, brakingDeltaByCorner: braking };
    }, [corners, deltaRows, nonRefLapIds]);

    const { setZoom } = useCursorSync();

    const zoomToCorner = (corner: string) => {
        const bounds = cornerBounds.get(corner);
        if (bounds) setZoom([bounds[0] - 80, bounds[1] + 80]);
    };

    if (!corners || !nonRefLapIds.length) {
        return (
            <div className="flex h-32 items-center justify-center font-mono text-sm text-zinc-600">
                No matched corners for these laps
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-zinc-500">Apex speed Δ (km/h)</p>
                <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={speedData}
                            margin={{ top: 8, right: 10, left: -12, bottom: 5 }}
                            onClick={state => {
                                const label = (state as { activeLabel?: string })?.activeLabel;
                                if (label) zoomToCorner(label);
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                            <XAxis dataKey="corner" stroke={CHART.grid} tick={AXIS_TICK} />
                            <YAxis stroke={CHART.grid} tick={AXIS_TICK} />
                            <ReferenceLine y={0} stroke={CHART.reference} />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(rawValue: unknown, rawName: unknown, item) => {
                                    const lapId = asString(rawName);
                                    const value = asNumber(rawValue);
                                    const corner = asString((item?.payload as CornerDuelRow | undefined)?.corner ?? "");
                                    const brakeDelta = brakingDeltaByCorner.get(corner)?.[lapId];
                                    const brakeText = brakeDelta != null ? `, brk ${brakeDelta > 0 ? "+" : ""}${brakeDelta.toFixed(0)}m` : "";
                                    return [`${value > 0 ? "+" : ""}${value.toFixed(1)} km/h${brakeText}`, labels[lapId] ?? lapId];
                                }}
                            />
                            <Legend formatter={(v: string) => labels[v] ?? v} wrapperStyle={{ fontSize: 11 }} />
                            {nonRefLapIds.map(lapId => (
                                <Bar key={lapId} dataKey={lapId} fill={colors[lapId] ?? CHART.primary} isAnimationActive={false} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div>
                <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-zinc-500">Time gained / lost (ms)</p>
                <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={timeData}
                            margin={{ top: 8, right: 10, left: -12, bottom: 5 }}
                            onClick={state => {
                                const label = (state as { activeLabel?: string })?.activeLabel;
                                if (label) zoomToCorner(label);
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                            <XAxis dataKey="corner" stroke={CHART.grid} tick={AXIS_TICK} />
                            <YAxis stroke={CHART.grid} tick={AXIS_TICK} />
                            <ReferenceLine y={0} stroke={CHART.reference} />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(rawValue: unknown, rawName: unknown) => {
                                    const lapId = asString(rawName);
                                    const value = asNumber(rawValue);
                                    return [`${value > 0 ? "+" : ""}${value.toFixed(0)} ms`, labels[lapId] ?? lapId];
                                }}
                            />
                            <Legend formatter={(v: string) => labels[v] ?? v} wrapperStyle={{ fontSize: 11 }} />
                            {nonRefLapIds.map(lapId => (
                                <Bar key={lapId} dataKey={lapId} fill={colors[lapId] ?? CHART.primary} isAnimationActive={false} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <p className="text-[11px] text-zinc-600">
                Click a bar to zoom every synced chart into that corner. Positive = faster / gained time vs the reference.
            </p>
        </div>
    );
}
