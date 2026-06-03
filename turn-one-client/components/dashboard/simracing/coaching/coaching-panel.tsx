"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
        <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 shadow-xl backdrop-blur-md">
            <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest">AI Coach</h2>
                    </div>

                    <div className="flex gap-1 items-center bg-black/40 border border-primary/20 p-1 rounded-lg">
                        <TabButton active={tab === "tips"} onClick={() => setTab("tips")} icon={<Lightbulb className="w-3.5 h-3.5" />}>
                            Tips
                        </TabButton>
                        <TabButton active={tab === "chat"} onClick={() => setTab("chat")} icon={<MessageSquare className="w-3.5 h-3.5" />}>
                            Chat
                        </TabButton>
                    </div>
                </div>

                {tab === "tips" ? (
                    <TipsView tips={tips} status={tipsStatus} />
                ) : (
                    <ChatView
                        history={history}
                        status={chatStatus}
                        draft={draft}
                        onDraft={setDraft}
                        onSend={handleSend}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function TipsView({ tips, status }: { tips: ReturnType<typeof useCoaching>["tips"]; status: ReturnType<typeof useCoaching>["tipsStatus"] }) {
    if (status === "loading") {
        return <p className="text-muted-foreground animate-pulse font-mono text-sm">Analysing your laps...</p>;
    }
    if (status === "locked") {
        return <LockedNotice message="AI tips are available on PRO and ELITE plans." />;
    }
    if (status === "error") {
        return <p className="text-red-300 font-mono text-sm">Couldn&apos;t load tips. Try again later.</p>;
    }
    if (!tips.length) {
        return <p className="text-muted-foreground font-mono text-sm">No tips for this lap yet.</p>;
    }

    return (
        <div className="grid gap-3">
            {tips.map(tip => {
                const meta = SEVERITY_META[tip.severity];
                const Icon = meta.icon;
                return (
                    <div key={tip.id} className={`p-4 rounded-md border bg-black/40 ${meta.ring}`}>
                        <div className="flex items-start gap-3">
                            <Icon className={`w-4 h-4 mt-0.5 ${meta.color}`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="text-sm font-bold text-white">{tip.title}</h3>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        {tip.category}
                                    </span>
                                    {tip.lapNumber != null ? (
                                        <span className="text-[10px] font-mono text-muted-foreground">L{tip.lapNumber}</span>
                                    ) : null}
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{tip.detail}</p>
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
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {history.length === 0 ? (
                    <p className="text-muted-foreground font-mono text-sm">
                        Ask the coach about a corner, a sector, or a setup change.
                    </p>
                ) : (
                    history.map((m, i) => (
                        <div
                            key={i}
                            className={`p-3 rounded-md border text-sm whitespace-pre-wrap leading-relaxed ${
                                m.role === "user"
                                    ? "bg-primary/10 border-primary/30 text-white"
                                    : "bg-black/40 border-white/10 text-slate-200"
                            }`}
                        >
                            {m.content}
                        </div>
                    ))
                )}
                {status === "sending" ? (
                    <p className="text-muted-foreground animate-pulse font-mono text-xs">Thinking...</p>
                ) : null}
                {status === "error" ? (
                    <p className="text-red-300 font-mono text-xs">Request failed. Try again.</p>
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
                    placeholder="Ask about a lap, sector, or setup..."
                    className="flex-1 bg-black/60 border border-white/10 rounded-md px-3 py-2 text-sm focus:border-primary/40 outline-none"
                />
                <button
                    onClick={onSend}
                    disabled={!draft.trim() || status === "sending"}
                    className="px-3 py-2 rounded-md bg-primary/20 border border-primary/40 hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
        <div className="flex items-center gap-3 p-4 rounded-md border border-primary/30 bg-black/40">
            <Lock className="w-4 h-4 text-primary" />
            <div className="flex-1">
                <p className="text-sm text-white font-bold">{message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Upgrade your plan in Settings to unlock this feature.
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
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                active ? "bg-primary/20 text-white border border-primary/40" : "text-muted-foreground hover:text-white"
            }`}
        >
            {icon}
            {children}
        </button>
    );
}
