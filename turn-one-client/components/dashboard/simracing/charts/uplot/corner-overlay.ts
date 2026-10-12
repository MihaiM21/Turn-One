import type uPlot from "uplot";
import { CORNER_BAND, UPLOT_FONT } from "./uplot-theme";

/** The subset of a corner the charts need to draw it. Structurally compatible with `LapCornerDto`. */
export interface OverlayCorner {
    index: number;
    refIndex?: number | null;
    name?: string | null;
    direction: number;
    entryM: number;
    apexM: number;
    exitM: number;
    brakingPointM?: number | null;
    throttleOnM?: number | null;
}

export interface CornerOverlayOptions {
    corners: OverlayCorner[];
    /** Draw corner numbers along the top edge. */
    labels?: boolean;
    /** Per-lap braking points to tick on the x axis: one array per lap, colour per lap. */
    brakingMarkers?: { color: string; corners: OverlayCorner[] }[];
}

/** Human label for a corner: "T5" from the reference index when matched, else the lap-local index. */
export function cornerLabel(c: OverlayCorner) {
    if (c.name) return c.name;
    const n = (c.refIndex ?? c.index) + 1;
    return `T${n}`;
}

/**
 * uPlot plugin that shades corner bands (entry→exit) under the series, optionally numbers them and
 * ticks each lap's braking point on the bottom edge. Drawn on the `draw` hook so it sits above the
 * grid and below the cursor.
 */
export function cornerOverlayPlugin(get: () => CornerOverlayOptions): uPlot.Plugin {
    return {
        hooks: {
            drawClear: [
                (u: uPlot) => {
                    const { corners, labels } = get();
                    if (!corners.length) return;
                    const ctx = u.ctx;
                    const { left, top, width, height } = u.bbox;
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(left, top, width, height);
                    ctx.clip();

                    for (const c of corners) {
                        const x0 = u.valToPos(c.entryM, "x", true);
                        const x1 = u.valToPos(c.exitM, "x", true);
                        if (x1 < left || x0 > left + width) continue;
                        ctx.fillStyle = c.direction < 0 ? CORNER_BAND.left : CORNER_BAND.right;
                        ctx.fillRect(x0, top, Math.max(1, x1 - x0), height);
                    }

                    if (labels) {
                        ctx.font = UPLOT_FONT;
                        ctx.fillStyle = CORNER_BAND.label;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "top";
                        const dpr = devicePixelRatio || 1;
                        for (const c of corners) {
                            const xa = u.valToPos(c.apexM, "x", true);
                            if (xa < left || xa > left + width) continue;
                            ctx.fillText(cornerLabel(c), xa, top + 4 * dpr);
                        }
                    }
                    ctx.restore();
                },
            ],
            draw: [
                (u: uPlot) => {
                    const { brakingMarkers } = get();
                    if (!brakingMarkers?.length) return;
                    const ctx = u.ctx;
                    const { left, top, width, height } = u.bbox;
                    const dpr = devicePixelRatio || 1;
                    ctx.save();
                    ctx.lineWidth = 2 * dpr;
                    brakingMarkers.forEach((lap, li) => {
                        ctx.strokeStyle = lap.color;
                        const yBase = top + height - (2 + li * 5) * dpr;
                        for (const c of lap.corners) {
                            if (c.brakingPointM == null) continue;
                            const x = u.valToPos(c.brakingPointM, "x", true);
                            if (x < left || x > left + width) continue;
                            ctx.beginPath();
                            ctx.moveTo(x, yBase);
                            ctx.lineTo(x, yBase - 8 * dpr);
                            ctx.stroke();
                        }
                    });
                    ctx.restore();
                },
            ],
        },
    };
}
