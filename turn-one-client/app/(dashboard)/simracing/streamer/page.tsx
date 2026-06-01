"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Copy, Plus, Radio, Trash2, ExternalLink } from "lucide-react";

interface TokenDto {
    id: string;
    token: string;
    label: string | null;
    scopes: string | null;
    createdAt: string;
    expiresAt: string | null;
}

const OVERLAY_KINDS = [
    { key: "cockpit", label: "Cockpit" },
    { key: "lap", label: "Lap Times" },
    { key: "leaderboard", label: "Leaderboard" },
] as const;

function apiBase() {
    return (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api\/?$/, "");
}

function authHeaders(): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function StreamerPage() {
    const [tokens, setTokens] = useState<TokenDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [label, setLabel] = useState("");
    const [creating, setCreating] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase()}/api/simracing/overlay/tokens`, { headers: authHeaders() });
            if (res.status === 403) {
                setError("Overlay tokens require a PRO or ELITE plan.");
                setTokens([]);
                return;
            }
            if (res.ok) setTokens(await res.json());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const create = async () => {
        setCreating(true);
        setError(null);
        try {
            const res = await fetch(`${apiBase()}/api/simracing/overlay/tokens`, {
                method: "POST",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify({ label: label || "Overlay", scopes: "cockpit,lap,leaderboard" }),
            });
            if (res.status === 403) {
                setError("Overlay tokens require a PRO or ELITE plan.");
                return;
            }
            if (!res.ok) {
                setError("Failed to create token.");
                return;
            }
            setLabel("");
            await load();
        } finally {
            setCreating(false);
        }
    };

    const revoke = async (id: string) => {
        if (!confirm("Revoke this overlay token? Active OBS browser sources will disconnect.")) return;
        await fetch(`${apiBase()}/api/simracing/overlay/tokens/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        });
        await load();
    };

    return (
        <div className="w-full min-h-screen p-6 bg-gradient-to-br from-black via-red-950/20 to-black font-sans text-white">
            <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
                <div>
                    <Link
                        href="/simracing"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-white text-sm font-semibold transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sim Racing
                    </Link>

                    <div className="flex items-center gap-3 mb-1">
                        <Radio className="w-5 h-5 text-primary" />
                        <h1 className="text-3xl font-black italic tracking-tight">Streamer Mode</h1>
                    </div>
                    <p className="text-muted-foreground ml-8 max-w-xl">
                        Create a share token, then add the URL as a Browser Source in OBS. Each overlay has a
                        transparent background and connects live to your telemetry.
                    </p>
                </div>

                {error ? (
                    <Card className="border-red-500/40 bg-red-950/20">
                        <CardContent className="p-4">
                            <p className="text-red-300 font-mono text-sm">{error}</p>
                        </CardContent>
                    </Card>
                ) : null}

                <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-md">
                    <CardContent className="p-6 flex flex-col md:flex-row gap-3 md:items-end">
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                                Token Label
                            </label>
                            <input
                                type="text"
                                value={label}
                                onChange={e => setLabel(e.target.value)}
                                placeholder="e.g. Friday stream"
                                className="w-full bg-black/60 border border-white/10 rounded-md px-3 py-2 text-sm focus:border-primary/40 outline-none"
                            />
                        </div>
                        <button
                            onClick={create}
                            disabled={creating}
                            className="inline-flex items-center gap-2 bg-primary/20 border border-primary/40 hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-sm font-bold rounded-md transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            {creating ? "Creating..." : "Create Token"}
                        </button>
                    </CardContent>
                </Card>

                {loading ? (
                    <p className="text-muted-foreground animate-pulse font-mono text-sm">Loading tokens...</p>
                ) : tokens.length === 0 ? (
                    <p className="text-muted-foreground font-mono text-sm">No overlay tokens yet.</p>
                ) : (
                    <div className="space-y-4">
                        {tokens.map(t => (
                            <TokenCard key={t.id} token={t} onRevoke={() => revoke(t.id)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function TokenCard({ token, onRevoke }: { token: TokenDto; onRevoke: () => void }) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    return (
        <Card className="border-primary/20 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-md">
            <CardContent className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <p className="text-sm font-bold text-white">{token.label || "Overlay"}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                            Created {format(new Date(token.createdAt), "MMM d, HH:mm")}
                            {token.expiresAt ? ` · Expires ${format(new Date(token.expiresAt), "MMM d, HH:mm")}` : " · No expiry"}
                        </p>
                    </div>
                    <button
                        onClick={onRevoke}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md bg-red-950/40 border border-red-500/40 text-red-200 hover:bg-red-900/40 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Revoke
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {OVERLAY_KINDS.map(kind => {
                        const url = `${origin}/overlay/${token.token}/${kind.key}`;
                        return (
                            <div key={kind.key} className="rounded-md border border-white/10 bg-black/40 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        {kind.label}
                                    </p>
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-muted-foreground hover:text-white"
                                        aria-label="Preview"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-[10px] font-mono text-white/70 truncate">{url}</code>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(url)}
                                        className="shrink-0 px-2 py-1 rounded bg-black/60 border border-white/10 hover:border-primary/40 transition-colors"
                                        aria-label="Copy URL"
                                    >
                                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
