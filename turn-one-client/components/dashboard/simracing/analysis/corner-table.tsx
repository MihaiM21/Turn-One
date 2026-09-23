"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useCursorSync } from "@/components/dashboard/simracing/charts/uplot";
import { cornerDeltas } from "@/lib/simracing/lap-telemetry";
import type { CornerCompareDto, LapCornerDto } from "@/lib/simracing/protocol";

export interface CornerTableLap {
    id: string;
    label: string;
    color: string;
}

interface CornerTableProps {
    data: CornerCompareDto;
    /** Index-aligned with `data.rows[].perLap` — index 0 must be the reference lap. */
    laps: CornerTableLap[];
}

type SortKey = "timeLost" | "apexSpeed" | "braking";

const SORTS: { key: SortKey; label: string }[] = [
    { key: "timeLost", label: "Time lost" },
    { key: "apexSpeed", label: "Apex speed Δ" },
    { key: "braking", label: "Braking Δ" },
];

/**
 * Corner-by-corner comparison table. Rows sort by the biggest delta of the chosen kind across the
 * non-reference laps; clicking a row zooms every synced chart into that corner (±80 m).
 */
export function CornerTable({ data, laps }: CornerTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>("timeLost");
    const { distance, setZoom } = useCursorSync();
    const deltaRows = useMemo(() => cornerDeltas(data.rows), [data.rows]);

    const ranked = useMemo(() => {
        const combined = data.rows.map((row, i) => ({ row, delta: deltaRows[i] }));
        const scoreOf = (i: number) => {
            const { row, delta } = combined[i];
            void row;
            const vals =
                sortKey === "timeLost"
                    ? delta.timeDeltaMs
                    : sortKey === "apexSpeed"
                      ? delta.minSpeedDeltaKmh
                      : delta.brakingPointDeltaM;
            const abs = vals.slice(1).filter((v): v is number => v != null).map(Math.abs);
            return abs.length ? Math.max(...abs) : -1;
        };
        return combined
            .map((c, i) => ({ ...c, score: scoreOf(i) }))
            .sort((a, b) => b.score - a.score);
    }, [data.rows, deltaRows, sortKey]);

    if (!data.rows.length) {
        return <p className="px-5 py-8 text-center text-sm text-zinc-500">No matched corners for these laps.</p>;
    }

    return (
        <div>
            <div className="flex flex-wrap gap-1.5 px-5 pb-3 pt-4">
                {SORTS.map(s => (
                    <button
                        key={s.key}
                        type="button"
                        aria-pressed={sortKey === s.key}
                        onClick={() => setSortKey(s.key)}
                        className={cn(
                            "border px-2 py-1 text-[11px] font-bold transition-colors",
                            sortKey === s.key
                                ? "border-primary/50 bg-primary/15 text-primary"
                                : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                            <th className="px-5 py-2 font-normal">Corner</th>
                            {laps.map(l => (
                                <th key={l.id} className="px-3 py-2 font-normal" style={{ color: l.color }}>
                                    {l.label}
                                    {l === laps[0] ? " (ref)" : ""}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {ranked.map(({ row, delta }) => {
                            const ref = row.perLap[0];
                            const active = distance != null && ref != null && distance >= ref.entryM && distance <= ref.exitM;
                            return (
                                <tr
                                    key={row.refIndex}
                                    onClick={() => {
                                        if (ref) setZoom([ref.entryM - 80, ref.exitM + 80]);
                                    }}
                                    className={cn(
                                        "cursor-pointer border-b border-zinc-900 transition-colors hover:bg-zinc-900/60",
                                        active && "bg-primary/10"
                                    )}
                                >
                                    <td className="px-5 py-2 align-top font-mono font-bold text-white">
                                        {row.name ?? `T${row.refIndex + 1}`}
                                    </td>
                                    {laps.map((l, i) => {
                                        const c = row.perLap[i];
                                        if (!c) {
                                            return (
                                                <td key={l.id} className="px-3 py-2 align-top text-zinc-600">
                                                    —
                                                </td>
                                            );
                                        }
                                        return (
                                            <td key={l.id} className="px-3 py-2 align-top font-mono tabular-nums">
                                                <CellMetrics
                                                    corner={c}
                                                    isRef={i === 0}
                                                    minSpeedDelta={delta.minSpeedDeltaKmh[i]}
                                                    brakingDelta={delta.brakingPointDeltaM[i]}
                                                    throttleDelta={delta.throttleOnDeltaM[i]}
                                                    timeDelta={delta.timeDeltaMs[i]}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function CellMetrics({
    corner,
    isRef,
    minSpeedDelta,
    brakingDelta,
    throttleDelta,
    timeDelta,
}: {
    corner: LapCornerDto;
    isRef: boolean;
    minSpeedDelta: number | null;
    brakingDelta: number | null;
    throttleDelta: number | null;
    timeDelta: number | null;
}) {
    const brakingBeforeApex = corner.brakingPointM != null ? corner.apexM - corner.brakingPointM : null;
    const throttleAfterApex = corner.throttleOnM != null ? corner.throttleOnM - corner.apexM : null;

    return (
        <div className="flex flex-col gap-0.5">
            <span className={isRef ? "text-zinc-300" : color(minSpeedDelta, "higherIsBetter")}>
                {Math.round(corner.minSpeedKmh)} km/h
                {!isRef && minSpeedDelta != null ? <Delta value={minSpeedDelta} digits={1} suffix="" /> : null}
            </span>
            <span className="text-[10px] text-zinc-500">
                brk {brakingBeforeApex != null ? brakingBeforeApex.toFixed(0) : "—"}m before apex
                {!isRef && brakingDelta != null ? (
                    <span className={cn("ml-1", color(brakingDelta, "higherIsBetter"))}>
                        <Delta value={brakingDelta} digits={0} suffix="m" />
                    </span>
                ) : null}
            </span>
            <span className="text-[10px] text-zinc-500">
                thr {throttleAfterApex != null ? throttleAfterApex.toFixed(0) : "—"}m after apex
                {!isRef && throttleDelta != null ? (
                    <span className={cn("ml-1", color(throttleDelta, "lowerIsBetter"))}>
                        <Delta value={throttleDelta} digits={0} suffix="m" />
                    </span>
                ) : null}
            </span>
            <span className={isRef ? "text-zinc-400" : color(timeDelta, "lowerIsBetter")}>
                {(corner.timeInCornerMs / 1000).toFixed(3)}s
                {!isRef && timeDelta != null ? <Delta value={timeDelta / 1000} digits={3} suffix="s" /> : null}
            </span>
        </div>
    );
}

function Delta({ value, digits, suffix }: { value: number; digits: number; suffix: string }) {
    return (
        <span className="ml-1 text-[10px]">
            {value > 0 ? "+" : ""}
            {value.toFixed(digits)}
            {suffix}
        </span>
    );
}

/** Green when the delta favours this lap, red when it costs it. Both polarities show up in the table. */
function color(value: number | null, polarity: "higherIsBetter" | "lowerIsBetter") {
    if (value == null || Math.abs(value) < 1e-6) return "text-zinc-400";
    const better = polarity === "higherIsBetter" ? value > 0 : value < 0;
    return better ? "text-green-500" : "text-red-500";
}
