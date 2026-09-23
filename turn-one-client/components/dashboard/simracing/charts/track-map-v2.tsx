"use client";

import { useMemo, useRef, useState } from "react";
import type { DistanceSample } from "@/lib/simracing/analysis";
import type { LapCornerDto, MultiChannelChartData } from "@/lib/simracing/protocol";
import { TrackMap } from "./track-map";
import { useCursorSync, cornerLabel, type OverlayCorner } from "./uplot";
import { speedToColor, gearToColor, deltaToColor } from "@/lib/color-scale";
import { formatDistance } from "./chart-theme";

export type TrackMapV2ColorMode = "speed" | "gear" | "throttle" | "brake" | "delta";

const MODES: { key: TrackMapV2ColorMode; label: string }[] = [
    { key: "speed", label: "Speed" },
    { key: "gear", label: "Gear" },
    { key: "throttle", label: "Throttle" },
    { key: "brake", label: "Brake" },
    { key: "delta", label: "Delta" },
];

export interface TrackMapV2Lap {
    id: string;
    label: string;
    color: string;
    /** On-track XY, absolute metres, when the sim publishes position (protocol-v2 `posX`/`posY`). */
    x?: Float32Array | number[] | null;
    y?: Float32Array | number[] | null;
    /** Distance-grid spacing for this lap's channel arrays. */
    stepM: number;
    speed?: Float32Array | number[] | null;
    gear?: Float32Array | number[] | null;
    throttle?: Float32Array | number[] | null;
    brake?: Float32Array | number[] | null;
    /** Cumulative delta vs the reference lap, seconds. Null/absent for the reference lap itself. */
    deltaS?: Float32Array | number[] | null;
    corners?: LapCornerDto[];
}

export interface TrackMapV2Props {
    /** Flat `[x0,y0,x1,y1,...]` track profile centreline, 5 m spacing, used when no lap has XY. */
    centerline?: number[] | null;
    laps: TrackMapV2Lap[];
    referenceLapId: string;
    height?: number;
    colorMode?: TrackMapV2ColorMode;
    /**
     * Old-`TrackMap` fallback inputs. When geometry can't be built from XY or a centreline, and
     * these are supplied, delegate to the heading dead-reckoned map instead of the empty message.
     */
    fallbackSamples?: DistanceSample[];
    fallbackRaw?: MultiChannelChartData;
}

interface GeoPoint {
    x: number;
    y: number;
    /** Distance along the lap/centreline, metres. */
    distance: number;
}

interface Geometry {
    points: GeoPoint[];
    width: number;
    height: number;
    viewBox: string;
}

const SIZE = 1000;
const MARGIN_FRAC = 0.07;
const BUCKET = 24; // ~1/40th of SIZE — coarse spatial index for nearest-point lookups.

function toArray(v: Float32Array | number[] | null | undefined): number[] | null {
    if (!v || v.length === 0) return null;
    return v as number[];
}

/** Cumulative straight-line arc length between consecutive raw points. */
function cumulativeDistances(raw: { x: number; y: number }[]): number[] {
    const out = new Array<number>(raw.length);
    out[0] = 0;
    for (let i = 1; i < raw.length; i++) {
        out[i] = out[i - 1] + Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y);
    }
    return out;
}

/** Normalises raw world-space points into a padded SVG viewBox, flipping Y so the map reads north-up. */
function project(raw: { x: number; y: number }[], distances: number[]): Geometry {
    const xs = raw.map(p => p.x);
    const ys = raw.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const margin = SIZE * MARGIN_FRAC;
    const scale = (SIZE - margin * 2) / Math.max(spanX, spanY);

    const width = spanX * scale + margin * 2;
    const height = spanY * scale + margin * 2;

    const points: GeoPoint[] = raw.map((p, i) => ({
        x: (p.x - minX) * scale + margin,
        y: height - ((p.y - minY) * scale + margin),
        distance: distances[i],
    }));

    return { points, width, height, viewBox: `0 0 ${width} ${height}` };
}

/** Same transform as `project`, applied to an already-known bounds — used to overlay other laps in the same frame. */
function projectWith(raw: { x: number; y: number }[], bounds: { minX: number; minY: number; scale: number; margin: number; height: number }) {
    return raw.map(p => ({
        x: (p.x - bounds.minX) * bounds.scale + bounds.margin,
        y: bounds.height - ((p.y - bounds.minY) * bounds.scale + bounds.margin),
    }));
}

function boundsOf(raw: { x: number; y: number }[]) {
    const xs = raw.map(p => p.x);
    const ys = raw.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const margin = SIZE * MARGIN_FRAC;
    const scale = (SIZE - margin * 2) / Math.max(spanX, spanY);
    const width = spanX * scale + margin * 2;
    const height = spanY * scale + margin * 2;
    return { minX, minY, scale, margin, width, height };
}

