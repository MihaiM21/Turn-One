"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    Download,
    Wifi,
    WifiOff,
    ArrowUpCircle,
    CheckCircle2,
    ExternalLink,
    ShieldCheck,
    HelpCircle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExploreMoreLinks } from "@/components/dashboard/explore-more-links";
import { SectionCard } from "@/components/dashboard/simracing/section-card";
import { LinkDownloadButton } from "@/components/turn-one-link/download-button";
import { SETUP_STEPS, REQUIREMENTS, TROUBLESHOOTING, PRIVACY_POINTS } from "@/components/turn-one-link/setup-content";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLinkRelease } from "@/hooks/use-link-release";
import { getMySessions, type SimSession } from "@/lib/simracing/api";

/** Newest-first version comparison for dotted numeric versions ("1.2.10" > "1.2.9"). */
function isOutdated(current: string, latest: string) {
    const a = current.replace(/^v/, "").split(".").map(Number);
    const b = latest.replace(/^v/, "").split(".").map(Number);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const x = a[i] ?? 0;
        const y = b[i] ?? 0;
        if (Number.isNaN(x) || Number.isNaN(y)) return false;
        if (x !== y) return x < y;
    }
    return false;
}

export default function SimracingDownloadPage() {
    const { release } = useLinkRelease();
    const [sessions, setSessions] = useState<SimSession[] | null>(null);

    useEffect(() => {
        getMySessions()
            .then(setSessions)
            .catch(() => setSessions([]));
    }, []);

    // The most recent session tells us whether Link has ever connected, and which build it was.
    const latestSession = sessions?.length
        ? [...sessions].sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt))[0]
        : null;
    const installedVersion = latestSession?.clientVersion ?? null;
    const hasConnected = !!latestSession;
    const isLive = sessions?.some(s => s.isActive) ?? false;
    const updateAvailable =
        !!installedVersion && !!release?.version && isOutdated(installedVersion, release.version);

    return (
        <main className="w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <PageHeader
                label="Sim racing"
                title="Turn One Link"
                description="The Windows app that streams your Assetto Corsa Competizione telemetry to Turn One."
                actions={
                    <Link
                        href="/download"
                        className="inline-flex h-8 items-center gap-1.5 border border-zinc-800 bg-zinc-900/60 px-3 text-xs text-zinc-300 transition-colors hover:border-primary/40 hover:text-primary"
                    >
                        Full guide
                        <ExternalLink className="h-3 w-3" />
                    </Link>
                }
            />

            {/* Connection status */}
            <SectionCard
                label="Status"
                title="Your connection"
                icon={isLive ? Wifi : WifiOff}
                iconClassName={isLive ? "text-green-500" : hasConnected ? "text-zinc-500" : "text-yellow-500"}
            >
                <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">State</p>
                        <p className="mt-1 text-sm font-bold text-white">
                            {isLive ? (
                                <span className="text-green-500">Streaming now</span>
                            ) : hasConnected ? (
                                "Not connected"
                            ) : (
                                <span className="text-yellow-500">Never connected</span>
                            )}
                        </p>
                        {latestSession ? (
                            <p className="mt-0.5 text-[11px] text-zinc-500">
                                Last session {formatDistanceToNow(new Date(latestSession.startedAt))} ago
                            </p>
                        ) : (
                            <p className="mt-0.5 text-[11px] text-zinc-500">Install Link to record your first lap.</p>
                        )}
                    </div>

                    <div>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Your version</p>
                        <p className="mt-1 font-mono text-sm font-bold tabular-nums text-white">
                            {installedVersion ? `v${installedVersion.replace(/^v/, "")}` : "—"}
                        </p>
                        {updateAvailable ? (
                            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-yellow-400">
                                <ArrowUpCircle className="h-3 w-3" />
                                Update available
                            </p>
                        ) : installedVersion ? (
                            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-green-500">
                                <CheckCircle2 className="h-3 w-3" />
                                Up to date
                            </p>
                        ) : null}
                    </div>

                    <div>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Latest release</p>
                        <p className="mt-1 font-mono text-sm font-bold tabular-nums text-white">
                            {release?.version ? `v${release.version}` : release ? "Unreleased" : "—"}
                        </p>
                    </div>
                </div>
            </SectionCard>

            <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
                <SectionCard label="Install" title="Get Turn One Link" icon={Download}>
                    <LinkDownloadButton size="sm" />

                    <ol className="mt-6 divide-y divide-zinc-800 border-t border-zinc-800">
                        {SETUP_STEPS.map((step, i) => {
                            const StepIcon = step.icon;
                            return (
                                <li key={step.title} className="flex gap-4 py-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-primary/40 font-mono text-[10px] font-bold text-primary">
                                        {i + 1}
                                    </span>
                                    <div className="min-w-0 space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <StepIcon className="h-3.5 w-3.5 text-primary" />
                                            <p className="text-xs font-bold uppercase tracking-tight text-white">
                                                {step.title}
                                            </p>
                                        </div>
                                        <p className="text-xs text-zinc-500">{step.description}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </SectionCard>

                <div className="space-y-4">
                    <SectionCard label="Requirements" title="Before you start">
                        <dl className="divide-y divide-zinc-800">
                            {REQUIREMENTS.map(req => (
                                <div key={req.label} className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0">
                                    <dt className="text-[10px] uppercase tracking-wider text-zinc-500">{req.label}</dt>
                                    <dd className="text-xs text-zinc-300">{req.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </SectionCard>

                    <SectionCard label="Privacy" title="What it never does" icon={ShieldCheck} iconClassName="text-green-500">
                        <ul className="space-y-2">
                            {PRIVACY_POINTS.doesNot.map(point => (
                                <li key={point} className="flex gap-2 text-xs text-zinc-400">
                                    <span className="mt-1.5 h-1 w-1 shrink-0 bg-zinc-700" aria-hidden />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </SectionCard>
                </div>
            </div>

            <SectionCard label="Help" title="Troubleshooting" icon={HelpCircle}>
                <Accordion type="single" collapsible className="w-full">
                    {TROUBLESHOOTING.map((item, i) => (
                        <AccordionItem key={item.question} value={`item-${i}`} className="border-zinc-800">
                            <AccordionTrigger className="text-left text-sm font-bold hover:text-primary hover:no-underline">
                                {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-xs leading-relaxed text-zinc-400">
                                {item.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </SectionCard>

            <ExploreMoreLinks currentPage="/simracing/download" />
        </main>
    );
}
