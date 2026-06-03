"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface LeaderboardRow {
    userId: string;
    username: string;
    totalDistanceKm: number;
    totalLaps: number;
    totalSessions: number;
    highestSpeedKmh: number;
}

function apiBase() {
    return (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api\/?$/, "");
}

export default function LeaderboardOverlayPage() {
    const [rows, setRows] = useState<LeaderboardRow[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${apiBase()}/api/telemetry/leaderboards`);
                if (res.ok) setRows((await res.json()).slice(0, 10));
            } catch {
                // intentionally silent — overlays should not surface errors to the stream
            }
        };
        fetchData();
        const id = setInterval(fetchData, 30000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="p-4 max-w-md">
            <Card className="border-primary/30 bg-black/70 backdrop-blur-md">
                <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-4 h-4 text-primary" />
                        <h2 className="text-xs font-bold uppercase tracking-widest text-white">Leaderboard</h2>
                    </div>
                    {rows.length === 0 ? (
                        <p className="text-xs text-muted-foreground font-mono">No data.</p>
                    ) : (
                        <ol className="space-y-1">
                            {rows.map((r, i) => (
                                <li key={r.userId} className="flex items-center justify-between text-sm font-mono">
                                    <span className="flex items-center gap-2">
                                        <span className="w-5 text-right text-muted-foreground">{i + 1}.</span>
                                        <span className="text-white">{r.username}</span>
                                    </span>
                                    <span className="text-primary">{r.totalDistanceKm.toFixed(1)} km</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
