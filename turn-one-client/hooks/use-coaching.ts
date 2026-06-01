"use client";

import { useCallback, useEffect, useState } from "react";

export type CoachingSeverity = 0 | 1 | 2 | 3;

export interface CoachingTip {
    id: string;
    title: string;
    detail: string;
    category: string;
    severity: CoachingSeverity;
    lapNumber: number | null;
}

export interface CoachingChatMessage {
    role: "user" | "assistant";
    content: string;
}

export interface CoachingChatReply {
    content: string;
    provider: string;
}

function apiBase() {
    return (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api\/?$/, "");
}

function authHeaders(): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
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
            const url = apiBase();
            const qs = lapNumber != null ? `?lap=${lapNumber}` : "";
            const res = await fetch(`${url}/api/coaching/sessions/${sessionId}/tips${qs}`, {
                headers: authHeaders(),
            });
            if (res.status === 403) {
                setTipsStatus("locked");
                setTips([]);
                return;
            }
            if (!res.ok) {
                setTipsStatus("error");
                return;
            }
            setTips(await res.json());
            setTipsStatus("ok");
        } catch {
            setTipsStatus("error");
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
                const url = apiBase();
                const res = await fetch(`${url}/api/coaching/sessions/${sessionId}/chat`, {
                    method: "POST",
                    headers: { ...authHeaders(), "Content-Type": "application/json" },
                    body: JSON.stringify({ message, history }),
                });
                if (res.status === 403) {
                    setChatStatus("locked");
                    return;
                }
                if (!res.ok) {
                    setChatStatus("error");
                    return;
                }
                const reply: CoachingChatReply = await res.json();
                setHistory([...nextHistory, { role: "assistant", content: reply.content }]);
                setChatStatus("idle");
            } catch {
                setChatStatus("error");
            }
        },
        [sessionId, history]
    );

    return { tips, tipsStatus, loadTips, history, chatStatus, sendMessage };
}
