"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
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
    ArrowRight,
    CheckSquare,
    Square,
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
import { SIM_SOURCE_LABEL, type SimSource } from "@/lib/simracing/protocol";

type SortKey = "newest" | "bestLap";
type SourceFilter = "all" | SimSource;

const SOURCE_FILTERS: { key: SourceFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "Acc", label: "ACC" },
    { key: "Ac", label: "AC" },
    { key: "IRacing", label: "iRacing" },
    { key: "F1_25", label: "F1 25" },
    { key: "F1_26", label: "F1 26" },
];

const SESSION_TYPE_COLORS: Record<string, string> = {
    RACE: "border-primary/30 bg-primary/10 text-primary",
    QUALIFY: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    PRACTICE: "border-blue-500/30 bg-blue-500/10 text-blue-400",
};

/** ACC reports types as "AC_PRACTICE" / "AC_RACE"; show the readable half. */
function shortType(sessionType: string) {
    return (sessionType || "").replace(/^AC_/, "").toUpperCase() || "SESSION";
}

interface TrackGroup {
    key: string;
    trackName: string;
    source?: SimSource;
    trackProfileId: string | null;
    sessions: SimSession[];
    bestLapMs: number | null;
}

function groupByTrack(sessions: SimSession[]): TrackGroup[] {
    const map = new Map<string, TrackGroup>();
    for (const s of sessions) {
        const key = s.trackId ?? s.track ?? "unknown";
        let group = map.get(key);
        if (!group) {
            group = { key, trackName: s.track, source: s.source, trackProfileId: s.trackProfileId ?? null, sessions: [], bestLapMs: null };
            map.set(key, group);
        }
        group.sessions.push(s);
        if (!group.trackProfileId && s.trackProfileId) group.trackProfileId = s.trackProfileId;
    }
    for (const group of map.values()) {
        group.sessions.sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
        const times = group.sessions.map(s => s.bestLapMs).filter(ms => ms > 0);
        group.bestLapMs = times.length ? Math.min(...times) : null;
    }
    return [...map.values()];
}

