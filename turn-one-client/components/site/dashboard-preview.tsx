"use client";

import { NextRaceHero } from "@/components/dashboard/live dashboard/next-race-hero";
import { LatestSessionWidget } from "@/components/dashboard/latest-session-widget";
import { GatedPreview } from "@/components/site/gated-preview";
import { SectionHeader } from "@/components/site/section-header";

export function DashboardPreview() {
  return (
    <section className="space-y-6">
      <SectionHeader
        eyebrow="What you get inside"
        title="A live race control room"
        subtitle="Real-time countdowns, session highlights, predictions, gifts and gamified telemetry — your dashboard updates every lap."
      />

      <div className="relative">
        <GatedPreview
          intensity="sm"
          teaser="Your personalized dashboard refreshes every lap. Sign up free to unlock the full experience."
          cta={{ label: "Sign up free", href: "/auth/signup" }}
        >
          <div className="space-y-4">
            <NextRaceHero />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
              <LatestSessionWidget />
              <div className="flex h-full flex-col justify-between border border-zinc-800 bg-zinc-950 p-5">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Daily reward</p>
                  <p className="text-2xl font-black uppercase tracking-tight">+50 tokens</p>
                  <p className="text-xs text-zinc-500">Stop by every day for a token gift, streak bonuses and prediction boosts.</p>
                </div>
                <div className="mt-4 flex items-baseline gap-3 border-t border-zinc-800 pt-3">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Streak</span>
                  <span className="font-mono text-xl font-black tabular-nums">07</span>
                  <span className="text-xs text-zinc-500">days</span>
                </div>
              </div>
            </div>
          </div>
        </GatedPreview>
      </div>
    </section>
  );
}
