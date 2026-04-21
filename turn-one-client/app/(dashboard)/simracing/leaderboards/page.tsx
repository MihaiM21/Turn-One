"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface LeaderboardUser {
    id: string;
    username: string;
    totalDistanceKm: number;
    totalLaps: number;
    totalSessions: number;
    highestSpeedKmh: number;
    totalPlayTimeSeconds: number;
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

    const formatPlayTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="w-full min-h-screen p-6 bg-gradient-to-br from-black via-red-950/20 to-black font-sans text-white">
            <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
                <h1 className="text-3xl font-black italic tracking-tight mb-6">GLOBAL LEADERBOARDS</h1>

                <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 shadow-xl backdrop-blur-md">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-primary/5 text-muted-foreground border-b border-primary/20">
                                    <tr>
                                        <th className="p-4 font-semibold w-16 text-center">Rank</th>
                                        <th className="p-4 font-semibold">Driver</th>
                                        <th className="p-4 font-semibold text-right">Distance (km)</th>
                                        <th className="p-4 font-semibold text-right">Total Laps</th>
                                        <th className="p-4 font-semibold text-right">Top Speed</th>
                                        <th className="p-4 font-semibold text-right">Track Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-primary/10">
                                {loading && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500 animate-pulse">Loading standings...</td>
                                    </tr>
                                )}
                                {!loading && users.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500">No driver data found.</td>
                                    </tr>
                                )}
                                {users.map((user, idx) => (
                                    <tr key={user.id} className="hover:bg-primary/5 transition-colors">
                                        <td className="p-4 text-center font-black text-muted-foreground">{idx + 1}</td>
                                        <td className="p-4 font-bold text-white">{user.username}</td>
                                        <td className="p-4 text-right font-mono font-bold text-primary">{user.totalDistanceKm.toFixed(1)}</td>
                                        <td className="p-4 text-right font-mono">{user.totalLaps}</td>
                                        <td className="p-4 text-right font-mono text-orange-400">{Math.round(user.highestSpeedKmh)} km/h</td>
                                        <td className="p-4 text-right font-mono text-muted-foreground">{formatPlayTime(user.totalPlayTimeSeconds)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            </div>
        </div>
    );
}