/** Nearest geometry point to a given lap distance (binary search — `points[].distance` is monotonic). */
function pointAtDistance(points: GeoPoint[], distance: number): GeoPoint | null {
    if (!points.length) return null;
    let lo = 0;
    let hi = points.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (points[mid].distance < distance) lo = mid + 1;
        else hi = mid;
    }
    if (lo > 0) {
        const a = points[lo - 1];
        const b = points[lo];
        return Math.abs(a.distance - distance) <= Math.abs(b.distance - distance) ? a : b;
    }
    return points[lo];
}

/** Coarse bucket grid over pixel-space points, so hover lookups don't scan the whole lap per mousemove. */
function buildBucketIndex(points: GeoPoint[]) {
    const map = new Map<string, GeoPoint[]>();
    for (const p of points) {
        const key = `${Math.floor(p.x / BUCKET)},${Math.floor(p.y / BUCKET)}`;
        const list = map.get(key);
        if (list) list.push(p);
        else map.set(key, [p]);
    }
    return map;
}

function nearestByPosition(index: Map<string, GeoPoint[]>, x: number, y: number): GeoPoint | null {
    const bx = Math.floor(x / BUCKET);
    const by = Math.floor(y / BUCKET);
    let best: GeoPoint | null = null;
    let bestDist = Infinity;
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const list = index.get(`${bx + dx},${by + dy}`);
            if (!list) continue;
            for (const p of list) {
                const d = (p.x - x) ** 2 + (p.y - y) ** 2;
                if (d < bestDist) {
                    bestDist = d;
                    best = p;
                }
            }
        }
    }
    return best;
}

/**
 * SVG racing-line map built from real XY telemetry (or the track profile centreline), replacing
 * the heading-dead-reckoned `TrackMap` when protocol-v2 position data is available.
 */
