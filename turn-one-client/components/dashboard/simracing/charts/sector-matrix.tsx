"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import type { LapLike } from "@/lib/simracing/analysis";
import { sectorMatrix } from "@/lib/simracing/analysis";
import { formatLapTime } from "@/lib/simracing/api";

interface SectorMatrixTableProps {
    laps: LapLike[];
    selectedLap?: number | null;
    onSelectLap?: (lapNumber: number) => void;
}

function formatSector(ms: number | null) {
    if (ms == null || ms <= 0) return "—";
    return (ms / 1000).toFixed(3);
}

/**
 * Lap × sector grid with the session's best sectors highlighted, plus the theoretical best —
 * the lap you'd have if you strung your best sectors together.
 */
export function SectorMatrixTable({ laps, selectedLap = null, onSelectLap }: SectorMatrixTableProps) {
    const matrix = useMemo(() => sectorMatrix(laps), [laps]);

    const hasSectors = matrix.bestSectors.some(s => s != null);

    if (!matrix.laps.length) {
        return (
            <div className="flex h-32 items-center justify-center font-mono text-sm text-muted-foreground/70">
                No laps recorded yet
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {hasSectors ? (
                <div className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
                    <div className="bg-card px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Best lap</p>
                        <p className="mt-1 font-mono text-lg font-black tabular-nums text-white">
                            {formatLapTime(matrix.bestLapMs)}
                        </p>
                    </div>
                    <div className="bg-card px-4 py-3">
                        <p className="flex items-center gap-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                            <Sparkles className="h-3 w-3 text-primary" />
                            Theoretical best
                        </p>
                        <p className="mt-1 font-mono text-lg font-black tabular-nums text-primary">
                            {formatLapTime(matrix.theoreticalBestMs)}
                        </p>
                    </div>
                    <div className="bg-card px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Left on the table</p>
                        <p className="mt-1 font-mono text-lg font-black tabular-nums text-yellow-400">
                            {matrix.timeLeftOnTableMs != null
                                ? `${(matrix.timeLeftOnTableMs / 1000).toFixed(3)}s`
                                : "—"}
                        </p>
                    </div>
                </div>
            ) : (
                <p className="border border-blue-500/20 bg-blue-950/10 px-4 py-3 text-xs text-blue-300">
                    Sector times aren&apos;t available for this session, so the theoretical best can&apos;t be
                    calculated. Lap times are still shown below.
                </p>
            )}

            <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-border text-left">
                            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] font-normal text-muted-foreground">
                                Lap
                            </th>
                            <th className="px-3 py-2 text-right text-[10px] uppercase tracking-[0.2em] font-normal text-muted-foreground">
                                S1
                            </th>
                            <th className="px-3 py-2 text-right text-[10px] uppercase tracking-[0.2em] font-normal text-muted-foreground">
                                S2
                            </th>
                            <th className="px-3 py-2 text-right text-[10px] uppercase tracking-[0.2em] font-normal text-muted-foreground">
                                S3
                            </th>
                            <th className="px-3 py-2 text-right text-[10px] uppercase tracking-[0.2em] font-normal text-muted-foreground">
                                Lap time
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.laps.map(lap => (
                            <tr
                                key={lap.lapNumber}
                                onClick={() => onSelectLap?.(lap.lapNumber)}
                                className={`border-b border-border/60 transition-colors ${
                                    onSelectLap ? "cursor-pointer hover:bg-secondary/60" : ""
                                } ${selectedLap === lap.lapNumber ? "bg-secondary" : ""}`}
                            >
                                <td className="px-3 py-2">
                                    <span className="font-mono tabular-nums text-foreground/85">{lap.lapNumber}</span>
                                    {!lap.isValid ? (
                                        <span className="ml-2 border border-red-500/30 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400">
                                            Invalid
                                        </span>
                                    ) : null}
                                </td>

                                {lap.sectors.map((sector, i) => (
                                    <td
                                        key={i}
                                        className={`px-3 py-2 text-right font-mono tabular-nums ${
                                            lap.sectorIsBest[i] ? "font-bold text-purple-400" : "text-muted-foreground"
                                        }`}
                                    >
                                        {formatSector(sector)}
                                    </td>
                                ))}

                                <td
                                    className={`px-3 py-2 text-right font-mono tabular-nums font-bold ${
                                        lap.isBestLap ? "text-primary" : lap.isValid ? "text-white" : "text-muted-foreground/70"
                                    }`}
                                >
                                    {formatLapTime(lap.lapTimeMs)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {hasSectors ? (
                <p className="text-[11px] text-muted-foreground/70">
                    <span className="text-purple-400">Purple</span> marks your best time in that sector.
                </p>
            ) : null}
        </div>
    );
}
