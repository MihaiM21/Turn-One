"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SectionCard } from "@/components/dashboard/simracing/section-card";
import { getSession, getLaps, SimApiError } from "@/lib/simracing/api";

/**
 * The old session-scoped comparison UI is superseded by the cross-session Analysis workspace.
 * This route now just resolves the session's track + best lap and redirects there, so old links
 * (bookmarks, the session detail page) keep working.
 */
export default function CompareSessionRedirect() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;

        Promise.all([getSession(id), getLaps(id)])
            .then(([session, laps]) => {
                if (cancelled) return;
                const valid = laps.filter(l => l.isValid && l.lapTimeMs && l.lapTimeMs > 0);
                const best = valid.length
                    ? valid.reduce((a, b) => (b.lapTimeMs! < a.lapTimeMs! ? b : a))
                    : (laps[0] ?? null);

                const query = new URLSearchParams();
                query.set("track", session.trackProfileId ?? "");
                if (best) query.set("ref", best.id);
                router.replace(`/simracing/analysis?${query.toString()}`);
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
                empty={failed ? "Couldn't load this session — try Analysis from the sidebar instead." : undefined}
            />
        </main>
    );
}
