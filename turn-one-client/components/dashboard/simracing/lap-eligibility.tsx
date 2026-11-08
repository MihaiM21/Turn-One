"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Trophy, XCircle } from "lucide-react";
import { SectionCard } from "@/components/dashboard/simracing/section-card";
import { getSessionValidations, reasonLabel, type LapEligibility } from "@/lib/simracing/leaderboards";

/**
 * Which laps of a session count for the leaderboards, and why the others don't (HCR-009). Hidden
 * until the session has at least one validated lap.
 */
export function LapEligibility({ sessionId }: { sessionId: string }) {
    const [laps, setLaps] = useState<LapEligibility[]>([]);

    useEffect(() => {
        let cancelled = false;
        getSessionValidations(sessionId)
            .then(rows => !cancelled && setLaps(rows))
            .catch(() => !cancelled && setLaps([]));
        return () => {
            cancelled = true;
        };
    }, [sessionId]);

    if (laps.length === 0) return null;
    const ranked = laps.filter(l => l.eligible).length;

    return (
        <SectionCard label="Leaderboards" title={`${ranked} of ${laps.length} laps count`} icon={Trophy} iconClassName="text-yellow-400" flush>
            <ul className="divide-y divide-border/60">
                {laps.map(l => (
                    <li key={l.lapId} className="flex items-start gap-3 px-5 py-2 text-sm">
                        {l.eligible ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-label="Counts" />
                        ) : (
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" aria-label="Doesn't count" />
                        )}
                        <span className="w-14 shrink-0 font-mono text-muted-foreground">Lap {l.lapNumber}</span>
                        <span className={l.eligible ? "text-foreground/85" : "text-muted-foreground"}>
                            {l.eligible ? "Counts for the leaderboard" : l.reasons.map(reasonLabel).join(" · ")}
                        </span>
                    </li>
                ))}
            </ul>
        </SectionCard>
    );
}
