"use client";

import { Check, X } from "lucide-react";

export interface LapSummary {
    lapNumber: number;
    lapTimeMs: number | null;
    isValid: boolean;
}

interface LapSelectorProps {
    laps: LapSummary[];
    selected: number | null;
    onSelect: (lap: number | null) => void;
}

function formatLapTime(ms: number | null) {
    if (ms == null || ms <= 0) return "—";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${m}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

export function LapSelector({ laps, selected, onSelect }: LapSelectorProps) {
    if (!laps.length) {
        return (
            <p className="text-muted-foreground font-mono text-xs">No laps recorded for this session yet.</p>
        );
    }

    const best = laps
        .filter(l => l.isValid && l.lapTimeMs && l.lapTimeMs > 0)
        .reduce<number | null>((acc, l) => (acc === null || l.lapTimeMs! < acc ? l.lapTimeMs! : acc), null);

    return (
        <div className="flex gap-2 overflow-x-auto pb-2">
            <button
                onClick={() => onSelect(null)}
                className={`shrink-0 px-3 py-2 text-xs font-bold rounded-md border transition-colors ${
                    selected === null
                        ? "bg-primary/20 text-white border-primary/40"
                        : "bg-black/40 text-muted-foreground border-white/10 hover:text-white"
                }`}
            >
                All Laps
            </button>
            {laps.map(lap => {
                const active = selected === lap.lapNumber;
                const isBest = best != null && lap.lapTimeMs === best;
                return (
                    <button
                        key={lap.lapNumber}
                        onClick={() => onSelect(lap.lapNumber)}
                        className={`shrink-0 flex flex-col items-start gap-0.5 px-3 py-2 rounded-md border transition-colors ${
                            active
                                ? "bg-primary/20 border-primary/40 text-white"
                                : isBest
                                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200 hover:text-white"
                                  : "bg-black/40 border-white/10 text-muted-foreground hover:text-white"
                        }`}
                    >
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                            Lap {lap.lapNumber}
                            {lap.isValid ? (
                                <Check className="w-3 h-3 text-emerald-400/70" />
                            ) : (
                                <X className="w-3 h-3 text-red-400/70" />
                            )}
                        </span>
                        <span className="font-mono text-xs">{formatLapTime(lap.lapTimeMs)}</span>
                    </button>
                );
            })}
        </div>
    );
}
