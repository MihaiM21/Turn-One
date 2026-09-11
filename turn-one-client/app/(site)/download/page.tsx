"use client";

import {
    Activity,
    Bot,
    Check,
    GitCompareArrows,
    Radio,
    ShieldCheck,
    X,
    Map,
    History,
} from "lucide-react";
import { MainNav } from "@/components/navigation/main-nav";
import { PublicHero } from "@/components/site/public-hero";
import { SectionHeader } from "@/components/site/section-header";
import { PublicCard } from "@/components/site/public-card";
import { CtaRow } from "@/components/site/cta-row";
import { SimRacingIllustration } from "@/components/site/tutorial-illustrations";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LinkDownloadButton } from "@/components/turn-one-link/download-button";
import { SETUP_STEPS, REQUIREMENTS, PRIVACY_POINTS, TROUBLESHOOTING } from "@/components/turn-one-link/setup-content";
import { useLinkRelease } from "@/hooks/use-link-release";

const CAPABILITIES = [
    {
        icon: Activity,
        title: "Live cockpit",
        description:
            "Speed, gear, RPM, pedals, tyre and brake temperatures streaming to your browser at 100 Hz — on a second monitor, phone or tablet.",
    },
    {
        icon: History,
        title: "Every lap, saved",
        description:
            "Each completed lap lands in your session history with lap and sector times, valid/invalid state and full telemetry traces.",
    },
    {
        icon: GitCompareArrows,
        title: "Delta traces",
        description:
            "Overlay any two laps on a distance axis and see exactly where the time went — corner by corner, metre by metre.",
    },
    {
        icon: Map,
        title: "Track maps",
        description:
            "Your racing line coloured by speed, throttle, brake or gear, cursor-synced with the telemetry traces.",
    },
    {
        icon: Bot,
        title: "AI coaching",
        description:
            "Plain-language feedback on braking, throttle application and consistency — and a chat you can ask about any lap.",
    },
    {
        icon: Radio,
        title: "Streamer overlays",
        description:
            "Transparent, OBS-ready overlays with shareable links. Put your live telemetry on stream in about a minute.",
    },
];

