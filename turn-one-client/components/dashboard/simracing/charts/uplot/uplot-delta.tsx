"use client";

import { useCallback, useMemo, useState } from "react";
import type uPlot from "uplot";
import { cn } from "@/lib/utils";
import { CHART, formatDistance } from "../chart-theme";
import { cornerOverlayPlugin, type OverlayCorner } from "./corner-overlay";
import { CURSOR_BASE, PANE_LAYOUT, distanceAxis, valueAxis } from "./uplot-theme";
import { useUPlot } from "./use-uplot";
import { useLatest } from "./use-latest";
import { nearestIndex } from "./uplot-traces";
import { wheelZoomPlugin } from "./wheel-zoom";
import { zeroLinePlugin } from "./zero-line";

export interface DeltaLap {
    id: string;
    label: string;
    color: string;
    /** Cumulative delta vs the reference in seconds, on the shared grid. */
    deltaS: Float32Array | number[];
}

export interface UPlotDeltaProps {
    x: Float32Array | number[];
    laps: DeltaLap[];
    referenceLabel: string;
    corners?: OverlayCorner[];
    height?: number;
    className?: string;
}

/**
 * Cumulative time delta of N laps against the reference lap. Rising = losing time there. The
 * area between the line and zero is tinted red above / green below so the eye finds the costly
 * corners first. The end value equals the lap-time difference.
 */
export function UPlotDelta({ x, laps, referenceLabel, corners = [], height = 200, className }: UPlotDeltaProps) {
    const lapsRef = useLatest(laps);
    const cornersRef = useLatest(corners);

    const data = useMemo<uPlot.AlignedData>(() => {
        const xs = Array.from(x);
        return [xs, ...laps.map(l => xs.map((_, i) => (Number.isNaN(l.deltaS[i]) ? null : l.deltaS[i])))] as uPlot.AlignedData;
    }, [x, laps]);

    const [hover, setHover] = useState<number | null>(null);

    const buildOptions = useCallback(
        (): Omit<uPlot.Options, "width" | "height"> => ({
            // Room on top for the corner numbers the overlay plugin draws.
            padding: [18, PANE_LAYOUT.padRight, 0, 0],
            legend: { show: false },
            cursor: {
                ...CURSOR_BASE,
                points: { ...CURSOR_BASE.points, fill: (_u, si) => lapsRef.current[si - 1]?.color ?? CHART.primary },
            },
            scales: {
                x: { time: false },
                y: {
                    range: (_u, min, max) => {
                        const m = Math.max(Math.abs(min), Math.abs(max), 0.1) * 1.1;
                        return [-m, m];
                    },
                },
            },
            axes: [distanceAxis(), valueAxis("s")],
            series: [
                { label: "Distance" },
                ...lapsRef.current.map((l, i) => ({
                    label: l.label,
                    stroke: l.color,
                    width: 1.75,
                    spanGaps: false,
                    points: { show: false },
                    // Only the first (primary) lap gets the signed fill; more would just muddy.
                    fill: i === 0 ? signedFill : undefined,
                })),
            ],
            plugins: [wheelZoomPlugin(), zeroLinePlugin(), cornerOverlayPlugin(() => ({ corners: cornersRef.current, labels: true }))],
        }),
        [cornersRef, lapsRef]
    );

    const { containerRef } = useUPlot({ buildOptions, data, height, deps: [laps.length], onCursor: setHover });

    const hoverIdx = hover == null ? null : nearestIndex(x, hover);

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                {laps.map(l => {
                    const finalDelta = lastFinite(l.deltaS);
                    const at = hoverIdx != null ? l.deltaS[hoverIdx] : null;
                    return (
                        <div key={l.id}>
                            <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: l.color }}>
                                {l.label}
                            </p>
                            <p
                                className={cn(
                                    "font-mono text-2xl font-black tabular-nums",
                                    (finalDelta ?? 0) <= 0 ? "text-green-500" : "text-red-500"
                                )}
                            >
                                {fmtDelta(finalDelta)}
                            </p>
                            {at != null && !Number.isNaN(at) ? (
                                <p className="font-mono text-xs text-zinc-400">
                                    {fmtDelta(at)} @ {formatDistance(hover ?? 0)}
                                </p>
                            ) : null}
                        </div>
                    );
                })}
                <p className="ml-auto self-end text-xs text-zinc-500">vs {referenceLabel}</p>
            </div>
            <div className="border border-zinc-800 bg-zinc-950">
                <div ref={containerRef} className="w-full" style={{ height }} />
            </div>
        </div>
    );
}

/** Red above zero (losing), green below (gaining) — a vertical gradient split at the zero pixel. */
const signedFill: uPlot.Series.Fill = u => {
    const ctx = u.ctx;
    const { top, height } = u.bbox;
    const y0 = u.valToPos(0, "y", true);
    const split = height > 0 ? Math.min(1, Math.max(0, (y0 - top) / height)) : 0.5;
    const grad = ctx.createLinearGradient(0, top, 0, top + height);
    grad.addColorStop(0, "rgba(239,68,68,0.28)");
    grad.addColorStop(split, "rgba(239,68,68,0.04)");
    grad.addColorStop(split, "rgba(34,197,94,0.04)");
    grad.addColorStop(1, "rgba(34,197,94,0.28)");
    return grad;
};

function lastFinite(arr: Float32Array | number[]) {
    for (let i = arr.length - 1; i >= 0; i--) if (!Number.isNaN(arr[i])) return arr[i];
    return null;
}

export function fmtDelta(s: number | null | undefined) {
    if (s == null || Number.isNaN(s)) return "—";
    return `${s > 0 ? "+" : ""}${s.toFixed(3)}s`;
}
