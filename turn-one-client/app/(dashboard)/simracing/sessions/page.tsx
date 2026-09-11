"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import {
    Clock,
    Flag,
    ChevronRight,
    Gauge,
    Trash2,
    Search,
    ArrowUpDown,
    Timer,
    Download,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExploreMoreLinks } from "@/components/dashboard/explore-more-links";
import { SectionCard } from "@/components/dashboard/simracing/section-card";
import {
    getMySessions,
    deleteSession as deleteSessionApi,
    formatLapTime,
    type SimSession,
} from "@/lib/simracing/api";

type SortKey = "recent" | "bestLap" | "laps" | "track";

const SESSION_TYPE_COLORS: Record<string, string> = {
    RACE: "border-primary/30 bg-primary/10 text-primary",
    QUALIFY: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    PRACTICE: "border-blue-500/30 bg-blue-500/10 text-blue-400",
};

/** ACC reports types as "AC_PRACTICE" / "AC_RACE"; show the readable half. */
function shortType(sessionType: string) {
    return (sessionType || "").replace(/^AC_/, "").toUpperCase() || "SESSION";
}

export default function MySessionsPage() {
    const [sessions, setSessions] = useState<SimSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortKey>("recent");
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        getMySessions()
            .then(setSessions)
            .catch(err => {
                console.error("Failed to fetch sessions", err);
                toast.error("Couldn't load your sessions.");
            })
            .finally(() => setLoading(false));
    }, []);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        const filtered = q
            ? sessions.filter(
                  s =>
                      s.track?.toLowerCase().includes(q) ||
                      s.carModel?.toLowerCase().includes(q) ||
                      shortType(s.sessionType).toLowerCase().includes(q)
              )
            : sessions;

        const sorted = [...filtered];
        switch (sort) {
            case "bestLap":
                // Sessions with no timed lap sink to the bottom rather than sorting as "fastest".
                sorted.sort((a, b) => (a.bestLapMs || Infinity) - (b.bestLapMs || Infinity));
                break;
            case "laps":
                sorted.sort((a, b) => b.lapCount - a.lapCount);
                break;
            case "track":
                sorted.sort((a, b) => (a.track || "").localeCompare(b.track || ""));
                break;
            default:
                sorted.sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
        }
        return sorted;
    }, [sessions, query, sort]);

    const totalLaps = useMemo(() => sessions.reduce((sum, s) => sum + s.lapCount, 0), [sessions]);
    const overallBest = useMemo(() => {
        const times = sessions.map(s => s.bestLapMs).filter(ms => ms > 0);
        return times.length ? Math.min(...times) : null;
    }, [sessions]);

    const handleDelete = async (session: SimSession) => {
        if (!confirm(`Delete the ${session.track} session and all of its laps? This can't be undone.`)) return;

        setDeleting(session.id);
        try {
            await deleteSessionApi(session.id);
            setSessions(prev => prev.filter(s => s.id !== session.id));
            toast.success("Session deleted.");
        } catch {
            toast.error("Couldn't delete that session.");
        } finally {
            setDeleting(null);
        }
    };

    return (
        <main className="w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <PageHeader
                label="Sim racing"
                title="My sessions"
                description="Every stint you've recorded, with lap counts and personal bests."
                stats={[
                    { icon: Flag, label: "Sessions", value: sessions.length },
                    { icon: Timer, label: "Laps", value: totalLaps },
                    { icon: Gauge, label: "Best lap", value: formatLapTime(overallBest) },
                ]}
            />

            {!loading && sessions.length > 0 ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Filter by track, car or session type"
                            className="h-9 w-full border border-zinc-800 bg-zinc-950 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-primary/40 focus:outline-none"
                        />
                    </div>

                    <div className="relative">
                        <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value as SortKey)}
                            className="h-9 w-full appearance-none border border-zinc-800 bg-zinc-950 pl-9 pr-8 text-sm text-white focus:border-primary/40 focus:outline-none sm:w-52"
                        >
                            <option value="recent">Most recent</option>
                            <option value="bestLap">Fastest lap</option>
                            <option value="laps">Most laps</option>
                            <option value="track">Track name</option>
                        </select>
                    </div>
                </div>
            ) : null}

            {loading ? (
                <SectionCard loading />
            ) : sessions.length === 0 ? (
                <SectionCard
                    emptyIcon={Gauge}
                    empty={
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-bold text-white">No sessions recorded yet</p>
                                <p className="mt-1 text-xs text-zinc-500">
                                    Install Turn One Link, launch ACC and complete a lap — your session shows up here
                                    automatically.
                                </p>
                            </div>
                            <Link
                                href="/simracing/download"
                                className="inline-flex h-9 items-center gap-2 bg-primary px-5 text-xs font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Get Turn One Link
                            </Link>
                        </div>
                    }
                />
            ) : visible.length === 0 ? (
                <SectionCard emptyIcon={Search} empty={`Nothing matches "${query}".`} />
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {visible.map(s => {
                        const typeKey = shortType(s.sessionType);
                        const typeColor = SESSION_TYPE_COLORS[typeKey] ?? "border-zinc-700 bg-zinc-900 text-zinc-400";
                        return (
                            <div
                                key={s.id}
                                className="group flex flex-col border border-zinc-800 bg-zinc-950 transition-colors hover:border-zinc-700"
                            >
                                <div className="flex items-start justify-between gap-2 border-b border-zinc-800 px-5 py-4">
                                    <div className="min-w-0">
                                        <h3 className="truncate text-sm font-bold leading-tight text-white">{s.track}</h3>
                                        <p className="mt-0.5 truncate text-xs text-zinc-500">{s.carModel}</p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        {s.isActive ? (
                                            <span className="border border-primary/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
                                                Live
                                            </span>
                                        ) : null}
                                        <span
                                            className={`border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${typeColor}`}
                                        >
                                            {typeKey}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-px bg-zinc-800">
                                    <div className="bg-zinc-950 px-4 py-3">
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Laps</p>
                                        <p className="mt-1 font-mono text-sm font-bold tabular-nums text-white">
                                            {s.lapCount}
                                        </p>
                                    </div>
                                    <div className="bg-zinc-950 px-4 py-3">
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Best</p>
                                        <p className="mt-1 font-mono text-sm font-bold tabular-nums text-primary">
                                            {formatLapTime(s.bestLapMs)}
                                        </p>
                                    </div>
                                    <div className="bg-zinc-950 px-4 py-3">
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">When</p>
                                        <p className="mt-1 font-mono text-xs tabular-nums text-zinc-300">
                                            {formatDistanceToNow(new Date(s.startedAt))} ago
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-auto flex items-center justify-between gap-2 border-t border-zinc-800 px-5 py-3">
                                    <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(s.startedAt), "MMM d, yyyy · HH:mm")}
                                    </span>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleDelete(s)}
                                            disabled={deleting === s.id}
                                            aria-label={`Delete ${s.track} session`}
                                            className="inline-flex h-7 w-7 items-center justify-center text-zinc-600 transition-colors hover:text-red-500 disabled:opacity-40"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                        <Link
                                            href={`/simracing/sessions/${s.id}`}
                                            className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 transition-colors hover:text-primary"
                                        >
                                            Analyse
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ExploreMoreLinks currentPage="/simracing/sessions" />
        </main>
    );
}