export default function DownloadPage() {
    const { release } = useLinkRelease();

    return (
        <div className="min-h-screen bg-black">
            <MainNav variant="homepage" />

            <PublicHero
                eyebrow="Turn One Link · Free · Windows"
                title="Your sim. Your data. Your lap time."
                subtitle="Turn One Link is a small Windows app that streams your Assetto Corsa Competizione telemetry to Turn One in real time — so every lap you drive becomes something you can actually analyse."
                backgroundImage="/turn-one-car/2026-turn-one-car/Cockpit_Image_01.webp"
                cta={<LinkDownloadButton />}
            />

            <main className="mx-auto max-w-7xl space-y-16 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                {/* What you get */}
                <section className="space-y-8">
                    <SectionHeader
                        eyebrow="What it unlocks"
                        title="From shared memory to real analysis."
                        subtitle="Link is the bridge. Everything below happens automatically once it's running — no exports, no spreadsheets, no scripts."
                    />

                    <div className="grid gap-px overflow-hidden border border-zinc-800 bg-zinc-800 sm:grid-cols-2 lg:grid-cols-3">
                        {CAPABILITIES.map(({ icon: Icon, title, description }) => (
                            <div key={title} className="bg-zinc-950 p-6">
                                <Icon className="h-5 w-5 text-primary" />
                                <p className="mt-3 text-sm font-bold uppercase tracking-tight text-white">{title}</p>
                                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Setup */}
                <section className="space-y-8 border-t border-zinc-800 pt-16">
                    <SectionHeader
                        eyebrow="Setup"
                        title="Four steps, about two minutes."
                        subtitle="No in-game settings to change and nothing to configure. Install it, sign in, drive."
                    />

                    <div className="grid items-start gap-8 lg:grid-cols-2">
                        <PublicCard className="overflow-hidden p-0">
                            <div className="border-b border-zinc-800 bg-zinc-900/40">
                                <SimRacingIllustration />
                            </div>
                            <ol className="divide-y divide-zinc-800">
                                {SETUP_STEPS.map((step, i) => {
                                    const StepIcon = step.icon;
                                    return (
                                        <li key={step.title} className="flex gap-4 p-4">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-primary/40 font-mono text-[10px] font-bold text-primary">
                                                    {i + 1}
                                                </span>
                                                {i < SETUP_STEPS.length - 1 && (
                                                    <span className="w-px flex-1 bg-zinc-800" aria-hidden />
                                                )}
                                            </div>
                                            <div className="space-y-1 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <StepIcon className="h-3.5 w-3.5 text-primary" />
                                                    <p className="text-xs font-bold uppercase tracking-tight">{step.title}</p>
                                                </div>
                                                <p className="text-xs text-zinc-400">{step.description}</p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </PublicCard>

                        <div className="space-y-6">
                            <PublicCard accent className="p-6">
                                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Requirements</p>
                                <dl className="mt-4 divide-y divide-zinc-800">
                                    {REQUIREMENTS.map(req => (
                                        <div key={req.label} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
                                            <dt className="text-[10px] uppercase tracking-wider text-zinc-500">{req.label}</dt>
                                            <dd className="text-xs text-zinc-300">{req.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </PublicCard>

                            <PublicCard className="p-6">
                                <LinkDownloadButton />
                            </PublicCard>
                        </div>
                    </div>
                </section>

                {/* Privacy */}
                <section className="space-y-8 border-t border-zinc-800 pt-16">
                    <SectionHeader
                        eyebrow="Privacy"
                        title="Exactly what it reads."
                        subtitle="Link reads one block of memory that ACC already publishes, and sends nothing else. Here's the full list."
                    />

                    <div className="grid gap-4 lg:grid-cols-2">
                        <PublicCard className="p-6">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">What it sends</p>
                            </div>
                            <ul className="mt-4 space-y-2.5">
                                {PRIVACY_POINTS.sends.map(point => (
                                    <li key={point} className="flex gap-2.5 text-xs text-zinc-300">
                                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </PublicCard>

                        <PublicCard className="p-6">
                            <div className="flex items-center gap-2">
                                <X className="h-4 w-4 text-zinc-500" />
                                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">What it never does</p>
                            </div>
                            <ul className="mt-4 space-y-2.5">
                                {PRIVACY_POINTS.doesNot.map(point => (
                                    <li key={point} className="flex gap-2.5 text-xs text-zinc-300">
                                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </PublicCard>
                    </div>
                </section>

                {/* Troubleshooting */}
                <section className="space-y-8 border-t border-zinc-800 pt-16">
                    <SectionHeader eyebrow="Troubleshooting" title="Common questions." />

                    <PublicCard className="px-6">
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
                    </PublicCard>
                </section>

                {/* Changelog — only once there is a release to describe */}
                {release?.changelog?.length ? (
                    <section className="space-y-8 border-t border-zinc-800 pt-16">
                        <SectionHeader eyebrow="Changelog" title="What's new." />

                        <div className="space-y-4">
                            {release.changelog.map(entry => (
                                <PublicCard key={entry.version} className="p-6">
                                    <div className="flex flex-wrap items-baseline gap-3">
                                        <p className="font-mono text-sm font-black text-primary">v{entry.version}</p>
                                        {entry.date ? (
                                            <p className="font-mono text-[11px] text-zinc-500">
                                                {new Date(entry.date).toLocaleDateString(undefined, { dateStyle: "medium" })}
                                            </p>
                                        ) : null}
                                    </div>
                                    <ul className="mt-3 space-y-1.5">
                                        {entry.changes.map(change => (
                                            <li key={change} className="flex gap-2.5 text-xs text-zinc-400">
                                                <span className="mt-1.5 h-1 w-1 shrink-0 bg-primary" aria-hidden />
                                                {change}
                                            </li>
                                        ))}
                                    </ul>
                                </PublicCard>
                            ))}
                        </div>
                    </section>
                ) : null}

                {/* Final CTA */}
                <section className="border border-zinc-800 bg-zinc-950 px-6 py-12 text-center sm:px-12">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Free to start</p>
                    <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">
                        Stop guessing where the time went.
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400">
                        Create a free account, install Link, and your next stint turns into lap-by-lap analysis
                        automatically.
                    </p>
                    <div className="mt-6 flex justify-center">
                        <CtaRow
                            primary={{ label: "Create a free account", href: "/auth/signup" }}
                            secondary={{ label: "See how it works", href: "/how-it-works#simracing" }}
                        />
                    </div>
                </section>
            </main>
        </div>
    );
}
