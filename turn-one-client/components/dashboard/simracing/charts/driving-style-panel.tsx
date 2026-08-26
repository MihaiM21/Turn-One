"use client";

import { useMemo } from "react";
import type { DistanceSample } from "@/lib/simracing/analysis";
import { drivingStyle } from "@/lib/simracing/analysis";

interface DrivingStylePanelProps {
    samples: DistanceSample[];
    /** Optional reference lap; each metric then shows the difference against it. */
    referenceSamples?: DistanceSample[] | null;
    referenceLabel?: string;
}

interface Row {
    label: string;
    value: number;
    reference: number | null;
    /** Formatted display value. */
    display: string;
    color: string;
    hint: string;
    /** True when a higher number is better, for colouring the comparison. */
    higherIsBetter: boolean;
}

/**
 * How the lap was driven, rather than what the car did — the numbers a coach would quote:
 * time at full throttle, time coasting, whether the brake and throttle overlap.
 */
export function DrivingStylePanel({
    samples,
    referenceSamples = null,
    referenceLabel = "best lap",
}: DrivingStylePanelProps) {
    const rows = useMemo<Row[] | null>(() => {
        const style = drivingStyle(samples);
        if (!style) return null;
        const ref = referenceSamples ? drivingStyle(referenceSamples) : null;

        return [
            {
                label: "Full throttle",
                value: style.fullThrottlePct,
                reference: ref?.fullThrottlePct ?? null,
                display: `${style.fullThrottlePct.toFixed(1)}%`,
                color: "#22c55e",
                hint: "Share of the lap at 98%+ throttle.",
                higherIsBetter: true,
            },
            {
                label: "Braking",
                value: style.brakingPct,
                reference: ref?.brakingPct ?? null,
                display: `${style.brakingPct.toFixed(1)}%`,
                color: "#f97316",
                hint: "Share of the lap with the brake applied.",
                higherIsBetter: false,
            },
            {
                label: "Coasting",
                value: style.coastingPct,
                reference: ref?.coastingPct ?? null,
                display: `${style.coastingPct.toFixed(1)}%`,
                color: "#eab308",
                hint: "Neither pedal pressed — usually free time to reclaim.",
                higherIsBetter: false,
            },
            {
                label: "Trail braking",
                value: style.trailBrakePct,
                reference: ref?.trailBrakePct ?? null,
                display: `${style.trailBrakePct.toFixed(1)}%`,
                color: "#ec4899",
                hint: "Brake and throttle overlapping into the corner.",
                higherIsBetter: true,
            },
            {
                label: "Peak brake",
                value: style.peakBrake * 100,
                reference: ref ? ref.peakBrake * 100 : null,
                display: `${(style.peakBrake * 100).toFixed(0)}%`,
                color: "#ef4444",
                hint: "Hardest brake application in the lap.",
                higherIsBetter: true,
            },
            {
                label: "Brake events",
                value: style.brakeApplications,
                reference: ref?.brakeApplications ?? null,
                display: `${style.brakeApplications}`,
                color: "#3b82f6",
                hint: "Distinct braking zones. Extra events often mean corrections.",
                higherIsBetter: false,
            },
        ];
    }, [samples, referenceSamples]);

    if (!rows) {
        return (
            <div className="flex h-32 items-center justify-center font-mono text-sm text-zinc-600">
                Not enough data to profile this lap
            </div>
        );
    }

    // Percent-based rows share a 0–100 bar; counts are shown as numbers only.
    const isPercent = (row: Row) => row.label !== "Brake events";

    return (
        <div className="space-y-4">
            {rows.map(row => {
                const diff = row.reference != null ? row.value - row.reference : null;
                const better = diff == null ? null : row.higherIsBetter ? diff > 0 : diff < 0;

                return (
                    <div key={row.label}>
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="text-[11px] uppercase tracking-wider text-zinc-400">{row.label}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="font-mono text-sm font-bold tabular-nums text-white">{row.display}</span>
                                {diff != null && Math.abs(diff) >= 0.1 ? (
                                    <span
                                        className={`font-mono text-[11px] tabular-nums ${
                                            better ? "text-green-500" : "text-red-500"
                                        }`}
                                        title={`vs ${referenceLabel}`}
                                    >
                                        {diff > 0 ? "+" : ""}
                                        {diff.toFixed(1)}
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        {isPercent(row) ? (
                            <div className="relative mt-1.5 h-1.5 w-full bg-zinc-900">
                                <div
                                    className="absolute inset-y-0 left-0"
                                    style={{ width: `${Math.min(100, row.value)}%`, backgroundColor: row.color }}
                                />
                                {row.reference != null ? (
                                    <div
                                        className="absolute inset-y-0 w-px bg-white/60"
                                        style={{ left: `${Math.min(100, row.reference)}%` }}
                                        title={`${referenceLabel}: ${row.reference.toFixed(1)}%`}
                                    />
                                ) : null}
                            </div>
                        ) : null}

                        <p className="mt-1 text-[11px] text-zinc-600">{row.hint}</p>
                    </div>
                );
            })}

            {referenceSamples ? (
                <p className="border-t border-zinc-800 pt-3 text-[11px] text-zinc-600">
                    The white tick on each bar is your {referenceLabel}.
                </p>
            ) : null}
        </div>
    );
}
