"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Flag, LineChart, Timer, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/simracing/section-card";
import { PlanGate } from "@/components/dashboard/simracing/plan-gate";
import { TrackMapV2, type TrackMapV2Lap } from "@/components/dashboard/simracing/charts/track-map-v2";
import {
    CursorSyncProvider,
    UPlotDelta,
    UPlotTraces,
    type DeltaLap,
    type TraceLap,
} from "@/components/dashboard/simracing/charts/uplot";
import { LapPicker, type LapPickerSelection } from "@/components/dashboard/simracing/analysis/lap-picker";
import { CornerTable } from "@/components/dashboard/simracing/analysis/corner-table";
import { useAnalysisData } from "@/components/dashboard/simracing/analysis/use-analysis-data";
import { PlotFrame } from "@/components/dashboard/simracing/plots/plot-frame";
import { formatDelta, formatLapTime, getTrackProfile } from "@/lib/simracing/api";
import { overlayDelta, toDistanceSeriesFromColumnar, lapColor } from "@/lib/simracing/lap-telemetry";
import type { LapChannels } from "@/lib/simracing/lap-telemetry";
import type { LapOverlayEntryDto, TrackProfileDto, MultiChannelChartData } from "@/lib/simracing/protocol";
import { SIM_PLOTS, SIM_PLOT_CATEGORIES, type SimPlotCategory, type SimPlotContext } from "@/lib/simracing/plot-catalog";
import { cn } from "@/lib/utils";

/** Converts one overlay lap's channel dictionary into the Float32Array-backed shape charts want. */
function channelsRecord(lap: LapOverlayEntryDto, n: number): Record<string, Float32Array> {
    const out: Record<string, Float32Array> = {};
    for (const [key, values] of Object.entries(lap.channels)) {
        const arr = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const v = values[i];
            arr[i] = v == null ? NaN : v;
        }
        out[key] = arr;
    }
    return out;
}

function lastFinite(arr: Float32Array | number[]): number | null {
    for (let i = arr.length - 1; i >= 0; i--) if (!Number.isNaN(arr[i])) return arr[i];
    return null;
}

export default function AnalysisPage() {
    return (
        <Suspense
            fallback={
                <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
                    <SectionCard loading />
                </main>
            }
        >
            <AnalysisWorkspace />
        </Suspense>
    );
}

