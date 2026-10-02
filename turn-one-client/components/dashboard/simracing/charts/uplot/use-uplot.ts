"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type uPlot from "uplot";
import { useCursorSync } from "./cursor-sync";
import { useLatest } from "./use-latest";

type UPlotCtor = typeof uPlot;

let ctorPromise: Promise<UPlotCtor> | null = null;

/** uPlot touches `document` at construction, so it is loaded on the client only. */
export function loadUPlot(): Promise<UPlotCtor> {
    if (!ctorPromise) ctorPromise = import("uplot").then(m => m.default);
    return ctorPromise;
}

export interface UseUPlotOptions {
    /** Builds the options for a given width. Called once per (re)creation. */
    buildOptions: (width: number, height: number) => Omit<uPlot.Options, "width" | "height">;
    data: uPlot.AlignedData;
    height: number;
    /** Recreate the chart (not just setData) when any of these change — series count, axes, etc. */
    deps?: unknown[];
    /** Called with the hovered x value (or null) on cursor moves; wired into the shared cursor sync. */
    onCursor?: (x: number | null, u: uPlot) => void;
}

/**
 * Owns one uPlot instance: creates it inside the returned container ref, resizes with the container,
 * pushes new `data` via `setData`, participates in the shared cursor/zoom group, and destroys on unmount.
 */
export function useUPlot({ buildOptions, data, height, deps = [], onCursor }: UseUPlotOptions) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const plotRef = useRef<uPlot | null>(null);
    const [ready, setReady] = useState(false);
    const sync = useCursorSync();
    const onCursorRef = useLatest(onCursor);
    const dataRef = useLatest(data);
    const buildRef = useLatest(buildOptions);
    const syncRef = useLatest(sync);

    // Create / recreate. `deps` is the caller's recreate list; options/sync are read through refs.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        let cancelled = false;
        let unregister: (() => void) | null = null;

        loadUPlot().then(UPlot => {
            if (cancelled || !containerRef.current) return;
            const width = Math.max(120, containerRef.current.clientWidth);
            const base = buildRef.current(width, height);
            const hooks: uPlot.Hooks.Arrays = { ...(base.hooks ?? {}) };

            const setCursor = (u: uPlot) => {
                const idx = u.cursor.idx;
                const x = idx == null || idx < 0 ? null : (u.data[0][idx] ?? null);
                onCursorRef.current?.(x, u);
                syncRef.current.setDistance(x);
            };
            hooks.setCursor = [...(hooks.setCursor ?? []), setCursor];

            // Propagate drag-zoom to the rest of the group.
            const setScale = (u: uPlot, key: string) => {
                if (key !== "x") return;
                const { min, max } = u.scales.x;
                if (min == null || max == null) return;
                const x = u.data[0];
                const full = x.length && min <= x[0] && max >= x[x.length - 1];
                if (full) syncRef.current.setZoom(null);
                else syncRef.current.applyZoom(min, max, u);
            };
            hooks.setScale = [...(hooks.setScale ?? []), setScale];

            const u = new UPlot({ ...base, width, height, hooks }, dataRef.current, el);
            plotRef.current = u;
            unregister = syncRef.current.register(u);
            setReady(true);
        });

        return () => {
            cancelled = true;
            unregister?.();
            plotRef.current?.destroy();
            plotRef.current = null;
            setReady(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [height, ...deps]);

    // Data updates.
    useEffect(() => {
        const u = plotRef.current;
        if (!u || !ready) return;
        u.setData(data, false);
        // Keep the current zoom if one is active, else show the whole lap.
        const x = data[0];
        if (x.length) {
            const z = sync.zoom;
            u.setScale("x", z ? { min: z[0], max: z[1] } : { min: x[0], max: x[x.length - 1] });
        }
    }, [data, ready, sync.zoom]);

    // Resize with the container.
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            const u = plotRef.current;
            if (!u) return;
            const w = Math.max(120, Math.floor(entries[0].contentRect.width));
            if (w !== u.width) u.setSize({ width: w, height });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [height, ready]);

    return { containerRef, plotRef, ready };
}
