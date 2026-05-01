"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Eye, MapPin, Car, Flag, Radio } from "lucide-react";

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
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.status === 403) {
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
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <Radio className="w-5 h-5 text-primary" />
                        <h1 className="text-3xl font-black italic tracking-tight flex items-center gap-3">
                            LIVE STREAMS
                            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm ml-8">Active public sessions · refreshes every 10s</p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-52 rounded-xl bg-black/40 border border-primary/10 animate-pulse" />
                        ))}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-primary/20 border-dashed rounded-xl bg-black/40 backdrop-blur-md">
                        <Eye className="w-12 h-12 text-muted-foreground/40 mb-4" />
                        <p className="text-muted-foreground font-medium text-lg mb-2">No live sessions right now</p>
                        <p className="text-sm text-slate-500">Check back later, or start your own session to be spectated!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessions.map(s => (
                            <Card
                                key={s.id}
                                className="border-primary/30 bg-gradient-to-br from-black/80 to-black/60 hover:border-primary/60 transition-all duration-200 shadow-xl hover:shadow-primary/20 backdrop-blur-md group overflow-hidden"
                            >
                                <CardContent className="p-0">
                                    <div className="p-5 border-b border-primary/10">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg text-white">{s.username}</h3>
                                                <p className="text-muted-foreground text-xs">
                                                    Started {formatDistanceToNow(new Date(s.startedAt))} ago
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 bg-primary/20 text-primary border border-primary/30 rounded-md font-black tracking-widest animate-pulse">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                LIVE
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-5 py-4 space-y-2.5">
                                        <div className="flex items-center gap-3 text-sm">
                                            <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                            <span className="text-muted-foreground text-xs w-8">Track</span>
                                            <span className="font-semibold text-white">{s.track}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Car className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                            <span className="text-muted-foreground text-xs w-8">Car</span>
                                            <span className="font-semibold text-white truncate max-w-[180px]">{s.carModel}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Flag className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                            <span className="text-muted-foreground text-xs w-8">Laps</span>
                                            <span className="font-mono font-bold text-primary">{s.lapCount}</span>
                                        </div>
                                    </div>

                                    <div className="px-5 pb-5">
                                        <Link
                                            href={`/simracing/spectate/${s.id}`}
                                            className="block w-full text-center bg-primary/20 hover:bg-primary/40 border border-primary/30 hover:border-primary/60 text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-200 text-sm"
                                        >
                                            Watch Cockpit →
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
