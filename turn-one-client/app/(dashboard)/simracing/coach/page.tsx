"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
    Sparkles,
    Send,
    Lightbulb,
    AlertTriangle,
    AlertOctagon,
    Info,
    Lock,
    Trash2,
    ArrowRight,
    Download,
    TrendingDown,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExploreMoreLinks } from "@/components/dashboard/explore-more-links";
import { SectionCard } from "@/components/dashboard/simracing/section-card";
import { TimeLossList } from "@/components/dashboard/simracing/charts/time-loss-list";
import { useCoaching, type CoachingSeverity } from "@/hooks/use-coaching";
import {
    getMySessions,
    getLaps,
    getLapChart,
    formatLapTime,
    type SimSession,
    type SimLap,
} from "@/lib/simracing/api";
import { toDistanceSeries, resampleByDistance, deltaTrace, biggestLoss, type TimeLoss } from "@/lib/simracing/analysis";

const SEVERITY_META: Record<CoachingSeverity, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
    0: { icon: Info, color: "text-blue-400/80" },
    1: { icon: Lightbulb, color: "text-yellow-400/80" },
    2: { icon: AlertTriangle, color: "text-orange-400/80" },
    3: { icon: AlertOctagon, color: "text-red-400/80" },
};

const PROMPTS = [
    "Where am I losing time vs my best lap?",
    "How can I improve my braking in slow corners?",
    "Why is my throttle application inconsistent?",
    "What should I focus on next session?",
];

