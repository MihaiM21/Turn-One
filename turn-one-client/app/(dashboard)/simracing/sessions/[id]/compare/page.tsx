"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GitCompareArrows } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
    MultiChannelChart,
    type MultiChannelChartData,
} from "@/components/dashboard/simracing/charts/multi-channel-chart";

interface SessionDto {
    id: string;
    carModel: string;
    track: string;
    sessionType: string;
    lapCount: number;
    startedAt: string;
}

function apiBase() {
    return (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api\/?$/, "");
}

function authHeaders(): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function CompareSessionPage() {
    const params = useParams();
    const id = params.id as string;

    const [primary, setPrimary] = useState<SessionDto | null>(null);
    const [candidates, setCandidates] = useState<SessionDto[]>([]);
    const [againstId, setAgainstId] = useState<string>("");
    const [primaryLap, setPrimaryLap] = useState<string>("");
    const [againstLap, setAgainstLap] = useState<string>("");
    const [primaryData, setPrimaryData] = useState<MultiChannelChartData>({ channels: [], points: [] });
    const [secondaryData, setSecondaryData] = useState<MultiChannelChartData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        const url = apiBase();
        (async () => {
            const [self, mine] = await Promise.all([
                fetch(`${url}/api/telemetry/sessions/${id}`, { headers: authHeaders() }),
                fetch(`${url}/api/telemetry/sessions/me`, { headers: authHeaders() }),
            ]);
            if (self.ok) setPrimary(await self.json());
            if (mine.ok) {
                const all: SessionDto[] = await mine.json();
                setCandidates(all.filter(s => s.id !== id));
            }
        })();
    }, [id]);

    const runCompare = useCallback(async () => {
        if (!id || !againstId) return;
        setError(null);
        setLoading(true);
        try {
            const url = apiBase();
            const qs = new URLSearchParams({ against: againstId });
            if (primaryLap) qs.set("lap", primaryLap);
            if (againstLap) qs.set("againstLap", againstLap);

            const res = await fetch(`${url}/api/telemetry/sessions/${id}/compare?${qs.toString()}`, {
                headers: authHeaders(),
            });
            if (res.status === 403) {
                setError("Session comparison requires a PRO or ELITE plan.");
                return;
            }
            if (!res.ok) {
                setError("Failed to load comparison.");
                return;
            }
            const body = await res.json();
            setPrimaryData(body.primary.data);
            setSecondaryData(body.secondary.data);
        } finally {
            setLoading(false);
        }
    }, [id, againstId, primaryLap, againstLap]);

    return (
        <div className="w-full min-h-screen p-6 bg-gradient-to-br from-black via-red-950/20 to-black font-sans text-white">
            <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
                <div>
                    <Link
                        href={`/simracing/sessions/${id}`}
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-white text-sm font-semibold transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Session
                    </Link>

                    <div className="flex items-center gap-3">
                        <GitCompareArrows className="w-5 h-5 text-primary" />
                        <h1 className="text-3xl font-black italic tracking-tight">Compare</h1>
                    </div>
                    {primary ? (
                        <p className="text-muted-foreground mt-1">
                            {primary.track} · {primary.carModel}
                        </p>
                    ) : null}
                </div>

                <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-md">
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                                Primary Lap (this session)
                            </label>
                            <input
                                type="number"
                                placeholder="All laps"
                                value={primaryLap}
                                onChange={e => setPrimaryLap(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-md px-3 py-2 text-sm font-mono focus:border-primary/40 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                                Compare Against (your sessions)
                            </label>
                            <select
                                value={againstId}
                                onChange={e => setAgainstId(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-md px-3 py-2 text-sm focus:border-primary/40 outline-none"
                            >
                                <option value="">Select a session...</option>
                                {candidates.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.track} · {c.carModel} · {new Date(c.startedAt).toLocaleDateString()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                                Against Lap
                            </label>
                            <input
                                type="number"
                                placeholder="All laps"
                                value={againstLap}
                                onChange={e => setAgainstLap(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-md px-3 py-2 text-sm font-mono focus:border-primary/40 outline-none"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={runCompare}
                                disabled={!againstId || loading}
                                className="w-full bg-primary/20 border border-primary/40 hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-sm font-bold rounded-md transition-colors"
                            >
                                {loading ? "Loading..." : "Run Comparison"}
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {error ? (
                    <Card className="border-red-500/40 bg-red-950/20 backdrop-blur-md">
                        <CardContent className="p-4">
                            <p className="text-red-300 font-mono text-sm">{error}</p>
                        </CardContent>
                    </Card>
                ) : null}

                {secondaryData ? (
                    <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-md">
                        <CardContent className="p-6">
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">
                                Overlay (dashed = compare)
                            </h2>
                            <MultiChannelChart
                                data={primaryData}
                                compareData={secondaryData}
                                compareLabel="Compare"
                            />
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </div>
    );
}
