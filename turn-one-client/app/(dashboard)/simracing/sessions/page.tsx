"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { Clock, Flag, Layers, ChevronRight, Gauge } from "lucide-react";

interface SessionDto {
    id: string;
    carModel: string;
    track: string;
    driverName: string;
    sessionType: string;
    mode: number;
    visibility: number;
    isActive: boolean;
    lapCount: number;
    startedAt: string;
    endedAt?: string;
}

const SESSION_TYPE_COLORS: Record<string, string> = {
    RACE: "bg-primary/10 text-primary border-primary/30",
    QUALIFY: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    PRACTICE: "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

export default function MySessionsPage() {
    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const token = localStorage.getItem("token");
                const url = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api\/?$/, "");
                const res = await fetch(`${url}/api/telemetry/sessions/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setSessions(data);
                }
            } catch (err) {
                console.error("Failed to fetch sessions", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, []);

    return (
        <div className="w-full min-h-screen p-6 bg-gradient-to-br from-black via-red-950/20 to-black font-sans text-white">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <Layers className="w-5 h-5 text-primary" />
                        <h1 className="text-3xl font-black italic tracking-tight">MY SESSIONS</h1>
                    </div>
                    <p className="text-muted-foreground text-sm ml-8">Your complete racing history</p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-52 rounded-xl bg-black/40 border border-primary/10 animate-pulse" />
                        ))}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-primary/20 border-dashed rounded-xl bg-black/40 backdrop-blur-md">
                        <Gauge className="w-12 h-12 text-muted-foreground/40 mb-4" />
                        <p className="text-muted-foreground font-medium text-lg mb-2">No sessions recorded yet</p>
                        <p className="text-sm text-slate-500">Connect the Turn One Link and complete a lap to get started!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessions.map(s => {
                            const typeKey = s.sessionType?.toUpperCase() || "";
                            const typeColor = SESSION_TYPE_COLORS[typeKey] ?? "bg-primary/10 text-primary border-primary/30";
                            return (
                                <Card
                                    key={s.id}
                                    className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 shadow-xl backdrop-blur-md hover:border-primary/50 hover:shadow-primary/10 transition-all duration-200 group overflow-hidden"
                                >
                                    <CardContent className="p-0">
                                        <div className="p-5 border-b border-primary/10">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-lg text-white leading-tight">{s.track}</h3>
                                                <span className={`text-[10px] px-2 py-1 rounded border font-black tracking-widest whitespace-nowrap ml-2 ${typeColor}`}>
                                                    {typeKey || "SESSION"}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground text-sm truncate">{s.carModel}</p>
                                        </div>

                                        <div className="px-5 py-4 grid grid-cols-2 gap-3">
                                            <div className="flex items-center gap-2">
                                                <Flag className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                <div>
                                                    <div className="text-[10px] text-muted-foreground">Laps</div>
                                                    <div className="font-mono font-bold text-white text-sm">{s.lapCount}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                <div>
                                                    <div className="text-[10px] text-muted-foreground">When</div>
                                                    <div className="font-mono text-white text-xs">{formatDistanceToNow(new Date(s.startedAt))} ago</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-5 pb-4 flex items-center justify-between">
                                            <span className="text-[11px] text-muted-foreground">
                                                {format(new Date(s.startedAt), "MMM d, yyyy · HH:mm")}
                                            </span>
                                            <Link
                                                href={`/simracing/sessions/${s.id}`}
                                                className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-white transition-colors duration-200"
                                            >
                                                View Laps <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
