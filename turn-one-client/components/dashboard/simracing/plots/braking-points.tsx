"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { CHART } from "@/components/dashboard/simracing/charts/chart-theme";
import type { SimPlotContext } from "@/lib/simracing/plot-catalog";

interface CornerRow {
    label: string;
    /** [lapId, distance-before-apex] for braking points, dashed for the reference lap. */
    braking: { lapId: string; deltaM: number; isRef: boolean }[];
    throttle: { lapId: string; deltaM: number; isRef: boolean }[];
    maxBraking: number;
    maxThrottle: number;
}

/**
 * Per corner, two horizontal axes: how far before the apex each lap started braking, and how far
 * after the apex each lap got back to throttle. The reference lap's marker is drawn hollow so it
 * reads as the baseline every other dot is measured against.
 */
export function BrakingPointsPlot({ ctx }: { ctx: SimPlotContext }) {
    const { corners, refLapId, colors, labels } = ctx;

    const rows = useMemo<CornerRow[]>(() => {
        if (!corners) return [];
        const lapIndex = new Map(corners.lapIds.map((id, i) => [id, i]));

        return corners.rows.map(row => {
            const braking: CornerRow["braking"] = [];
            const throttle: CornerRow["throttle"] = [];

            for (const lapId of corners.lapIds) {
                const i = lapIndex.get(lapId);
                const c = i != null ? row.perLap[i] : null;
                if (!c) continue;
                if (c.brakingPointM != null) {
                    braking.push({ lapId, deltaM: c.apexM - c.brakingPointM, isRef: lapId === refLapId });
                }
                if (c.throttleOnM != null) {
                    throttle.push({ lapId, deltaM: c.throttleOnM - c.apexM, isRef: lapId === refLapId });
                }
            }

            return {
                label: row.name ?? `T${row.refIndex + 1}`,
                braking,
                throttle,
                maxBraking: Math.max(1, ...braking.map(b => b.deltaM)),
                maxThrottle: Math.max(1, ...throttle.map(t => t.deltaM)),
            };
        });
    }, [corners, refLapId]);

    if (!corners || !rows.length) {
        return (
            <div className="flex h-32 items-center justify-center font-mono text-sm text-zinc-600">
                No matched corners for these laps
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {rows.map(row => (
                <div key={row.label} className="border border-zinc-800 bg-zinc-950 px-3 py-2">
                    <p className="mb-2 font-mono text-xs font-bold text-white">{row.label}</p>

                    <AxisRow title="Braking (m before apex)" points={row.braking} max={row.maxBraking} colors={colors} labels={labels} />
                    <AxisRow title="Throttle-on (m after apex)" points={row.throttle} max={row.maxThrottle} colors={colors} labels={labels} className="mt-2" />
                </div>
            ))}

            <p className="text-[11px] text-zinc-600">
                Filled dots are compared laps; the reference lap&apos;s dot is hollow. Further left in the braking row is earlier braking.
            </p>
        </div>
    );
}

function AxisRow({
    title,
    points,
    max,
    colors,
    labels,
    className,
}: {
    title: string;
    points: { lapId: string; deltaM: number; isRef: boolean }[];
    max: number;
    colors: Record<string, string>;
    labels: Record<string, string>;
    className?: string;
}) {
    if (!points.length) {
        return <p className={cn("text-[10px] text-zinc-600", className)}>{title}: no data</p>;
    }

    return (
        <div className={className}>
            <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500">{title}</p>
            <div className="relative h-6 border-b border-zinc-800">
                {points.map(p => {
                    const pct = Math.min(100, Math.max(0, (p.deltaM / max) * 100));
                    return (
                        <div
                            key={p.lapId}
                            title={`${labels[p.lapId] ?? p.lapId}: ${p.deltaM.toFixed(0)}m`}
                            className={cn(
                                "absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2",
                                p.isRef && "bg-transparent"
                            )}
                            style={{
                                left: `${pct}%`,
                                borderColor: colors[p.lapId] ?? CHART.primary,
                                backgroundColor: p.isRef ? "transparent" : colors[p.lapId] ?? CHART.primary,
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}
