"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { clearAuthIntent } from "@/lib/auth-utils";
import {
    BETA_INPUTS,
    BETA_NOTE_MAX,
    BETA_PLATFORMS,
    BETA_SIMS,
    getMyBetaApplication,
    saveMyBetaApplication,
    type BetaApplication,
    type BetaInput,
    type BetaPlatform,
    type BetaSim,
    type BetaStatus,
} from "@/lib/simracing/api";

const STATUS_COPY: Record<BetaStatus, { icon: typeof Clock; title: string; body: string; tone: string }> = {
    pending: {
        icon: Clock,
        title: "Application received",
        body: "We're picking 20–50 drivers for the closed beta starting January 2027. The decision will show up here.",
        tone: "text-muted-foreground",
    },
    accepted: {
        icon: CheckCircle2,
        title: "You're in the beta",
        body: "Install Turn One Link, pair it with this account and drive a few laps — your telemetry shows up in Sessions.",
        tone: "text-primary",
    },
    declined: {
        icon: XCircle,
        title: "Not this round",
        body: "The first wave is small, so we couldn't take everyone. Your answers stay on file if more spots open.",
        tone: "text-muted-foreground",
    },
};

function Chip({
    selected,
    onClick,
    children,
    role = "checkbox",
}: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
    role?: "checkbox" | "radio";
}) {
    return (
        <button
            type="button"
            role={role}
            aria-checked={selected}
            onClick={onClick}
            className={cn(
                "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground"
            )}
        >
            {children}
        </button>
    );
}

