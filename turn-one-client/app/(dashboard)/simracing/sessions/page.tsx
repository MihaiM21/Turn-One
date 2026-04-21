"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";

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

export default function MySessionsPage() {
    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const token = localStorage.getItem("token");
                const url = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api\/?$/, "");
                const res = await fetch(`${url}/api/telemetry/sessions/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
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
            <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
                <h1 className="text-3xl font-black italic tracking-tight mb-6 text-white">MY SESSIONS</h1>

                {loading ? (
                    <div className="text-muted-foreground animate-pulse">Loading sessions...</div>
                ) : sessions.length === 0 ? (
                    <div className="p-8 border-2 border-primary/20 border-dashed rounded-lg text-center bg-black/40 backdrop-blur-md">
                        <p className="text-muted-foreground font-medium">No sessions recorded yet.</p>
                        <p className="text-sm text-slate-500 mt-2">Connect the Turn One Link and complete a lap!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessions.map(s => (
                            <Card key={s.id} className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 shadow-xl backdrop-blur-md hover:border-primary/40 hover:shadow-primary/10 transition-all">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-white">{s.track}</h3>
                                            <p className="text-muted-foreground text-sm">{s.carModel}</p>
                                        </div>
                                        <div className="text-xs px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded font-semibold whitespace-nowrap">
                                            {s.sessionType}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-300 mb-6">
                                        <div className="flex flex-col bg-black/40 p-2 rounded border border-primary/10">
                                            <span className="text-xs text-muted-foreground">Laps</span>
                                            <span className="font-mono font-bold text-white">{s.lapCount}</span>
                                        </div>
                                        <div className="flex flex-col bg-black/40 p-2 rounded border border-primary/10">
                                            <span className="text-xs text-muted-foreground">Duration</span>
                                            <span className="font-mono text-white">{formatDistanceToNow(new Date(s.startedAt))} ago</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(s.startedAt), "PPP p")}
                                        </span>
                                        <Link href={`/simracing/sessions/${s.id}`} className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                                            View Laps &rarr;
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
