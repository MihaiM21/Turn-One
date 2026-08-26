"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, Copy, Plus, Radio, Trash2, ExternalLink, Eye, EyeOff } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExploreMoreLinks } from "@/components/dashboard/explore-more-links";
import { SectionCard } from "@/components/dashboard/simracing/section-card";
import { PlanGate } from "@/components/dashboard/simracing/plan-gate";
import { simApiBase } from "@/lib/simracing/api";

interface TokenDto {
    id: string;
    token: string;
    label: string | null;
    scopes: string | null;
    createdAt: string;
    expiresAt: string | null;
}

const OVERLAY_KINDS = [
    { key: "cockpit", label: "Cockpit", detail: "Speed, gear, RPM and pedals" },
    { key: "lap", label: "Lap times", detail: "Current, last, best and delta" },
    { key: "leaderboard", label: "Leaderboard", detail: "Top drivers by distance" },
] as const;

function authHeaders(): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function StreamerPage() {
    const [tokens, setTokens] = useState<TokenDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [label, setLabel] = useState("");
    const [creating, setCreating] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${simApiBase()}/api/simracing/overlay/tokens`, { headers: authHeaders() });
            // 403 is the plan gate — PlanGate already explains it, so just show no tokens.
            if (res.ok) setTokens(await res.json());
            else setTokens([]);
        } catch {
            toast.error("Couldn't load your overlay tokens.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const create = async () => {
        setCreating(true);
        try {
            const res = await fetch(`${simApiBase()}/api/simracing/overlay/tokens`, {
                method: "POST",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify({ label: label || "Overlay", scopes: "cockpit,lap,leaderboard" }),
            });
            if (res.status === 403) {
                toast.error("Overlay tokens require a PRO or ELITE plan.");
                return;
            }
            if (!res.ok) {
                toast.error("Couldn't create that token.");
                return;
            }
            setLabel("");
            toast.success("Overlay token created.");
            await load();
        } finally {
            setCreating(false);
        }
    };

    const revoke = async (id: string) => {
        if (!confirm("Revoke this overlay token? Active OBS browser sources will disconnect immediately.")) return;
        try {
            await fetch(`${simApiBase()}/api/simracing/overlay/tokens/${id}`, {
                method: "DELETE",
                headers: authHeaders(),
            });
            toast.success("Token revoked.");
            await load();
        } catch {
            toast.error("Couldn't revoke that token.");
        }
    };

    return (
        <main className="w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <Link
                href="/simracing"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:text-primary"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to cockpit
            </Link>

            <PageHeader
                label="Sim racing"
                title="Streamer mode"
                description="Create a share token, then add its URL as a Browser Source in OBS. Every overlay is transparent and connects live to your telemetry."
                stats={[{ icon: Radio, label: "Tokens", value: tokens.length }]}
            />

            <PlanGate
                required="PRO"
                title="Streamer overlays"
                description="Transparent, OBS-ready overlays with shareable links for cockpit, lap times and the leaderboard."
            >
                <div className="space-y-4">
                    <SectionCard label="New token" title="Create an overlay link" icon={Plus}>
                        <div className="flex flex-col gap-3 md:flex-row md:items-end">
                            <div className="flex-1">
                                <label
                                    htmlFor="token-label"
                                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500"
                                >
                                    Label
                                </label>
                                <input
                                    id="token-label"
                                    type="text"
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                    placeholder="e.g. Friday stream"
                                    className="h-9 w-full border border-zinc-800 bg-zinc-950 px-3 text-sm text-white placeholder:text-zinc-600 focus:border-primary/40 focus:outline-none"
                                />
                            </div>
                            <button
                                onClick={create}
                                disabled={creating}
                                className="inline-flex h-9 items-center gap-2 bg-primary px-5 text-xs font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {creating ? "Creating…" : "Create token"}
                            </button>
                        </div>

                        <p className="mt-4 flex items-start gap-2 border border-yellow-500/30 bg-yellow-950/10 px-3 py-2 text-xs text-yellow-300">
                            <EyeOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            Anyone with an overlay link can watch your live telemetry. Treat them like passwords and
                            revoke any you&apos;ve shared publicly.
                        </p>
                    </SectionCard>

                    {loading ? (
                        <SectionCard loading />
                    ) : tokens.length === 0 ? (
                        <SectionCard
                            emptyIcon={Radio}
                            empty="No overlay tokens yet. Create one above to get your OBS URLs."
                        />
                    ) : (
                        tokens.map(t => <TokenCard key={t.id} token={t} onRevoke={() => revoke(t.id)} />)
                    )}
                </div>
            </PlanGate>

            <ExploreMoreLinks currentPage="/simracing/streamer" />
        </main>
    );
}

function TokenCard({ token, onRevoke }: { token: TokenDto; onRevoke: () => void }) {
    const [previewing, setPreviewing] = useState<string | null>(null);
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const copy = (url: string, kind: string) => {
        navigator.clipboard.writeText(url);
        toast.success(`${kind} overlay URL copied.`);
    };

    return (
        <SectionCard
            label="Overlay"
            title={token.label || "Overlay"}
            icon={Radio}
            actions={
                <button
                    onClick={onRevoke}
                    className="inline-flex h-7 items-center gap-1.5 border border-red-500/40 bg-red-950/30 px-2.5 text-[11px] font-bold text-red-300 transition-colors hover:bg-red-900/40"
                >
                    <Trash2 className="h-3 w-3" />
                    Revoke
                </button>
            }
        >
            <p className="font-mono text-[11px] text-zinc-500">
                Created {format(new Date(token.createdAt), "MMM d, HH:mm")}
                {token.expiresAt
                    ? ` · Expires ${format(new Date(token.expiresAt), "MMM d, HH:mm")}`
                    : " · No expiry"}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                {OVERLAY_KINDS.map(kind => {
                    const url = `${origin}/overlay/${token.token}/${kind.key}`;
                    const isPreviewing = previewing === kind.key;
                    return (
                        <div key={kind.key} className="border border-zinc-800 bg-black">
                            <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                        {kind.label}
                                    </p>
                                    <p className="mt-0.5 truncate text-[10px] text-zinc-600">{kind.detail}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    <button
                                        onClick={() => setPreviewing(isPreviewing ? null : kind.key)}
                                        aria-label={isPreviewing ? "Hide preview" : "Show preview"}
                                        className={`p-1 transition-colors ${
                                            isPreviewing ? "text-primary" : "text-zinc-600 hover:text-white"
                                        }`}
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                    </button>
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label="Open in a new tab"
                                        className="p-1 text-zinc-600 transition-colors hover:text-white"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </div>
                            </div>

                            {/* Live preview so you can see what you're pasting into OBS. */}
                            {isPreviewing ? (
                                <div
                                    className="border-b border-zinc-800"
                                    // Checkerboard, so the transparent overlay background is visible.
                                    style={{
                                        backgroundImage:
                                            "linear-gradient(45deg, #18181b 25%, transparent 25%), linear-gradient(-45deg, #18181b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18181b 75%), linear-gradient(-45deg, transparent 75%, #18181b 75%)",
                                        backgroundSize: "16px 16px",
                                        backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                                    }}
                                >
                                    <iframe
                                        src={url}
                                        title={`${kind.label} overlay preview`}
                                        className="h-40 w-full border-0"
                                        sandbox="allow-scripts allow-same-origin"
                                    />
                                </div>
                            ) : null}

                            <div className="flex items-center gap-2 px-3 py-2">
                                <code className="min-w-0 flex-1 truncate font-mono text-[10px] text-zinc-400">
                                    {url}
                                </code>
                                <button
                                    onClick={() => copy(url, kind.label)}
                                    aria-label={`Copy ${kind.label} overlay URL`}
                                    className="shrink-0 border border-zinc-800 p-1.5 transition-colors hover:border-primary/40 hover:text-primary"
                                >
                                    <Copy className="h-3.5 w-3.5 text-zinc-500" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </SectionCard>
    );
}
