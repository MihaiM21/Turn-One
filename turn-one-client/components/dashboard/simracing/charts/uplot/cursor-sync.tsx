"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type uPlot from "uplot";

/**
 * How chart x values relate to distance. Charts may plot against distance (identity) or against a
 * lap's elapsed time (PBI-071); the shared cursor and zoom stay in metres either way, so the map,
 * time losses and stepper never need to know which axis the charts use.
 */
export interface AxisMap {
    kind: "distance" | "time";
    /** Metres → chart x value. */
    toX: (m: number) => number;
    /** Chart x value → metres. */
    fromX: (x: number) => number;
}

export const DISTANCE_AXIS: AxisMap = { kind: "distance", toX: m => m, fromX: x => x };

export interface CursorSyncState {
    /** Hovered distance in metres, or null when the pointer is off every chart. */
    distance: number | null;
    setDistance: (d: number | null) => void;
    /** Current x-zoom window in metres, or null for the full lap. */
    zoom: [number, number] | null;
    setZoom: (z: [number, number] | null) => void;
    /** Registers a uPlot instance so zoom changes propagate to every pane. Returns an unregister fn. */
    register: (u: uPlot) => () => void;
    /** Move every registered chart's x-scale. Safe to call from a uPlot `setScale` hook — re-entrancy is guarded. */
    applyZoom: (min: number, max: number, source?: uPlot) => void;
    resetZoom: () => void;
    /** The charts' x axis; `distance` and `zoom` are always metres. */
    axis: AxisMap;
}

const Ctx = createContext<CursorSyncState | null>(null);

/**
 * Distance-keyed cursor + zoom shared by every chart in an analysis view.
 *
 * uPlot's own `cursor.sync` moves the hover line across instances; this context adds the two things
 * it does not do: expose the hovered distance to non-uPlot components (corner table, track map,
 * time-loss list) and keep drag-zoom windows identical across panes and the delta chart.
 */
export function CursorSyncProvider({ children, axis = DISTANCE_AXIS }: { children: ReactNode; axis?: AxisMap }) {
    const axisRef = useRef(axis);
    useLayoutEffect(() => {
        axisRef.current = axis;
    }, [axis]);
    const [distance, setDistanceState] = useState<number | null>(null);
    const [zoom, setZoomState] = useState<[number, number] | null>(null);
    const instances = useRef(new Set<uPlot>());
    const applying = useRef(false);
    const rafPending = useRef<number | null>(null);
    const nextDistance = useRef<number | null>(null);

    // Hover fires per mousemove; coalesce to one React state update per frame.
    const setDistance = useCallback((d: number | null) => {
        nextDistance.current = d;
        if (rafPending.current != null) return;
        rafPending.current = requestAnimationFrame(() => {
            rafPending.current = null;
            setDistanceState(nextDistance.current);
        });
    }, []);

    /** `min`/`max` are chart x values (what uPlot hooks report); state keeps metres. */
    const applyZoom = useCallback((min: number, max: number, source?: uPlot) => {
        if (applying.current) return;
        applying.current = true;
        try {
            for (const u of instances.current) {
                if (u === source) continue;
                u.setScale("x", { min, max });
            }
        } finally {
            applying.current = false;
        }
        setZoomState([axisRef.current.fromX(min), axisRef.current.fromX(max)]);
    }, []);

    const resetZoom = useCallback(() => {
        applying.current = true;
        try {
            for (const u of instances.current) {
                const x = u.data[0];
                if (!x?.length) continue;
                u.setScale("x", { min: x[0], max: x[x.length - 1] });
            }
        } finally {
            applying.current = false;
        }
        setZoomState(null);
    }, []);

    const setZoom = useCallback(
        (z: [number, number] | null) => {
            if (z) applyZoom(axisRef.current.toX(z[0]), axisRef.current.toX(z[1]));
            else resetZoom();
        },
        [applyZoom, resetZoom]
    );

    const register = useCallback((u: uPlot) => {
        instances.current.add(u);
        return () => {
            instances.current.delete(u);
        };
    }, []);

    const value = useMemo<CursorSyncState>(
        () => ({ distance, setDistance, zoom, setZoom, register, applyZoom, resetZoom, axis }),
        [distance, setDistance, zoom, setZoom, register, applyZoom, resetZoom, axis]
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const noop: CursorSyncState = {
    distance: null,
    setDistance: () => {},
    zoom: null,
    setZoom: () => {},
    register: () => () => {},
    applyZoom: () => {},
    resetZoom: () => {},
    axis: DISTANCE_AXIS,
};

/** Falls back to a no-op state so a chart can render outside a provider (previews, share cards). */
export function useCursorSync(): CursorSyncState {
    return useContext(Ctx) ?? noop;
}
