"use client";

import { Card, CardContent } from "@/components/ui/card";

export interface LapMetrics {
    lapNumber: number;
    lapTimeMs: number | null;
    brakingScore: number;
    throttleScore: number;
    consistencyScore: number;
    deltaToBestMs: number | null;
    sector1DeltaMs: number | null;
    sector2DeltaMs: number | null;
    sector3DeltaMs: number | null;
}

function formatLapTime(ms: number | null) {
    if (ms == null || ms <= 0) return "—";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${m}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

function formatDelta(ms: number | null) {
    if (ms == null) return "—";
    const sign = ms > 0 ? "+" : "";
    return `${sign}${(ms / 1000).toFixed(3)}s`;
}

function deltaColor(ms: number | null) {
    if (ms == null) return "text-muted-foreground";
    if (ms < 0) return "text-emerald-400";
    if (ms > 0) return "text-red-400";
    return "text-white";
}

function scoreColor(score: number) {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
}

interface LapMetricsPanelProps {
    metrics: LapMetrics | null;
}

export function LapMetricsPanel({ metrics }: LapMetricsPanelProps) {
    if (!metrics) {
        return (
            <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-md">
                <CardContent className="p-5">
                    <p className="text-muted-foreground font-mono text-sm">Select a lap to view analytics.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Cell label="Lap" value={metrics.lapNumber.toString()} mono />
            <Cell label="Lap Time" value={formatLapTime(metrics.lapTimeMs)} mono />
            <Cell label="Δ Best" value={formatDelta(metrics.deltaToBestMs)} valueClass={deltaColor(metrics.deltaToBestMs)} mono />
            <Cell label="S1 Δ" value={formatDelta(metrics.sector1DeltaMs)} valueClass={deltaColor(metrics.sector1DeltaMs)} mono />
            <Cell label="Braking" value={Math.round(metrics.brakingScore).toString()} valueClass={scoreColor(metrics.brakingScore)} mono />
            <Cell label="Throttle" value={Math.round(metrics.throttleScore).toString()} valueClass={scoreColor(metrics.throttleScore)} mono />
            <Cell label="Consist." value={Math.round(metrics.consistencyScore).toString()} valueClass={scoreColor(metrics.consistencyScore)} mono />
        </div>
    );
}

function Cell({
    label,
    value,
    valueClass = "text-white",
    mono = false,
}: {
    label: string;
    value: string;
    valueClass?: string;
    mono?: boolean;
}) {
    return (
        <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-md">
            <CardContent className="p-3">
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                    {label}
                </span>
                <span className={`block text-lg font-bold ${mono ? "font-mono" : ""} ${valueClass}`}>{value}</span>
            </CardContent>
        </Card>
    );
}
