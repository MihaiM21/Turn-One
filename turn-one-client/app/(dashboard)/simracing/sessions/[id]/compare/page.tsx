"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, GitCompareArrows, LineChart, Map as MapIcon, TrendingDown, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/simracing/section-card";
import { PlanGate } from "@/components/dashboard/simracing/plan-gate";
import { DeltaTraceChart } from "@/components/dashboard/simracing/charts/delta-trace-chart";
import { DistanceTraceChart } from "@/components/dashboard/simracing/charts/distance-trace-chart";
import { TrackMap } from "@/components/dashboard/simracing/charts/track-map";
import { TimeLossList } from "@/components/dashboard/simracing/charts/time-loss-list";
import type { MultiChannelChartData } from "@/components/dashboard/simracing/charts/multi-channel-chart";
import {
    getSession,
    getMySessions,
    getLaps,
    compare as compareApi,
    formatLapTime,
    SimApiError,
    type SimSession,
    type SimLap,
} from "@/lib/simracing/api";
import { toDistanceSeries, resampleByDistance, deltaTrace, biggestLoss } from "@/lib/simracing/analysis";

const EMPTY: MultiChannelChartData = { channels: [], points: [] };

export default function CompareSessionPage() {
    const params = useParams();
    const id = params.id as string;

    const [primary, setPrimary] = useState<SimSession | null>(null);
    const [candidates, setCandidates] = useState<SimSession[]>([]);
    const [primaryLaps, setPrimaryLaps] = useState<SimLap[]>([]);
    const [againstLaps, setAgainstLaps] = useState<SimLap[]>([]);

    const [againstId, setAgainstId] = useState("");
    const [primaryLap, setPrimaryLap] = useState("");
    const [againstLap, setAgainstLap] = useState("");

    const [primaryData, setPrimaryData] = useState<MultiChannelChartData>(EMPTY);
    const [secondaryData, setSecondaryData] = useState<MultiChannelChartData | null>(null);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState<number | null>(null);

    useEffect(() => {
        if (!id) return;
        Promise.allSettled([getSession(id), getMySessions(), getLaps(id)]).then(([self, mine, laps]) => {
            if (self.status === "fulfilled") setPrimary(self.value);
            if (mine.status === "fulfilled") setCandidates(mine.value.filter(s => s.id !== id));
            if (laps.status === "fulfilled") setPrimaryLaps(laps.value);
        });
    }, [id]);

    // Load the other session's laps so its lap picker shows real times, not a bare number box.
    useEffect(() => {
        if (!againstId) {
            setAgainstLaps([]);
            setAgainstLap("");
            return;
        }
        getLaps(againstId)
            .then(setAgainstLaps)
            .catch(() => setAgainstLaps([]));
    }, [againstId]);

    const runCompare = useCallback(async () => {
        if (!id || !againstId) return;
        setLoading(true);
        try {
            const body = await compareApi(id, againstId, {
                lap: primaryLap ? Number(primaryLap) : null,
                againstLap: againstLap ? Number(againstLap) : null,
            });
            setPrimaryData(body.primary.data);
            setSecondaryData(body.secondary.data);
        } catch (err) {
            toast.error(
                err instanceof SimApiError && err.isPlanGated
                    ? "Session comparison requires a PRO or ELITE plan."
                    : "Couldn't load the comparison."
            );
        } finally {
            setLoading(false);
        }
    }, [id, againstId, primaryLap, againstLap]);

    // ---- derived ----
    const primarySeries = useMemo(() => toDistanceSeries(primaryData), [primaryData]);
    const secondarySeries = useMemo(
        () => (secondaryData ? toDistanceSeries(secondaryData) : null),
        [secondaryData]
    );

    const primarySamples = useMemo(() => resampleByDistance(primarySeries, 5), [primarySeries]);
    const secondarySamples = useMemo(
        () => (secondarySeries ? resampleByDistance(secondarySeries, 5) : []),
        [secondarySeries]
    );

    const delta = useMemo(
        () => (secondarySeries ? deltaTrace(primarySeries, secondarySeries, 5) : []),
        [primarySeries, secondarySeries]
    );

    const losses = useMemo(
        () => (delta.length ? biggestLoss(delta, primarySamples, 5) : []),
        [delta, primarySamples]
    );

    const againstSession = candidates.find(c => c.id === againstId) ?? null;
    const primaryLabel = primaryLap ? `Lap ${primaryLap}` : "Full session";
    const againstLabel = againstSession
        ? `${againstSession.track}${againstLap ? ` lap ${againstLap}` : ""}`
        : "Reference";

    return (
        <main className="w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <Link
                href={`/simracing/sessions/${id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:text-primary"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to session
            </Link>

            <PageHeader
                label="Sim racing"
                title="Compare laps"
                description={
                    primary
                        ? `${primary.track} · ${primary.carModel} against any other session you've recorded.`
                        : "Overlay two laps and see exactly where the time went."
                }
            />

            <PlanGate
                required="PRO"
                title="Lap comparison"
                description="Overlay any two laps on a distance axis with a true time-delta trace and a ranked breakdown of where the time went."
            >
                <div className="space-y-4">
                    <SectionCard label="Setup" title="Pick what to compare" icon={GitCompareArrows}>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div>
                                <label
                                    htmlFor="primary-lap"
                                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500"
                                >
                                    This session · lap
                                </label>
                                <select
                                    id="primary-lap"
                                    value={primaryLap}
                                    onChange={e => setPrimaryLap(e.target.value)}
                                    className="h-9 w-full border border-zinc-800 bg-zinc-950 px-3 text-sm text-white focus:border-primary/40 focus:outline-none"
                                >
                                    <option value="">All laps</option>
                                    {primaryLaps.map(l => (
                                        <option key={l.lapNumber} value={l.lapNumber}>
                                            Lap {l.lapNumber} — {formatLapTime(l.lapTimeMs)}
                                            {l.isValid ? "" : " (invalid)"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="against-session"
                                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500"
                                >
                                    Compare against
                                </label>
                                <select
                                    id="against-session"
                                    value={againstId}
                                    onChange={e => setAgainstId(e.target.value)}
                                    className="h-9 w-full border border-zinc-800 bg-zinc-950 px-3 text-sm text-white focus:border-primary/40 focus:outline-none"
                                >
                                    <option value="">Select a session…</option>
                                    {candidates.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.track} · {c.carModel} · {new Date(c.startedAt).toLocaleDateString()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="against-lap"
                                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500"
                                >
                                    That session · lap
                                </label>
                                <select
                                    id="against-lap"
                                    value={againstLap}
                                    onChange={e => setAgainstLap(e.target.value)}
                                    disabled={!againstId}
                                    className="h-9 w-full border border-zinc-800 bg-zinc-950 px-3 text-sm text-white focus:border-primary/40 focus:outline-none disabled:opacity-40"
                                >
                                    <option value="">All laps</option>
                                    {againstLaps.map(l => (
                                        <option key={l.lapNumber} value={l.lapNumber}>
                                            Lap {l.lapNumber} — {formatLapTime(l.lapTimeMs)}
                                            {l.isValid ? "" : " (invalid)"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={runCompare}
                                    disabled={!againstId || loading}
                                    className="h-9 w-full bg-primary text-xs font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {loading ? "Comparing…" : "Compare"}
                                </button>
                            </div>
                        </div>

                        {primaryLap && againstLap ? null : (
                            <p className="mt-4 border border-blue-500/20 bg-blue-950/10 px-3 py-2 text-xs text-blue-300">
                                Pick a specific lap on both sides for a meaningful delta — comparing whole sessions
                                averages every lap together.
                            </p>
                        )}
                    </SectionCard>

                    {secondaryData ? (
                        <>
                            <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
                                <SectionCard label="Delta" title={`${primaryLabel} vs ${againstLabel}`} icon={TrendingDown}>
                                    <DeltaTraceChart
                                        delta={delta}
                                        lapLabel={primaryLabel}
                                        referenceLabel={againstLabel}
                                        cursorDistance={cursor}
                                        onCursorChange={setCursor}
                                    />
                                </SectionCard>

                                <SectionCard label="Where it went" title="Biggest time losses" icon={Sparkles}>
                                    <TimeLossList
                                        losses={losses}
                                        totalDelta={delta.length ? delta[delta.length - 1].delta : null}
                                        referenceLabel={againstLabel}
                                        onSelect={setCursor}
                                    />
                                </SectionCard>
                            </div>

                            <SectionCard
                                label="Telemetry"
                                title="Overlaid traces"
                                icon={LineChart}
                                actions={<span className="text-[11px] text-zinc-500">Dashed = {againstLabel}</span>}
                            >
                                <DistanceTraceChart
                                    samples={primarySamples}
                                    compareSamples={secondarySamples}
                                    compareLabel={againstLabel}
                                    availableChannels={primaryData.channels}
                                    cursorDistance={cursor}
                                    onCursorChange={setCursor}
                                />
                            </SectionCard>

                            <SectionCard label="Circuit" title="Racing line" icon={MapIcon}>
                                <TrackMap
                                    samples={primarySamples}
                                    raw={primaryData}
                                    deltaByDistance={delta}
                                    cursorDistance={cursor}
                                    onCursorChange={setCursor}
                                />
                            </SectionCard>
                        </>
                    ) : (
                        <SectionCard
                            emptyIcon={GitCompareArrows}
                            empty="Choose a session and lap above, then hit Compare."
                        />
                    )}
                </div>
            </PlanGate>
        </main>
    );
}
