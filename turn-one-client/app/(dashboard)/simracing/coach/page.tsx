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
} from "lucide-react";
import { useCoaching, type CoachingSeverity } from "@/hooks/use-coaching";

interface SessionDto {
    id: string;
    carModel: string;
    track: string;
    sessionType: string;
    lapCount: number;
    startedAt: string;
    bestLapMs: number;
}

interface LapDto {
    lapNumber: number;
    lapTimeMs: number | null;
    isValid: boolean;
}

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

function apiBase() {
    return (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api\/?$/, "");
}

function authHeaders(): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatLapTime(ms: number | null) {
    if (ms == null || ms <= 0) return "—";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${m}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

export default function AiCoachPage() {
    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [sessionId, setSessionId] = useState<string>("");
    const [laps, setLaps] = useState<LapDto[]>([]);
    const [lapNumber, setLapNumber] = useState<number | null>(null);

    const { tips, tipsStatus, history, chatStatus, sendMessage } = useCoaching(sessionId || undefined, lapNumber);
    const [draft, setDraft] = useState("");
    const [localHistory, setLocalHistory] = useState<typeof history>([]);

    useEffect(() => {
        (async () => {
            const res = await fetch(`${apiBase()}/api/telemetry/sessions/me`, { headers: authHeaders() });
            if (res.ok) {
                const data: SessionDto[] = await res.json();
                setSessions(data);
                if (data.length > 0 && !sessionId) setSessionId(data[0].id);
            }
        })();
    }, [sessionId]);

    useEffect(() => {
        if (!sessionId) {
            setLaps([]);
            setLapNumber(null);
            return;
        }
        (async () => {
            const res = await fetch(`${apiBase()}/api/telemetry/sessions/${sessionId}/laps`, {
                headers: authHeaders(),
            });
            if (res.ok) setLaps(await res.json());
        })();
        setLapNumber(null);
    }, [sessionId]);

    useEffect(() => {
        setLocalHistory(history);
    }, [history]);

    const selectedSession = useMemo(() => sessions.find(s => s.id === sessionId), [sessions, sessionId]);

    const handleSend = async () => {
        if (!draft.trim() || !sessionId) return;
        const msg = draft.trim();
        setDraft("");
        await sendMessage(msg);
    };

    const handlePrompt = async (prompt: string) => {
        if (!sessionId) return;
        await sendMessage(prompt);
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-5">
                <section className="border-b border-zinc-800/70 pb-5 animate-in fade-in duration-500">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Sim racing</p>
                            <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-3">
                                <Sparkles className="h-6 w-6 text-primary" />
                                AI Coach
                            </h1>
                            <p className="mt-2 text-xs text-zinc-500 max-w-xl">
                                Ask anything about your driving — pace, technique, setup direction.
                            </p>
                        </div>
                        <Link
                            href="/simracing"
                            className="inline-flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-primary"
                        >
                            Back to dashboard <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                </section>

                {sessions.length === 0 ? (
                    <section className="border border-zinc-800 bg-zinc-950">
                        <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                            <Sparkles className="h-8 w-8 text-primary/60" />
                            <p className="font-bold text-white">No sessions yet</p>
                            <p className="max-w-md text-sm text-zinc-500">
                                The coach uses your session telemetry to give tips. Run a session in your sim, then come back here.
                            </p>
                            <Link
                                href="/simracing/live"
                                className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-sm border border-primary/50 bg-primary/10 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                            >
                                Open Live Cockpit
                            </Link>
                        </div>
                    </section>
                ) : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]">
                        <div className="space-y-4">
                            <section className="border border-zinc-800 bg-zinc-950">
                                <div className="border-b border-zinc-800 px-5 py-4">
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Context</p>
                                </div>
                                <div className="space-y-4 px-5 py-4">
                                    <div>
                                        <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-500">
                                            Session
                                        </label>
                                        <select
                                            value={sessionId}
                                            onChange={e => setSessionId(e.target.value)}
                                            className="w-full rounded-sm border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary/40"
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
                                            <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-500">
                                                Lap (optional)
                                            </label>
                                            <select
                                                value={lapNumber ?? ""}
                                                onChange={e => setLapNumber(e.target.value === "" ? null : Number(e.target.value))}
                                                className="w-full rounded-sm border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary/40"
                                            >
                                                <option value="">Whole session</option>
                                                {laps.map(l => (
                                                    <option key={l.lapNumber} value={l.lapNumber}>
                                                        Lap {l.lapNumber} · {formatLapTime(l.lapTimeMs)} {l.isValid ? "" : "(invalid)"}
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
                            </section>

                            <section className="border border-zinc-800 bg-zinc-950">
                                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <Lightbulb className="h-3.5 w-3.5 text-yellow-400/80" />
                                        <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Auto tips</p>
                                    </div>
                                </div>
                                {tipsStatus === "loading" ? (
                                    <p className="px-5 py-5 font-mono text-sm text-zinc-500 animate-pulse">Analysing...</p>
                                ) : tipsStatus === "locked" ? (
                                    <LockedRow message="AI tips require PRO or ELITE plan." />
                                ) : tipsStatus === "error" ? (
                                    <p className="px-5 py-5 font-mono text-sm text-red-400">Couldn&apos;t load tips.</p>
                                ) : tips.length === 0 ? (
                                    <p className="px-5 py-5 font-mono text-sm text-zinc-500">No tips for this context.</p>
                                ) : (
                                    <div className="divide-y divide-zinc-800/60">
                                        {tips.map(tip => {
                                            const meta = SEVERITY_META[tip.severity];
                                            const Icon = meta.icon;
                                            return (
                                                <div key={tip.id} className="flex items-start gap-3 px-5 py-3">
                                                    <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${meta.color}`} />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-white">{tip.title}</p>
                                                        <p className="mt-1 text-xs leading-relaxed text-zinc-500">{tip.detail}</p>
                                                        {tip.lapNumber != null ? (
                                                            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                                                                Lap {tip.lapNumber} · {tip.category}
                                                            </p>
                                                        ) : (
                                                            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                                                                {tip.category}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        </div>

                        <section className="border border-zinc-800 bg-zinc-950 flex flex-col min-h-[560px]">
                            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Chat</p>
                                </div>
                                {localHistory.length > 0 ? (
                                    <button
                                        onClick={() => setLocalHistory([])}
                                        className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-primary"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        Clear
                                    </button>
                                ) : null}
                            </div>

                            {chatStatus === "locked" ? (
                                <LockedRow message="Coaching chat is available on the ELITE plan. Tips remain on PRO." />
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
                                                            onClick={() => handlePrompt(p)}
                                                            className="rounded-sm border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-left text-sm text-zinc-200 transition-colors hover:border-primary/40 hover:text-primary"
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
                                                    className={`rounded-sm border px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
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
                                            <p className="font-mono text-xs text-zinc-500 animate-pulse">Thinking...</p>
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
                                                placeholder="Ask the coach..."
                                                className="flex-1 rounded-sm border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary/40"
                                            />
                                            <button
                                                onClick={handleSend}
                                                disabled={!draft.trim() || chatStatus === "sending"}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-primary/40 bg-primary/10 text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
                                                aria-label="Send"
                                            >
                                                <Send className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}

function LockedRow({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-3 px-5 py-5">
            <Lock className="h-4 w-4 shrink-0 text-primary" />
            <div>
                <p className="text-sm font-bold text-white">{message}</p>
                <p className="mt-0.5 text-xs text-zinc-500">Upgrade in Settings to unlock.</p>
            </div>
        </div>
    );
}