export function TrackMapV2({
    centerline,
    laps,
    referenceLapId,
    height = 420,
    colorMode: controlledMode,
    fallbackSamples,
    fallbackRaw,
}: TrackMapV2Props) {
    const [mode, setMode] = useState<TrackMapV2ColorMode>(controlledMode ?? "speed");
    const activeMode = controlledMode ?? mode;
    const sync = useCursorSync();
    const svgRef = useRef<SVGSVGElement>(null);

    const refLap = useMemo(() => laps.find(l => l.id === referenceLapId) ?? null, [laps, referenceLapId]);

    // ---- Reference geometry -------------------------------------------------
    const geometry = useMemo(() => {
        const refX = toArray(refLap?.x);
        const refY = toArray(refLap?.y);
        if (refX && refY && refLap) {
            const n = Math.min(refX.length, refY.length);
            const raw = Array.from({ length: n }, (_, i) => ({ x: refX[i], y: refY[i] }));
            const distances = raw.map((_, i) => i * refLap.stepM);
            return project(raw, distances);
        }

        if (centerline && centerline.length >= 4) {
            const n = Math.floor(centerline.length / 2);
            const raw = Array.from({ length: n }, (_, i) => ({ x: centerline[i * 2], y: centerline[i * 2 + 1] }));
            const distances = cumulativeDistances(raw);
            return project(raw, distances);
        }

        return null;
    }, [refLap, centerline]);

    const bucketIndex = useMemo(() => (geometry ? buildBucketIndex(geometry.points) : null), [geometry]);

    // ---- Other laps' geometry, projected into the same frame -----------------
    const laneGeometries = useMemo(() => {
        if (!geometry) return new Map<string, GeoPoint[]>();

        const refRaw =
            toArray(refLap?.x) && toArray(refLap?.y)
                ? Array.from({ length: Math.min(toArray(refLap!.x)!.length, toArray(refLap!.y)!.length) }, (_, i) => ({
                      x: toArray(refLap!.x)![i],
                      y: toArray(refLap!.y)![i],
                  }))
                : centerline && centerline.length >= 4
                  ? Array.from({ length: Math.floor(centerline.length / 2) }, (_, i) => ({
                        x: centerline[i * 2],
                        y: centerline[i * 2 + 1],
                    }))
                  : [];
        const bounds = boundsOf(refRaw);

        const out = new Map<string, GeoPoint[]>();
        for (const lap of laps) {
            if (lap.id === referenceLapId) continue;
            const lx = toArray(lap.x);
            const ly = toArray(lap.y);
            if (!lx || !ly) continue;
            const n = Math.min(lx.length, ly.length);
            const raw = Array.from({ length: n }, (_, i) => ({ x: lx[i], y: ly[i] }));
            const projected = projectWith(raw, bounds);
            out.set(
                lap.id,
                projected.map((p, i) => ({ ...p, distance: i * lap.stepM }))
            );
        }
        return out;
    }, [geometry, laps, refLap, referenceLapId, centerline]);

    // ---- Colour bounds --------------------------------------------------------
    const primaryLap = useMemo(
        () => laps.find(l => l.id !== referenceLapId && toArray(l.deltaS)) ?? null,
        [laps, referenceLapId]
    );

    const bounds = useMemo(() => {
        const speeds = toArray(refLap?.speed) ?? [];
        const deltas = (toArray(primaryLap?.deltaS) ?? []).filter(v => Number.isFinite(v)).map(Math.abs);
        return {
            minSpeed: speeds.length ? Math.min(...speeds) : 0,
            maxSpeed: speeds.length ? Math.max(...speeds) : 1,
            maxDelta: deltas.length ? Math.max(...deltas, 0.05) : 0.05,
        };
    }, [refLap, primaryLap]);

    const colorForIndex = (i: number): string => {
        switch (activeMode) {
            case "gear": {
                const v = toArray(refLap?.gear)?.[i] ?? 0;
                return gearToColor(v);
            }
            case "throttle": {
                const v = toArray(refLap?.throttle)?.[i] ?? 0;
                return `rgb(${Math.round(34 + (1 - v) * 60)}, ${Math.round(197 * v + 40)}, 94)`;
            }
            case "brake": {
                const v = toArray(refLap?.brake)?.[i] ?? 0;
                return v > 0.03 ? `rgb(239, ${Math.round(120 - v * 100)}, 68)` : "#3f3f46";
            }
            case "delta": {
                const v = toArray(primaryLap?.deltaS)?.[i];
                return deltaToColor(v == null || Number.isNaN(v) ? 0 : v, bounds.maxDelta);
            }
            default: {
                const v = toArray(refLap?.speed)?.[i] ?? 0;
                return speedToColor(v, bounds.minSpeed, bounds.maxSpeed);
            }
        }
    };

    // ---- Corners ---------------------------------------------------------------
    const corners: OverlayCorner[] = (refLap?.corners as OverlayCorner[] | undefined) ?? [];

    // ---- Cursor -----------------------------------------------------------------
    const cursorPoints = useMemo(() => {
        if (sync.distance == null || !geometry) return [];
        const out: { lapId: string; color: string; point: GeoPoint }[] = [];
        for (const lap of laps) {
            if (lap.id === referenceLapId) {
                const p = pointAtDistance(geometry.points, sync.distance);
                if (p) out.push({ lapId: lap.id, color: lap.color, point: p });
                continue;
            }
            const own = laneGeometries.get(lap.id);
            if (own?.length) {
                const idx = Math.max(0, Math.min(own.length - 1, Math.round(sync.distance / lap.stepM)));
                out.push({ lapId: lap.id, color: lap.color, point: own[idx] });
            } else {
                // No XY for this lap — ride the reference geometry by distance instead.
                const p = pointAtDistance(geometry.points, sync.distance);
                if (p) out.push({ lapId: lap.id, color: lap.color, point: p });
            }
        }
        return out;
    }, [sync.distance, geometry, laneGeometries, laps, referenceLapId]);

    const distanceFromClientPoint = (clientX: number, clientY: number): number | null => {
        const svg = svgRef.current;
        if (!svg || !bucketIndex) return null;
        const ctm = svg.getScreenCTM();
        if (!ctm) return null;
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const local = pt.matrixTransform(ctm.inverse());
        const nearest = nearestByPosition(bucketIndex, local.x, local.y);
        return nearest?.distance ?? null;
    };

    if (!geometry) {
        if (fallbackSamples && fallbackRaw) {
            return <TrackMap samples={fallbackSamples} raw={fallbackRaw} height={height} />;
        }
        return (
            <div className="flex h-48 items-center justify-center font-mono text-sm text-zinc-600">
                No position data for this lap
            </div>
        );
    }

    const hoveredLap = sync.distance != null ? refLap : null;
    const hoverIdx =
        hoveredLap && geometry ? Math.max(0, Math.min(geometry.points.length - 1, Math.round((sync.distance ?? 0) / (refLap?.stepM || 1)))) : null;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                    {MODES.map(m => (
                        <button
                            key={m.key}
                            type="button"
                            onClick={() => setMode(m.key)}
                            aria-pressed={activeMode === m.key}
                            className={`h-7 border px-2.5 text-[11px] font-bold transition-colors ${
                                activeMode === m.key
                                    ? "border-zinc-700 bg-zinc-800 text-white"
                                    : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300"
                            }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                {hoverIdx != null ? (
                    <div className="flex gap-3 font-mono text-[11px] tabular-nums text-zinc-400">
                        <span>{formatDistance(sync.distance ?? 0)}</span>
                        {toArray(refLap?.speed) ? (
                            <span className="text-white">{Math.round(toArray(refLap!.speed)![hoverIdx] ?? 0)} km/h</span>
                        ) : null}
                        {toArray(refLap?.gear) ? <span>G{Math.round(toArray(refLap!.gear)![hoverIdx] ?? 0)}</span> : null}
                    </div>
                ) : null}
            </div>

            <div style={{ height }} className="w-full">
                <svg
                    ref={svgRef}
                    viewBox={geometry.viewBox}
                    className="h-full w-full"
                    preserveAspectRatio="xMidYMid meet"
                    onMouseMove={e => {
                        const d = distanceFromClientPoint(e.clientX, e.clientY);
                        if (d != null) sync.setDistance(d);
                    }}
                    onMouseLeave={() => sync.setDistance(null)}
                    onClick={e => {
                        const d = distanceFromClientPoint(e.clientX, e.clientY);
                        if (d != null) sync.setZoom([Math.max(0, d - 150), d + 150]);
                    }}
                >
                    {/* Casing */}
                    <polyline
                        points={geometry.points.map(p => `${p.x},${p.y}`).join(" ")}
                        fill="none"
                        stroke="#18181b"
                        strokeWidth={14}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Braking zones (reference lap): entry from brakingPointM to apexM. */}
                    {corners.map((c, i) => {
                        if (c.brakingPointM == null) return null;
                        const from = pointAtDistance(geometry.points, c.brakingPointM);
                        const to = pointAtDistance(geometry.points, c.apexM);
                        if (!from || !to) return null;
                        return (
                            <line
                                key={`brake-${i}`}
                                x1={from.x}
                                y1={from.y}
                                x2={to.x}
                                y2={to.y}
                                stroke="#ef4444"
                                strokeWidth={16}
                                strokeLinecap="round"
                                opacity={0.28}
                            />
                        );
                    })}

                    {/* Reference lap, coloured per-segment. */}
                    {geometry.points.slice(0, -1).map((p, i) => {
                        const next = geometry.points[i + 1];
                        return (
                            <line
                                key={i}
                                x1={p.x}
                                y1={p.y}
                                x2={next.x}
                                y2={next.y}
                                stroke={colorForIndex(i)}
                                strokeWidth={9}
                                strokeLinecap="round"
                            />
                        );
                    })}

                    {/* Other laps' racing lines, when they have their own XY. */}
                    {laps
                        .filter(l => l.id !== referenceLapId)
                        .map(lap => {
                            const pts = laneGeometries.get(lap.id);
                            if (!pts?.length) return null;
                            return (
                                <polyline
                                    key={lap.id}
                                    points={pts.map(p => `${p.x},${p.y}`).join(" ")}
                                    fill="none"
                                    stroke={lap.color}
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity={0.85}
                                />
                            );
                        })}

                    {/* Corner numbers */}
                    {corners.map((c, i) => {
                        const apex = pointAtDistance(geometry.points, c.apexM);
                        if (!apex) return null;
                        return (
                            <text
                                key={`label-${i}`}
                                x={apex.x}
                                y={apex.y - 10}
                                fontSize={11}
                                textAnchor="middle"
                                fill="#a1a1aa"
                                className="select-none font-mono"
                            >
                                {cornerLabel(c)}
                            </text>
                        );
                    })}

                    {/* Start/finish */}
                    {geometry.points.length ? (
                        <circle cx={geometry.points[0].x} cy={geometry.points[0].y} r={9} fill="#fff" />
                    ) : null}

                    {/* Cursor dots, one per lap. */}
                    {cursorPoints.map(({ lapId, color, point }) => (
                        <circle
                            key={lapId}
                            cx={point.x}
                            cy={point.y}
                            r={7}
                            fill={color}
                            stroke="#fff"
                            strokeWidth={2}
                        />
                    ))}
                </svg>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-400">
                {laps.map(l => (
                    <span key={l.id} className="inline-flex items-center gap-1.5">
                        <span
                            className="inline-block h-0.5 w-4"
                            style={{
                                background: l.color,
                                borderTop: l.id === referenceLapId ? undefined : `2px solid ${l.color}`,
                            }}
                        />
                        {l.label}
                        {l.id === referenceLapId ? <span className="text-zinc-600">(reference)</span> : null}
                    </span>
                ))}
                <span className="ml-auto text-zinc-600">hover for cursor · click to zoom ±150 m</span>
            </div>
        </div>
    );
}
