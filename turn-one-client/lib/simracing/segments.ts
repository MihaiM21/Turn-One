/**
 * Corner-by-corner segments of a lap for the workbench stepper (PBI-070). Corners come from the
 * existing corner detection; the gaps between them become straights, so the segments cover the
 * whole lap and their time deltas add up to the lap delta.
 */

import type { DeltaPoint } from "@/lib/simracing/analysis";

export interface SegmentCorner {
    index: number;
    refIndex?: number | null;
    name?: string | null;
    entryM: number;
    exitM: number;
}

export interface LapSegment {
    /** "T3", a corner name, or "T3 → T4" for the straight between them. */
    label: string;
    kind: "corner" | "straight";
    startM: number;
    endM: number;
}

/** Shorter gaps between corners are folded into the next segment instead of becoming a straight. */
const MIN_STRAIGHT_M = 30;

const cornerName = (c: SegmentCorner) => c.name || `T${(c.refIndex ?? c.index) + 1}`;

/** Corners and the straights between them, contiguous from 0 to the lap length. */
export function buildSegments(corners: SegmentCorner[], lapLengthM: number): LapSegment[] {
    if (!(lapLengthM > 0)) return [];
    const sorted = [...corners]
        .filter(c => Number.isFinite(c.entryM) && Number.isFinite(c.exitM) && c.exitM > c.entryM)
        .sort((a, b) => a.entryM - b.entryM);
    if (!sorted.length) return [{ label: "Lap", kind: "straight", startM: 0, endM: lapLengthM }];

    const out: LapSegment[] = [];
    let cursor = 0;
    let prev: SegmentCorner | null = null;
    for (const c of sorted) {
        const entry = Math.min(lapLengthM, Math.max(cursor, c.entryM));
        const exit = Math.min(lapLengthM, Math.max(entry, c.exitM));
        if (entry - cursor >= MIN_STRAIGHT_M) {
            out.push({ label: prev ? `${cornerName(prev)} → ${cornerName(c)}` : `Start → ${cornerName(c)}`, kind: "straight", startM: cursor, endM: entry });
            cursor = entry;
        }
        if (exit > cursor) {
            out.push({ label: cornerName(c), kind: "corner", startM: cursor, endM: exit });
            cursor = exit;
        }
        prev = c;
    }
    if (lapLengthM - cursor > 0) {
        if (lapLengthM - cursor >= MIN_STRAIGHT_M || !out.length) {
            out.push({ label: prev ? `${cornerName(prev)} → Line` : "Lap", kind: "straight", startM: cursor, endM: lapLengthM });
        } else {
            out[out.length - 1].endM = lapLengthM;
        }
    }
    return out;
}

/** Delta (s) at a distance, linearly interpolated on the delta trace; 0 before the first point. */
export function deltaAt(delta: DeltaPoint[], distanceM: number): number {
    // The lap starts level with the reference, so the sum of all segments is the lap delta.
    if (!delta.length || distanceM <= 0) return 0;
    if (distanceM <= delta[0].distance) return delta[0].delta;
    const last = delta[delta.length - 1];
    if (distanceM >= last.distance) return last.delta;
    let lo = 0;
    let hi = delta.length - 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (delta[mid].distance <= distanceM) lo = mid;
        else hi = mid;
    }
    const a = delta[lo];
    const b = delta[hi];
    const t = (distanceM - a.distance) / (b.distance - a.distance || 1);
    return a.delta + (b.delta - a.delta) * t;
}

/** Time gained (−) or lost (+) in each segment: the delta at its end minus the delta at its start. */
export function segmentDeltas(segments: LapSegment[], delta: DeltaPoint[]): number[] {
    return segments.map(s => deltaAt(delta, s.endM) - deltaAt(delta, s.startM));
}
