"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
    Activity,
    Sparkles,
    Radio,
    Eye,
    Trophy,
    Gauge,
    Flag,
    Clock,
    GitCompareArrows,
    ArrowRight,
    TimerReset,
    Zap,
    Megaphone,
} from "lucide-react";

interface MyStats {
    totalSessions: number;
    activeSessions: number;
    totalLaps: number;
    totalDistanceKm: number;
    totalPlayTimeSeconds: number;
    highestSpeedKmh: number;
    lastSessionAt: string | null;
    bestLap: {
        lapTimeMs: number | null;
        track: string;
        carModel: string;
        lapNumber: number;
        sessionId: string;
    } | null;
}

interface SessionDto {
    id: string;
    carModel: string;
    track: string;
    sessionType: string;
    isActive: boolean;
    lapCount: number;
    bestLapMs: number;
    startedAt: string;
}

interface LeaderboardRow {
    userId: string;
    username: string;
    totalDistanceKm: number;
    totalLaps: number;
}

function apiBase() {
    return (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api\/?$/, "");
}

function authHeaders(): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatLapTime(ms: number | null) {
    if (ms == null || ms <= 0) return "—";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${m}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

function formatPlayTime(seconds: number) {
    if (seconds < 60) return `${seconds}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

const NEWS = [
    {
        tag: "New",
        title: "Multi-channel telemetry & lap comparison",
        detail: "Overlay throttle, brake, steering and more — and compare any two sessions side-by-side.",
        href: "/simracing/sessions",
    },
    {
        tag: "New",
        title: "AI Coach",
        detail: "Get instant tips on braking, throttle, and consistency. Chat with the coach about any lap.",
        href: "/simracing/coach",
    },
    {
        tag: "New",
        title: "Streamer Mode",
        detail: "OBS-ready transparent overlays with shareable tokens for cockpit, lap times, and leaderboard.",
        href: "/simracing/streamer",
    },
];

export default function SimracingDashboard() {
    const [stats, setStats] = useState<MyStats | null>(null);
    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);

    useEffect(() => {
        const url = apiBase();
        (async () => {
            const [statsRes, sessionsRes, lbRes] = await Promise.all([
                fetch(`${url}/api/telemetry/me/stats`, { headers: authHeaders() }),
                fetch(`${url}/api/telemetry/sessions/me`, { headers: authHeaders() }),
                fetch(`${url}/api/telemetry/leaderboards`),
            ]);
            if (statsRes.ok) setStats(await statsRes.json());
            if (sessionsRes.ok) setSessions((await sessionsRes.json()).slice(0, 5));
            if (lbRes.ok) setLeaderboard((await lbRes.json()).slice(0, 5));
        })();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white">
            <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-5">
                <section className="border-b border-zinc-800/70 pb-5 animate-in fade-in duration-500">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Sim racing</p>
                            <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-3">
                                <Gauge className="h-6 w-6 text-primary" />
                                Dashboard
                            </h1>
                            <p className="mt-2 text-xs text-zinc-500 max-w-xl">
                                Pro telemetry, AI coaching, and streamer-ready overlays.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/simracing/live"
                                className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-primary/50 bg-primary/10 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                            >
                                <Activity className="h-3.5 w-3.5" />
                                Live Cockpit
                            </Link>
                            <QuickLink href="/simracing/coach" icon={Sparkles} label="AI Coach" />
                            <QuickLink href="/simracing/sessions" icon={Flag} label="Sessions" />
                            <QuickLink href="/simracing/streamer" icon={Radio} label="Streamer" />
                            <QuickLink href="/simracing/spectate" icon={Eye} label="Spectate" />
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-px overflow-hidden border border-zinc-800 bg-zinc-800 lg:grid-cols-4">
                    <Stat icon={Flag} label="Sessions" value={stats ? stats.totalSessions.toString() : "—"} sub={stats?.activeSessions ? `${stats.activeSessions} live` : undefined} />
                    <Stat icon={TimerReset} label="Total laps" value={stats ? stats.totalLaps.toString() : "—"} />
                    <Stat icon={Zap} label="Top speed" value={stats ? `${Math.round(stats.highestSpeedKmh)} km/h` : "—"} />
                    <Stat icon={Clock} label="Time on track" value={stats ? formatPlayTime(stats.totalPlayTimeSeconds) : "—"} sub={stats?.lastSessionAt ? `Last ${formatDistanceToNow(new Date(stats.lastSessionAt))} ago` : undefined} />
                </section>

                {stats?.bestLap?.lapTimeMs ? (
                    <section className="border border-zinc-800 bg-zinc-950">
                        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                            <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-yellow-500/80" />
                                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Personal best</p>
                            </div>
                            <Link
                                href={`/simracing/sessions/${stats.bestLap.sessionId}`}
                                className="inline-flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-primary"
                            >
                                View session <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="px-5 py-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                            <div>
                                <p className="font-mono text-4xl font-bold tabular-nums text-primary">
                                    {formatLapTime(stats.bestLap.lapTimeMs)}
                                </p>
                                <p className="mt-1 text-xs text-zinc-500">
                                    Lap {stats.bestLap.lapNumber} · {stats.bestLap.track} · {stats.bestLap.carModel}
                                </p>
                            </div>
                        </div>
                    </section>
                ) : null}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
                    <section className="border border-zinc-800 bg-zinc-950">
                        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Recent sessions</p>
                                <p className="mt-0.5 font-bold">Your activity</p>
                            </div>
                            <Link href="/simracing/sessions" className="inline-flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-primary">
                                View all <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                        {sessions.length === 0 ? (
                            <p className="px-5 py-6 text-sm text-zinc-500 font-mono">No sessions yet. Start a session in your sim to see it here.</p>
                        ) : (
                            <div className="divide-y divide-zinc-800/60">
                                {sessions.map(s => (
                                    <Link
                                        key={s.id}
                                        href={`/simracing/sessions/${s.id}`}
                                        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-900/60"
                                    >
                                        <Activity className="h-4 w-4 shrink-0 text-zinc-500" />
                                        <span className="w-32 shrink-0 text-[11px] uppercase tracking-wider text-zinc-500 truncate">
                                            {format(new Date(s.startedAt), "MMM d, HH:mm")}
                                        </span>
                                        <span className="truncate text-sm font-medium text-white">{s.track}</span>
                                        {s.isActive ? (
                                            <span className="rounded-sm border border-primary/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
                                                Live
                                            </span>
                                        ) : null}
                                        <span className="ml-auto font-mono text-sm tabular-nums text-primary shrink-0">
                                            {s.bestLapMs > 0 ? formatLapTime(s.bestLapMs) : `${s.lapCount} laps`}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="border border-zinc-800 bg-zinc-950">
                        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                            <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-yellow-500/80" />
                                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Top drivers</p>
                            </div>
                            <Link href="/simracing/leaderboards" className="inline-flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-primary">
                                Full <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                        {leaderboard.length === 0 ? (
                            <p className="px-5 py-6 text-sm text-zinc-500 font-mono">No data.</p>
                        ) : (
                            <div className="divide-y divide-zinc-800/60">
                                {leaderboard.map((r, i) => (
                                    <div key={r.userId} className="flex items-center gap-3 px-5 py-3">
                                        <span className="w-5 shrink-0 text-right font-mono text-xs text-zinc-500">{i + 1}.</span>
                                        <span className="truncate text-sm text-white">{r.username}</span>
                                        <span className="ml-auto font-mono text-sm tabular-nums text-primary">{r.totalDistanceKm.toFixed(0)} km</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <section className="border border-zinc-800 bg-zinc-950">
                    <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                        <div className="flex items-center gap-2">
                            <Megaphone className="h-4 w-4 text-primary" />
                            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">What&apos;s new</p>
                        </div>
                    </div>
                    <div className="divide-y divide-zinc-800/60">
                        {NEWS.map(n => (
                            <Link
                                key={n.title}
                                href={n.href}
                                className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-zinc-900/60"
                            >
                                <span className="rounded-sm border border-primary/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary shrink-0 mt-0.5">
                                    {n.tag}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-white">{n.title}</p>
                                    <p className="mt-0.5 text-xs text-zinc-500">{n.detail}</p>
                                </div>
                                <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-zinc-600" />
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-px overflow-hidden border border-zinc-800 bg-zinc-800 sm:grid-cols-2 lg:grid-cols-4">
                    <ActionTile href="/simracing/coach" icon={Sparkles} title="AI Coach" detail="Tips & chat for any lap" />
                    <ActionTile href="/simracing/streamer" icon={Radio} title="Streamer Mode" detail="OBS overlay links" />
                    <ActionTile href="/simracing/spectate" icon={Eye} title="Watch Live" detail="Active community sessions" />
                    <ActionTile href="/simracing/sessions" icon={GitCompareArrows} title="Compare Laps" detail="Overlay any two sessions" />
                </section>
            </main>
        </div>
    );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
    return (
        <Link
            href={href}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-zinc-800 bg-zinc-900/60 px-3 text-xs text-zinc-300 transition-colors hover:border-primary/40 hover:bg-zinc-900 hover:text-primary"
        >
            <Icon className="h-3.5 w-3.5" />
            {label}
        </Link>
    );
}

function Stat({
    icon: Icon,
    label,
    value,
    sub,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    sub?: string;
}) {
    return (
        <div className="bg-zinc-950 px-5 py-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                <Icon className="h-3 w-3" />
                {label}
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-white">{value}</p>
            {sub ? <p className="mt-0.5 text-[10px] text-zinc-500">{sub}</p> : null}
        </div>
    );
}

function ActionTile({
    href,
    icon: Icon,
    title,
    detail,
}: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    detail: string;
}) {
    return (
        <Link href={href} className="group bg-zinc-950 px-5 py-4 transition-colors hover:bg-zinc-900/60">
            <div className="flex items-center gap-2 text-primary">
                <Icon className="h-4 w-4" />
                <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{title}</p>
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">{detail}</p>
        </Link>
    );
}