export default function AiCoachPage() {
    const [sessions, setSessions] = useState<SimSession[]>([]);
    const [sessionId, setSessionId] = useState("");
    const [laps, setLaps] = useState<SimLap[]>([]);
    const [lapNumber, setLapNumber] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const { tips, tipsStatus, history, chatStatus, sendMessage } = useCoaching(sessionId || undefined, lapNumber);
    const [draft, setDraft] = useState("");
    const [localHistory, setLocalHistory] = useState<typeof history>([]);

    // Locally-derived losses — these work on every plan, so BASIC users still get
    // something concrete when the server-side tips are gated or empty.
    const [derivedLosses, setDerivedLosses] = useState<TimeLoss[]>([]);
    const [derivedLoading, setDerivedLoading] = useState(false);

    useEffect(() => {
        getMySessions()
            .then(data => {
                setSessions(data);
                if (data.length && !sessionId) setSessionId(data[0].id);
            })
            .catch(() => setSessions([]))
            .finally(() => setLoading(false));
        // Only run on mount: re-running on sessionId would refetch on every selection change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!sessionId) {
            setLaps([]);
            setLapNumber(null);
            return;
        }
        getLaps(sessionId)
            .then(setLaps)
            .catch(() => setLaps([]));
        setLapNumber(null);
    }, [sessionId]);

    useEffect(() => setLocalHistory(history), [history]);

    const bestLapNumber = useMemo(() => {
        const valid = laps.filter(l => l.isValid && l.lapTimeMs && l.lapTimeMs > 0);
        if (!valid.length) return null;
        return valid.reduce((best, l) => (l.lapTimeMs! < best.lapTimeMs! ? l : best)).lapNumber;
    }, [laps]);

    // Derive losses for the chosen lap against the session's best lap.
    useEffect(() => {
        if (!sessionId || lapNumber == null || bestLapNumber == null || lapNumber === bestLapNumber) {
            setDerivedLosses([]);
            return;
        }

        let cancelled = false;
        setDerivedLoading(true);

        Promise.all([getLapChart(sessionId, lapNumber), getLapChart(sessionId, bestLapNumber)])
            .then(([lapData, refData]) => {
                if (cancelled) return;
                const lapSeries = toDistanceSeries(lapData);
                const refSeries = toDistanceSeries(refData);
                const samples = resampleByDistance(lapSeries, 5);
                setDerivedLosses(biggestLoss(deltaTrace(lapSeries, refSeries, 5), samples, 5));
            })
            .catch(() => {
                if (!cancelled) setDerivedLosses([]);
            })
            .finally(() => {
                if (!cancelled) setDerivedLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [sessionId, lapNumber, bestLapNumber]);

    const selectedSession = sessions.find(s => s.id === sessionId);

    const handleSend = async () => {
        if (!draft.trim() || !sessionId) return;
        const msg = draft.trim();
        setDraft("");
        await sendMessage(msg);
    };

    return (
        <main className="w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <PageHeader
                label="Sim racing"
                title="AI Coach"
                description="Ask anything about your driving — pace, technique, setup direction."
                actions={
                    <Link
                        href="/simracing"
                        className="inline-flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-primary"
                    >
                        Back to cockpit <ArrowRight className="h-3 w-3" />
                    </Link>
                }
            />

            {loading ? (
                <SectionCard loading />
            ) : sessions.length === 0 ? (
                <SectionCard
                    emptyIcon={Sparkles}
                    empty={
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-bold text-white">No sessions yet</p>
                                <p className="mt-1 text-xs text-zinc-500">
                                    The coach reads your session telemetry. Install Turn One Link, drive a few laps,
                                    then come back.
                                </p>
                            </div>
                            <Link
                                href="/simracing/download"
                                className="inline-flex h-9 items-center gap-2 bg-primary px-5 text-xs font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Get Turn One Link
                            </Link>
                        </div>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]">
                    <div className="space-y-4">
                        <SectionCard label="Context" title="What to analyse">
                            <div className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="coach-session"
                                        className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-500"
                                    >
                                        Session
                                    </label>
                                    <select
                                        id="coach-session"
                                        value={sessionId}
                                        onChange={e => setSessionId(e.target.value)}
                                        className="h-9 w-full border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none transition-colors focus:border-primary/40"
                                    >
                                        {sessions.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.track} · {s.carModel} · {format(new Date(s.startedAt), "MMM d")}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {laps.length > 0 ? (
                                    <div>
                                        <label
                                            htmlFor="coach-lap"
                                            className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-500"
                                        >
                                            Lap (optional)
                                        </label>
                                        <select
                                            id="coach-lap"
                                            value={lapNumber ?? ""}
                                            onChange={e =>
                                                setLapNumber(e.target.value === "" ? null : Number(e.target.value))
                                            }
                                            className="h-9 w-full border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none transition-colors focus:border-primary/40"
                                        >
                                            <option value="">Whole session</option>
                                            {laps.map(l => (
                                                <option key={l.lapNumber} value={l.lapNumber}>
                                                    Lap {l.lapNumber} · {formatLapTime(l.lapTimeMs)}
                                                    {l.isValid ? "" : " (invalid)"}
                                                    {l.lapNumber === bestLapNumber ? " ★" : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : null}

                                {selectedSession ? (
                                    <Link
                                        href={`/simracing/sessions/${selectedSession.id}`}
                                        className="inline-flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-primary"
                                    >
                                        Open full session <ArrowRight className="h-3 w-3" />
                                    </Link>
                                ) : null}
                            </div>
                        </SectionCard>

                        {/* Works on every plan — computed in the browser from the delta trace. */}
                        {lapNumber != null && lapNumber !== bestLapNumber ? (
                            <SectionCard
                                label="Telemetry"
                                title={`Lap ${lapNumber} vs your best`}
                                icon={TrendingDown}
                                loading={derivedLoading}
                            >
                                <TimeLossList
                                    losses={derivedLosses}
                                    referenceLabel={`lap ${bestLapNumber}`}
                                />
                            </SectionCard>
                        ) : null}

                        <SectionCard label="Auto tips" title="Coach analysis" icon={Lightbulb} iconClassName="text-yellow-400">
                            {tipsStatus === "loading" ? (
                                <p className="animate-pulse font-mono text-sm text-zinc-500">Analysing…</p>
                            ) : tipsStatus === "locked" ? (
                                <LockedRow
                                    message="AI tips require a PRO or ELITE plan."
                                    hint="The telemetry breakdown above is free on every plan."
                                />
                            ) : tipsStatus === "error" ? (
                                <p className="font-mono text-sm text-red-400">Couldn&apos;t load tips.</p>
                            ) : tips.length === 0 ? (
                                <p className="font-mono text-sm text-zinc-500">No tips for this context.</p>
                            ) : (
                                <div className="-mx-5 divide-y divide-zinc-800/60">
                                    {tips.map(tip => {
                                        const meta = SEVERITY_META[tip.severity];
                                        const Icon = meta.icon;
                                        return (
                                            <div key={tip.id} className="flex items-start gap-3 px-5 py-3">
                                                <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${meta.color}`} />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-white">{tip.title}</p>
                                                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                                                        {tip.detail}
                                                    </p>
                                                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                                                        {tip.lapNumber != null ? `Lap ${tip.lapNumber} · ` : ""}
                                                        {tip.category}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </SectionCard>
                    </div>

                    <SectionCard
                        label="Chat"
                        title="Ask the coach"
                        icon={Sparkles}
                        className="flex min-h-[560px] flex-col"
                        bodyClassName="flex flex-1 flex-col p-0"
                        flush
                        actions={
                            localHistory.length > 0 ? (
                                <button
                                    onClick={() => setLocalHistory([])}
                                    className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-primary"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    Clear
                                </button>
                            ) : null
                        }
                    >
                        {chatStatus === "locked" ? (
                            <div className="px-5 py-5">
                                <LockedRow
                                    message="Coaching chat is on the ELITE plan."
                                    hint="Automatic tips are included with PRO."
                                />
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                                    {localHistory.length === 0 ? (
                                        <div className="space-y-3">
                                            <p className="font-mono text-sm text-zinc-500">
                                                Start a conversation — or try a quick prompt:
                                            </p>
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                {PROMPTS.map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => sendMessage(p)}
                                                        className="border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-left text-sm text-zinc-200 transition-colors hover:border-primary/40 hover:text-primary"
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        localHistory.map((m, i) => (
                                            <div
                                                key={i}
                                                className={`whitespace-pre-wrap border px-3 py-2 text-sm leading-relaxed ${
                                                    m.role === "user"
                                                        ? "border-primary/30 bg-primary/5 text-white"
                                                        : "border-zinc-800 bg-zinc-900/40 text-zinc-200"
                                                }`}
                                            >
                                                {m.content}
                                            </div>
                                        ))
                                    )}
                                    {chatStatus === "sending" ? (
                                        <p className="animate-pulse font-mono text-xs text-zinc-500">Thinking…</p>
                                    ) : null}
                                    {chatStatus === "error" ? (
                                        <p className="font-mono text-xs text-red-400">Request failed. Try again.</p>
                                    ) : null}
                                </div>

                                <div className="border-t border-zinc-800 px-5 py-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={draft}
                                            onChange={e => setDraft(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend();
                                                }
                                            }}
                                            placeholder="Ask the coach…"
                                            className="h-9 flex-1 border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none transition-colors focus:border-primary/40"
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!draft.trim() || chatStatus === "sending"}
                                            aria-label="Send"
                                            className="inline-flex h-9 w-9 items-center justify-center border border-primary/40 bg-primary/10 text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            <Send className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </SectionCard>
                </div>
            )}

            <ExploreMoreLinks currentPage="/simracing/coach" />
        </main>
    );
}

function LockedRow({ message, hint }: { message: string; hint: string }) {
    return (
        <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
                <p className="text-sm font-bold text-white">{message}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>
                <Link
                    href="/pricing"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                    See plans <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
        </div>
    );
}
