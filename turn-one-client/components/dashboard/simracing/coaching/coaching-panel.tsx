"use client";

import { useState } from "react";
import { SectionCard } from "../section-card";
import { Sparkles, MessageSquare, Lightbulb, AlertTriangle, AlertOctagon, Info, Lock, Send } from "lucide-react";
import { useCoaching, type CoachingSeverity } from "@/hooks/use-coaching";

interface CoachingPanelProps {
    sessionId: string;
    lapNumber: number | null;
}

const SEVERITY_META: Record<CoachingSeverity, { icon: React.ComponentType<{ className?: string }>; color: string; ring: string }> = {
    0: { icon: Info, color: "text-blue-300", ring: "border-blue-500/30" },
    1: { icon: Lightbulb, color: "text-yellow-300", ring: "border-yellow-500/30" },
    2: { icon: AlertTriangle, color: "text-orange-300", ring: "border-orange-500/40" },
    3: { icon: AlertOctagon, color: "text-red-300", ring: "border-red-500/50" },
};

export function CoachingPanel({ sessionId, lapNumber }: CoachingPanelProps) {
    const [tab, setTab] = useState<"tips" | "chat">("tips");
    const { tips, tipsStatus, history, chatStatus, sendMessage } = useCoaching(sessionId, lapNumber);
    const [draft, setDraft] = useState("");

    const handleSend = async () => {
        if (!draft.trim()) return;
        const message = draft.trim();
        setDraft("");
        await sendMessage(message);
    };

    return (
        <SectionCard
            label="Coaching"
            title={lapNumber != null ? `AI Coach · lap ${lapNumber}` : "AI Coach"}
            icon={Sparkles}
            actions={
                <div className="flex border border-zinc-800">
                    <TabButton
                        active={tab === "tips"}
                        onClick={() => setTab("tips")}
                        icon={<Lightbulb className="h-3.5 w-3.5" />}
                    >
                        Tips
                    </TabButton>
                    <TabButton
                        active={tab === "chat"}
                        onClick={() => setTab("chat")}
                        icon={<MessageSquare className="h-3.5 w-3.5" />}
                    >
                        Chat
                    </TabButton>
                </div>
            }
        >
            {tab === "tips" ? (
                <TipsView tips={tips} status={tipsStatus} />
            ) : (
                <ChatView history={history} status={chatStatus} draft={draft} onDraft={setDraft} onSend={handleSend} />
            )}
        </SectionCard>
    );
}

function TipsView({ tips, status }: { tips: ReturnType<typeof useCoaching>["tips"]; status: ReturnType<typeof useCoaching>["tipsStatus"] }) {
    if (status === "loading") {
        return <p className="animate-pulse font-mono text-sm text-zinc-500">Analysing your laps…</p>;
    }
    if (status === "locked") {
        return <LockedNotice message="AI tips are available on PRO and ELITE plans." />;
    }
    if (status === "error") {
        return <p className="font-mono text-sm text-red-400">Couldn&apos;t load tips. Try again later.</p>;
    }
    if (!tips.length) {
        return <p className="font-mono text-sm text-zinc-500">No tips for this lap yet.</p>;
    }

    return (
        <div className="grid gap-3">
            {tips.map(tip => {
                const meta = SEVERITY_META[tip.severity];
                const Icon = meta.icon;
                return (
                    <div key={tip.id} className={`border bg-black p-4 ${meta.ring}`}>
                        <div className="flex items-start gap-3">
                            <Icon className={`w-4 h-4 mt-0.5 ${meta.color}`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="text-sm font-bold text-white">{tip.title}</h3>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                        {tip.category}
                                    </span>
                                    {tip.lapNumber != null ? (
                                        <span className="font-mono text-[10px] text-zinc-500">L{tip.lapNumber}</span>
                                    ) : null}
                                </div>
                                <p className="text-sm leading-relaxed text-zinc-400">{tip.detail}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ChatView({
    history,
    status,
    draft,
    onDraft,
    onSend,
}: {
    history: ReturnType<typeof useCoaching>["history"];
    status: ReturnType<typeof useCoaching>["chatStatus"];
    draft: string;
    onDraft: (v: string) => void;
    onSend: () => void;
}) {
    if (status === "locked") {
        return <LockedNotice message="Coaching chat is available on the ELITE plan." />;
    }

    return (
        <div className="space-y-3">
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {history.length === 0 ? (
                    <p className="font-mono text-sm text-zinc-500">
                        Ask the coach about a corner, a sector, or a setup change.
                    </p>
                ) : (
                    history.map((m, i) => (
                        <div
                            key={i}
                            className={`whitespace-pre-wrap border p-3 text-sm leading-relaxed ${
                                m.role === "user"
                                    ? "border-primary/30 bg-primary/5 text-white"
                                    : "border-zinc-800 bg-zinc-900/40 text-zinc-200"
                            }`}
                        >
                            {m.content}
                        </div>
                    ))
                )}
                {status === "sending" ? (
                    <p className="animate-pulse font-mono text-xs text-zinc-500">Thinking…</p>
                ) : null}
                {status === "error" ? (
                    <p className="font-mono text-xs text-red-400">Request failed. Try again.</p>
                ) : null}
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={draft}
                    onChange={e => onDraft(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                        }
                    }}
                    placeholder="Ask about a lap, sector, or setup…"
                    className="h-9 flex-1 border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none transition-colors focus:border-primary/40"
                />
                <button
                    onClick={onSend}
                    disabled={!draft.trim() || status === "sending"}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-primary/40 bg-primary/10 text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Send"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function LockedNotice({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-3 border border-primary/30 bg-primary/5 p-4">
            <Lock className="h-4 w-4 shrink-0 text-primary" />
            <div className="flex-1">
                <p className="text-sm font-bold text-white">{message}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                    Upgrade your plan to unlock this feature.
                </p>
            </div>
        </div>
    );
}

function TabButton({
    active,
    onClick,
    icon,
    children,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex h-7 items-center gap-1.5 px-3 text-[11px] font-bold transition-colors ${
                active ? "bg-primary/15 text-primary" : "text-zinc-500 hover:text-zinc-300"
            }`}
        >
            {icon}
            {children}
        </button>
    );
}