export default function MySessionsPage() {
    const [sessions, setSessions] = useState<SimSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortKey>("newest");
    const [source, setSource] = useState<SourceFilter>("all");
    const [deleting, setDeleting] = useState<string | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);

    useEffect(() => {
        getMySessions()
            .then(setSessions)
            .catch(err => {
                console.error("Failed to fetch sessions", err);
                toast.error("Couldn't load your sessions.");
            })
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return sessions.filter(s => {
            if (source !== "all" && s.source !== source) return false;
            if (!q) return true;
            return s.track?.toLowerCase().includes(q) || s.carModel?.toLowerCase().includes(q);
        });
    }, [sessions, query, source]);

    const groups = useMemo(() => {
        const built = groupByTrack(filtered);
        const sorted = [...built];
        if (sort === "bestLap") {
            sorted.sort((a, b) => (a.bestLapMs || Infinity) - (b.bestLapMs || Infinity));
        } else {
            sorted.sort((a, b) => +new Date(b.sessions[0]?.startedAt ?? 0) - +new Date(a.sessions[0]?.startedAt ?? 0));
        }
        return sorted;
    }, [filtered, sort]);

    const totalLaps = useMemo(() => sessions.reduce((sum, s) => sum + s.lapCount, 0), [sessions]);
    const overallBest = useMemo(() => {
        const times = sessions.map(s => s.bestLapMs).filter(ms => ms > 0);
        return times.length ? Math.min(...times) : null;
    }, [sessions]);

    const toggleSelected = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleDelete = async (session: SimSession) => {
        if (!confirm(`Delete the ${session.track} session and all of its laps? This can't be undone.`)) return;

        setDeleting(session.id);
        try {
            await deleteSessionApi(session.id);
            setSessions(prev => prev.filter(s => s.id !== session.id));
            setSelected(prev => {
                const next = new Set(prev);
                next.delete(session.id);
                return next;
            });
            toast.success("Session deleted.");
        } catch {
            toast.error("Couldn't delete that session.");
        } finally {
            setDeleting(null);
        }
    };

    const handleBulkDelete = async () => {
        const ids = [...selected];
        if (!ids.length) return;
        if (!confirm(`Delete ${ids.length} session${ids.length === 1 ? "" : "s"} and all of their laps? This can't be undone.`)) return;

        setBulkDeleting(true);
        let succeeded = 0;
        let failed = 0;
        for (const id of ids) {
            try {
                await deleteSessionApi(id);
                succeeded++;
            } catch {
                failed++;
            }
        }
        setSessions(prev => prev.filter(s => !ids.includes(s.id)));
        setSelected(new Set());
        setBulkDeleting(false);

        if (failed === 0) toast.success(`Deleted ${succeeded} session${succeeded === 1 ? "" : "s"}.`);
        else toast.error(`Deleted ${succeeded}, failed to delete ${failed}.`);
    };

    return (
        <main className="w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <PageHeader
                label="Sim racing"
                title="My sessions"
                description="Every stint you've recorded, grouped by track, with lap counts and personal bests."
                stats={[
                    { icon: Flag, label: "Sessions", value: sessions.length },
                    { icon: Timer, label: "Laps", value: totalLaps },
                    { icon: Gauge, label: "Best lap", value: formatLapTime(overallBest) },
                ]}
            />

            {!loading && sessions.length > 0 ? (
                <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
                            <input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Filter by track or car"
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
                                <option value="newest">Newest track activity</option>
                                <option value="bestLap">Fastest lap</option>
                            </select>
                        </div>

                        {selected.size > 0 ? (
                            <button
                                type="button"
                                onClick={handleBulkDelete}
                                disabled={bulkDeleting}
                                className="inline-flex h-9 shrink-0 items-center gap-1.5 border border-red-500/40 bg-red-950/20 px-3 text-xs font-bold uppercase tracking-wide text-red-400 transition-colors hover:bg-red-950/40 disabled:opacity-50"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete selected ({selected.size})
                            </button>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {SOURCE_FILTERS.map(f => (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => setSource(f.key)}
                                aria-pressed={source === f.key}
                                className={`h-7 border px-2.5 text-[11px] font-bold transition-colors ${
                                    source === f.key
                                        ? "border-primary/50 bg-primary/10 text-primary"
                                        : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
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
            ) : groups.length === 0 ? (
                <SectionCard emptyIcon={Search} empty={`Nothing matches "${query}".`} />
            ) : (
                <div className="space-y-4">
                    {groups.map(group => (
                        <SectionCard
                            key={group.key}
                            label={group.source ? SIM_SOURCE_LABEL[group.source] : undefined}
                            title={group.trackName || "Unknown track"}
                            actions={
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-[11px] tabular-nums text-zinc-500">
                                        {group.sessions.length} session{group.sessions.length === 1 ? "" : "s"} · best{" "}
                                        <span className="text-primary">{formatLapTime(group.bestLapMs)}</span>
                                    </span>
                                    {group.trackProfileId ? (
                                        <Link
                                            href={`/simracing/analysis?track=${group.trackProfileId}`}
                                            className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 transition-colors hover:text-primary"
                                        >
                                            Analyse this track
                                            <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    ) : null}
                                </div>
                            }
                            flush
                        >
                            <div className="divide-y divide-zinc-800/60">
                                {group.sessions.map(s => {
                                    const typeKey = s.sessionKind ?? shortType(s.sessionType);
                                    const typeColor =
                                        SESSION_TYPE_COLORS[typeKey.toUpperCase()] ?? "border-zinc-700 bg-zinc-900 text-zinc-400";
                                    const isSelected = selected.has(s.id);
                                    return (
                                        <div
                                            key={s.id}
                                            className="flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-900/40"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleSelected(s.id)}
                                                aria-label={isSelected ? "Deselect session" : "Select session"}
                                                className="shrink-0 text-zinc-600 transition-colors hover:text-zinc-300"
                                            >
                                                {isSelected ? (
                                                    <CheckSquare className="h-4 w-4 text-primary" />
                                                ) : (
                                                    <Square className="h-4 w-4" />
                                                )}
                                            </button>

                                            <span className="flex w-36 shrink-0 items-center gap-1.5 text-[11px] text-zinc-500">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(s.startedAt), "MMM d, yyyy · HH:mm")}
                                            </span>

                                            <span className="min-w-0 flex-1 truncate text-sm text-white">{s.carModel}</span>

                                            <span
                                                className={`shrink-0 border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${typeColor}`}
                                            >
                                                {typeKey}
                                            </span>

                                            {s.isActive ? (
                                                <span className="shrink-0 border border-primary/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
                                                    Live
                                                </span>
                                            ) : null}

                                            {group.source ? (
                                                <span className="shrink-0 border border-zinc-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                                                    {SIM_SOURCE_LABEL[group.source]}
                                                </span>
                                            ) : null}

                                            <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-400">
                                                {s.lapCount} laps
                                            </span>

                                            <span className="w-20 shrink-0 text-right font-mono text-sm font-bold tabular-nums text-primary">
                                                {formatLapTime(s.bestLapMs)}
                                            </span>

                                            <div className="flex shrink-0 items-center gap-1">
                                                {s.trackProfileId ? (
                                                    <Link
                                                        href={`/simracing/analysis?track=${s.trackProfileId}`}
                                                        className="inline-flex h-7 items-center gap-1 px-2 text-[11px] font-bold text-zinc-400 transition-colors hover:text-primary"
                                                    >
                                                        Analyse
                                                    </Link>
                                                ) : null}
                                                <Link
                                                    href={`/simracing/sessions/${s.id}`}
                                                    className="inline-flex h-7 items-center gap-1 px-2 text-[11px] font-bold text-zinc-400 transition-colors hover:text-primary"
                                                >
                                                    Open
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(s)}
                                                    disabled={deleting === s.id}
                                                    aria-label={`Delete ${s.track} session`}
                                                    className="inline-flex h-7 w-7 items-center justify-center text-zinc-600 transition-colors hover:text-red-500 disabled:opacity-40"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </SectionCard>
                    ))}
                </div>
            )}

            <ExploreMoreLinks currentPage="/simracing/sessions" />
        </main>
    );
}
