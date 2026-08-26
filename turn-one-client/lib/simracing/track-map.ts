/**
 * Reconstructs a track outline from telemetry.
 *
 * ACC publishes absolute car coordinates, but only as a 60-element array of structs, which the
 * tick store cannot flatten into queryable scalar fields. It *does* publish `heading` (radians)
 * and `speedKmh` as scalars, and those two are enough: integrating velocity along the heading
 * dead-reckons the racing line.
 *
 * Dead reckoning drifts over a lap, so `buildTrackPath` closes the loop by distributing the
 * accumulated error backwards across the path — the standard correction, and visually exact
 * enough for a map you hover over.
 */

import type { DistanceSample } from "./analysis";
import type { MultiChannelChartData } from "@/components/dashboard/simracing/charts/multi-channel-chart";

export interface TrackPoint {
    x: number;
    y: number;
    distance: number;
    /** Index into the source sample array, for cursor sync. */
    index: number;
}

export interface TrackPath {
    points: TrackPoint[];
    /** SVG viewBox covering the path with a small margin. */
    viewBox: string;
    width: number;
    height: number;
    /** False when there was no heading data and the caller should fall back to a ribbon. */
    ok: boolean;
}

const EMPTY: TrackPath = { points: [], viewBox: "0 0 100 100", width: 100, height: 100, ok: false };

/**
 * Heading is not part of `DistanceSample` (it is only needed here), so it is read straight from
 * the raw channel data and matched to samples by index.
 */
export function buildTrackPath(
    samples: DistanceSample[],
    raw: MultiChannelChartData,
    opts: { size?: number; closeLoop?: boolean } = {}
): TrackPath {
    const size = opts.size ?? 1000;
    const closeLoop = opts.closeLoop ?? true;

    if (samples.length < 10 || !raw.channels?.includes("heading")) return EMPTY;

    const headings = raw.points.map(p => p.values.heading);
    if (!headings.some(h => typeof h === "number")) return EMPTY;

    // Integrate position. Sample i in `samples` corresponds to point i in `raw.points`.
    const pts: { x: number; y: number; distance: number; index: number }[] = [];
    let x = 0;
    let y = 0;

    for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        const heading = headings[i];
        if (typeof heading !== "number") continue;

        if (i > 0) {
            const ds = s.distance - samples[i - 1].distance;
            if (ds > 0 && ds < 500) {
                // ACC heading: 0 = north, increasing clockwise.
                x += Math.sin(heading) * ds;
                y += Math.cos(heading) * ds;
            }
        }

        pts.push({ x, y, distance: s.distance, index: i });
    }

    if (pts.length < 10) return EMPTY;

    // Close the loop: spread the end-to-start error linearly back along the path.
    if (closeLoop) {
        const first = pts[0];
        const last = pts[pts.length - 1];
        const errX = last.x - first.x;
        const errY = last.y - first.y;
        const total = last.distance - first.distance;

        if (total > 0 && Math.hypot(errX, errY) < total * 0.5) {
            for (const p of pts) {
                const t = (p.distance - first.distance) / total;
                p.x -= errX * t;
                p.y -= errY * t;
            }
        }
    }

    // Normalise into the viewBox, preserving aspect ratio.
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const margin = size * 0.06;
    const scale = (size - margin * 2) / Math.max(spanX, spanY);

    const width = spanX * scale + margin * 2;
    const height = spanY * scale + margin * 2;

    const points: TrackPoint[] = pts.map(p => ({
        x: (p.x - minX) * scale + margin,
        // SVG y grows downward; flip so the map reads like a normal track map.
        y: height - ((p.y - minY) * scale + margin),
        distance: p.distance,
        index: p.index,
    }));

    return { points, viewBox: `0 0 ${width} ${height}`, width, height, ok: true };
}

/** Nearest point on the path to a given distance — used to place the cursor marker. */
export function pointAtDistance(path: TrackPath, distance: number): TrackPoint | null {
    if (!path.points.length) return null;
    let best = path.points[0];
    let bestGap = Math.abs(best.distance - distance);
    for (const p of path.points) {
        const gap = Math.abs(p.distance - distance);
        if (gap < bestGap) {
            best = p;
            bestGap = gap;
        }
    }
    return best;
}

/**
 * Fallback when heading is unavailable: a straight horizontal ribbon indexed by distance.
 * Keeps the "coloured by channel" affordance even without a real track shape.
 */
export function buildRibbonPath(samples: DistanceSample[], size = 1000): TrackPath {
    if (samples.length < 2) return EMPTY;

    const total = samples[samples.length - 1].distance || 1;
    const height = 120;

    return {
        points: samples.map((s, i) => ({
            x: (s.distance / total) * size,
            y: height / 2,
            distance: s.distance,
            index: i,
        })),
        viewBox: `0 0 ${size} ${height}`,
        width: size,
        height,
        ok: false,
    };
}
