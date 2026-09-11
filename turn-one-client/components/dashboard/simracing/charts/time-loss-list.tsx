"use client";

import { AlertTriangle, ChevronRight, Trophy } from "lucide-react";
import type { TimeLoss } from "@/lib/simracing/analysis";
import { formatDistance } from "./chart-theme";

interface TimeLossListProps {
    losses: TimeLoss[];
    /** Total delta of the lap vs the reference, in seconds. */
    totalDelta?: number | null;
    referenceLabel?: string;
    /** Clicking a row moves the shared cursor to that point on the lap. */
    onSelect?: (distance: number) => void;
}

/**
 * The point of the whole analysis stack: where the time went, in words.
 *
 * A delta trace tells you *that* you lost time; this tells you where and, from the pedal traces
 * at that point, what to try differently.
 */
export function TimeLossList({ losses, totalDelta = null, referenceLabel = "your best lap", onSelect }: TimeLossListProps) {
    if (!losses.length) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
                <Trophy className="h-8 w-8 text-zinc-700" />
                <p className="text-sm text-zinc-400">
                    {totalDelta != null && totalDelta < 0
                        ? "This is your reference lap — nothing to claw back."
                        : "No significant losses found against " + referenceLabel + "."}
                </p>
            </div>
        );
    }

    const totalLost = losses.reduce((sum, l) => sum + l.lostSeconds, 0);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-baseline gap-x-4">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Recoverable</p>
                    <p className="font-mono text-2xl font-black tabular-nums text-yellow-400">
                        {totalLost.toFixed(3)}s
                    </p>
                </div>
                <p className="text-xs text-zinc-500">
                    across {losses.length} {losses.length === 1 ? "section" : "sections"}, vs {referenceLabel}
                </p>
            </div>

            <ol className="divide-y divide-zinc-800 border-t border-zinc-800">
                {losses.map((loss, i) => {
                    const midpoint = (loss.startM + loss.endM) / 2;
                    return (
                        <li key={`${loss.startM}-${i}`}>
                            <button
                                onClick={() => onSelect?.(midpoint)}
                                disabled={!onSelect}
                                className="flex w-full items-start gap-3 px-1 py-3 text-left transition-colors enabled:hover:bg-zinc-900/60"
                            >
                                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-yellow-500/40 font-mono text-[10px] font-bold text-yellow-400">
                                    {i + 1}
                                </span>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-baseline gap-x-2">
                                        <span className="font-mono text-sm font-bold tabular-nums text-yellow-400">
                                            −{loss.lostSeconds.toFixed(3)}s
                                        </span>
                                        <span className="font-mono text-[11px] tabular-nums text-zinc-500">
                                            {formatDistance(loss.startM)} – {formatDistance(loss.endM)}
                                        </span>
                                        {loss.speedDeltaKmh < -1 ? (
                                            <span className="font-mono text-[11px] tabular-nums text-zinc-500">
                                                {loss.speedDeltaKmh.toFixed(0)} km/h
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="mt-0.5 text-xs text-zinc-400">{loss.cause}</p>
                                </div>

                                {onSelect ? (
                                    <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-zinc-700" />
                                ) : null}
                            </button>
                        </li>
                    );
                })}
            </ol>

            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-zinc-600">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                Losses are derived from the delta trace and your pedal inputs at each point. Treat them as
                pointers to look at, not gospel — traffic and track limits can distort a lap.
            </p>
        </div>
    );
}
