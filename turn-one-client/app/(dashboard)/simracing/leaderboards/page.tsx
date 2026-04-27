"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface LeaderboardUser {
    id: string;
    username: string;
    totalDistanceKm: number;
    totalLaps: number;
    totalSessions: number;
    highestSpeedKmh: number;
    totalPlayTimeSeconds: number;
}

const RANK_STYLES = [
    { row: "bg-yellow-500/5 hover:bg-yellow-500/10", rank: "text-yellow-400 font-black", label: "1st" },
    { row: "bg-slate-400/5 hover:bg-slate-400/10", rank: "text-slate-400 font-black", label: "2nd" },
    { row: "bg-orange-700/5 hover:bg-orange-700/10", rank: "text-orange-600 font-black", label: "3rd" },
];

function getRankStyle(idx: number) {
    return RANK_STYLES[idx] ?? { row: "hover:bg-primary/5", rank: "text-muted-foreground font-mono", label: `${idx + 1}` };
}

function formatPlayTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
}

export default function LeaderboardsPage() {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboards = async () => {
            try {
                const url = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api\/?$/, "");
                const res = await fetch(`${url}/api/telemetry/leaderboards`);
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data);
                }
            } catch (err) {
                console.error("Failed to fetch leaderboards", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboards();
    }, []);

    return (
        <div className="w-full min-h-screen p-6 bg-gradient-to-br from-black via-red-950/20 to-black font-sans text-white">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        <h1 className="text-3xl font-black italic tracking-tight">GLOBAL LEADERBOARDS</h1>
                    </div>
                    <p className="text-muted-foreground text-sm ml-8">Ranked by total distance driven</p>
                </div>

                <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 shadow-xl backdrop-blur-md overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-primary/5 text-muted-foreground border-b border-primary/20">
                                    <tr>
                                        <th className="p-4 font-semibold w-16 text-center">Rank</th>
                                        <th className="p-4 font-semibold">Driver</th>
                                        <th className="p-4 font-semibold text-right">Distance</th>
                                        <th className="p-4 font-semibold text-right">Laps</th>
                                        <th className="p-4 font-semibold text-right hidden md:table-cell">Sessions</th>
                                        <th className="p-4 font-semibold text-right">Top Speed</th>
                                        <th className="p-4 font-semibold text-right hidden lg:table-cell">Track Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-primary/10">
                                    {loading && (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-slate-500 animate-pulse">
                                                Loading standings...
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && users.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-12 text-center">
                                                <Trophy className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                                                <p className="text-muted-foreground">No driver data yet. Be the first on the board!</p>
                                            </td>
                                        </tr>
                                    )}
                                    {users.map((user, idx) => {
                                        const s = getRankStyle(idx);
                                        return (
                                            <tr key={user.id} className={`transition-colors ${s.row}`}>
                                                <td className={`p-4 text-center ${s.rank}`}>{s.label}</td>
                                                <td className="p-4 font-bold text-white">{user.username}</td>
                                                <td className="p-4 text-right font-mono font-bold text-primary">
                                                    {user.totalDistanceKm.toFixed(1)}{" "}
                                                    <span className="text-xs text-muted-foreground">km</span>
                                                </td>
                                                <td className="p-4 text-right font-mono">{user.totalLaps}</td>
                                                <td className="p-4 text-right font-mono text-muted-foreground hidden md:table-cell">
                                                    {user.totalSessions}
                                                </td>
                                                <td className="p-4 text-right font-mono text-orange-400">
                                                    {Math.round(user.highestSpeedKmh)}{" "}
                                                    <span className="text-xs text-muted-foreground">km/h</span>
                                                </td>
                                                <td className="p-4 text-right font-mono text-muted-foreground hidden lg:table-cell">
                                                    {formatPlayTime(user.totalPlayTimeSeconds)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
