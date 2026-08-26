"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Trophy, Users, Route, Timer, Zap } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExploreMoreLinks } from "@/components/dashboard/explore-more-links";
import { SectionCard } from "@/components/dashboard/simracing/section-card";
import { useAuth } from "@/lib/auth";
import {
    getLeaderboards,
    formatPlayTime,
    type SimLeaderboardRow,
} from "@/lib/simracing/api";

type Board = "distance" | "laps" | "speed" | "time";

const BOARDS: { key: Board; label: string; icon: typeof Route; sort: (a: SimLeaderboardRow, b: SimLeaderboardRow) => number }[] = [
    { key: "distance", label: "Distance", icon: Route, sort: (a, b) => b.totalDistanceKm - a.totalDistanceKm },
    { key: "laps", label: "Laps", icon: Timer, sort: (a, b) => b.totalLaps - a.totalLaps },
    { key: "speed", label: "Top speed", icon: Zap, sort: (a, b) => b.highestSpeedKmh - a.highestSpeedKmh },
    { key: "time", label: "Track time", icon: Users, sort: (a, b) => b.totalPlayTimeSeconds - a.totalPlayTimeSeconds },
];

/** Gold / silver / bronze for the podium, plain rows below. */
const RANK_STYLES = [
    "text-yellow-400 font-black",
    "text-zinc-300 font-black",
    "text-orange-500 font-black",
];

export default function LeaderboardsPage() {
    const { user } = useAuth();
    const [rows, setRows] = useState<SimLeaderboardRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [board, setBoard] = useState<Board>("distance");

    useEffect(() => {
        getLeaderboards()
            .then(setRows)
            .catch(() => toast.error("Couldn't load the leaderboards."))
            .finally(() => setLoading(false));
    }, []);

    const active = BOARDS.find(b => b.key === board)!;

    const sorted = useMemo(() => [...rows].sort(active.sort), [rows, active]);

    const myRank = useMemo(() => {
        if (!user?.username) return null;
        const index = sorted.findIndex(r => r.username === user.username);
        return index >= 0 ? { index, row: sorted[index] } : null;
    }, [sorted, user?.username]);

    // Only pin the user's row when it's off the visible podium area.
    const showPinnedRank = myRank != null && myRank.index >= 10;

    const primaryValue = (row: SimLeaderboardRow) => {
        switch (board) {
            case "laps":
                return row.totalLaps.toLocaleString();
            case "speed":
                return `${Math.round(row.highestSpeedKmh)} km/h`;
            case "time":
                return formatPlayTime(row.totalPlayTimeSeconds);
            default:
                return `${row.totalDistanceKm.toFixed(1)} km`;
        }
    };

    return (
        <main className="w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <PageHeader
                label="Sim racing"
                title="Global leaderboards"
                description="Every driver streaming through Turn One Link, ranked."
                stats={[
                    { icon: Users, label: "Drivers", value: rows.length },
                    {
                        icon: Trophy,
                        label: "Your rank",
                        value: myRank ? `#${myRank.index + 1}` : "—",
                        iconClassName: "text-yellow-400",
                    },
                ]}
            />

            <div className="flex gap-px overflow-x-auto bg-zinc-800 p-px">
                {BOARDS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setBoard(key)}
                        aria-pressed={board === key}
                        className={`inline-flex shrink-0 items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                            board === key
                                ? "bg-primary/15 text-primary"
                                : "bg-zinc-950 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                        }`}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            <SectionCard
                label="Standings"
                title={`Ranked by ${active.label.toLowerCase()}`}
                icon={Trophy}
                iconClassName="text-yellow-400"
                loading={loading}
                empty={!loading && rows.length === 0 ? "No driver data yet — be the first on the board." : undefined}
                emptyIcon={Trophy}
                flush
                bodyClassName="px-0 py-0"
            >
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                <th className="w-16 px-4 py-3 text-center text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500">
                                    Rank
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500">
                                    Driver
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500">
                                    {active.label}
                                </th>
                                <th className="hidden px-4 py-3 text-right text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500 md:table-cell">
                                    Sessions
                                </th>
                                <th className="hidden px-4 py-3 text-right text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500 md:table-cell">
                                    Laps
                                </th>
                                <th className="hidden px-4 py-3 text-right text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500 lg:table-cell">
                                    Track time
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((row, i) => {
                                const isMe = user?.username && row.username === user.username;
                                return (
                                    <tr
                                        key={row.userId}
                                        className={`border-b border-zinc-800/60 transition-colors hover:bg-zinc-900/60 ${
                                            isMe ? "bg-primary/5" : ""
                                        }`}
                                    >
                                        <td
                                            className={`px-4 py-3 text-center font-mono tabular-nums ${
                                                RANK_STYLES[i] ?? "text-zinc-500"
                                            }`}
                                        >
                                            {i + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`font-bold ${isMe ? "text-primary" : "text-white"}`}>
                                                {row.username}
                                            </span>
                                            {isMe ? (
                                                <span className="ml-2 border border-primary/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
                                                    You
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-primary">
                                            {primaryValue(row)}
                                        </td>
                                        <td className="hidden px-4 py-3 text-right font-mono tabular-nums text-zinc-400 md:table-cell">
                                            {row.totalSessions}
                                        </td>
                                        <td className="hidden px-4 py-3 text-right font-mono tabular-nums text-zinc-400 md:table-cell">
                                            {row.totalLaps}
                                        </td>
                                        <td className="hidden px-4 py-3 text-right font-mono tabular-nums text-zinc-400 lg:table-cell">
                                            {formatPlayTime(row.totalPlayTimeSeconds)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </SectionCard>

            {showPinnedRank ? (
                <SectionCard label="Your position" title={`#${myRank.index + 1} of ${sorted.length}`} icon={Trophy}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <span className="font-bold text-white">{myRank.row.username}</span>
                        <span className="font-mono text-lg font-black tabular-nums text-primary">
                            {primaryValue(myRank.row)}
                        </span>
                    </div>
                </SectionCard>
            ) : null}

            <ExploreMoreLinks currentPage="/simracing/leaderboards" />
        </main>
    );
}
