"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SectionCard } from "@/components/dashboard/simracing/section-card";
import { getLaps, SimApiError } from "@/lib/simracing/api";

/**
 * Old comparison links. The session workbench compares any two laps of a session in place
 * (PBI-068), so this route opens it with the latest valid non-best lap against the best lap.
 */
export default function CompareSessionRedirect() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;

        getLaps(id)
            .then(laps => {
                if (cancelled) return;
                const valid = laps.filter(l => l.isValid && l.lapTimeMs && l.lapTimeMs > 0);
                const best = valid.length ? valid.reduce((a, b) => (b.lapTimeMs! < a.lapTimeMs! ? b : a)) : (laps[0] ?? null);
                const timed = [...laps].reverse().filter(l => l.lapNumber !== best?.lapNumber && (l.lapTimeMs ?? 0) > 0);
                const other = timed.find(l => l.isValid) ?? timed[0] ?? best;

                const query = new URLSearchParams();
                if (other) query.set("lap", String(other.lapNumber));
                if (best) query.set("ref", String(best.lapNumber));
                router.replace(`/simracing/sessions/${id}?${query.toString()}`);
            })
            .catch(err => {
                if (cancelled) return;
                if (!(err instanceof SimApiError)) console.error(err);
                setFailed(true);
            });

        return () => {
            cancelled = true;
        };
    }, [id, router]);

    return (
        <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <SectionCard
                loading={!failed}
                empty={failed ? "Couldn't load this session — open it from My sessions instead." : undefined}
            />
        </main>
    );
}
