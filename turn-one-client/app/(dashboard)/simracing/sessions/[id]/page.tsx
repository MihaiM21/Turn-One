"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowLeft, Activity, Clock, Flag, Lock, Globe, GitCompareArrows } from "lucide-react";
import Link from "next/link";
import {
    MultiChannelChart,
    type MultiChannelChartData,
} from "@/components/dashboard/simracing/charts/multi-channel-chart";
import { ReplayScrubber } from "@/components/dashboard/simracing/replay-scrubber";
import {
    LapMetricsPanel,
    type LapMetrics,
} from "@/components/dashboard/simracing/lap-metrics-panel";
import { LapSelector, type LapSummary } from "@/components/dashboard/simracing/lap-selector";
import { CoachingPanel } from "@/components/dashboard/simracing/coaching/coaching-panel";

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

interface LapDto {
    lapNumber: number;
    lapTimeMs: number | null;
    isValid: boolean;
}

function apiBase() {
    return (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api\/?$/, "");
}

function authHeaders(): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function SessionDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [session, setSession] = useState<SessionDto | null>(null);
    const [chartData, setChartData] = useState<MultiChannelChartData>({ channels: [], points: [] });
    const [laps, setLaps] = useState<LapSummary[]>([]);
    const [metrics, setMetrics] = useState<LapMetrics[]>([]);
    const [selectedLap, setSelectedLap] = useState<number | null>(null);
    const [cursor, setCursor] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);

    useEffect(() => {
        if (!id) return;
        const url = apiBase();

        (async () => {
            try {
                const [sessionRes, lapsRes, metricsRes] = await Promise.all([
                    fetch(`${url}/api/telemetry/sessions/${id}`, { headers: authHeaders() }),
                    fetch(`${url}/api/telemetry/sessions/${id}/laps`, { headers: authHeaders() }),
                    fetch(`${url}/api/telemetry/sessions/${id}/metrics`, { headers: authHeaders() }),
                ]);
                if (sessionRes.ok) setSession(await sessionRes.json());
                if (lapsRes.ok) {
                    const data: LapDto[] = await lapsRes.json();
                    setLaps(
                        data.map(l => ({
                            lapNumber: l.lapNumber,
                            lapTimeMs: l.lapTimeMs,
                            isValid: l.isValid,
                        }))
                    );
                }
                if (metricsRes.ok) setMetrics(await metricsRes.json());
            } catch (err) {
                console.error("Failed to fetch session", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const loadChart = useCallback(
        async (lap: number | null) => {
            if (!id) return;
            const url = apiBase();
            setChartLoading(true);
            try {
                const endpoint =
                    lap == null
                        ? `${url}/api/telemetry/sessions/${id}/channels`
                        : `${url}/api/telemetry/sessions/${id}/laps/${lap}/chart`;
                const res = await fetch(endpoint, { headers: authHeaders() });
                if (res.ok) setChartData(await res.json());
            } catch (err) {
                console.error("Failed to load chart", err);
            } finally {
                setChartLoading(false);
            }
        },
        [id]
    );

    useEffect(() => {
        loadChart(selectedLap);
        setCursor(null);
    }, [selectedLap, loadChart]);

    const handleVisibilityUpdate = async (newVis: number) => {
        try {
            const url = apiBase();
            await fetch(`${url}/api/telemetry/sessions/${id}/visibility`, {
                method: "PATCH",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify(newVis),
            });
            setSession(prev => (prev ? { ...prev, visibility: newVis } : prev));
        } catch {
            alert("Failed to update visibility. Check plan level.");
        }
    };

    const activeMetrics = useMemo(() => {
        if (selectedLap == null) return null;
        return metrics.find(m => m.lapNumber === selectedLap) ?? null;
    }, [selectedLap, metrics]);

    const { minTs, maxTs } = useMemo(() => {
        if (!chartData.points.length) return { minTs: 0, maxTs: 0 };
        return {
            minTs: chartData.points[0].timestamp,
            maxTs: chartData.points[chartData.points.length - 1].timestamp,
        };
    }, [chartData]);

    if (loading)
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black flex items-center justify-center">
                <p className="text-slate-500 animate-pulse font-mono">Loading session...</p>
            </div>
        );
    if (!session)
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black flex items-center justify-center">
                <p className="text-white">Session not found.</p>
            </div>
        );

    return (
        <div className="w-full min-h-screen p-6 bg-gradient-to-br from-black via-red-950/20 to-black font-sans text-white">
            <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
                <div>
                    <Link
                        href="/simracing/sessions"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-white text-sm font-semibold transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        My Sessions
                    </Link>

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Activity className="w-5 h-5 text-primary" />
                                <h1 className="text-3xl font-black italic tracking-tight">{session.track}</h1>
                            </div>
                            <p className="text-muted-foreground ml-8">{session.carModel}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href={`/simracing/sessions/${id}/compare`}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-md bg-black/40 border border-primary/20 hover:border-primary/40 transition-colors"
                            >
                                <GitCompareArrows className="w-3.5 h-3.5" />
                                Compare
                            </Link>

                            <div className="flex gap-1 items-center bg-black/40 border border-primary/20 p-1 rounded-lg backdrop-blur-md">
                                <button
                                    onClick={() => handleVisibilityUpdate(0)}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-md transition-all ${
                                        session.visibility === 0
                                            ? "bg-primary/20 text-white border border-primary/40"
                                            : "text-muted-foreground hover:text-white"
                                    }`}
                                >
                                    <Lock className="w-3.5 h-3.5" />
                                    Private
                                </button>
                                <button
                                    onClick={() => handleVisibilityUpdate(1)}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-md transition-all ${
                                        session.visibility === 1
                                            ? "bg-blue-600/30 text-blue-200 border border-blue-500/40"
                                            : "text-muted-foreground hover:text-white"
                                    }`}
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    Public
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={<Activity className="w-4 h-4" />}
                        label="Status"
                        value={session.isActive ? "LIVE" : "Completed"}
                        valueClass={session.isActive ? "text-primary animate-pulse" : "text-white"}
                    />
                    <StatCard
                        icon={<Clock className="w-4 h-4" />}
                        label="Started"
                        value={format(new Date(session.startedAt), "MMM d, HH:mm")}
                    />
                    <StatCard label="Type" value={session.sessionType} />
                    <StatCard
                        icon={<Flag className="w-4 h-4" />}
                        label="Total Laps"
                        value={session.lapCount}
                        valueClass="text-2xl font-mono font-bold text-primary"
                    />
                </div>

                <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 shadow-xl backdrop-blur-md">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Laps</h2>
                            <span className="text-xs text-muted-foreground font-mono">{laps.length} recorded</span>
                        </div>
                        <LapSelector laps={laps} selected={selectedLap} onSelect={setSelectedLap} />
                    </CardContent>
                </Card>

                <LapMetricsPanel metrics={activeMetrics} />

                <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 shadow-xl backdrop-blur-md overflow-hidden">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                                Telemetry {selectedLap != null ? `· Lap ${selectedLap}` : "· Full Session"}
                            </h2>
                        </div>

                        {chartLoading ? (
                            <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse font-mono text-sm">
                                Loading telemetry data...
                            </div>
                        ) : (
                            <>
                                <MultiChannelChart
                                    data={chartData}
                                    cursorTimestamp={cursor}
                                    onCursorChange={setCursor}
                                />
                                {maxTs > minTs ? (
                                    <ReplayScrubber
                                        minTimestamp={minTs}
                                        maxTimestamp={maxTs}
                                        value={cursor}
                                        onChange={setCursor}
                                    />
                                ) : null}
                            </>
                        )}
                    </CardContent>
                </Card>

                <CoachingPanel sessionId={id} lapNumber={selectedLap} />
            </div>
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    valueClass = "text-lg font-bold text-white",
}: {
    icon?: React.ReactNode;
    label: string;
    value: string | number;
    valueClass?: string;
}) {
    return (
        <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 shadow-xl backdrop-blur-md">
            <CardContent className="p-5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    {icon}
                    {label}
                </span>
                <span className={valueClass}>{value}</span>
            </CardContent>
        </Card>
    );
}
