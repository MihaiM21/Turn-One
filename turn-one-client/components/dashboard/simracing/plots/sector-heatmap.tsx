"use client";

import { useMemo } from "react";
import { deltaToColor } from "@/lib/color-scale";
import { formatLapTime } from "@/lib/simracing/api";
import type { SimPlotContext } from "@/lib/simracing/plot-catalog";

/**
 * Lap × sector grid, coloured by each sector's delta to the best sector time recorded by any of
 * the selected laps — an adaptation of the F1 race-pace heatmap to a single driver's own laps.
 */
export function SectorHeatmapPlot({ ctx }: { ctx: SimPlotContext }) {
    const { overlay, colors, labels } = ctx;

    const { rows, sectorCount, bestPerSector, maxAbs } = useMemo(() => {
        const sectorCount = overlay.laps.reduce((n, l) => Math.max(n, l.sectorsMs.length), 0);
        const bestPerSector = Array.from({ length: sectorCount }, (_, i) => {
            const times = overlay.laps
                .map(l => l.sectorsMs[i])
                .filter((t): t is number => typeof t === "number" && t > 0);
            return times.length ? Math.min(...times) : null;
        });

        const rows = overlay.laps.map(lap => ({
            lapId: lap.lapId,
            lapNumber: lap.lapNumber,
            sectors: lap.sectorsMs,
        }));

        let maxAbs = 1;
        for (const row of rows) {
            row.sectors.forEach((s, i) => {
                const best = bestPerSector[i];
                if (typeof s === "number" && best != null) maxAbs = Math.max(maxAbs, Math.abs(s - best));
            });
        }

        return { rows, sectorCount, bestPerSector, maxAbs };
    }, [overlay]);

    if (!rows.length || !sectorCount) {
        return (
            <div className="flex h-32 items-center justify-center font-mono text-sm text-zinc-600">
                No sector data for these laps
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="overflow-x-auto border border-zinc-800">
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-zinc-800 text-left">
                            <th className="bg-zinc-950 px-3 py-2 text-[10px] uppercase tracking-[0.2em] font-normal text-zinc-500">
                                Lap
                            </th>
                            {Array.from({ length: sectorCount }, (_, i) => (
                                <th key={i} className="bg-zinc-950 px-3 py-2 text-right text-[10px] uppercase tracking-[0.2em] font-normal text-zinc-500">
                                    S{i + 1}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => (
                            <tr key={row.lapId} className="border-b border-zinc-900">
                                <td className="px-3 py-1.5 font-mono font-bold" style={{ color: colors[row.lapId] }}>
                                    {labels[row.lapId] ?? `Lap ${row.lapNumber}`}
                                </td>
                                {Array.from({ length: sectorCount }, (_, i) => {
                                    const value = row.sectors[i];
                                    const best = bestPerSector[i];
                                    const isBest = typeof value === "number" && best != null && value === best;
                                    const bg =
                                        typeof value === "number" && best != null
                                            ? deltaToColor(value - best, maxAbs)
                                            : "#27272a";
                                    return (
                                        <td
                                            key={i}
                                            className="px-3 py-1.5 text-right font-mono tabular-nums text-white"
                                            style={{ backgroundColor: bg }}
                                        >
                                            {typeof value === "number" ? (value / 1000).toFixed(3) : "—"}
                                            {isBest ? <span className="ml-1 text-[9px] text-white/80">•</span> : null}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5" style={{ backgroundColor: deltaToColor(-maxAbs, maxAbs) }} />
                    Fastest
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5" style={{ backgroundColor: deltaToColor(maxAbs, maxAbs) }} />
                    Slowest
                </span>
                <span>Best lap time: {formatLapTime(Math.min(...overlay.laps.map(l => l.lapTimeMs ?? Infinity)))}</span>
            </div>
        </div>
    );
}
