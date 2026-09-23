"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    ArrowLeft,
    Activity,
    Clock,
    Flag,
    Lock,
    Globe,
    GitCompareArrows,
    LineChart as LineChartAnalysis,
    Gauge,
    Map as MapIcon,
    LineChart,
    Sparkles,
    Bot,
    Timer,
    Zap,
    TrendingDown,
    CircleDot,
    Cog,
    RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard, StatStrip, Stat } from "@/components/dashboard/simracing/section-card";
import { PlanGate } from "@/components/dashboard/simracing/plan-gate";
import { LapSelector, type LapSummary } from "@/components/dashboard/simracing/lap-selector";
import { CoachingPanel } from "@/components/dashboard/simracing/coaching/coaching-panel";
import { DistanceTraceChart } from "@/components/dashboard/simracing/charts/distance-trace-chart";
import { DeltaTraceChart } from "@/components/dashboard/simracing/charts/delta-trace-chart";
import { TrackMap } from "@/components/dashboard/simracing/charts/track-map";
import { TrackMapV2 } from "@/components/dashboard/simracing/charts/track-map-v2";
import { UPlotTraces, type TraceLap } from "@/components/dashboard/simracing/charts/uplot";
import { FrictionCircleChart } from "@/components/dashboard/simracing/charts/friction-circle";
import { DrivingStylePanel } from "@/components/dashboard/simracing/charts/driving-style-panel";
import { ShiftHistogram } from "@/components/dashboard/simracing/charts/shift-histogram";
import { LapEvolutionChart } from "@/components/dashboard/simracing/charts/lap-evolution-chart";
import { SectorMatrixTable } from "@/components/dashboard/simracing/charts/sector-matrix";
import { TimeLossList } from "@/components/dashboard/simracing/charts/time-loss-list";
import { ShareCardButton } from "@/components/dashboard/simracing/share-card";
import type { LapTelemetryDto, MultiChannelChartData } from "@/lib/simracing/protocol";
import { fromLapTelemetryDto } from "@/lib/simracing/lap-telemetry";
import type { DistanceSeries } from "@/lib/simracing/analysis";
import {
    getSession,
    getLaps,
    getSummary,
    getLapChart,
    getChannels,
    getSessionLapTelemetry,
    setVisibility as setVisibilityApi,
    reprocessSession,
    formatLapTime,
    SimApiError,
    type SimSession,
    type SimLap,
    type SimSessionSummary,
} from "@/lib/simracing/api";
import { simTelemetryService, type LapProcessedEvent } from "@/lib/simTelemetryService";
import { toDistanceSeries, resampleByDistance, deltaTrace, biggestLoss } from "@/lib/simracing/analysis";

type Tab = "overview" | "traces" | "analysis" | "coach";

const TABS: { key: Tab; label: string; icon: typeof Gauge }[] = [
    { key: "overview", label: "Overview", icon: Gauge },
    { key: "traces", label: "Traces", icon: LineChart },
    { key: "analysis", label: "Analysis", icon: Sparkles },
    { key: "coach", label: "Coach", icon: Bot },
];

const EMPTY_CHART: MultiChannelChartData = { channels: [], points: [] };

/** The processed lap record, or null when the lap has none yet (404) so callers fall back to the raw chart. */
async function tryLapRecord(sessionId: string, lap: number): Promise<LapTelemetryDto | null> {
    try {
        const dto = await getSessionLapTelemetry(sessionId, lap);
        return dto.sampleCount > 1 ? dto : null;
    } catch (err) {
        if (err instanceof SimApiError && (err.status === 404 || err.isPlanGated)) return null;
        throw err;
    }
}

