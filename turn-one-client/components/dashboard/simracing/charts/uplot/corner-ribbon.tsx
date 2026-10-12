"use client";

import { useCallback, useMemo } from "react";
import type uPlot from "uplot";
import { cornerLabel, type OverlayCorner } from "./corner-overlay";
import { CORNER_BAND, CURSOR_BASE, PANE_LAYOUT, UPLOT_FONT } from "./uplot-theme";
import { useUPlot } from "./use-uplot";
import { useLatest } from "./use-latest";
import { wheelZoomPlugin } from "./wheel-zoom";

export interface CornerRibbonProps {
    x: Float32Array | number[];
    corners: OverlayCorner[];
    /** Sector split distances in metres (S1|S2, S2|S3, …). */
    sectorBoundariesM?: number[];
    height?: number;
}

/**
 * The landmark strip that sits above the stacked traces: sector splits and numbered corner bands on
 * the same distance axis, in the same cursor/zoom group. Keeping labels here (instead of inside the
 * first pane) means no pane ever has text colliding with its data or axis ticks.
 */
export function CornerRibbon({ x, corners, sectorBoundariesM = [], height = PANE_LAYOUT.ribbonHeight }: CornerRibbonProps) {
    const cornersRef = useLatest(corners);
    const sectorsRef = useLatest(sectorBoundariesM);

    const data = useMemo<uPlot.AlignedData>(() => {
        const xs = Array.from(x);
        return [xs, xs.map(() => null)] as uPlot.AlignedData;
    }, [x]);

    const buildOptions = useCallback(
        (): Omit<uPlot.Options, "width" | "height"> => ({
            padding: [0, PANE_LAYOUT.padRight, 0, 0],
            legend: { show: false },
            cursor: { ...CURSOR_BASE, points: { show: false } },
            scales: { x: { time: false }, y: { range: [0, 1] } },
            axes: [
                { show: false, size: 0 },
                { show: false, size: PANE_LAYOUT.axisWidth },
            ],
            series: [{ label: "Distance" }, { label: "", points: { show: false }, stroke: "transparent" }],
            plugins: [wheelZoomPlugin(), ribbonPlugin(() => ({ corners: cornersRef.current, sectors: sectorsRef.current }))],
        }),
        [cornersRef, sectorsRef]
    );

    const { containerRef } = useUPlot({ buildOptions, data, height, deps: [] });

    return (
        <div className="border-b border-zinc-800 bg-zinc-950/80">
            <div ref={containerRef} className="w-full" style={{ height }} />
        </div>
    );
}

function ribbonPlugin(get: () => { corners: OverlayCorner[]; sectors: number[] }): uPlot.Plugin {
    return {
        hooks: {
            draw: [
                (u: uPlot) => {
                    const { corners, sectors } = get();
                    const ctx = u.ctx;
                    const { left, top, width, height } = u.bbox;
                    const dpr = devicePixelRatio || 1;
                    const xMin = u.scales.x.min ?? 0;
                    const xMax = u.scales.x.max ?? 0;

                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(left, top, width, height);
                    ctx.clip();
                    ctx.font = UPLOT_FONT;
                    ctx.textBaseline = "middle";

                    // Sector splits: dashed dividers with the sector name at the left of each block.
                    const splits = [...sectors].filter(s => Number.isFinite(s)).sort((a, b) => a - b);
                    if (splits.length) {
                        ctx.strokeStyle = CORNER_BAND.sector;
                        ctx.fillStyle = CORNER_BAND.sectorLabel;
                        ctx.lineWidth = 1 * dpr;
                        ctx.setLineDash([3 * dpr, 3 * dpr]);
                        ctx.textAlign = "left";
                        const starts = [xMin, ...splits];
                        starts.forEach((s, i) => {
                            const px = u.valToPos(Math.max(s, xMin), "x", true);
                            if (i > 0 && px >= left && px <= left + width) {
                                ctx.beginPath();
                                ctx.moveTo(px, top);
                                ctx.lineTo(px, top + height);
                                ctx.stroke();
                            }
                            const end = i < splits.length ? splits[i] : xMax;
                            if (end > xMin && s < xMax) ctx.fillText(`S${i + 1}`, Math.max(px, left) + 4 * dpr, top + height * 0.28);
                        });
                        ctx.setLineDash([]);
                    }

                    // Corner bands with their numbers on the lower half.
                    ctx.textAlign = "center";
                    for (const c of corners) {
                        const x0 = u.valToPos(c.entryM, "x", true);
                        const x1 = u.valToPos(c.exitM, "x", true);
                        if (x1 < left || x0 > left + width) continue;
                        ctx.fillStyle = c.direction < 0 ? CORNER_BAND.left : CORNER_BAND.right;
                        ctx.fillRect(x0, top + height * 0.5, Math.max(1, x1 - x0), height * 0.5);
                        ctx.fillStyle = CORNER_BAND.label;
                        const xa = u.valToPos(c.apexM, "x", true);
                        ctx.fillText(cornerLabel(c), xa, top + height * 0.75);
                    }
                    ctx.restore();
                },
            ],
        },
    };
}
