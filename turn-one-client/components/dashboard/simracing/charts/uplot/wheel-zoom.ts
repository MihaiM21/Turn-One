import type uPlot from "uplot";

export interface WheelZoomOptions {
    /** Zoom factor per wheel notch. 0.85 = 15 % tighter per notch in. */
    factor?: number;
    /** Narrowest window allowed, in x units (metres). */
    minSpanX?: number;
}

/**
 * Mouse-wheel navigation on the distance axis, the way desktop telemetry tools do it:
 * Ctrl/⌘ + wheel zooms about the cursor, Shift + wheel (or a horizontal wheel/trackpad swipe) pans.
 * A plain wheel is left alone so the page still scrolls. The resulting `setScale("x")` flows through
 * the shared cursor-sync group, so every pane and the delta chart follow.
 */
export function wheelZoomPlugin(opts: WheelZoomOptions = {}): uPlot.Plugin {
    const factor = opts.factor ?? 0.85;
    const minSpan = opts.minSpanX ?? 50;

    let bound: { over: HTMLElement; onWheel: (e: WheelEvent) => void } | null = null;

    return {
        hooks: {
            destroy: [() => bound?.over.removeEventListener("wheel", bound.onWheel)],
            ready: [
                (u: uPlot) => {
                    const over = u.over;
                    const onWheel = (e: WheelEvent) => {
                        const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
                        const wantsZoom = e.ctrlKey || e.metaKey;
                        const wantsPan = e.shiftKey || horizontal;
                        if (!wantsZoom && !wantsPan) return;
                        e.preventDefault();

                        const x = u.data[0];
                        if (!x.length) return;
                        const dataMin = x[0];
                        const dataMax = x[x.length - 1];
                        const { min, max } = u.scales.x;
                        if (min == null || max == null) return;
                        const span = max - min;

                        if (wantsZoom) {
                            const rect = over.getBoundingClientRect();
                            const cursorX = u.posToVal(e.clientX - rect.left, "x");
                            const frac = Math.min(1, Math.max(0, (cursorX - min) / span));
                            const zoomIn = e.deltaY < 0;
                            let nextSpan = zoomIn ? span * factor : span / factor;
                            nextSpan = Math.max(minSpan, Math.min(dataMax - dataMin, nextSpan));
                            let nMin = cursorX - frac * nextSpan;
                            let nMax = nMin + nextSpan;
                            if (nMin < dataMin) { nMin = dataMin; nMax = dataMin + nextSpan; }
                            if (nMax > dataMax) { nMax = dataMax; nMin = dataMax - nextSpan; }
                            u.setScale("x", { min: nMin, max: nMax });
                            return;
                        }

                        // Pan: only meaningful when zoomed in.
                        if (span >= dataMax - dataMin) return;
                        const delta = horizontal ? e.deltaX : e.deltaY;
                        const shift = Math.sign(delta) * span * 0.1;
                        let nMin = min + shift;
                        let nMax = max + shift;
                        if (nMin < dataMin) { nMin = dataMin; nMax = dataMin + span; }
                        if (nMax > dataMax) { nMax = dataMax; nMin = dataMax - span; }
                        u.setScale("x", { min: nMin, max: nMax });
                    };
                    over.addEventListener("wheel", onWheel, { passive: false });
                    bound = { over, onWheel };
                },
            ],
        },
    };
}
