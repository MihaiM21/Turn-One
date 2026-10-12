"use client";

import { useCallback, useEffect, useState } from "react";
import { request, SimApiError } from "@/lib/simracing/api";

export type CoachingSeverity = 0 | 1 | 2 | 3;

export interface CoachingTip {
    id: string;
    title: string;
    detail: string;
    category: string;
    severity: CoachingSeverity;
    lapNumber: number | null;
    /** Reference corner index (0-based) this tip is about, when it's corner-specific. */
    cornerIndex?: number | null;
    /** Display name for `cornerIndex` — the track profile's reference corner name, or "T{n}". */
    cornerName?: string | null;
    /** Distance (m) along the lap to jump the cursor to, when this tip is corner-specific. */
    distanceM?: number | null;
}

export interface CoachingChatMessage {
    role: "user" | "assistant";
    content: string;
}

export interface CoachingChatReply {
    content: string;
    provider: string;
}

export function useCoaching(sessionId: string | undefined, lapNumber: number | null) {
    const [tips, setTips] = useState<CoachingTip[]>([]);
    const [tipsStatus, setTipsStatus] = useState<"idle" | "loading" | "ok" | "locked" | "error">("idle");
    const [history, setHistory] = useState<CoachingChatMessage[]>([]);
    const [chatStatus, setChatStatus] = useState<"idle" | "sending" | "locked" | "error">("idle");

    const loadTips = useCallback(async () => {
        if (!sessionId) return;
        setTipsStatus("loading");
        try {
            const qs = lapNumber != null ? `?lap=${lapNumber}` : "";
            const tips = await request<CoachingTip[]>(`/api/coaching/sessions/${sessionId}/tips${qs}`);
            setTips(tips);
            setTipsStatus("ok");
        } catch (err) {
            if (err instanceof SimApiError && err.isPlanGated) {
                setTipsStatus("locked");
                setTips([]);
            } else {
                setTipsStatus("error");
            }
        }
    }, [sessionId, lapNumber]);

    useEffect(() => {
        loadTips();
    }, [loadTips]);

    const sendMessage = useCallback(
        async (message: string) => {
            if (!sessionId || !message.trim()) return;
            const userMsg: CoachingChatMessage = { role: "user", content: message };
            const nextHistory = [...history, userMsg];
            setHistory(nextHistory);
            setChatStatus("sending");

            try {
                const reply = await request<CoachingChatReply>(`/api/coaching/sessions/${sessionId}/chat`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message, history }),
                });
                setHistory([...nextHistory, { role: "assistant", content: reply.content }]);
                setChatStatus("idle");
            } catch (err) {
                if (err instanceof SimApiError && err.isPlanGated) {
                    setChatStatus("locked");
                } else {
                    setChatStatus("error");
                }
            }
        },
        [sessionId, history]
    );

    return { tips, tipsStatus, loadTips, history, chatStatus, sendMessage };
}
