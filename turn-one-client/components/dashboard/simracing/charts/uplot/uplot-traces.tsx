"use client";

import { useCallback, useMemo, useState } from "react";
import type uPlot from "uplot";
import { cn } from "@/lib/utils";
import { CHART, formatDistance } from "../chart-theme";
import { cornerOverlayPlugin, type OverlayCorner } from "./corner-overlay";
import { CornerRibbon } from "./corner-ribbon";
import { useCursorSync } from "./cursor-sync";
import { CURSOR_BASE, DEFAULT_PANES, PANE_LAYOUT, PANE_META, distanceAxis, trimNumber, valueAxis } from "./uplot-theme";
import { useUPlot } from "./use-uplot";
import { useLatest } from "./use-latest";
import { wheelZoomPlugin } from "./wheel-zoom";
import { zeroLinePlugin } from "./zero-line";

export interface TraceLap {
    id: string;
    label: string;
    color: string;
    /** Channel key → values on the shared distance grid (NaN where absent). */
    channels: Record<string, Float32Array | number[]>;
    /** Corners detected on this lap, for braking-point markers. */
    corners?: OverlayCorner[];
    /** Draw dashed — used for the reference lap. */
    dashed?: boolean;
    /** Shown in the legend when known. */
    lapTimeMs?: number | null;
}

export interface UPlotTracesProps {
    /** Shared distance axis, metres. */
    x: Float32Array | number[];
    laps: TraceLap[];
    /** Channel keys to show, one pane each. Defaults to speed / throttle / brake. */
    panes?: string[];
    /** Which lap's corners shade the background (usually the reference). */
    cornerSource?: TraceLap;
    /** Sector splits from the track profile, metres. */
    sectorBoundariesM?: number[];
    /** Base pane height; each channel scales it by its `weight`. */
    paneHeight?: number;
    /** Show an on/off toggle strip for the available channels. */
    channelToggles?: boolean;
    /** Show the corner / sector ribbon above the first pane. */
    ribbon?: boolean;
    className?: string;
}

/**
 * Stacked, cursor-synced distance traces for N laps — the core of the analysis workspace, laid out
 * like a desktop telemetry tool: a landmark ribbon (sectors + corners) on top, one strip per channel
 * with a fixed header (name · unit · live values · Δ vs reference), a single shared distance axis at
 * the bottom, and one cursor/zoom group across everything including the delta chart.
 */
