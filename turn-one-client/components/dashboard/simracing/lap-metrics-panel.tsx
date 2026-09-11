"use client";

import { formatLapTime, formatDelta } from "@/lib/simracing/api";

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

function deltaColor(ms: number | null) {
    if (ms == null) return "text-zinc-500";
    if (ms < 0) return "text-green-500";
    if (ms > 0) return "text-red-500";
    return "text-white";
}

function scoreColor(score: number) {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-500";
}

export function LapMetricsPanel({ metrics }: { metrics: LapMetrics | null }) {
    if (!metrics) {
        return (
            <div className="border border-zinc-800 bg-zinc-950 px-5 py-4">
                <p className="font-mono text-sm text-zinc-500">Select a lap to view analytics.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-zinc-800 bg-zinc-800 md:grid-cols-4 lg:grid-cols-7">
            <Cell label="Lap" value={metrics.lapNumber.toString()} />
            <Cell label="Lap time" value={formatLapTime(metrics.lapTimeMs)} />
            <Cell
                label="Δ Best"
                value={formatDelta(metrics.deltaToBestMs)}
                valueClass={deltaColor(metrics.deltaToBestMs)}
            />
            <Cell
                label="S1 Δ"
                value={formatDelta(metrics.sector1DeltaMs)}
                valueClass={deltaColor(metrics.sector1DeltaMs)}
            />
            <Cell
                label="Braking"
                value={Math.round(metrics.brakingScore).toString()}
                valueClass={scoreColor(metrics.brakingScore)}
            />
            <Cell
                label="Throttle"
                value={Math.round(metrics.throttleScore).toString()}
                valueClass={scoreColor(metrics.throttleScore)}
            />
            <Cell
                label="Consist."
                value={Math.round(metrics.consistencyScore).toString()}
                valueClass={scoreColor(metrics.consistencyScore)}
            />
        </div>
    );
}

function Cell({ label, value, valueClass = "text-white" }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="bg-zinc-950 px-4 py-3">
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{label}</span>
            <span className={`mt-1 block font-mono text-lg font-bold tabular-nums ${valueClass}`}>{value}</span>
        </div>
    );
}
