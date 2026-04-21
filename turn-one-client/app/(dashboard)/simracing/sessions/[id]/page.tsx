"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

interface SessionDto {
    id: string;
    carModel: string;
    track: string;
    driverName: string;
    sessionType: string;
    visibility: number;
    isActive: boolean;
    lapCount: number;
    startedAt: string;
    endedAt?: string;
}

export default function SessionDetailPage() {
    const params = useParams();
    const id = params.id as string;
    
    const [session, setSession] = useState<SessionDto | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchSession = async () => {
            try {
                const token = localStorage.getItem("token");
                const url = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api\/?$/, "");
                const res = await fetch(`${url}/api/telemetry/sessions/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSession(data);
                }
            } catch (err) {
                console.error("Failed to fetch session detail", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, [id]);

    const handleVisibilityUpdate = async (newVis: number) => {
        try {
            const token = localStorage.getItem("token");
            const url = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api\/?$/, "");
            await fetch(`${url}/api/telemetry/sessions/${id}/visibility`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newVis)
            });
            setSession(prev => prev ? {...prev, visibility: newVis} : prev);
        } catch (err) {
            alert("Failed to update visibility. Check plan level.");
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse font-sans">Loading session details...</div>;
    if (!session) return <div className="p-12 text-center font-sans text-white">Session not found.</div>;

    return (
        <div className="w-full min-h-screen p-6 bg-gradient-to-br from-black via-red-950/20 to-black font-sans text-white">
            <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tight text-white">{session.track}</h1>
                        <p className="text-muted-foreground">{session.carModel}</p>
                    </div>
                    
                    <div className="flex gap-2 items-center bg-black/40 border border-primary/20 p-1 rounded-lg backdrop-blur-md">
                        <button 
                            onClick={() => handleVisibilityUpdate(0)}
                            className={`px-4 py-2 text-sm font-bold rounded ${session.visibility === 0 ? 'bg-primary/20 text-white border border-primary/50' : 'text-muted-foreground hover:text-white'}`}
                        >
                            Private
                        </button>
                        <button 
                            onClick={() => handleVisibilityUpdate(1)}
                            className={`px-4 py-2 text-sm font-bold rounded ${session.visibility === 1 ? 'bg-blue-600/30 text-blue-200 border border-blue-500/50' : 'text-muted-foreground hover:text-white'}`}
                        >
                            Public
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 shadow-xl backdrop-blur-md">
                        <CardContent className="p-6">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">Status</span>
                            <span className={`text-xl font-bold ${session.isActive ? 'text-primary animate-pulse' : 'text-white'}`}>{session.isActive ? 'LIVE' : 'Completed'}</span>
                        </CardContent>
                    </Card>
                    <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 shadow-xl backdrop-blur-md">
                        <CardContent className="p-6">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">Time</span>
                            <span className="text-lg font-bold text-white">{format(new Date(session.startedAt), "MMM d, HH:mm")}</span>
                        </CardContent>
                    </Card>
                    <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 shadow-xl backdrop-blur-md">
                        <CardContent className="p-6">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">Type</span>
                            <span className="text-lg font-bold text-white">{session.sessionType}</span>
                        </CardContent>
                    </Card>
                    <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 shadow-xl backdrop-blur-md">
                        <CardContent className="p-6">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">Total Laps</span>
                            <span className="text-2xl font-mono font-bold text-primary">{session.lapCount}</span>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 shadow-xl backdrop-blur-md mb-6">
                    <CardContent className="p-12 text-center text-muted-foreground">
                        Detailed per-lap telemetry charts will appear here using the historical InfluxDB data.
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
