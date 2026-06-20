"use client";

import Link from "next/link";
import {
  BarChart3,
  Zap,
  Users,
  Trophy,
  TrendingUp,
  Clock,
  Target,
  ArrowRight,
} from "lucide-react";
import { MainNav } from "@/components/navigation/main-nav";
import { PublicHero } from "@/components/site/public-hero";
import { SectionHeader } from "@/components/site/section-header";
import { PublicCard } from "@/components/site/public-card";
import { CtaRow } from "@/components/site/cta-row";
import { DashboardPreview } from "@/components/site/dashboard-preview";
import { SOCIAL_LINKS } from "@/lib/social-links";

const features = [
  {
    icon: BarChart3,
    title: "Telemetry analysis",
    description: "Sector-by-sector visualization of lap times, throttle, brake and speed traces with millisecond precision.",
  },
  {
    icon: Zap,
    title: "Real-time insights",
    description: "Live timing during practice, qualifying and the race — streamed straight from official sources.",
  },
  {
    icon: TrendingUp,
    title: "Performance trends",
    description: "Track how drivers and teams evolve across sessions and seasons with comparative analytics.",
  },
  {
    icon: Trophy,
    title: "Championship analytics",
    description: "Deep dive into title fights with scenario modelling and points projections.",
  },
  {
    icon: Clock,
    title: "Historical archive",
    description: "Full coverage from 2020 onwards. Compare any session, any driver, any era.",
  },
  {
    icon: Users,
    title: "Built for the community",
    description: "Share insights, compete on the leaderboard, claim daily rewards, and predict every race.",
  },
];

const stats = [
  { value: "5+", label: "Years of F1 data" },
  { value: "1M+", label: "Data points per race" },
  { value: "1000+", label: "Sessions archived" },
];

const timeline = [
  { year: "2023", title: "The beginning", description: "Started as a side project by F1 fans frustrated with the lack of accessible telemetry tools." },
  { year: "2024", title: "First platform launch", description: "Shipped to a 1,000+ enthusiast community with live timing and lap-by-lap analysis." },
  { year: "2025", title: "AI integration", description: "Added predictive models and automated insights, processing 10M+ data points per race weekend." },
  { year: "2026", title: "Next generation", description: "Real-time SignalR telemetry, gamified predictions, daily rewards and a refreshed dashboard.", highlight: true },
];

export default function HomePage() {
  const backgroundImage = "/turn-one-car/2026-turn-one-car/Cockpit_Image_01.webp";

  return (
    <div className="min-h-screen bg-black">
      <MainNav variant="homepage" />

      <PublicHero
        eyebrow="Turn One · Formula One intelligence"
        title="Race data, finally on your side."
        subtitle="Advanced telemetry analysis, real-time insights and a gamified race experience — built for every kind of F1 fan."
        backgroundImage={backgroundImage}
        cta={
          <CtaRow
            primary={{ label: "Start free", href: "/auth/signup" }}
            secondary={{ label: "Join Discord", href: SOCIAL_LINKS.discord }}
          />
        }
      >
        <div className="grid max-w-2xl grid-cols-3 gap-4 border-t border-zinc-800 pt-6">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-mono text-2xl font-black tabular-nums text-foreground sm:text-3xl">
                {s.value}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </PublicHero>

      <main className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {/* Dashboard preview / onboarding teaser */}
        <DashboardPreview />

        {/* Feature grid */}
        <section className="space-y-6">
          <SectionHeader
            eyebrow="What's inside"
            title="Professional F1 analysis tools"
            subtitle="Everything you need to make sense of every lap — from broadcast-style overlays to the rawest telemetry."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <PublicCard key={f.title} hover className="p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center border border-zinc-800 bg-zinc-900">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-bold uppercase tracking-tight">{f.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{f.description}</p>
              </PublicCard>
            ))}
          </div>
        </section>

        {/* Merged "About" section (from /about) */}
        <section id="about" className="space-y-6">
          <SectionHeader
            eyebrow="Our story"
            title="Motorsport intelligence specialists"
            subtitle="Turn One combines deep Formula One expertise with modern engineering to give fans, content creators and analysts the same kind of tools the paddock uses."
          />

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <PublicCard accent className="p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Mission</p>
              <p className="mt-3 text-base text-zinc-300">
                Democratize access to professional-grade telemetry. Turn the millions of raw data points
                from every session into something anyone can understand, explore and bet on.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Data-driven", "Professional grade", "Innovation first", "Community owned"].map((b) => (
                  <span
                    key={b}
                    className="border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-300"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </PublicCard>

            <PublicCard className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {[Target, Zap, Trophy, BarChart3].map((Icon, i) => (
                  <div key={i} className="flex aspect-square items-center justify-center border border-zinc-800 bg-zinc-900">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                ))}
              </div>
            </PublicCard>
          </div>

          {/* Timeline */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {timeline.map((t) => (
              <PublicCard key={t.year} accent={t.highlight} className="p-5">
                <p className="font-mono text-2xl font-black tabular-nums text-primary">{t.year}</p>
                <p className="mt-2 text-sm font-bold">{t.title}</p>
                <p className="mt-1 text-xs text-zinc-400">{t.description}</p>
              </PublicCard>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border border-zinc-800 bg-zinc-950 px-6 py-12 text-center sm:px-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Ready when you are</p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Build your race control room.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400">
            Free forever. 30 tokens to start. No credit card. Sign up takes under thirty seconds.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/auth/signup"
              className="group inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-medium uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Create free account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
