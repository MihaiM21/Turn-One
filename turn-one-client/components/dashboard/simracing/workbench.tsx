"use client";

/**
 * Pieces of the session workbench (PBI-068, layout A "Split" chosen 2026-11-25): the lap strip,
 * the "lap vs reference" picker, the time-loss panel wired to the shared cursor, and the
 * details sheet that holds everything secondary.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatLapTime } from "@/lib/simracing/api";
import type { TimeLoss } from "@/lib/simracing/analysis";
import { TimeLossList } from "@/components/dashboard/simracing/charts/time-loss-list";
import { useCursorSync } from "@/components/dashboard/simracing/charts/uplot";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface WorkbenchLap {
    lapNumber: number;
    lapTimeMs: number | null;
    isValid: boolean;
}

/** Zoom window around a picked point, metres either side. */
export const FOCUS_HALF_WINDOW_M = 150;

/** Every lap as a chip: click picks the lap, the reference is marked and the best lap starred. */
export function LapStrip({
    laps,
    lap,
    reference,
    bestLap,
    onPickLap,
    trailing,
}: {
    laps: WorkbenchLap[];
    lap: number | null;
    reference: number | null;
    bestLap: number | null;
    onPickLap: (lap: number) => void;
    trailing?: ReactNode;
}) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto rounded-lg border border-border bg-card px-3 py-2">
            <span className="eyebrow shrink-0 text-[10px]">Laps</span>
            {laps.map(l => {
                const isLap = l.lapNumber === lap;
                const isRef = l.lapNumber === reference;
                return (
                    <button
                        key={l.lapNumber}
                        type="button"
                        onClick={() => onPickLap(l.lapNumber)}
                        aria-pressed={isLap}
                        title={l.isValid ? undefined : "Invalid lap"}
                        className={cn(
                            "inline-flex shrink-0 items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-xs tabular-nums transition-colors",
                            isLap
                                ? "border-primary bg-primary/15 text-primary"
                                : isRef
                                  ? "border-blue-500/50 text-blue-300"
                                  : "border-border text-muted-foreground hover:text-foreground",
                            !l.isValid && "line-through opacity-60"
                        )}
                    >
                        L{l.lapNumber} {formatLapTime(l.lapTimeMs)}
                        {l.lapNumber === bestLap ? <span aria-label="best lap">★</span> : null}
                        {isRef ? <span className="text-[9px] uppercase tracking-wider">ref</span> : null}
                    </button>
                );
            })}
            {trailing ? <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">{trailing}</div> : null}
        </div>
    );
}

/** "Lap 3 vs lap 4": two selects, so any pair of laps in the session can be compared in place. */
export function LapVsPicker({
    laps,
    lap,
    reference,
    onChange,
}: {
    laps: WorkbenchLap[];
    lap: number | null;
    reference: number | null;
    onChange: (lap: number, reference: number) => void;
}) {
    const selectClass =
        "h-8 rounded-md border border-border bg-card px-2 font-mono text-xs tabular-nums text-foreground focus:border-primary/50 focus:outline-none";
    if (lap == null || reference == null) return null;
    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <label className="sr-only" htmlFor="wb-lap">Lap</label>
            <select id="wb-lap" className={selectClass} value={lap} onChange={e => onChange(Number(e.target.value), reference)}>
                {laps.map(l => (
                    <option key={l.lapNumber} value={l.lapNumber}>
                        Lap {l.lapNumber} · {formatLapTime(l.lapTimeMs)}
                    </option>
                ))}
            </select>
            <span>vs</span>
            <label className="sr-only" htmlFor="wb-ref">Reference lap</label>
            <select id="wb-ref" className={selectClass} value={reference} onChange={e => onChange(lap, Number(e.target.value))}>
                {laps.map(l => (
                    <option key={l.lapNumber} value={l.lapNumber}>
                        Lap {l.lapNumber} · {formatLapTime(l.lapTimeMs)}
                    </option>
                ))}
            </select>
        </div>
    );
}

/** Time losses; picking one moves every chart and the map to it and zooms there. */
export function SyncedLosses({
    losses,
    totalDelta,
    referenceLabel,
    onFocus,
}: {
    losses: TimeLoss[];
    totalDelta: number | null;
    referenceLabel: string;
    onFocus: (distanceM: number) => void;
}) {
    const sync = useCursorSync();
    return (
        <TimeLossList
            losses={losses}
            totalDelta={totalDelta}
            referenceLabel={referenceLabel}
            onSelect={d => {
                sync.setDistance(d);
                sync.setZoom([Math.max(0, d - FOCUS_HALF_WINDOW_M), d + FOCUS_HALF_WINDOW_M]);
                onFocus(d);
            }}
        />
    );
}

/** Applies a shared-link cursor (`?at=` metres) once the charts exist. */
export function InitialFocus({ at, ready }: { at: number | null; ready: boolean }) {
    const sync = useCursorSync();
    const done = useRef(false);
    useEffect(() => {
        if (done.current || !ready || at == null) return;
        done.current = true;
        // Let uPlot register its instances first.
        const id = window.setTimeout(() => {
            sync.setDistance(at);
            sync.setZoom([Math.max(0, at - FOCUS_HALF_WINDOW_M), at + FOCUS_HALF_WINDOW_M]);
        }, 300);
        return () => window.clearTimeout(id);
    }, [at, ready, sync]);
    return null;
}

export interface DetailsTab {
    key: string;
    label: string;
    node: ReactNode;
}

/** Everything secondary, one tab each, in a side sheet so the main column stays the analysis. */
export function DetailsSheet({
    open,
    onOpenChange,
    tabs,
    title,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tabs: DetailsTab[];
    title: string;
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
                <SheetHeader>
                    <SheetTitle className="font-display text-2xl">{title}</SheetTitle>
                </SheetHeader>
                <Tabs defaultValue={tabs[0]?.key} className="px-4 pb-6">
                    <TabsList className="flex h-auto flex-wrap justify-start">
                        {tabs.map(t => (
                            <TabsTrigger key={t.key} value={t.key} className="text-xs">
                                {t.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {tabs.map(t => (
                        <TabsContent key={t.key} value={t.key} className="mt-4">
                            {t.node}
                        </TabsContent>
                    ))}
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