export function UPlotTraces({
    x,
    laps,
    panes,
    cornerSource,
    sectorBoundariesM,
    paneHeight = 110,
    channelToggles = true,
    ribbon = true,
    className,
}: UPlotTracesProps) {
    const available = useMemo(() => {
        const keys = new Set<string>();
        for (const lap of laps) for (const k of Object.keys(lap.channels)) if (PANE_META[k]) keys.add(k);
        return [...DEFAULT_PANES, ...Object.keys(PANE_META)].filter((k, i, arr) => keys.has(k) && arr.indexOf(k) === i);
    }, [laps]);

    const [enabled, setEnabled] = useState<string[]>(() => panes ?? DEFAULT_PANES.slice(0, 3));
    // Keep the canonical channel order regardless of toggle order.
    const active = (panes ? panes : available.filter(k => enabled.includes(k))).filter(k => available.includes(k));

    const reference = laps.find(l => l.dashed) ?? laps[0];
    const corners = (cornerSource ?? reference)?.corners ?? [];
    const sync = useCursorSync();
    const [hover, setHover] = useState<number | null>(null);
    const hoverIdx = hover == null ? null : nearestIndex(x, hover);

    return (
        <div className={cn("space-y-2", className)}>
            {channelToggles && !panes ? (
                <div className="flex flex-wrap items-center gap-1">
                    {available.map(k => {
                        const on = enabled.includes(k);
                        return (
                            <button
                                key={k}
                                type="button"
                                aria-pressed={on}
                                onClick={() => setEnabled(e => (on ? e.filter(v => v !== k) : [...e, k]))}
                                className={cn(
                                    "border px-2 py-0.5 text-[11px] font-medium transition-colors",
                                    on
                                        ? "border-zinc-700 bg-zinc-800 text-white"
                                        : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300"
                                )}
                                style={on ? { borderColor: PANE_META[k].color } : undefined}
                            >
                                {PANE_META[k].label}
                            </button>
                        );
                    })}
                    <span className="ml-auto flex items-center gap-2">
                        {sync.zoom ? (
                            <span className="font-mono text-[10px] text-zinc-500">
                                {formatDistance(sync.zoom[0])} – {formatDistance(sync.zoom[1])}
                            </span>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => sync.resetZoom()}
                            disabled={!sync.zoom}
                            className="border border-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400 hover:text-white disabled:opacity-40"
                        >
                            Fit lap
                        </button>
                    </span>
                </div>
            ) : null}

            {active.length === 0 ? (
                <div className="flex h-32 items-center justify-center font-mono text-sm text-zinc-600">
                    No channels to plot
                </div>
            ) : (
                <div className="border border-zinc-800 bg-zinc-950">
                    {ribbon ? <CornerRibbon x={x} corners={corners} sectorBoundariesM={sectorBoundariesM} /> : null}
                    {active.map((key, i) => (
                        <TracePane
                            key={key}
                            channel={key}
                            x={x}
                            laps={laps}
                            reference={reference}
                            corners={corners}
                            showXAxis={i === active.length - 1}
                            height={Math.round(paneHeight * (PANE_META[key].weight ?? 1))}
                            hoverIdx={hoverIdx}
                            hoverX={hover}
                            onHover={setHover}
                            last={i === active.length - 1}
                        />
                    ))}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400">
                {laps.map(l => (
                    <span key={l.id} className="inline-flex items-center gap-1.5">
                        <span
                            className="inline-block h-0.5 w-4"
                            style={{ background: l.dashed ? "transparent" : l.color, borderTop: l.dashed ? `2px dashed ${l.color}` : undefined }}
                        />
                        <span style={{ color: l.color }}>{l.label}</span>
                        {l.lapTimeMs ? <span className="font-mono tabular-nums text-zinc-500">{fmtLapTime(l.lapTimeMs)}</span> : null}
                        {l === reference && laps.length > 1 ? <span className="text-zinc-600">reference</span> : null}
                    </span>
                ))}
                <span className="ml-auto text-zinc-600">drag to zoom · ctrl+wheel zoom · shift+wheel pan · double-click to fit</span>
            </div>
        </div>
    );
}

interface TracePaneProps {
    channel: string;
    x: Float32Array | number[];
    laps: TraceLap[];
    reference: TraceLap | undefined;
    corners: OverlayCorner[];
    showXAxis: boolean;
    height: number;
    hoverIdx: number | null;
    hoverX: number | null;
    onHover: (x: number | null) => void;
    last: boolean;
}

function TracePane({ channel, x, laps, reference, corners, showXAxis, height, hoverIdx, hoverX, onHover, last }: TracePaneProps) {
    const meta = PANE_META[channel];
    const cornersRef = useLatest(corners);
    const lapsRef = useLatest(laps);

    const data = useMemo<uPlot.AlignedData>(() => {
        const scale = meta.scale ?? 1;
        const xs = Array.from(x);
        const ys = laps.map(l => {
            const src = l.channels[channel];
            if (!src) return xs.map(() => null);
            return xs.map((_, i) => {
                const v = src[i];
                return v == null || Number.isNaN(v) ? null : v * scale;
            });
        });
        return [xs, ...ys] as uPlot.AlignedData;
    }, [x, laps, channel, meta.scale]);

    /** Per-lap [min, max] over the whole lap — the "at rest" readout. */
    const extents = useMemo(
        () =>
            laps.map(l => {
                const src = l.channels[channel];
                if (!src) return null;
                let min = Infinity, max = -Infinity;
                for (let i = 0; i < src.length; i++) {
                    const v = src[i];
                    if (v == null || Number.isNaN(v)) continue;
                    if (v < min) min = v;
                    if (v > max) max = v;
                }
                return Number.isFinite(min) ? ([min * (meta.scale ?? 1), max * (meta.scale ?? 1)] as [number, number]) : null;
            }),
        [laps, channel, meta.scale]
    );

    const buildOptions = useCallback(
        (): Omit<uPlot.Options, "width" | "height"> => ({
            padding: [PANE_LAYOUT.padTop, PANE_LAYOUT.padRight, 0, 0],
            legend: { show: false },
            cursor: {
                ...CURSOR_BASE,
                points: { ...CURSOR_BASE.points, fill: (_u, si) => lapsRef.current[si - 1]?.color ?? CHART.primary },
            },
            scales: {
                x: { time: false },
                y: meta.range
                    ? { range: meta.range }
                    : { range: (_u, min, max) => padRange(min, max, meta) },
            },
            axes: [
                { ...distanceAxis(), show: showXAxis, size: showXAxis ? PANE_LAYOUT.xAxisHeight : 0 },
                valueAxis(meta.unit, { discrete: meta.discrete }),
            ],
            series: [
                { label: "Distance" },
                ...lapsRef.current.map(l => ({
                    label: l.label,
                    stroke: l.color,
                    width: l.dashed ? 1.25 : 1.6,
                    dash: l.dashed ? [6, 4] : undefined,
                    spanGaps: false,
                    points: { show: false },
                    paths: meta.discrete ? stepped : undefined,
                })),
            ],
            plugins: [
                wheelZoomPlugin(),
                ...(meta.symmetric ? [zeroLinePlugin()] : []),
                cornerOverlayPlugin(() => ({
                    corners: cornersRef.current,
                    labels: false,
                    brakingMarkers: lapsRef.current
                        .filter(l => l.corners?.length)
                        .map(l => ({ color: l.color, corners: l.corners! })),
                })),
            ],
        }),
        [meta, showXAxis, cornersRef, lapsRef]
    );

    const { containerRef } = useUPlot({
        buildOptions,
        data,
        height,
        deps: [laps.length, channel, showXAxis],
        onCursor: onHover,
    });

    const fmt = (v: number) => (meta.discrete ? String(Math.round(v)) : trimNumber(v));
    const refVal = reference && hoverIdx != null ? valueAt(reference, channel, hoverIdx, meta.scale) : null;

    return (
        <div className={cn("bg-zinc-950", !last && "border-b border-zinc-800/70")}>
            {/* Fixed header: never shares pixels with the canvas, so nothing can overlap the axis or data. */}
            <div className="flex h-6 items-center gap-3 border-b border-zinc-900 px-2 font-mono text-[10px]">
                <span className="flex items-baseline gap-1.5">
                    <span className="uppercase tracking-[0.2em]" style={{ color: meta.color }}>
                        {meta.label}
                    </span>
                    {meta.unit ? <span className="text-zinc-600">{meta.unit}</span> : null}
                </span>
                <span className="ml-auto flex items-center gap-3 tabular-nums">
                    {hoverIdx != null
                        ? laps.map(l => {
                              const v = valueAt(l, channel, hoverIdx, meta.scale);
                              const showDelta = reference && l !== reference && v != null && refVal != null && !meta.discrete;
                              return (
                                  <span key={l.id} className="inline-flex items-baseline gap-1">
                                      <span style={{ color: l.color }}>{v == null ? "—" : fmt(v)}</span>
                                      {showDelta ? (
                                          <span className={cn("text-[9px]", v - refVal > 0 ? "text-zinc-400" : "text-zinc-500")}>
                                              {v - refVal >= 0 ? "+" : ""}
                                              {fmt(v - refVal)}
                                          </span>
                                      ) : null}
                                  </span>
                              );
                          })
                        : laps.map((l, i) => {
                              const e = extents[i];
                              if (!e) return null;
                              return (
                                  <span key={l.id} className="text-zinc-500">
                                      <span style={{ color: l.color }}>{fmt(e[0])}</span>
                                      <span className="text-zinc-700"> – </span>
                                      <span style={{ color: l.color }}>{fmt(e[1])}</span>
                                  </span>
                              );
                          })}
                    {hoverX != null ? <span className="text-zinc-600">@ {formatDistance(hoverX)}</span> : null}
                </span>
            </div>
            <div ref={containerRef} className="w-full" style={{ height }} />
        </div>
    );
}

function valueAt(lap: TraceLap, channel: string, idx: number, scale = 1): number | null {
    const v = lap.channels[channel]?.[idx];
    return v == null || Number.isNaN(v) ? null : v * scale;
}

function padRange(min: number, max: number, meta: { discrete?: boolean; symmetric?: boolean }): [number, number] {
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
    if (meta.discrete) return [Math.floor(min) - 0.5, Math.ceil(max) + 0.5];
    if (meta.symmetric) {
        const m = Math.max(Math.abs(min), Math.abs(max), 0.1) * 1.1;
        return [-m, m];
    }
    const pad = (max - min) * 0.08 || 1;
    return [min - pad, max + pad];
}

/** Sample-and-hold rendering for gear / flags. */
const stepped: uPlot.Series.PathBuilder = (u, seriesIdx, idx0, idx1) => {
    const s = u.series[seriesIdx];
    const xdata = u.data[0];
    const ydata = u.data[seriesIdx];
    const scaleX = "x";
    const scaleY = s.scale ?? "y";
    const stroke = new Path2D();
    let started = false;
    let prevY: number | null = null;
    for (let i = idx0; i <= idx1; i++) {
        const y = ydata[i];
        if (y == null) {
            started = false;
            prevY = null;
            continue;
        }
        const px = u.valToPos(xdata[i], scaleX, true);
        const py = u.valToPos(y, scaleY, true);
        if (!started) {
            stroke.moveTo(px, py);
            started = true;
        } else {
            if (prevY != null) stroke.lineTo(px, u.valToPos(prevY, scaleY, true));
            stroke.lineTo(px, py);
        }
        prevY = y;
    }
    return { stroke, fill: null, clip: null };
};

export function nearestIndex(x: Float32Array | number[], value: number) {
    if (!x.length) return null;
    const step = x.length > 1 ? x[1] - x[0] : 1;
    return Math.max(0, Math.min(x.length - 1, Math.round((value - x[0]) / step)));
}

function fmtLapTime(ms: number) {
    const m = Math.floor(ms / 60000);
    const s = ((ms % 60000) / 1000).toFixed(3).padStart(6, "0");
    return `${m}:${s}`;
}
