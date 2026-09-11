"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import type { DistanceSample } from "@/lib/simracing/analysis";
import { shiftPoints } from "@/lib/simracing/analysis";
import { gearToColor } from "@/lib/color-scale";
import { CHART, TOOLTIP_STYLE, AXIS_TICK, asNumber, asString } from "./chart-theme";

interface ShiftHistogramProps {
    samples: DistanceSample[];
    /** Engine rev limit from the session's static data, if known. */
    maxRpm?: number | null;
    height?: number;
}

/** Average upshift RPM per gear, against the rev limit — short-shifting shows up immediately. */
export function ShiftHistogram({ samples, maxRpm = null, height = 260 }: ShiftHistogramProps) {
    const data = useMemo(() => {
        const shifts = shiftPoints(samples);
        const byGear = new Map<number, number[]>();
        for (const s of shifts) {
            if (!byGear.has(s.fromGear)) byGear.set(s.fromGear, []);
            byGear.get(s.fromGear)!.push(s.rpm);
        }

        return Array.from(byGear.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([gear, rpms]) => ({
                // ACC encodes gear as 0=R, 1=N, 2=1st — show the number the driver sees.
                gear: `${gear - 1}→${gear}`,
                gearNumber: gear - 1,
                averageRpm: Math.round(rpms.reduce((a, b) => a + b, 0) / rpms.length),
                maxShiftRpm: Math.round(Math.max(...rpms)),
                count: rpms.length,
            }))
            .filter(d => d.gearNumber >= 1);
    }, [samples]);

    if (!data.length) {
        return (
            <div className="flex h-40 items-center justify-center font-mono text-sm text-zinc-600">
                No upshifts detected in this lap
            </div>
        );
    }

    const ceiling = maxRpm && maxRpm > 0 ? maxRpm : Math.max(...data.map(d => d.maxShiftRpm)) * 1.08;

    return (
        <div className="space-y-3">
            <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 8, right: 10, left: -12, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                        <XAxis dataKey="gear" stroke={CHART.grid} tick={AXIS_TICK} />
                        <YAxis domain={[0, Math.ceil(ceiling / 500) * 500]} stroke={CHART.grid} tick={AXIS_TICK} />
                        <Tooltip
                            contentStyle={TOOLTIP_STYLE}
                            cursor={{ fill: "rgba(255,255,255,0.04)" }}
                            formatter={(rawValue: unknown, rawName: unknown) => [
                                `${asNumber(rawValue).toLocaleString()} rpm`,
                                asString(rawName) === "averageRpm" ? "Average shift" : asString(rawName),
                            ]}
                        />

                        {maxRpm && maxRpm > 0 ? (
                            <ReferenceLine
                                y={maxRpm}
                                stroke={CHART.slower}
                                strokeDasharray="4 3"
                                label={{ value: "Rev limit", fill: CHART.slower, fontSize: 10, position: "insideTopRight" }}
                            />
                        ) : null}

                        <Bar dataKey="averageRpm" isAnimationActive={false}>
                            {data.map(d => (
                                <Cell key={d.gear} fill={gearToColor(d.gearNumber)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-500 sm:grid-cols-4">
                {data.map(d => (
                    <span key={d.gear} className="font-mono tabular-nums">
                        {d.gear}: {d.count}×
                    </span>
                ))}
            </div>

            {maxRpm && maxRpm > 0 ? (
                <p className="text-[11px] text-zinc-600">
                    Bars well below the rev limit mean you&apos;re short-shifting and leaving power unused.
                </p>
            ) : null}
        </div>
    );
}