export default function SessionDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [tab, setTab] = useState<Tab>("overview");
    const [session, setSession] = useState<SimSession | null>(null);
    const [laps, setLaps] = useState<SimLap[]>([]);
    const [summary, setSummary] = useState<SimSessionSummary | null>(null);
    const [loading, setLoading] = useState(true);

    const [selectedLap, setSelectedLap] = useState<number | null>(null);
    const [lapChart, setLapChart] = useState<MultiChannelChartData>(EMPTY_CHART);
    const [referenceChart, setReferenceChart] = useState<MultiChannelChartData>(EMPTY_CHART);
    // Protocol-v2 lap records (2 m grid, corners, XY). Preferred over the raw Influx chart when present.
    const [lapRecord, setLapRecord] = useState<LapTelemetryDto | null>(null);
    const [refRecord, setRefRecord] = useState<LapTelemetryDto | null>(null);
    const [chartLoading, setChartLoading] = useState(false);
    const [cursor, setCursor] = useState<number | null>(null);

    // ---- load session ----------------------------------------------------
    useEffect(() => {
        if (!id) return;
        Promise.allSettled([getSession(id), getLaps(id), getSummary(id)])
            .then(([s, l, sum]) => {
                if (s.status === "fulfilled") setSession(s.value);
                if (l.status === "fulfilled") setLaps(l.value);
                if (sum.status === "fulfilled") setSummary(sum.value);
            })
            .finally(() => setLoading(false));
    }, [id]);

    // ---- refetch laps as they're processed, while the session is still live --------
    useEffect(() => {
        if (!id || !session?.isActive) return;

        const handleLapProcessed = (e: LapProcessedEvent) => {
            if (e.sessionId !== id) return;
            getLaps(id).then(setLaps).catch(() => {});
            getSummary(id).then(setSummary).catch(() => {});
        };

        simTelemetryService.onLapProcessed(handleLapProcessed);
        simTelemetryService.connect();

        return () => {
            simTelemetryService.offLapProcessed(handleLapProcessed);
            simTelemetryService.disconnect();
        };
    }, [id, session?.isActive]);

    const lapSummaries: LapSummary[] = useMemo(
        () => laps.map(l => ({ lapNumber: l.lapNumber, lapTimeMs: l.lapTimeMs, isValid: l.isValid })),
        [laps]
    );

    /** Fastest valid lap — the natural reference for deltas and style comparisons. */
    const bestLapNumber = useMemo(() => {
        const valid = laps.filter(l => l.isValid && l.lapTimeMs && l.lapTimeMs > 0);
        if (!valid.length) return null;
        return valid.reduce((best, l) => (l.lapTimeMs! < best.lapTimeMs! ? l : best)).lapNumber;
    }, [laps]);

    // Default to the best lap: a specific lap is far more useful than a whole-session smear.
    useEffect(() => {
        if (selectedLap == null && bestLapNumber != null) setSelectedLap(bestLapNumber);
    }, [bestLapNumber, selectedLap]);

    // ---- load telemetry --------------------------------------------------
    const loadCharts = useCallback(
        async (lap: number | null) => {
            if (!id) return;
            setChartLoading(true);
            try {
                // Processed lap records first; the raw Influx chart is the fallback for legacy / unprocessed laps.
                const record = lap == null ? null : await tryLapRecord(id, lap);
                setLapRecord(record);
                const primary = record ? EMPTY_CHART : lap == null ? await getChannels(id) : await getLapChart(id, lap);
                setLapChart(primary);

                // Fetch the reference lap too, unless it *is* the selected lap.
                if (bestLapNumber != null && bestLapNumber !== lap) {
                    const ref = await tryLapRecord(id, bestLapNumber);
                    setRefRecord(ref);
                    setReferenceChart(ref ? EMPTY_CHART : await getLapChart(id, bestLapNumber));
                } else {
                    setRefRecord(null);
                    setReferenceChart(EMPTY_CHART);
                }
            } catch (err) {
                if (err instanceof SimApiError && err.isPlanGated) {
                    // The PlanGate around the chart already explains this; don't double-report.
                    setLapChart(EMPTY_CHART);
                } else {
                    toast.error("Couldn't load telemetry for this lap.");
                }
            } finally {
                setChartLoading(false);
            }
        },
        [id, bestLapNumber]
    );

    useEffect(() => {
        loadCharts(selectedLap);
        setCursor(null);
    }, [selectedLap, loadCharts]);

    // ---- derived analysis ------------------------------------------------
    const trackLengthM = undefined; // Not exposed by the API yet; distance falls back to speed integration.

    const lapParsed = useMemo(() => (lapRecord ? fromLapTelemetryDto(lapRecord) : null), [lapRecord]);
    const refParsed = useMemo(() => (refRecord ? fromLapTelemetryDto(refRecord) : null), [refRecord]);

    const lapSeries: DistanceSeries = useMemo(
        () => lapParsed?.series ?? toDistanceSeries(lapChart, trackLengthM),
        [lapParsed, lapChart]
    );
    const refSeries: DistanceSeries = useMemo(
        () => refParsed?.series ?? toDistanceSeries(referenceChart, trackLengthM),
        [refParsed, referenceChart]
    );

    // Server records are already on a uniform grid; only the raw Influx path needs resampling.
    const lapSamples = useMemo(() => (lapParsed ? lapSeries.samples : resampleByDistance(lapSeries, 5)), [lapParsed, lapSeries]);
    const refSamples = useMemo(() => (refParsed ? refSeries.samples : resampleByDistance(refSeries, 5)), [refParsed, refSeries]);

    // uPlot trace stack inputs (v2 only): selected lap solid, best lap dashed, shared distance axis.
    const traceLaps: TraceLap[] = useMemo(() => {
        if (!lapParsed || selectedLap == null) return [];
        const out: TraceLap[] = [
            {
                id: lapParsed.series.lapId ?? "lap",
                label: `Lap ${selectedLap}`,
                color: "#ef4444",
                channels: lapParsed.columnar.channels,
                corners: lapParsed.corners,
                lapTimeMs: laps.find(l => l.lapNumber === selectedLap)?.lapTimeMs,
            },
        ];
        if (refParsed && bestLapNumber != null && bestLapNumber !== selectedLap) {
            out.push({
                id: refParsed.series.lapId ?? "ref",
                label: `Lap ${bestLapNumber}`,
                color: "#3b82f6",
                channels: refParsed.columnar.channels,
                corners: refParsed.corners,
                dashed: true,
                lapTimeMs: laps.find(l => l.lapNumber === bestLapNumber)?.lapTimeMs,
            });
        }
        return out;
    }, [lapParsed, refParsed, selectedLap, bestLapNumber, laps]);
    const traceX = useMemo(() => {
        if (!lapParsed) return new Float32Array(0);
        const n = Math.max(lapParsed.columnar.n, refParsed?.columnar.n ?? 0);
        const step = lapParsed.columnar.stepM;
        return Float32Array.from({ length: n }, (_, i) => i * step);
    }, [lapParsed, refParsed]);

    const delta = useMemo(
        () => (refSeries.samples.length ? deltaTrace(lapSeries, refSeries, 5) : []),
        [lapSeries, refSeries]
    );

    const losses = useMemo(
        () => (delta.length ? biggestLoss(delta, lapSamples, 5) : []),
        [delta, lapSamples]
    );

    // Real-XY track map input (v2 only). The delta trace is on a 5 m grid; resample it onto the lap's grid.
    const trackMapV2Laps = useMemo(() => {
        if (!lapParsed || selectedLap == null) return [];
        const c = lapParsed.columnar;
        const deltaS = delta.length
            ? Float32Array.from({ length: c.n }, (_, i) => {
                  const d = delta[Math.min(delta.length - 1, Math.round((i * c.stepM) / 5))];
                  return d ? d.delta : NaN;
              })
            : null;
        return [
            {
                id: lapParsed.series.lapId ?? "lap",
                label: `Lap ${selectedLap}`,
                color: "#ef4444",
                x: c.channels.posX ?? null,
                y: c.channels.posY ?? null,
                stepM: c.stepM,
                speed: c.channels.speed ?? null,
                gear: c.channels.gear ?? null,
                throttle: c.channels.throttle ?? null,
                brake: c.channels.brake ?? null,
                deltaS,
                corners: lapParsed.corners,
            },
        ];
    }, [lapParsed, selectedLap, delta]);

    const maxRpm = useMemo(() => {
        const rpms = laps.map(l => l.maxRpm).filter(r => r > 0);
        return rpms.length ? Math.max(...rpms) : null;
    }, [laps]);

    // ---- visibility ------------------------------------------------------
    const [reprocessing, setReprocessing] = useState(false);
    const handleReprocess = async () => {
        setReprocessing(true);
        try {
            await reprocessSession(id, true);
            toast.success("Reprocessing from the raw archive — laps refresh as they finish.");
            // Laps land one by one; poll a few times so a finished (non-live) session updates too.
            for (let i = 0; i < 6; i++) {
                await new Promise(r => setTimeout(r, 2500));
                getLaps(id).then(setLaps).catch(() => {});
                getSummary(id).then(setSummary).catch(() => {});
            }
        } catch (err) {
            toast.error(
                err instanceof SimApiError && err.status === 429
                    ? "One reprocess per minute — try again shortly."
                    : "Couldn't start reprocessing."
            );
        } finally {
            setReprocessing(false);
        }
    };

    const handleVisibility = async (next: number) => {
        const previous = session?.visibility;
        setSession(s => (s ? { ...s, visibility: next } : s));
        try {
            await setVisibilityApi(id, next);
            toast.success(next === 1 ? "Session is now public." : "Session is now private.");
        } catch (err) {
            setSession(s => (s && previous != null ? { ...s, visibility: previous } : s));
            toast.error(
                err instanceof SimApiError && err.isPlanGated
                    ? "Public sessions require a PRO or ELITE plan."
                    : "Couldn't change visibility."
            );
        }
    };

    if (loading) {
        return (
            <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
                <SectionCard loading />
            </main>
        );
    }

    if (!session) {
        return (
            <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
                <SectionCard
                    emptyIcon={Flag}
                    empty={
                        <div className="space-y-3">
                            <p className="text-sm text-zinc-400">Session not found.</p>
                            <Link href="/simracing/sessions" className="text-xs font-bold text-primary hover:underline">
                                Back to my sessions
                            </Link>
                        </div>
                    }
                />
            </main>
        );
    }

    const selectedLapData = laps.find(l => l.lapNumber === selectedLap) ?? null;
    const isReferenceLap = selectedLap != null && selectedLap === bestLapNumber;
    const bestLapData = bestLapNumber != null ? (laps.find(l => l.lapNumber === bestLapNumber) ?? null) : null;

    const analysisHref = (() => {
        const params = new URLSearchParams();
        params.set("track", session.trackProfileId ?? "");
        const refId = selectedLapData?.id ?? bestLapData?.id;
        if (refId) params.set("ref", refId);
        const lapIds = [selectedLapData?.id, bestLapData?.id].filter(
            (v, i, arr): v is string => v != null && arr.indexOf(v) === i
        );
        if (lapIds.length) params.set("laps", lapIds.join(","));
        return `/simracing/analysis?${params.toString()}`;
    })();

    return (
        <main className="w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <Link
                href="/simracing/sessions"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:text-primary"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                My sessions
            </Link>

            <PageHeader
                label={session.sessionType?.replace(/^AC_/, "") || "Session"}
                title={session.track}
                description={`${session.carModel}${session.driverName ? ` · ${session.driverName}` : ""}`}
                stats={[
                    { icon: Flag, label: "Laps", value: session.lapCount },
                    { icon: Timer, label: "Best", value: formatLapTime(summary?.bestLapMs ?? session.bestLapMs) },
                    {
                        icon: Activity,
                        label: "Status",
                        value: session.isActive ? "Live" : "Done",
                        iconClassName: session.isActive ? "text-green-500" : "text-zinc-500",
                    },
                ]}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <ShareCardButton session={session} summary={summary} laps={laps} />

                        <Link
                            href={analysisHref}
                            className="inline-flex h-8 items-center gap-1.5 border border-zinc-800 bg-zinc-900/60 px-3 text-xs text-zinc-300 transition-colors hover:border-primary/40 hover:text-primary"
                        >
                            <LineChartAnalysis className="h-3.5 w-3.5" />
                            Open in Analysis
                        </Link>

                        <button
                            type="button"
                            onClick={handleReprocess}
                            disabled={reprocessing}
                            title="Re-run lap processing from the raw telemetry archive"
                            className="inline-flex h-8 items-center gap-1.5 border border-zinc-800 bg-zinc-900/60 px-3 text-xs text-zinc-300 transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${reprocessing ? "animate-spin" : ""}`} />
                            Reprocess
                        </button>

                        <Link
                            href={`/simracing/sessions/${id}/compare`}
                            className="inline-flex h-8 items-center gap-1.5 border border-zinc-800 bg-zinc-900/60 px-3 text-xs text-zinc-300 transition-colors hover:border-primary/40 hover:text-primary"
                        >
                            <GitCompareArrows className="h-3.5 w-3.5" />
                            Compare
                        </Link>

                        <div className="flex border border-zinc-800">
                            <button
                                onClick={() => handleVisibility(0)}
                                className={`inline-flex h-8 items-center gap-1.5 px-3 text-xs font-bold transition-colors ${
                                    session.visibility === 0
                                        ? "bg-zinc-900 text-white"
                                        : "text-zinc-500 hover:text-zinc-300"
                                }`}
                            >
                                <Lock className="h-3 w-3" />
                                Private
                            </button>
                            <button
                                onClick={() => handleVisibility(1)}
                                className={`inline-flex h-8 items-center gap-1.5 px-3 text-xs font-bold transition-colors ${
                                    session.visibility === 1
                                        ? "bg-blue-950/50 text-blue-300"
                                        : "text-zinc-500 hover:text-zinc-300"
                                }`}
                            >
                                <Globe className="h-3 w-3" />
                                Public
                            </button>
                        </div>
                    </div>
                }
            />

            {/* Tabs */}
            <div className="flex gap-px overflow-x-auto bg-zinc-800 p-px">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        aria-pressed={tab === key}
                        className={`inline-flex shrink-0 items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                            tab === key
                                ? "bg-primary/15 text-primary"
                                : "bg-zinc-950 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                        }`}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Lap picker — shared by every tab except Overview */}
            {tab !== "overview" ? (
                <SectionCard
                    label="Lap"
                    title={
                        selectedLap != null
                            ? `Lap ${selectedLap}${isReferenceLap ? " · your reference" : ""}`
                            : "Full session"
                    }
                    icon={Timer}
                    actions={
                        selectedLapData ? (
                            <span className="font-mono text-sm font-bold tabular-nums text-primary">
                                {formatLapTime(selectedLapData.lapTimeMs)}
                            </span>
                        ) : null
                    }
                    flush
                >
                    <LapSelector
                        laps={lapSummaries}
                        selected={selectedLap}
                        onSelect={setSelectedLap}
                        requireLap={tab === "analysis"}
                    />
                </SectionCard>
            ) : null}

            {/* ---------------- Overview ---------------- */}
            {tab === "overview" ? (
                <div className="space-y-4">
                    <StatStrip>
                        <Stat icon={Flag} label="Laps" value={summary?.totalLaps ?? session.lapCount} sub={summary ? `${summary.validLaps} valid` : undefined} />
                        <Stat icon={Timer} label="Best lap" value={formatLapTime(summary?.bestLapMs ?? session.bestLapMs)} valueClassName="text-primary" />
                        <Stat
                            icon={Sparkles}
                            label="Theoretical"
                            value={formatLapTime(summary?.theoreticalBestMs ?? null)}
                            sub={
                                summary?.timeLeftOnTableMs
                                    ? `${(summary.timeLeftOnTableMs / 1000).toFixed(3)}s on the table`
                                    : undefined
                            }
                        />
                        <Stat
                            icon={Zap}
                            label="Top speed"
                            value={summary?.topSpeedKmh ? `${Math.round(summary.topSpeedKmh)} km/h` : "—"}
                            sub={
                                summary?.consistencyStdDevMs != null
                                    ? `±${(summary.consistencyStdDevMs / 1000).toFixed(3)}s consistency`
                                    : undefined
                            }
                        />
                    </StatStrip>

                    <SectionCard label="Pace" title="Lap evolution" icon={TrendingDown}>
                        <LapEvolutionChart
                            laps={lapSummaries.map(l => ({ ...l, sector1Ms: null, sector2Ms: null, sector3Ms: null }))}
                            selectedLap={selectedLap}
                            onSelectLap={lap => {
                                setSelectedLap(lap);
                                setTab("traces");
                            }}
                        />
                    </SectionCard>

                    <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
                        <SectionCard label="Timing" title="Sectors & theoretical best" icon={Timer} flush bodyClassName="px-5 py-4">
                            <SectorMatrixTable
                                laps={laps}
                                selectedLap={selectedLap}
                                onSelectLap={lap => {
                                    setSelectedLap(lap);
                                    setTab("traces");
                                }}
                            />
                        </SectionCard>

                        <SectionCard
                            label="Circuit"
                            title={selectedLap != null ? `Lap ${selectedLap} racing line` : "Racing line"}
                            icon={MapIcon}
                            loading={chartLoading}
                        >
                            {trackMapV2Laps.length ? (
                                <TrackMapV2
                                    laps={trackMapV2Laps}
                                    referenceLapId={trackMapV2Laps[0].id}
                                    height={300}
                                    fallbackSamples={lapSamples}
                                    fallbackRaw={lapChart}
                                />
                            ) : (
                                <TrackMap
                                    samples={lapSamples}
                                    raw={lapChart}
                                    deltaByDistance={delta}
                                    cursorDistance={cursor}
                                    onCursorChange={setCursor}
                                    height={300}
                                />
                            )}
                        </SectionCard>
                    </div>

                    <SectionCard label="Session" title="Details" icon={Clock}>
                        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <dt className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Started</dt>
                                <dd className="mt-1 font-mono text-sm text-white">
                                    {format(new Date(session.startedAt), "MMM d, yyyy · HH:mm")}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Ended</dt>
                                <dd className="mt-1 font-mono text-sm text-white">
                                    {session.endedAt ? format(new Date(session.endedAt), "MMM d, yyyy · HH:mm") : "—"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Fuel / lap</dt>
                                <dd className="mt-1 font-mono text-sm text-white">
                                    {summary?.averageFuelPerLap ? `${summary.averageFuelPerLap.toFixed(2)} L` : "—"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Link version</dt>
                                <dd className="mt-1 font-mono text-sm text-white">
                                    {session.clientVersion ? `v${session.clientVersion.replace(/^v/, "")}` : "—"}
                                </dd>
                            </div>
                        </dl>
                    </SectionCard>
                </div>
            ) : null}

            {/* ---------------- Traces ---------------- */}
            {tab === "traces" ? (
                <div className="space-y-4">
                    <SectionCard
                        label="Telemetry"
                        title={selectedLap != null ? `Lap ${selectedLap} traces` : "Full session traces"}
                        icon={LineChart}
                        loading={chartLoading}
                        actions={
                            refSamples.length && !isReferenceLap ? (
                                <span className="text-[11px] text-zinc-500">
                                    Dashed = lap {bestLapNumber} (your best)
                                </span>
                            ) : null
                        }
                    >
                        {traceLaps.length ? (
                            <UPlotTraces x={traceX} laps={traceLaps} cornerSource={traceLaps.find(l => l.dashed) ?? traceLaps[0]} />
                        ) : (
                            <DistanceTraceChart
                                samples={lapSamples}
                                compareSamples={isReferenceLap ? null : refSamples}
                                compareLabel={`Lap ${bestLapNumber}`}
                                availableChannels={lapChart.channels}
                                cursorDistance={cursor}
                                onCursorChange={setCursor}
                            />
                        )}
                    </SectionCard>

                    <SectionCard label="Circuit" title="Racing line" icon={MapIcon} loading={chartLoading}>
                        {trackMapV2Laps.length ? (
                            <TrackMapV2
                                laps={trackMapV2Laps}
                                referenceLapId={trackMapV2Laps[0].id}
                                fallbackSamples={lapSamples}
                                fallbackRaw={lapChart}
                            />
                        ) : (
                            <TrackMap
                                samples={lapSamples}
                                raw={lapChart}
                                deltaByDistance={delta}
                                cursorDistance={cursor}
                                onCursorChange={setCursor}
                            />
                        )}
                    </SectionCard>

                    {!lapSeries.fromTrackPosition && lapSamples.length ? (
                        <p className="border border-blue-500/20 bg-blue-950/10 px-4 py-3 text-xs text-blue-300">
                            Distance for this lap is derived by integrating speed rather than read from the track
                            position channel, so it may drift by a percent or two. Upgrading to PRO unlocks the
                            position channel for exact alignment.
                        </p>
                    ) : null}
                </div>
            ) : null}

            {/* ---------------- Analysis ---------------- */}
            {tab === "analysis" ? (
                <PlanGate
                    required="PRO"
                    title="Lap analysis"
                    description="Delta traces, time-loss breakdown, driving-style profiling, the friction circle and shift analysis."
                >
                    <div className="space-y-4">
                        {isReferenceLap ? (
                            <p className="border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-400">
                                Lap {selectedLap} is your fastest lap, so there&apos;s nothing to compare it against.
                                Pick a different lap above to see where it lost time.
                            </p>
                        ) : null}

                        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
                            <SectionCard
                                label="Delta"
                                title={`Lap ${selectedLap ?? "—"} vs lap ${bestLapNumber ?? "—"}`}
                                icon={TrendingDown}
                                loading={chartLoading}
                            >
                                <DeltaTraceChart
                                    delta={delta}
                                    lapLabel={`Lap ${selectedLap}`}
                                    referenceLabel={`Lap ${bestLapNumber}`}
                                    cursorDistance={cursor}
                                    onCursorChange={setCursor}
                                />
                            </SectionCard>

                            <SectionCard label="Where it went" title="Biggest time losses" icon={Sparkles}>
                                <TimeLossList
                                    losses={losses}
                                    totalDelta={delta.length ? delta[delta.length - 1].delta : null}
                                    referenceLabel={`lap ${bestLapNumber}`}
                                    onSelect={setCursor}
                                />
                            </SectionCard>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <SectionCard label="Inputs" title="Driving style" icon={Gauge}>
                                <DrivingStylePanel
                                    samples={lapSamples}
                                    referenceSamples={isReferenceLap ? null : refSamples}
                                    referenceLabel={`lap ${bestLapNumber}`}
                                />
                            </SectionCard>

                            <SectionCard label="Grip" title="Friction circle" icon={CircleDot}>
                                <FrictionCircleChart samples={lapSamples} />
                            </SectionCard>
                        </div>

                        <SectionCard label="Gearbox" title="Shift points" icon={Cog}>
                            <ShiftHistogram samples={lapSamples} maxRpm={maxRpm} />
                        </SectionCard>
                    </div>
                </PlanGate>
            ) : null}

            {/* ---------------- Coach ---------------- */}
            {tab === "coach" ? <CoachingPanel sessionId={id} lapNumber={selectedLap} /> : null}
        </main>
    );
}
