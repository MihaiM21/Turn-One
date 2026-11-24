import type { Metadata } from "next";
import {
  Activity,
  BarChart3,
  CalendarClock,
  Cast,
  Database,
  Eye,
  Gauge,
  Image as ImageIcon,
  Languages,
  Lightbulb,
  MapPin,
  MonitorDown,
  Radio,
  ShieldCheck,
  Smartphone,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";
import { MainNav } from "@/components/navigation/main-nav";
import { PublicHero } from "@/components/site/public-hero";
import { SectionHeader } from "@/components/site/section-header";
import { PublicCard } from "@/components/site/public-card";
import { CtaRow } from "@/components/site/cta-row";
import { BETA_SIGNUP_HREF } from "@/components/landing/data";
import { generateSEO } from "@/lib/seo";

/**
 * Only what a beta driver can use. Paid features carry a "Pro" tag (they mirror
 * Domain/PlanFeatures.cs and the pricing page); anything not built yet lives in
 * `planned` and is labelled as such. Same honesty rules as the landing page.
 */

export const metadata: Metadata = generateSEO({
  title: "Features",
  description:
    "Turn One Link records every lap you drive in ACC, EA SPORTS F1 25 (including the 2026 Season Pack) and iRacing. The web shows where you lose time, corner by corner, with verified leaderboards and OBS overlays.",
  url: "/features",
  keywords: [
    "sim racing telemetry",
    "ACC telemetry",
    "F1 25 telemetry",
    "iRacing telemetry",
    "lap comparison",
    "sim racing leaderboards",
  ],
});

type Feature = {
  icon: typeof Activity;
  title: string;
  description: string;
  bullets?: string[];
  pro?: boolean;
};

const capture: Feature[] = [
  {
    icon: MonitorDown,
    title: "Turn One Link",
    description:
      "A small Windows app that reads the telemetry your sim already publishes. Pair it once by approving a code on the website; it stays signed in.",
    bullets: ["Windows 10 and 11", "No password in the app", "Nothing injected into the game", "Updates itself"],
  },
  {
    icon: Database,
    title: "Every lap kept",
    description:
      "Link records each session on your PC first and uploads every lap as it ends. If your connection drops, it retries until the lap arrives.",
    bullets: ["Local copy of every session", "Upload state per session", "Duplicates removed on the server", "Sessions private by default"],
  },
  {
    icon: Wrench,
    title: "Set-up check",
    description:
      "A health check per game tells you whether the sim is detected, data is arriving and laps are timed, and what to change when a step fails.",
  },
  {
    icon: Smartphone,
    title: "Phone dashboard",
    description:
      "Scan a QR code and your phone becomes a second screen on your home network: delta, lap and sector times, tyres, fuel, gear and revs.",
  },
];

const analysis: Feature[] = [
  {
    icon: BarChart3,
    title: "Sessions and laps",
    description: "Every session with its laps, sector times, validity and personal bests, filtered by sim.",
  },
  {
    icon: MapPin,
    title: "Lap overlay on distance",
    description:
      "Speed, throttle, brake, gear and the running delta on one distance axis, with a track map that follows your cursor.",
  },
  {
    icon: Gauge,
    title: "Corner by corner",
    description:
      "Corners are detected on every lap. Compare braking points, minimum speed and exit speed between laps, and see which corner costs the most.",
  },
  {
    icon: Activity,
    title: "Explained plots",
    description:
      "Extra plots for braking, sectors, gears, grip, tyres, fuel and consistency. Each one says what it shows, how to read it and what to look for.",
  },
  {
    icon: Lightbulb,
    title: "Coaching tips per lap",
    description: "Tips on pace, braking, throttle, consistency and track limits for the lap you pick.",
    pro: true,
  },
  {
    icon: Eye,
    title: "Compare with other drivers",
    description: "Overlay up to eight laps, including other drivers' public laps, on the same distance axis.",
    pro: true,
  },
];

const compete: Feature[] = [
  {
    icon: Trophy,
    title: "Verified leaderboards",
    description:
      "Best valid laps per sim, track and car. Every lap is checked on the server: sector sum, track length and plausible speed.",
  },
  {
    icon: Users,
    title: "Your driver page",
    description: "Your personal bests and ranks per track and car. Appear under your name, anonymously, or not at all.",
  },
  {
    icon: ImageIcon,
    title: "Share cards",
    description: "Turn a lap into an image card, ready for social posts.",
  },
  {
    icon: Cast,
    title: "OBS overlays",
    description: "Browser-source overlays for streaming, fed live from your Link session: cockpit, lap timer and leaderboard.",
    pro: true,
  },
  {
    icon: Radio,
    title: "Spectate",
    description: "Watch public live sessions as they happen.",
    pro: true,
  },
];

const sims = [
  { name: "Assetto Corsa Competizione", platforms: "PC", reads: "Shared-memory telemetry" },
  { name: "EA SPORTS F1 25, including the 2026 Season Pack", platforms: "PC, and PS5 or Xbox through a PC on the same network", reads: "UDP telemetry you switch on in the game" },
  { name: "iRacing", platforms: "PC", reads: "iRacing SDK telemetry" },
  { name: "Assetto Corsa (experimental)", platforms: "PC", reads: "Recorded, not ranked yet" },
];

const planned: Feature[] = [
  { icon: Lightbulb, title: "Coach with measured tips", description: "The three corners that cost you most, with the metres and km/h to change and why." },
  { icon: Wrench, title: "Setups tied to laps", description: "A free setups library sorted by the lap each setup actually produced." },
  { icon: CalendarClock, title: "Weekly hotlap", description: "One shared target each week, on the track of the real Grand Prix." },
  { icon: Languages, title: "Romanian", description: "The website, Link and coaching tips in Romanian." },
];

function FeatureCard({ f }: { f: Feature }) {
  return (
    <PublicCard hover className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center border border-zinc-800 bg-zinc-900">
          <f.icon className="h-4 w-4 text-primary" />
        </div>
        {f.pro && (
          <span className="border border-primary/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-primary">Pro</span>
        )}
      </div>
      <p className="text-sm font-bold uppercase tracking-tight">{f.title}</p>
      <p className="mt-1 text-sm text-zinc-400">{f.description}</p>
      {f.bullets && (
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {f.bullets.map((b) => (
            <div key={b} className="flex items-center gap-2">
              <span className="h-1 w-1 bg-primary" aria-hidden />
              <span className="text-xs text-zinc-500">{b}</span>
            </div>
          ))}
        </div>
      )}
    </PublicCard>
  );
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-black">
      <MainNav />

      <PublicHero
        eyebrow="Features · Sim racing telemetry"
        title="Find the tenth in every corner."
        subtitle="Turn One Link records every lap you drive. The web shows where you lose time, against your best and the leaderboard."
        backgroundImage="/turn-one-car/2026-turn-one-car/0001.webp"
        cta={
          <CtaRow
            primary={{ label: "Join the beta", href: BETA_SIGNUP_HREF }}
            secondary={{ label: "See pricing", href: "/pricing" }}
          />
        }
      />

      <main className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Capture"
            title="Every lap, recorded"
            subtitle="Link sits in the tray, notices when you start a supported sim and keeps every lap."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {capture.map((f) => (
              <FeatureCard key={f.title} f={f} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeader eyebrow="Supported sims" title="What Link reads" />
          <PublicCard className="divide-y divide-zinc-800">
            {sims.map((s) => (
              <div key={s.name} className="grid gap-1 p-4 sm:grid-cols-3 sm:gap-4">
                <p className="text-sm font-bold">{s.name}</p>
                <p className="text-sm text-zinc-400">{s.platforms}</p>
                <p className="text-sm text-zinc-500">{s.reads}</p>
              </div>
            ))}
          </PublicCard>
        </section>

        <section className="space-y-6">
          <SectionHeader
            eyebrow="Analysis"
            title="Where the time goes"
            subtitle="Features tagged Pro are part of the paid plan, which is not on sale yet."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analysis.map((f) => (
              <FeatureCard key={f.title} f={f} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeader eyebrow="Compete and share" title="Leaderboards, pages and streams" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {compete.map((f) => (
              <FeatureCard key={f.title} f={f} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeader
            eyebrow="Planned"
            title="Not built yet"
            subtitle="These are next on the list. They are not available today."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {planned.map((f) => (
              <PublicCard key={f.title} className="p-5 opacity-80">
                <div className="mb-3 flex h-9 w-9 items-center justify-center border border-zinc-800 bg-zinc-900">
                  <f.icon className="h-4 w-4 text-zinc-500" />
                </div>
                <p className="text-sm font-bold uppercase tracking-tight">{f.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{f.description}</p>
              </PublicCard>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeader eyebrow="Also on Turn One" title="F1 Archive" />
          <PublicCard className="flex items-start gap-4 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-zinc-800 bg-zinc-900">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm text-zinc-400">
              Telemetry from the F1 sessions we processed before October 2026 stays available in the F1 Archive. Newer
              sessions are not added. Turn One is unofficial and is not affiliated with Formula 1, the FIA or the game
              publishers named on this page.
            </p>
          </PublicCard>
        </section>

        <section className="border border-zinc-800 bg-zinc-950 px-6 py-12 text-center sm:px-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Closed beta · Windows</p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Free to record. No credit card.
          </h2>
          <div className="mt-6 flex justify-center">
            <CtaRow
              primary={{ label: "Join the beta", href: BETA_SIGNUP_HREF }}
              secondary={{ label: "See pricing", href: "/pricing" }}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
