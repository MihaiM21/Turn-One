"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    ArrowLeft,
    Flag,
    Lock,
    Globe,
    LineChart as LineChartAnalysis,
    PanelRightOpen,
    Sparkles,
    Timer,
    Zap,
    RefreshCw,
} from "lucide-react";
import { SectionCard, StatStrip, Stat } from "@/components/dashboard/simracing/section-card";
import { PlanGate } from "@/components/dashboard/simracing/plan-gate";
import { CoachingPanel } from "@/components/dashboard/simracing/coaching/coaching-panel";
import { DistanceTraceChart } from "@/components/dashboard/simracing/charts/distance-trace-chart";
import { DeltaTraceChart } from "@/components/dashboard/simracing/charts/delta-trace-chart";
import { TrackMap } from "@/components/dashboard/simracing/charts/track-map";
import { TrackMapV2 } from "@/components/dashboard/simracing/charts/track-map-v2";
import { CursorSyncProvider, UPlotDelta, UPlotTraces, type TraceLap } from "@/components/dashboard/simracing/charts/uplot";
import { FrictionCircleChart } from "@/components/dashboard/simracing/charts/friction-circle";
import { DrivingStylePanel } from "@/components/dashboard/simracing/charts/driving-style-panel";
import { ShiftHistogram } from "@/components/dashboard/simracing/charts/shift-histogram";
import { LapEvolutionChart } from "@/components/dashboard/simracing/charts/lap-evolution-chart";
import { SectorMatrixTable } from "@/components/dashboard/simracing/charts/sector-matrix";
import { ShareCardButton } from "@/components/dashboard/simracing/share-card";
import { LapEligibility } from "@/components/dashboard/simracing/lap-eligibility";
import {
    DetailsSheet,
    InitialFocus,
    LapStrip,
    LapVsPicker,
    SegmentStepper,
    SyncedLosses,
    type DetailsTab,
    type WorkbenchLap,
} from "@/components/dashboard/simracing/workbench";
import type { LapTelemetryDto, MultiChannelChartData } from "@/lib/simracing/protocol";
import { fromLapTelemetryDto } from "@/lib/simracing/lap-telemetry";
import type { DistanceSeries } from "@/lib/simracing/analysis";
import {
    getSession,
    getLaps,
    getSummary,
    getLapChart,
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
import { cn } from "@/lib/utils";
import { buildSegments, segmentDeltas } from "@/lib/simracing/segments";
import { buildTimeAxis, cornerOnAxis } from "@/lib/simracing/time-axis";
import { DISTANCE_AXIS, type AxisMap } from "@/components/dashboard/simracing/charts/uplot/cursor-sync";
import { usePlan } from "@/hooks/use-plan";

/**
 * /simracing/sessions/[id] — the session workbench (PBI-068, layout A "Split", chosen 2026-11-25).
 * One screen: map and time losses on the left, delta and traces on the right, laps along the
 * bottom, everything secondary in the Details sheet. Lap, reference and a picked point live in
 * the URL (`?lap=3&ref=4&at=1520`), so a shared link opens the same view.
 */

const EMPTY_CHART: MultiChannelChartData = { channels: [], points: [] };
const LAP_COLOR = "#ef4444";
const REF_COLOR = "#3b82f6";

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

/** Remembers the chart x axis (distance or lap time) per browser. */
const AXIS_KEY = "t1.workbench.axis";

const numParam = (v: string | null) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

export default function SessionWorkbenchPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const pathname = usePathname();
    const search = useSearchParams();

    const [session, setSession] = useState<SimSession | null>(null);
    const [laps, setLaps] = useState<SimLap[]>([]);
    const [summary, setSummary] = useState<SimSessionSummary | null>(null);
    const [loading, setLoading] = useState(true);

    // View state, seeded from the URL once.
    const [selectedLap, setSelectedLap] = useState<number | null>(() => numParam(search.get("lap")));
    const [referenceLap, setReferenceLap] = useState<number | null>(() => numParam(search.get("ref")));
    const [focusAt, setFocusAt] = useState<number | null>(() => numParam(search.get("at")));
    const [axisKind, setAxisKind] = useState<"distance" | "time">(() => (search.get("x") === "time" ? "time" : "distance"));
    const chooseAxis = (k: "distance" | "time") => {
        setAxisKind(k);
        try {
            localStorage.setItem(AXIS_KEY, k);
        } catch {
            // Private mode or blocked storage: the URL still carries the choice.
        }
    };
    // No axis in the URL: fall back to this browser's last choice.
    useEffect(() => {
        if (search.get("x")) return;
        try {
            if (localStorage.getItem(AXIS_KEY) === "time") setAxisKind("time");
        } catch {
            // Storage unavailable: stay on distance.
        }
        // Read once on mount; the URL effect below owns later changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const [detailsOpen, setDetailsOpen] = useState(false);

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

    const workbenchLaps: WorkbenchLap[] = useMemo(
        () => laps.map(l => ({ lapNumber: l.lapNumber, lapTimeMs: l.lapTimeMs, isValid: l.isValid })),
        [laps]
    );

    /** Fastest valid lap — the default reference. */
    const bestLapNumber = useMemo(() => {
        const valid = laps.filter(l => l.isValid && l.lapTimeMs && l.lapTimeMs > 0);
        if (!valid.length) return null;
        return valid.reduce((best, l) => (l.lapTimeMs! < best.lapTimeMs! ? l : best)).lapNumber;
    }, [laps]);

    // Defaults: reference = best lap; lap = the latest valid lap that isn't the reference (else the reference).
    useEffect(() => {
        if (!laps.length) return;
        const exists = (n: number | null) => n != null && laps.some(l => l.lapNumber === n);
        const ref = exists(referenceLap) ? referenceLap : (bestLapNumber ?? laps[0].lapNumber);
        if (ref !== referenceLap) setReferenceLap(ref);
        if (!exists(selectedLap)) {
            // Prefer a valid lap; fall back to any timed lap so a session with one valid lap still compares.
            const timed = [...laps].reverse().filter(l => l.lapNumber !== ref && (l.lapTimeMs ?? 0) > 0);
            const other = timed.find(l => l.isValid) ?? timed[0];
            setSelectedLap(other?.lapNumber ?? ref);
        }
    }, [laps, bestLapNumber, referenceLap, selectedLap]);

    // Mirror the view into the URL without adding history entries.
    useEffect(() => {
        if (selectedLap == null || referenceLap == null) return;
        const sp = new URLSearchParams(search.toString());
        sp.set("lap", String(selectedLap));
        sp.set("ref", String(referenceLap));
        if (focusAt != null) sp.set("at", String(Math.round(focusAt)));
        else sp.delete("at");
        if (axisKind === "time") sp.set("x", "time");
        else sp.delete("x");
        if (sp.toString() !== search.toString()) router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    }, [selectedLap, referenceLap, focusAt, axisKind, pathname, router, search]);

    // ---- load telemetry --------------------------------------------------
    const loadCharts = useCallback(
        async (lap: number | null, ref: number | null) => {
            if (!id || lap == null) return;
            setChartLoading(true);
            try {
                // Processed lap records first; the raw Influx chart is the fallback for legacy / unprocessed laps.
                const record = await tryLapRecord(id, lap);
                setLapRecord(record);
                setLapChart(record ? EMPTY_CHART : await getLapChart(id, lap));

                if (ref != null && ref !== lap) {
                    const refRec = await tryLapRecord(id, ref);
                    setRefRecord(refRec);
                    setReferenceChart(refRec ? EMPTY_CHART : await getLapChart(id, ref));
                } else {
                    setRefRecord(null);
                    setReferenceChart(EMPTY_CHART);
                }
            } catch (err) {
                if (err instanceof SimApiError && err.isPlanGated) {
                    setLapChart(EMPTY_CHART);
                } else {
                    toast.error("Couldn't load telemetry for this lap.");
                }
            } finally {
                setChartLoading(false);
            }
        },
        [id]
    );

    useEffect(() => {
        loadCharts(selectedLap, referenceLap);
        setCursor(null);
    }, [selectedLap, referenceLap, loadCharts]);

    // ---- derived analysis ------------------------------------------------
    const lapParsed = useMemo(() => (lapRecord ? fromLapTelemetryDto(lapRecord) : null), [lapRecord]);
    const refParsed = useMemo(() => (refRecord ? fromLapTelemetryDto(refRecord) : null), [refRecord]);

    const lapSeries: DistanceSeries = useMemo(() => lapParsed?.series ?? toDistanceSeries(lapChart, undefined), [lapParsed, lapChart]);
    const refSeries: DistanceSeries = useMemo(() => refParsed?.series ?? toDistanceSeries(referenceChart, undefined), [refParsed, referenceChart]);

    // Server records are already on a uniform grid; only the raw Influx path needs resampling.
    const lapSamples = useMemo(() => (lapParsed ? lapSeries.samples : resampleByDistance(lapSeries, 5)), [lapParsed, lapSeries]);
    const refSamples = useMemo(() => (refParsed ? refSeries.samples : resampleByDistance(refSeries, 5)), [refParsed, refSeries]);

    const isSameLap = selectedLap != null && selectedLap === referenceLap;

    const traceLaps: TraceLap[] = useMemo(() => {
        if (!lapParsed || selectedLap == null) return [];
        const out: TraceLap[] = [
            {
                id: lapParsed.series.lapId ?? "lap",
                label: `Lap ${selectedLap}`,
                color: LAP_COLOR,
                channels: lapParsed.columnar.channels,
                corners: lapParsed.corners,
                lapTimeMs: laps.find(l => l.lapNumber === selectedLap)?.lapTimeMs,
            },
        ];
        if (refParsed && referenceLap != null && !isSameLap) {
            out.push({
                id: refParsed.series.lapId ?? "ref",
                label: `Lap ${referenceLap}`,
                color: REF_COLOR,
                channels: refParsed.columnar.channels,
                corners: refParsed.corners,
                dashed: true,
                lapTimeMs: laps.find(l => l.lapNumber === referenceLap)?.lapTimeMs,
            });
        }
        return out;
    }, [lapParsed, refParsed, selectedLap, referenceLap, isSameLap, laps]);

    const traceX = useMemo(() => {
        if (!lapParsed) return new Float32Array(0);
        const n = Math.max(lapParsed.columnar.n, refParsed?.columnar.n ?? 0);
        const step = lapParsed.columnar.stepM;
        return Float32Array.from({ length: n }, (_, i) => i * step);
    }, [lapParsed, refParsed]);

    // Time axis (PBI-071): same grid, x = the selected lap's elapsed time; map, losses and stepper stay in metres.
    const timeAxis = useMemo(
        () =>
            lapParsed && axisKind === "time"
                ? buildTimeAxis(lapParsed.series.samples.map(p => p.time), lapParsed.columnar.stepM, traceX.length)
                : null,
        [lapParsed, axisKind, traceX]
    );
    const axisMap: AxisMap = useMemo(
        () => (timeAxis ? { kind: "time", toX: timeAxis.toX, fromX: timeAxis.fromX } : DISTANCE_AXIS),
        [timeAxis]
    );
    const chartX = timeAxis?.x ?? traceX;
    const chartLaps = useMemo(
        () => (timeAxis ? traceLaps.map(l => ({ ...l, corners: l.corners?.map(c => cornerOnAxis(c, timeAxis.toX)) })) : traceLaps),
        [traceLaps, timeAxis]
    );

    const delta = useMemo(() => (refSeries.samples.length ? deltaTrace(lapSeries, refSeries, 5) : []), [lapSeries, refSeries]);
    const losses = useMemo(() => (delta.length ? biggestLoss(delta, lapSamples, 5) : []), [delta, lapSamples]);
    const totalDelta = delta.length ? delta[delta.length - 1].delta : null;

    /** The 5 m delta resampled onto the trace grid, so the uPlot delta shares the cursor and zoom. */
    const deltaOnTraceGrid = useMemo(() => {
        if (!lapParsed || !delta.length) return null;
        const step = lapParsed.columnar.stepM;
        return Float32Array.from({ length: traceX.length }, (_, i) => {
            const d = delta[Math.round((i * step) / 5)];
            return d ? d.delta : NaN;
        });
    }, [lapParsed, delta, traceX]);

    const trackMapV2Laps = useMemo(() => {
        if (!lapParsed || selectedLap == null) return [];
        const c = lapParsed.columnar;
        return [
            {
                id: lapParsed.series.lapId ?? "lap",
                label: `Lap ${selectedLap}`,
                color: LAP_COLOR,
                x: c.channels.posX ?? null,
                y: c.channels.posY ?? null,
                stepM: c.stepM,
                speed: c.channels.speed ?? null,
                gear: c.channels.gear ?? null,
                throttle: c.channels.throttle ?? null,
                brake: c.channels.brake ?? null,
                deltaS: deltaOnTraceGrid ? deltaOnTraceGrid.subarray(0, c.n) : null,
                corners: lapParsed.corners,
            },
        ];
    }, [lapParsed, selectedLap, deltaOnTraceGrid]);

    /** Corners (kinks left out) and the straights between them, with the time won or lost in each. */
    const segments = useMemo(() => {
        const corners = (refParsed?.corners ?? lapParsed?.corners ?? []).filter(c => !c.isKink);
        return buildSegments(corners, delta.length ? delta[delta.length - 1].distance : 0);
    }, [refParsed, lapParsed, delta]);
    const segDeltas = useMemo(() => segmentDeltas(segments, delta), [segments, delta]);
    const { atLeast } = usePlan();

    const maxRpm = useMemo(() => {
        const rpms = laps.map(l => l.maxRpm).filter(r => r > 0);
        return rpms.length ? Math.max(...rpms) : null;
    }, [laps]);

    // ---- actions ---------------------------------------------------------
    const [reprocessing, setReprocessing] = useState(false);
    const handleReprocess = async () => {
        setReprocessing(true);
        try {
            await reprocessSession(id, true);
            toast.success("Reprocessing from the raw archive — laps refresh as they finish.");
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

    const pickLap = (lap: number) => {
        setFocusAt(null);
        setSelectedLap(lap);
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
                            <p className="text-sm text-muted-foreground">Session not found.</p>
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
    const referenceLapData = laps.find(l => l.lapNumber === referenceLap) ?? null;

    const analysisHref = (() => {
        const sp = new URLSearchParams();
        sp.set("track", session.trackProfileId ?? "");
        const refId = referenceLapData?.id ?? selectedLapData?.id;
        if (refId) sp.set("ref", refId);
        const lapIds = [selectedLapData?.id, referenceLapData?.id].filter((v, i, arr): v is string => v != null && arr.indexOf(v) === i);
        if (lapIds.length) sp.set("laps", lapIds.join(","));
        return `/simracing/analysis?${sp.toString()}`;
    })();

    const refLabel = `lap ${referenceLap ?? "—"}`;
    const buttonClass =
        "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-3 text-xs text-foreground/85 transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50";

    const pickFromDetails = (lap: number) => {
        pickLap(lap);
        setDetailsOpen(false);
    };

    const detailsTabs: DetailsTab[] = [
        {
            key: "summary",
            label: "Summary",
            node: (
                <div className="space-y-4">
                    <StatStrip className="lg:grid-cols-2">
                        <Stat icon={Flag} label="Laps" value={summary?.totalLaps ?? session.lapCount} sub={summary ? `${summary.validLaps} valid` : undefined} />
                        <Stat icon={Timer} label="Best lap" value={formatLapTime(summary?.bestLapMs ?? null)} valueClassName="text-primary" />
                        <Stat
                            icon={Sparkles}
                            label="Theoretical"
                            value={formatLapTime(summary?.theoreticalBestMs ?? null)}
                            sub={summary?.timeLeftOnTableMs ? `${(summary.timeLeftOnTableMs / 1000).toFixed(3)}s on the table` : undefined}
                        />
                        <Stat
                            icon={Zap}
                            label="Top speed"
                            value={summary?.topSpeedKmh ? `${Math.round(summary.topSpeedKmh)} km/h` : "—"}
                            sub={summary?.consistencyStdDevMs != null ? `±${(summary.consistencyStdDevMs / 1000).toFixed(3)}s consistency` : undefined}
                        />
                    </StatStrip>
                    <LapEligibility sessionId={id} />
                    <dl className="grid gap-4 sm:grid-cols-2">
                        {[
                            ["Started", format(new Date(session.startedAt), "MMM d, yyyy · HH:mm")],
                            ["Ended", session.endedAt ? format(new Date(session.endedAt), "MMM d, yyyy · HH:mm") : "—"],
                            ["Fuel / lap", summary?.averageFuelPerLap ? `${summary.averageFuelPerLap.toFixed(2)} L` : "—"],
                            ["Link version", session.clientVersion ? `v${session.clientVersion.replace(/^v/, "")}` : "—"],
                        ].map(([k, v]) => (
                            <div key={k}>
                                <dt className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{k}</dt>
                                <dd className="mt-1 font-mono text-sm text-foreground">{v}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            ),
        },
        {
            key: "pace",
            label: "Lap evolution",
            node: (
                <LapEvolutionChart
                    laps={workbenchLaps.map(l => ({ ...l, sector1Ms: null, sector2Ms: null, sector3Ms: null }))}
                    selectedLap={selectedLap}
                    onSelectLap={pickFromDetails}
                />
            ),
        },
        {
            key: "sectors",
            label: "Sectors",
            node: <SectorMatrixTable laps={laps} selectedLap={selectedLap} onSelectLap={pickFromDetails} />,
        },
        {
            key: "style",
            label: "Driving style",
            node: (
                <PlanGate required="PRO" title="Driving style" description="Your inputs profiled against the reference lap.">
                    <DrivingStylePanel samples={lapSamples} referenceSamples={isSameLap ? null : refSamples} referenceLabel={refLabel} />
                </PlanGate>
            ),
        },
        {
            key: "grip",
            label: "Friction circle",
            node: (
                <PlanGate required="PRO" title="Friction circle" description="How much of the tyre's grip the lap used.">
                    <FrictionCircleChart samples={lapSamples} />
                </PlanGate>
            ),
        },
        {
            key: "gears",
            label: "Shift points",
            node: (
                <PlanGate required="PRO" title="Shift points" description="Where you change gear against the rev limit.">
                    <ShiftHistogram samples={lapSamples} maxRpm={maxRpm} />
                </PlanGate>
            ),
        },
        { key: "coach", label: "Coach", node: <CoachingPanel sessionId={id} lapNumber={selectedLap} /> },
    ];

    const map = trackMapV2Laps.length ? (
        <TrackMapV2 laps={trackMapV2Laps} referenceLapId={trackMapV2Laps[0].id} height={420} fallbackSamples={lapSamples} fallbackRaw={lapChart} />
    ) : (
        <TrackMap samples={lapSamples} raw={lapChart} deltaByDistance={delta} cursorDistance={cursor} onCursorChange={setCursor} height={420} />
    );

    return (
        <main className="w-full space-y-3 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            {/* Header: what this is, which two laps, by how much */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                    <Link
                        href="/simracing/sessions"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        My sessions
                    </Link>
                    <h1 className="font-display mt-2 truncate text-3xl leading-none sm:text-4xl">{session.track}</h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                        {session.carModel}
                        {session.driverName ? ` · ${session.driverName}` : ""} · {format(new Date(session.startedAt), "MMM d, yyyy")}
                        {session.isActive ? <span className="ml-2 text-timing-pb">● Live</span> : null}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <LapVsPicker
                        laps={workbenchLaps}
                        lap={selectedLap}
                        reference={referenceLap}
                        onChange={(lap, ref) => {
                            setFocusAt(null);
                            setSelectedLap(lap);
                            setReferenceLap(ref);
                        }}
                    />
                    {totalDelta != null && !isSameLap ? (
                        <span
                            className={cn("font-mono text-xl tabular-nums", totalDelta > 0 ? "text-red-400" : "text-timing-pb")}
                            aria-label="Lap delta against the reference"
                        >
                            {totalDelta > 0 ? "+" : ""}
                            {totalDelta.toFixed(3)} s
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <ShareCardButton session={session} summary={summary} laps={laps} />
                <Link href={analysisHref} className={buttonClass}>
                    <LineChartAnalysis className="h-3.5 w-3.5" />
                    Compare across sessions
                </Link>
                <button
                    type="button"
                    onClick={handleReprocess}
                    disabled={reprocessing}
                    title="Re-run lap processing from the raw telemetry archive"
                    className={buttonClass}
                >
                    <RefreshCw className={cn("h-3.5 w-3.5", reprocessing && "animate-spin")} />
                    Reprocess
                </button>
                <div className="flex overflow-hidden rounded-md border border-border">
                    <button
                        type="button"
                        onClick={() => handleVisibility(0)}
                        aria-pressed={session.visibility === 0}
                        className={cn(
                            "inline-flex h-8 items-center gap-1.5 px-3 text-xs font-bold transition-colors",
                            session.visibility === 0 ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground/85"
                        )}
                    >
                        <Lock className="h-3 w-3" />
                        Private
                    </button>
                    <button
                        type="button"
                        onClick={() => handleVisibility(1)}
                        aria-pressed={session.visibility === 1}
                        className={cn(
                            "inline-flex h-8 items-center gap-1.5 px-3 text-xs font-bold transition-colors",
                            session.visibility === 1 ? "bg-blue-950/50 text-blue-300" : "text-muted-foreground hover:text-foreground/85"
                        )}
                    >
                        <Globe className="h-3 w-3" />
                        Public
                    </button>
                </div>
            </div>

            <CursorSyncProvider axis={axisMap}>
                <InitialFocus at={focusAt} ready={!chartLoading && traceLaps.length > 0} />

                {/* Wide: map | charts with losses under the map. Below 1280 px: map, charts, losses. */}
                <div className="grid gap-3 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:[grid-template-areas:'map_charts'_'losses_charts']">
                    <section className="min-w-0 space-y-3 rounded-lg border border-border bg-card p-3 xl:[grid-area:map]" aria-label="Track map">
                        {map}
                        {atLeast("PRO") && !isSameLap && segments.length > 1 ? (
                            <SegmentStepper
                                key={`${selectedLap}-${referenceLap}`}
                                segments={segments}
                                deltas={segDeltas}
                                onFocus={setFocusAt}
                            />
                        ) : null}
                    </section>

                    <section
                        className="min-w-0 space-y-3 rounded-lg border border-border bg-card p-3 xl:[grid-area:charts]"
                        aria-label="Delta and traces"
                    >
                        {traceLaps.length ? (
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">X axis</span>
                                <div role="group" aria-label="Chart x axis" className="flex overflow-hidden rounded-md border border-border">
                                    {(["distance", "time"] as const).map(k => (
                                        <button
                                            key={k}
                                            type="button"
                                            aria-pressed={axisKind === k}
                                            onClick={() => chooseAxis(k)}
                                            title={k === "time" ? `Elapsed time of lap ${selectedLap}; both laps stay aligned by position` : "Metres from the line"}
                                            className={cn(
                                                "h-7 px-2.5 text-[11px] font-semibold transition-colors",
                                                axisKind === k ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground/85"
                                            )}
                                        >
                                            {k === "distance" ? "Distance" : "Lap time"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                        <PlanGate required="PRO" title="Lap delta" description="Time gained and lost against the reference lap, along the lap.">
                            {isSameLap ? (
                                <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                                    Pick a different reference lap to see where this lap gained or lost time.
                                </p>
                            ) : traceLaps.length && deltaOnTraceGrid ? (
                                <UPlotDelta
                                    x={chartX}
                                    laps={[{ id: "delta", label: `Lap ${selectedLap}`, color: LAP_COLOR, deltaS: deltaOnTraceGrid }]}
                                    referenceLabel={`Lap ${referenceLap}`}
                                    corners={(chartLaps.find(l => l.dashed) ?? chartLaps[0])?.corners}
                                    height={150}
                                />
                            ) : (
                                <DeltaTraceChart
                                    delta={delta}
                                    lapLabel={`Lap ${selectedLap}`}
                                    referenceLabel={`Lap ${referenceLap}`}
                                    cursorDistance={cursor}
                                    onCursorChange={setCursor}
                                />
                            )}
                        </PlanGate>

                        {chartLoading && !lapSamples.length ? (
                            <SectionCard loading className="border-0" />
                        ) : traceLaps.length ? (
                            <UPlotTraces x={chartX} laps={chartLaps} cornerSource={chartLaps.find(l => l.dashed) ?? chartLaps[0]} paneHeight={95} />
                        ) : (
                            <DistanceTraceChart
                                samples={lapSamples}
                                compareSamples={isSameLap ? null : refSamples}
                                compareLabel={`Lap ${referenceLap}`}
                                availableChannels={lapChart.channels}
                                cursorDistance={cursor}
                                onCursorChange={setCursor}
                            />
                        )}
                    </section>

                    <section className="min-w-0 rounded-lg border border-border bg-card px-4 py-3 xl:[grid-area:losses]" aria-label="Where the time went">
                        <p className="eyebrow mb-2 text-[10px]">Where the time went · vs {refLabel}</p>
                        <PlanGate required="PRO" title="Time losses" description="The sections of the lap that cost the most time, ranked.">
                            {isSameLap ? (
                                <p className="text-xs text-muted-foreground">Same lap on both sides; pick another reference.</p>
                            ) : (
                                <SyncedLosses losses={losses} totalDelta={totalDelta} referenceLabel={refLabel} onFocus={setFocusAt} />
                            )}
                        </PlanGate>
                    </section>
                </div>
            </CursorSyncProvider>

            <LapStrip
                laps={workbenchLaps}
                lap={selectedLap}
                reference={referenceLap}
                bestLap={bestLapNumber}
                onPickLap={pickLap}
                trailing={
                    <button type="button" onClick={() => setDetailsOpen(true)} className={buttonClass}>
                        <PanelRightOpen className="h-3.5 w-3.5" />
                        Details
                    </button>
                }
            />

            {!lapSeries.fromTrackPosition && lapSamples.length ? (
                <p className="rounded-lg border border-blue-500/20 bg-blue-950/10 px-4 py-3 text-xs text-blue-300">
                    Distance for this lap is derived by integrating speed rather than read from the track position channel, so it may drift by
                    a percent or two.
                </p>
            ) : null}

            <DetailsSheet open={detailsOpen} onOpenChange={setDetailsOpen} tabs={detailsTabs} title={`${session.track} · details`} />
        </main>
    );
}
