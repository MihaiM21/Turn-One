"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { ArrowLeft, Activity, Clock, Flag, Lock, Globe } from "lucide-react";
import Link from "next/link";

interface ChartPoint {
    timestamp: number;
    speedKmh: number;
    rpms: number;
    gas: number;
    brake: number;
    gear: number;
}

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
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchSession = async () => {
            try {
                const token = localStorage.getItem("token");
                const url = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api\/?$/, "");
                const res = await fetch(`${url}/api/telemetry/sessions/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
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

        const fetchChart = async () => {
            try {
                setChartLoading(true);
                const token = localStorage.getItem("token");
                const url = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api\/?$/, "");
                const res = await fetch(`${url}/api/telemetry/sessions/${id}/chart`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setChartData(data);
                }
            } catch (err) {
                console.error("Failed to fetch chart details", err);
            } finally {
                setChartLoading(false);
            }
        };

        fetchSession().then(fetchChart);
    }, [id]);

    const handleVisibilityUpdate = async (newVis: number) => {
        try {
            const token = localStorage.getItem("token");
            const url = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api\/?$/, "");
            await fetch(`${url}/api/telemetry/sessions/${id}/visibility`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newVis),
            });
            setSession(prev => (prev ? { ...prev, visibility: newVis } : prev));
        } catch {
            alert("Failed to update visibility. Check plan level.");
        }
    };

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
            <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
                {/* Header */}
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

                        {/* Visibility toggle */}
                        <div className="flex gap-1 items-center bg-black/40 border border-primary/20 p-1 rounded-lg backdrop-blur-md self-start">
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

                {/* Stat cards */}
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
                    <StatCard
                        label="Type"
                        value={session.sessionType}
                    />
                    <StatCard
                        icon={<Flag className="w-4 h-4" />}
                        label="Total Laps"
                        value={session.lapCount}
                        valueClass="text-2xl font-mono font-bold text-primary"
                    />
                </div>

                {/* Chart */}
                <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 shadow-xl backdrop-blur-md overflow-hidden">
                    <CardContent className="p-6">
                        <h2 className="text-sm font-bold mb-4 text-white uppercase tracking-widest">Speed & RPM Telemetry</h2>
                        {chartLoading ? (
                            <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse font-mono text-sm">
                                Loading telemetry data...
                            </div>
                        ) : chartData.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground font-mono text-sm max-w-md text-center mx-auto">
                                <Activity className="w-8 h-8 opacity-40" />
                                <p>No telemetry ticks found. Ensure you complete some movement on track before ending the session.</p>
                            </div>
                        ) : (
                            <div className="h-80 w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} stroke="#555" />
                                        <XAxis
                                            dataKey="timestamp"
                                            tickFormatter={t => format(new Date(t), "HH:mm:ss")}
                                            stroke="#555"
                                            tick={{ fill: "#888", fontSize: 10 }}
                                        />
                                        <YAxis yAxisId="left" stroke="#555" tick={{ fill: "#888", fontSize: 10 }} />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            stroke="#555"
                                            tick={{ fill: "#888", fontSize: 10 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "rgba(0,0,0,0.85)",
                                                borderColor: "#ef4444",
                                                borderRadius: "8px",
                                                backdropFilter: "blur(4px)",
                                            }}
                                            labelFormatter={t => format(new Date(t), "HH:mm:ss")}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="speedKmh"
                                            stroke="#ef4444"
                                            dot={false}
                                            strokeWidth={2}
                                            name="Speed (km/h)"
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="rpms"
                                            stroke="#3b82f6"
                                            dot={false}
                                            strokeWidth={2}
                                            name="RPM"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
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
