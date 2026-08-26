"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Eye, MapPin, Car, Flag, Radio, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExploreMoreLinks } from "@/components/dashboard/explore-more-links";
import { SectionCard } from "@/components/dashboard/simracing/section-card";
import { PlanGate } from "@/components/dashboard/simracing/plan-gate";
import { getLiveSessions, SimApiError, type SimSession } from "@/lib/simracing/api";

const REFRESH_MS = 10_000;

export default function SpectatePage() {
    const [sessions, setSessions] = useState<SimSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchLive = async () => {
            try {
                const data = await getLiveSessions();
                if (!cancelled) setSessions(data);
            } catch (err) {
                // 403 is the plan gate, which PlanGate already communicates — don't toast on a poll.
                if (!(err instanceof SimApiError)) console.error("Failed to fetch live streams", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchLive();
        const interval = setInterval(fetchLive, REFRESH_MS);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    return (
        <main className="w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <PageHeader
                label="Sim racing"
                title="Live streams"
                description="Public sessions streaming right now. Refreshes every 10 seconds."
                stats={[
                    {
                        icon: Radio,
                        label: "Live now",
                        value: sessions.length,
                        iconClassName: sessions.length ? "text-primary" : "text-zinc-600",
                    },
                ]}
            />

            <PlanGate
                required="PRO"
                title="Spectate live sessions"
                description="Watch any driver's live cockpit — speed, pedals, tyres and lap times, in real time."
            >
                {loading ? (
                    <SectionCard loading />
                ) : sessions.length === 0 ? (
                    <SectionCard
                        emptyIcon={Eye}
                        empty={
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-white">Nobody&apos;s live right now</p>
                                <p className="text-xs text-zinc-500">
                                    Check back later — or make your own session public and let others watch you.
                                </p>
                            </div>
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {sessions.map(s => (
                            <Link
                                key={s.id}
                                href={`/simracing/spectate/${s.id}`}
                                className="group flex flex-col border border-zinc-800 bg-zinc-950 transition-colors hover:border-primary/40"
                            >
                                <div className="flex items-start justify-between gap-2 border-b border-zinc-800 px-5 py-4">
                                    <div className="min-w-0">
                                        <h3 className="truncate text-sm font-bold text-white">
                                            {s.driverName || s.track}
                                        </h3>
                                        <p className="mt-0.5 text-xs text-zinc-500">
                                            Started {formatDistanceToNow(new Date(s.startedAt))} ago
                                        </p>
                                    </div>
                                    <span className="inline-flex shrink-0 items-center gap-1.5 border border-primary/40 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                                        Live
                                    </span>
                                </div>

                                <dl className="space-y-2 px-5 py-4">
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                                        <dt className="w-10 text-[11px] uppercase tracking-wider text-zinc-500">Track</dt>
                                        <dd className="truncate font-semibold text-white">{s.track}</dd>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Car className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                                        <dt className="w-10 text-[11px] uppercase tracking-wider text-zinc-500">Car</dt>
                                        <dd className="truncate font-semibold text-white">{s.carModel}</dd>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Flag className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                                        <dt className="w-10 text-[11px] uppercase tracking-wider text-zinc-500">Laps</dt>
                                        <dd className="font-mono font-bold tabular-nums text-primary">{s.lapCount}</dd>
                                    </div>
                                </dl>

                                <div className="mt-auto flex items-center justify-between border-t border-zinc-800 px-5 py-3">
                                    <span className="text-xs font-bold text-zinc-400 transition-colors group-hover:text-primary">
                                        Watch cockpit
                                    </span>
                                    <ArrowRight className="h-3.5 w-3.5 text-zinc-700 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </PlanGate>

            <ExploreMoreLinks currentPage="/simracing/spectate" />
        </main>
    );
}
