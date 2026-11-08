"use client";

import { Check, X } from "lucide-react";
import { formatLapTime } from "@/lib/simracing/api";

export interface LapSummary {
    lapNumber: number;
    lapTimeMs: number | null;
    isValid: boolean;
}

interface LapSelectorProps {
    laps: LapSummary[];
    selected: number | null;
    onSelect: (lap: number | null) => void;
    /** Hide the "All laps" option where a specific lap is required (delta, analysis). */
    requireLap?: boolean;
}

export function LapSelector({ laps, selected, onSelect, requireLap = false }: LapSelectorProps) {
    if (!laps.length) {
        return <p className="font-mono text-xs text-muted-foreground/70">No laps recorded for this session yet.</p>;
    }

    const best = laps
        .filter(l => l.isValid && l.lapTimeMs && l.lapTimeMs > 0)
        .reduce<number | null>((acc, l) => (acc === null || l.lapTimeMs! < acc ? l.lapTimeMs! : acc), null);

    return (
        <div className="flex gap-px overflow-x-auto bg-border p-px">
            {!requireLap ? (
                <button
                    onClick={() => onSelect(null)}
                    aria-pressed={selected === null}
                    className={`shrink-0 px-4 py-2 text-xs font-bold transition-colors ${
                        selected === null
                            ? "bg-primary/15 text-primary"
                            : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground/85"
                    }`}
                >
                    All laps
                </button>
            ) : null}

            {laps.map(lap => {
                const active = selected === lap.lapNumber;
                const isBest = best != null && lap.isValid && lap.lapTimeMs === best;
                return (
                    <button
                        key={lap.lapNumber}
                        onClick={() => onSelect(lap.lapNumber)}
                        aria-pressed={active}
                        className={`flex shrink-0 flex-col items-start gap-0.5 px-4 py-2 transition-colors ${
                            active
                                ? "bg-primary/15 text-primary"
                                : "bg-card text-muted-foreground hover:bg-secondary hover:text-white"
                        }`}
                    >
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                            Lap {lap.lapNumber}
                            {lap.isValid ? (
                                <Check className="h-3 w-3 text-green-500/70" />
                            ) : (
                                <X className="h-3 w-3 text-red-500/70" />
                            )}
                        </span>
                        <span
                            className={`font-mono text-xs tabular-nums ${
                                isBest && !active ? "font-bold text-primary" : ""
                            }`}
                        >
                            {formatLapTime(lap.lapTimeMs)}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
