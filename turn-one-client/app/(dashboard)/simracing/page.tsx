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
    Download,
    Wifi,
    WifiOff,
    Route,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExploreMoreLinks } from "@/components/dashboard/explore-more-links";
import { SectionCard, StatStrip, Stat } from "@/components/dashboard/simracing/section-card";
import { SETUP_STEPS } from "@/components/turn-one-link/setup-content";
import {
    getMyStats,
    getMySessions,
    getLeaderboards,
    formatLapTime,
    formatPlayTime,
    type SimStats,
    type SimSession,
    type SimLeaderboardRow,
} from "@/lib/simracing/api";

export default function SimracingDashboard() {
    const [stats, setStats] = useState<SimStats | null>(null);
    const [sessions, setSessions] = useState<SimSession[]>([]);
    const [leaderboard, setLeaderboard] = useState<SimLeaderboardRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.allSettled([getMyStats(), getMySessions(), getLeaderboards()])
            .then(([s, sess, lb]) => {
                if (s.status === "fulfilled") setStats(s.value);
                if (sess.status === "fulfilled") setSessions(sess.value);
                if (lb.status === "fulfilled") setLeaderboard(lb.value.slice(0, 5));
            })
            .finally(() => setLoading(false));
    }, []);

    const latest = sessions.length
        ? [...sessions].sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt))[0]
        : null;
    const isLive = sessions.some(s => s.isActive);
    const hasEverConnected = sessions.length > 0;

    return (
        <main className="w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <PageHeader
                label="Sim racing"
                title="Cockpit"
                description="Live telemetry, lap analysis, AI coaching and streamer overlays for your own driving."
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/simracing/live"
                            className="inline-flex h-8 items-center gap-1.5 border border-primary/50 bg-primary/10 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                        >
                            <Activity className="h-3.5 w-3.5" />
                            Live cockpit
                        </Link>
                        <QuickLink href="/simracing/sessions" icon={Flag} label="Sessions" />
                        <QuickLink href="/simracing/coach" icon={Sparkles} label="Coach" />
                        <QuickLink href="/simracing/leaderboards" icon={Trophy} label="Ranks" />
                    </div>
                }
            />

            {/* Connection strip — the first thing that matters, since nothing works without Link. */}
            {!loading ? (
                <div
                    className={`flex flex-wrap items-center justify-between gap-3 border px-5 py-3 ${
                        isLive
                            ? "border-green-500/30 bg-green-950/20"
                            : hasEverConnected
                              ? "border-zinc-800 bg-zinc-950"
                              : "border-yellow-500/30 bg-yellow-950/10"
                    }`}
                >
                    <div className="flex items-center gap-3">
                        {isLive ? (
                            <Wifi className="h-4 w-4 shrink-0 text-green-500" />
                        ) : (
                            <WifiOff className="h-4 w-4 shrink-0 text-zinc-500" />
                        )}
                        <div>
                            <p className="text-sm font-bold text-white">
                                {isLive
                                    ? "Turn One Link is streaming"
                                    : hasEverConnected
                                      ? "Turn One Link is offline"
                                      : "Turn One Link not connected yet"}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-500">
                                {isLive
                                    ? "Your live cockpit is receiving telemetry."
                                    : latest
                                      ? `Last session ${formatDistanceToNow(new Date(latest.startedAt))} ago${
                                            latest.clientVersion ? ` · v${latest.clientVersion.replace(/^v/, "")}` : ""
                                        }`
                                      : "Install the desktop app to start recording your laps."}
                            </p>
                        </div>
                    </div>

                    <Link
                        href={isLive ? "/simracing/live" : "/simracing/download"}
                        className={`inline-flex h-8 items-center gap-1.5 px-4 text-xs font-bold uppercase tracking-wide transition-colors ${
                            hasEverConnected
                                ? "border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-primary/40 hover:text-primary"
                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                    >
                        {isLive ? (
                            <>
                                <Activity className="h-3.5 w-3.5" />
                                Open cockpit
                            </>
                        ) : (
                            <>
                                <Download className="h-3.5 w-3.5" />
                                {hasEverConnected ? "Manage Link" : "Get Turn One Link"}
                            </>
                        )}
                    </Link>
                </div>
            ) : null}

            {/* First run: show the setup path instead of a wall of zeroes. */}
            {!loading && !hasEverConnected ? (
                <SectionCard label="Get started" title="Four steps to your first lap" icon={Download}>
                    <ol className="divide-y divide-zinc-800">
                        {SETUP_STEPS.map((step, i) => {
                            const StepIcon = step.icon;
                            return (
                                <li key={step.title} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-primary/40 font-mono text-[10px] font-bold text-primary">
                                        {i + 1}
                                    </span>
                                    <div className="min-w-0 space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <StepIcon className="h-3.5 w-3.5 text-primary" />
                                            <p className="text-xs font-bold uppercase tracking-tight text-white">
                                                {step.title}
                                            </p>
                                        </div>
                                        <p className="text-xs text-zinc-500">{step.description}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </SectionCard>
            ) : null}

            <StatStrip>
                <Stat
                    icon={Flag}
                    label="Sessions"
                    value={stats ? stats.totalSessions.toString() : "—"}
                    sub={stats?.activeSessions ? `${stats.activeSessions} live` : undefined}
                />
                <Stat icon={TimerReset} label="Total laps" value={stats ? stats.totalLaps.toString() : "—"} />
                <Stat
                    icon={Zap}
                    label="Top speed"
                    value={stats ? `${Math.round(stats.highestSpeedKmh)} km/h` : "—"}
                />
                <Stat
                    icon={Clock}
                    label="Time on track"
                    value={stats ? formatPlayTime(stats.totalPlayTimeSeconds) : "—"}
                    sub={
                        stats?.lastSessionAt
                            ? `Last ${formatDistanceToNow(new Date(stats.lastSessionAt))} ago`
                            : undefined
                    }
                />
            </StatStrip>

            {stats?.bestLap?.lapTimeMs ? (
                <SectionCard
                    label="Personal best"
                    title={`${stats.bestLap.track} · ${stats.bestLap.carModel}`}
                    icon={Trophy}
                    iconClassName="text-yellow-400"
                    actions={
                        <Link
                            href={`/simracing/sessions/${stats.bestLap.sessionId}`}
                            className="inline-flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-primary"
                        >
                            Analyse <ArrowRight className="h-3 w-3" />
                        </Link>
                    }
                >
                    <p className="font-mono text-4xl font-black tabular-nums text-primary">
                        {formatLapTime(stats.bestLap.lapTimeMs)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">Lap {stats.bestLap.lapNumber}</p>
                </SectionCard>
            ) : null}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
                <SectionCard
                    label="Recent sessions"
                    title="Your activity"
                    icon={Activity}
                    loading={loading}
                    empty={
                        !loading && sessions.length === 0
                            ? "No sessions yet. Start a session in ACC with Link running and it'll show up here."
                            : undefined
                    }
                    emptyIcon={Flag}
                    actions={
                        <Link
                            href="/simracing/sessions"
                            className="inline-flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-primary"
                        >
                            View all <ArrowRight className="h-3 w-3" />
                        </Link>
                    }
                    flush
                >
                    <div className="divide-y divide-zinc-800/60">
                        {sessions.slice(0, 5).map(s => (
                            <Link
                                key={s.id}
                                href={`/simracing/sessions/${s.id}`}
                                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-900/60"
                            >
                                <Activity className="h-4 w-4 shrink-0 text-zinc-600" />
                                <span className="w-32 shrink-0 truncate text-[11px] uppercase tracking-wider text-zinc-500">
                                    {format(new Date(s.startedAt), "MMM d, HH:mm")}
                                </span>
                                <span className="truncate text-sm font-medium text-white">{s.track}</span>
                                {s.isActive ? (
                                    <span className="border border-primary/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
                                        Live
                                    </span>
                                ) : null}
                                <span className="ml-auto shrink-0 font-mono text-sm tabular-nums text-primary">
                                    {s.bestLapMs > 0 ? formatLapTime(s.bestLapMs) : `${s.lapCount} laps`}
                                </span>
                            </Link>
                        ))}
                    </div>
                </SectionCard>

                <SectionCard
                    label="Top drivers"
                    title="By distance"
                    icon={Trophy}
                    iconClassName="text-yellow-400"
                    loading={loading}
                    empty={!loading && leaderboard.length === 0 ? "No data yet." : undefined}
                    emptyIcon={Trophy}
                    actions={
                        <Link
                            href="/simracing/leaderboards"
                            className="inline-flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-primary"
                        >
                            Full board <ArrowRight className="h-3 w-3" />
                        </Link>
                    }
                    flush
                >
                    <div className="divide-y divide-zinc-800/60">
                        {leaderboard.map((r, i) => (
                            <div key={r.userId} className="flex items-center gap-3 px-5 py-3">
                                <span className="w-5 shrink-0 text-right font-mono text-xs tabular-nums text-zinc-500">
                                    {i + 1}
                                </span>
                                <span className="truncate text-sm text-white">{r.username}</span>
                                <span className="ml-auto font-mono text-sm tabular-nums text-primary">
                                    {r.totalDistanceKm.toFixed(0)} km
                                </span>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </div>

            <section className="grid grid-cols-1 gap-px overflow-hidden border border-zinc-800 bg-zinc-800 sm:grid-cols-2 lg:grid-cols-4">
                <ActionTile
                    href="/simracing/coach"
                    icon={Sparkles}
                    title="AI Coach"
                    detail="Where you're losing time, in plain language"
                />
                <ActionTile
                    href="/simracing/sessions"
                    icon={GitCompareArrows}
                    title="Compare laps"
                    detail="Delta traces on a distance axis"
                />
                <ActionTile href="/simracing/streamer" icon={Radio} title="Streamer mode" detail="OBS-ready overlays" />
                <ActionTile href="/simracing/spectate" icon={Eye} title="Watch live" detail="Public sessions on track now" />
            </section>

            <ExploreMoreLinks currentPage="/simracing" />
        </main>
    );
}

function QuickLink({
    href,
    icon: Icon,
    label,
}: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
}) {
    return (
        <Link
            href={href}
            className="inline-flex h-8 items-center gap-1.5 border border-zinc-800 bg-zinc-900/60 px-3 text-xs text-zinc-300 transition-colors hover:border-primary/40 hover:text-primary"
        >
            <Icon className="h-3.5 w-3.5" />
            {label}
        </Link>
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
                <p className="text-sm font-bold text-white transition-colors group-hover:text-primary">{title}</p>
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">{detail}</p>
        </Link>
    );
}
