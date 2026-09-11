"use client";

import { useEffect, useState, type RefObject } from "react";
import { AreaChart, Area, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { LineChart } from "lucide-react";
import { SectionCard } from "./section-card";
import type { SimPhysics } from "@/lib/simTelemetryService";
import { CHART, TOOLTIP_STYLE, asNumber, asString } from "./charts/chart-theme";

const SAMPLE_MS = 100;
const WINDOW_SECONDS = 30;
const MAX_POINTS = (WINDOW_SECONDS * 1000) / SAMPLE_MS;

interface Sample {
    t: number;
    throttle: number;
    brake: number;
    speed: number;
}

interface LiveInputTraceProps {
    /** Ref to the most recent physics frame, sampled here rather than re-rendered per frame. */
    latest: RefObject<SimPhysics | null>;
    isActive: boolean;
}

/**
 * Rolling 30-second throttle/brake trace for the live cockpit.
 *
 * ACC pushes physics at ~100 Hz; driving a chart from that directly would re-render 100 times a
 * second for no visual benefit, so this samples the latest frame on a 10 Hz timer instead.
 */
export function LiveInputTrace({ latest, isActive }: LiveInputTraceProps) {
    const [samples, setSamples] = useState<Sample[]>([]);

    useEffect(() => {
        if (!isActive) return;

        const id = setInterval(() => {
            const p = latest.current;
            if (!p) return;
            setSamples(prev => {
                const next = [
                    ...prev,
                    {
                        t: Date.now(),
                        throttle: Math.min(p.gas * 100, 100),
                        brake: Math.min(p.brake * 100, 100),
                        speed: p.speedKmh,
                    },
                ];
                return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
            });
        }, SAMPLE_MS);

        return () => clearInterval(id);
    }, [latest, isActive]);

    // Drop the buffer when the car leaves the track so the next stint starts clean.
    useEffect(() => {
        if (!isActive) setSamples([]);
    }, [isActive]);

    return (
        <SectionCard
            label="Inputs"
            title={`Last ${WINDOW_SECONDS} seconds`}
            icon={LineChart}
            empty={!samples.length ? "Waiting for telemetry…" : undefined}
            emptyIcon={LineChart}
        >
            <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={samples} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: CHART.axis, fontSize: 10 }} stroke={CHART.grid} />
                        <Tooltip
                            contentStyle={TOOLTIP_STYLE}
                            labelFormatter={() => ""}
                            formatter={(rawValue: unknown, rawName: unknown) => [
                                `${Math.round(asNumber(rawValue))}%`,
                                asString(rawName) === "throttle" ? "Throttle" : "Brake",
                            ]}
                        />
                        <Area
                            dataKey="throttle"
                            stroke="#22c55e"
                            fill="#22c55e"
                            fillOpacity={0.2}
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                        />
                        <Area
                            dataKey="brake"
                            stroke="#f97316"
                            fill="#f97316"
                            fillOpacity={0.2}
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-2 flex gap-4 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-3" style={{ background: "#22c55e" }} />
                    Throttle
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-3" style={{ background: "#f97316" }} />
                    Brake
                </span>
            </div>
        </SectionCard>
    );
}