function AnalysisWorkspace() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const trackId = searchParams.get("track");
    const refLapId = searchParams.get("ref");
    const lapIds = useMemo(() => searchParams.get("laps")?.split(",").filter(Boolean) ?? [], [searchParams]);

    const updateSelection = useCallback(
        (next: LapPickerSelection) => {
            const params = new URLSearchParams(searchParams.toString());
            if (next.trackId) params.set("track", next.trackId);
            else params.delete("track");
            if (next.refLapId) params.set("ref", next.refLapId);
            else params.delete("ref");
            if (next.lapIds.length) params.set("laps", next.lapIds.join(","));
            else params.delete("laps");
            const qs = params.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        },
        [searchParams, router, pathname]
    );

    // The reference lap must lead the request arrays: `getLapOverlay`'s laps come back in request
    // order and `compareCorners` deltas everything against the first id.
    const orderedLapIds = useMemo(
        () => (refLapId ? [refLapId, ...lapIds.filter(id => id !== refLapId)] : lapIds),
        [refLapId, lapIds]
    );

    const { overlay, corners, loading, error, isPlanGated } = useAnalysisData(trackId, refLapId, orderedLapIds);

    const [trackProfile, setTrackProfile] = useState<TrackProfileDto | null>(null);
    useEffect(() => {
        if (!trackId) {
            setTrackProfile(null);
            return;
        }
        let cancelled = false;
        getTrackProfile(trackId)
            .then(p => {
                if (!cancelled) setTrackProfile(p);
            })
            .catch(() => {
                if (!cancelled) setTrackProfile(null);
            });
        return () => {
            cancelled = true;
        };
    }, [trackId]);

    const colorOf = useCallback((lapId: string) => lapColor(Math.max(0, orderedLapIds.indexOf(lapId))), [orderedLapIds]);

    const refEntry = useMemo(
        () => overlay?.laps.find(l => l.lapId === overlay.refLapId) ?? null,
        [overlay]
    );

    // ---- Delta trace --------------------------------------------------------
    const deltaXY = useMemo(() => (overlay ? overlayDelta(overlay) : null), [overlay]);

    const deltaLaps: DeltaLap[] = useMemo(() => {
        if (!overlay || !deltaXY) return [];
        const laps: DeltaLap[] = [];
        overlay.laps.forEach((lap, i) => {
            const ys = deltaXY.ys[i];
            if (!ys) return; // the reference lap has a null delta trace
            const deltaS = new Float32Array(ys.length);
            for (let j = 0; j < ys.length; j++) deltaS[j] = Number.isNaN(ys[j]) ? NaN : ys[j] / 1000;
            laps.push({ id: lap.lapId, label: `Lap ${lap.lapNumber}`, color: colorOf(lap.lapId), deltaS });
        });
        return laps;
    }, [overlay, deltaXY, colorOf]);

    const primaryLapId = lapIds.find(id => id !== refLapId) ?? null;
    const primaryDeltaLap = deltaLaps.find(d => d.id === primaryLapId) ?? null;
    const primaryFinalDeltaMs = primaryDeltaLap ? ((lastFinite(primaryDeltaLap.deltaS) ?? 0) * 1000) : null;

    // ---- Traces ---------------------------------------------------------------
    const traceX = useMemo(() => {
        if (!overlay) return new Float32Array(0);
        const x = new Float32Array(overlay.sampleCount);
        for (let i = 0; i < overlay.sampleCount; i++) x[i] = i * overlay.stepM;
        return x;
    }, [overlay]);

    const traceLaps: TraceLap[] = useMemo(() => {
        if (!overlay) return [];
        return overlay.laps.map(lap => ({
            id: lap.lapId,
            label: `Lap ${lap.lapNumber}`,
            color: colorOf(lap.lapId),
            channels: channelsRecord(lap, overlay.sampleCount),
            corners: lap.corners,
            dashed: lap.lapId === overlay.refLapId,
            lapTimeMs: lap.lapTimeMs,
        }));
    }, [overlay, colorOf]);

    const cornerSource = traceLaps.find(l => l.dashed) ?? traceLaps[0];

    // ---- Track map v2 (real XY / centreline) -----------------------------------
    const trackMapV2Laps: TrackMapV2Lap[] = useMemo(() => {
        if (!overlay) return [];
        return overlay.laps.map(lap => {
            const trace = traceLaps.find(t => t.id === lap.lapId);
            const delta = deltaLaps.find(d => d.id === lap.lapId);
            return {
                id: lap.lapId,
                label: `Lap ${lap.lapNumber}`,
                color: colorOf(lap.lapId),
                x: trace?.channels.posX ?? null,
                y: trace?.channels.posY ?? null,
                stepM: overlay.stepM,
                speed: trace?.channels.speed ?? null,
                gear: trace?.channels.gear ?? null,
                throttle: trace?.channels.throttle ?? null,
                brake: trace?.channels.brake ?? null,
                deltaS: delta?.deltaS ?? null,
                corners: lap.corners,
            };
        });
    }, [overlay, traceLaps, deltaLaps, colorOf]);

    // ---- Track map (reference lap) --------------------------------------------
    const trackMapInputs = useMemo(() => {
        if (!overlay || !refEntry) return null;
        const columnar: LapChannels = {
            stepM: overlay.stepM,
            n: overlay.sampleCount,
            channels: channelsRecord(refEntry, overlay.sampleCount),
        };
        const series = toDistanceSeriesFromColumnar(columnar, {
            lapId: refEntry.lapId,
            trackProfileId: overlay.track?.id ?? null,
        });
        const hasHeading = series.samples.some(s => s.heading != null);
        const raw: MultiChannelChartData = {
            channels: hasHeading ? ["heading"] : [],
            points: series.samples.map(s => ({
                timestamp: s.timestamp,
                values: { heading: s.heading ?? null } as Record<string, number | null>,
            })),
        };
        return { samples: series.samples, raw };
    }, [overlay, refEntry]);

    // ---- Corner table -----------------------------------------------------
    const cornerLaps = useMemo(
        () =>
            corners?.lapIds.map(id => {
                const entry = overlay?.laps.find(l => l.lapId === id);
                return { id, label: entry ? `Lap ${entry.lapNumber}` : id.slice(0, 6), color: colorOf(id) };
            }) ?? [],
        [corners, overlay, colorOf]
    );

    const bestLapMs = useMemo(() => {
        if (!overlay) return null;
        const times = overlay.laps.map(l => l.lapTimeMs).filter((t): t is number => t != null && t > 0);
        return times.length ? Math.min(...times) : null;
    }, [overlay]);

    // ---- More plots catalog ------------------------------------------------
    const [plotCategory, setPlotCategory] = useState<SimPlotCategory>("corners");

    const plotCtx: SimPlotContext | null = useMemo(() => {
        if (!overlay) return null;
        const colors: Record<string, string> = {};
        const labels: Record<string, string> = {};
        for (const lap of overlay.laps) {
            colors[lap.lapId] = colorOf(lap.lapId);
            labels[lap.lapId] = `Lap ${lap.lapNumber}`;
        }
        return { overlay, corners: corners ?? null, refLapId: overlay.refLapId, colors, labels };
    }, [overlay, corners, colorOf]);

    const plotsInCategory = useMemo(() => SIM_PLOTS.filter(p => p.category === plotCategory), [plotCategory]);

    return (
        <main className="w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <PageHeader
                label="Sim racing"
                title="Analysis"
                description="Overlay laps on a shared distance axis and see exactly where the time went."
                stats={[
                    { icon: Flag, label: "Track", value: trackProfile?.displayName ?? "—" },
                    { icon: LineChart, label: "Laps selected", value: lapIds.length },
                    { icon: Timer, label: "Best lap", value: formatLapTime(bestLapMs) },
                    {
                        icon: TrendingDown,
                        label: "Delta",
                        value: primaryFinalDeltaMs != null ? formatDelta(primaryFinalDeltaMs) : "—",
                        iconClassName: (primaryFinalDeltaMs ?? 0) > 0 ? "text-red-500" : "text-green-500",
                    },
                ]}
            />

            <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
                <LapPicker
                    trackId={trackId}
                    refLapId={refLapId}
                    lapIds={lapIds}
                    onChange={updateSelection}
                />

                <div className="space-y-4">
                    {error ? (
                        <p className="border border-red-500/30 bg-red-950/10 px-4 py-3 text-xs text-red-300">{error}</p>
                    ) : null}

                    {!refLapId || lapIds.length < 2 ? (
                        <SectionCard
                            emptyIcon={LineChart}
                            empty="Pick at least two laps in the left rail to build an overlay."
                        />
                    ) : (
                        <CursorSyncProvider>
                            <SectionCard label="Delta" title="Time gained / lost vs reference" loading={loading}>
                                {overlay && deltaLaps.length ? (
                                    <UPlotDelta
                                        x={traceX}
                                        laps={deltaLaps}
                                        referenceLabel={refEntry ? `Lap ${refEntry.lapNumber}` : "reference"}
                                        corners={refEntry?.corners}
                                    />
                                ) : null}
                            </SectionCard>

                            <SectionCard label="Traces" title="Distance traces" loading={loading}>
                                {overlay ? (
                                    <UPlotTraces
                                        x={traceX}
                                        laps={traceLaps}
                                        cornerSource={cornerSource}
                                        sectorBoundariesM={overlay.track?.sectorBoundariesM}
                                    />
                                ) : null}
                            </SectionCard>

                            <PlanGate
                                required="PRO"
                                title="Corner by corner"
                                description="Braking points, apex speed and throttle application compared corner by corner."
                            >
                                <SectionCard label="Corners" title="Corner by corner" loading={loading} flush>
                                    {corners ? <CornerTable data={corners} laps={cornerLaps} /> : null}
                                </SectionCard>
                            </PlanGate>

                            <SectionCard label="Track" title="Racing line" loading={loading}>
                                {overlay && trackMapV2Laps.length ? (
                                    <TrackMapV2
                                        centerline={overlay.track?.centerline ?? null}
                                        laps={trackMapV2Laps}
                                        referenceLapId={overlay.refLapId}
                                        fallbackSamples={trackMapInputs?.samples}
                                        fallbackRaw={trackMapInputs?.raw}
                                    />
                                ) : null}
                            </SectionCard>

                            {isPlanGated ? (
                                <p className="border border-primary/30 bg-primary/5 px-4 py-3 text-xs text-zinc-400">
                                    Some of this overlay needs a higher plan — upgrade to see every selected lap.
                                </p>
                            ) : null}

                            {plotCtx ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">More plots</p>
                                        <div className="flex flex-wrap gap-1">
                                            {SIM_PLOT_CATEGORIES.map(cat => (
                                                <button
                                                    key={cat.key}
                                                    type="button"
                                                    aria-pressed={plotCategory === cat.key}
                                                    onClick={() => setPlotCategory(cat.key)}
                                                    className={cn(
                                                        "border px-2.5 py-1 text-[11px] font-bold transition-colors",
                                                        plotCategory === cat.key
                                                            ? "border-primary/50 bg-primary/15 text-primary"
                                                            : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                                                    )}
                                                >
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 xl:grid-cols-2">
                                        {plotsInCategory.map(def =>
                                            def.isPro ? (
                                                <PlanGate
                                                    key={def.key}
                                                    required="PRO"
                                                    title={def.title}
                                                    description={def.description}
                                                >
                                                    <PlotFrame definition={def} ctx={plotCtx} />
                                                </PlanGate>
                                            ) : (
                                                <PlotFrame key={def.key} definition={def} ctx={plotCtx} />
                                            )
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </CursorSyncProvider>
                    )}
                </div>
            </div>
        </main>
    );
}