export default function SimracingBetaPage() {
    const [application, setApplication] = useState<BetaApplication | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);

    const [sims, setSims] = useState<BetaSim[]>([]);
    const [platform, setPlatform] = useState<BetaPlatform>("pc");
    const [input, setInput] = useState<BetaInput>("wheel");
    const [note, setNote] = useState("");

    const fill = (a: BetaApplication) => {
        setSims(a.sims);
        setPlatform(a.platform);
        setInput(a.input);
        setNote(a.note ?? "");
    };

    useEffect(() => {
        // Reaching this page fulfils a "Join the beta" sign-up intent.
        clearAuthIntent();
        getMyBetaApplication()
            .then(a => {
                setApplication(a);
                if (a) fill(a);
            })
            .catch(e => setLoadError(e instanceof Error ? e.message : "Couldn't load your application."))
            .finally(() => setLoading(false));
    }, []);

    const toggleSim = (sim: BetaSim) =>
        setSims(prev => (prev.includes(sim) ? prev.filter(s => s !== sim) : [...prev, sim]));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (sims.length === 0) {
            setFormError("Pick at least one sim.");
            return;
        }
        setSaving(true);
        setFormError(null);
        try {
            const saved = await saveMyBetaApplication({ sims, platform, input, note: note.trim() || null });
            const isNew = !application;
            setApplication(saved);
            fill(saved);
            setEditing(false);
            toast.success(isNew ? "Application sent" : "Answers updated");
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Couldn't save your application.");
        } finally {
            setSaving(false);
        }
    };

    const showForm = !application || editing;
    const status = application ? STATUS_COPY[application.status] : null;

    return (
        <main className="w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <PageHeader
                label="Sim racing"
                title="Closed beta"
                description="Telemetry and coaching for ACC, EA SPORTS F1 25-26 and iRacing through Turn One Link. Tell us what you drive — it takes a minute."
            />

            {loading ? (
                <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading your application…
                </div>
            ) : loadError ? (
                <Card className="max-w-2xl border-border bg-card">
                    <CardContent className="space-y-3">
                        <p className="text-sm text-destructive">{loadError}</p>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Try again
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="max-w-2xl space-y-4">
                    {application && status && (
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className={cn("flex items-center gap-2 text-base", status.tone)}>
                                    <status.icon className="h-4 w-4" />
                                    {status.title}
                                </CardTitle>
                                <CardDescription>{status.body}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                                    <dt className="text-muted-foreground">Sims</dt>
                                    <dd>
                                        {application.sims
                                            .map(s => BETA_SIMS.find(o => o.value === s)?.label ?? s)
                                            .join(", ")}
                                    </dd>
                                    <dt className="text-muted-foreground">Platform</dt>
                                    <dd>{BETA_PLATFORMS.find(o => o.value === application.platform)?.label}</dd>
                                    <dt className="text-muted-foreground">Input</dt>
                                    <dd>{BETA_INPUTS.find(o => o.value === application.input)?.label}</dd>
                                    <dt className="text-muted-foreground">Applied</dt>
                                    <dd>{new Date(application.createdAt).toLocaleDateString()}</dd>
                                </dl>
                                <div className="flex flex-wrap gap-2">
                                    {application.status === "accepted" && (
                                        <Button asChild>
                                            <Link href="/simracing/download">Get Turn One Link</Link>
                                        </Button>
                                    )}
                                    {!editing && (
                                        <Button variant="outline" onClick={() => setEditing(true)}>
                                            Edit answers
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {showForm && (
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-base">
                                    {application ? "Update your answers" : "Apply for the beta"}
                                </CardTitle>
                                <CardDescription>
                                    {application
                                        ? "Your status doesn't change when you edit."
                                        : "Free during the beta. No card needed."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submit} className="space-y-5">
                                    <fieldset className="space-y-2">
                                        <legend className="text-sm font-medium">Which sims do you drive?</legend>
                                        <div className="flex flex-wrap gap-2" role="group" aria-label="Sims">
                                            {BETA_SIMS.map(o => (
                                                <Chip
                                                    key={o.value}
                                                    selected={sims.includes(o.value)}
                                                    onClick={() => toggleSim(o.value)}
                                                >
                                                    {o.label}
                                                </Chip>
                                            ))}
                                        </div>
                                    </fieldset>

                                    <fieldset className="space-y-2">
                                        <legend className="text-sm font-medium">Platform</legend>
                                        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Platform">
                                            {BETA_PLATFORMS.map(o => (
                                                <Chip
                                                    key={o.value}
                                                    role="radio"
                                                    selected={platform === o.value}
                                                    onClick={() => setPlatform(o.value)}
                                                >
                                                    {o.label}
                                                </Chip>
                                            ))}
                                        </div>
                                    </fieldset>

                                    <fieldset className="space-y-2">
                                        <legend className="text-sm font-medium">Input</legend>
                                        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Input">
                                            {BETA_INPUTS.map(o => (
                                                <Chip
                                                    key={o.value}
                                                    role="radio"
                                                    selected={input === o.value}
                                                    onClick={() => setInput(o.value)}
                                                >
                                                    {o.label}
                                                </Chip>
                                            ))}
                                        </div>
                                    </fieldset>

                                    <div className="space-y-2">
                                        <Label htmlFor="beta-note">
                                            Anything else? <span className="text-muted-foreground">(optional)</span>
                                        </Label>
                                        <Textarea
                                            id="beta-note"
                                            value={note}
                                            maxLength={BETA_NOTE_MAX}
                                            onChange={e => setNote(e.target.value)}
                                            placeholder="Leagues you race in, what you want from telemetry, your rig…"
                                            className="min-h-24"
                                        />
                                        <p className="text-right text-xs text-muted-foreground tabular-nums">
                                            {note.length}/{BETA_NOTE_MAX}
                                        </p>
                                    </div>

                                    {formError && (
                                        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
                                            {formError}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        <Button type="submit" disabled={saving}>
                                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                            {application ? "Save answers" : "Send application"}
                                        </Button>
                                        {application && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                disabled={saving}
                                                onClick={() => {
                                                    fill(application);
                                                    setFormError(null);
                                                    setEditing(false);
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </main>
    );
}
