"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface SessionDto {
    id: string;
    username: string;
    carModel: string;
    track: string;
    sessionType: string;
    startedAt: string;
    lapCount: number;
}

export default function SpectatePage() {
    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLive = async () => {
            try {
                const token = localStorage.getItem("token");
                const url = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api\/?$/, "");
                const res = await fetch(`${url}/api/telemetry/live`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (res.status === 403) {
                     // Need PRO
                     setLoading(false);
                     return;
                }
                
                if (res.ok) {
                    const data = await res.json();
                    setSessions(data);
                }
            } catch (err) {
                console.error("Failed to fetch live streams", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLive();
        const interval = setInterval(fetchLive, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full min-h-screen p-6 bg-gradient-to-br from-black via-red-950/20 to-black font-sans text-white">
            <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
                <h1 className="text-3xl font-black italic tracking-tight mb-6 flex items-center gap-3 text-white">
                    <span className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]"></span>
                    LIVE STREAMS
                </h1>

                {loading ? (
                    <div className="text-muted-foreground animate-pulse">Finding active sessions...</div>
                ) : sessions.length === 0 ? (
                    <div className="p-8 border-2 border-primary/20 border-dashed rounded-lg text-center bg-black/40 backdrop-blur-md">
                        <p className="text-muted-foreground font-medium">No public sessions are currently live.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessions.map(s => (
                            <Card key={s.id} className="border-primary/30 bg-gradient-to-br from-black/80 to-black/60 hover:border-primary/60 transition-all shadow-xl hover:shadow-primary/20 backdrop-blur-md">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4 border-b border-primary/10 pb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-white">{s.username}&apos;s Stream</h3>
                                            <p className="text-muted-foreground text-xs">Started {formatDistanceToNow(new Date(s.startedAt))} ago</p>
                                        </div>
                                        <div className="text-xs px-2 py-1 bg-primary/20 text-primary border border-primary/30 rounded-md font-black tracking-widest whitespace-nowrap animate-pulse">
                                            LIVE
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1 mb-6 text-sm text-slate-300">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Track:</span>
                                            <span className="font-semibold text-white">{s.track}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Car:</span>
                                            <span className="font-semibold text-right max-w-[200px] truncate text-white">{s.carModel}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Laps:</span>
                                            <span className="font-mono font-bold text-primary">{s.lapCount}</span>
                                        </div>
                                    </div>

                                    <Link href={`/simracing/spectate/${s.id}`} className="block w-full text-center bg-primary/20 hover:bg-primary/40 border border-primary/30 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                        Watch Cockpit &rarr;
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
