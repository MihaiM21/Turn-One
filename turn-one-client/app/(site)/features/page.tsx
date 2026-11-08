import type { Metadata } from "next";
import {
  BarChart3,
  Zap,
  Target,
  Clock,
  MapPin,
  Database,
  Cpu,
  Eye,
  Settings,
  Download,
  Shield,
  Smartphone,
  Globe,
  Gauge,
  Activity,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { MainNav } from "@/components/navigation/main-nav";
import { PublicHero } from "@/components/site/public-hero";
import { SectionHeader } from "@/components/site/section-header";
import { PublicCard } from "@/components/site/public-card";
import { CtaRow } from "@/components/site/cta-row";
import { generateSEO } from "@/lib/seo";


export const metadata: Metadata = generateSEO({
  title: "Features",
  description:
    "Explore Turn One features — advanced F1 lap time analysis, real-time telemetry, speed traces, interactive track mapping, championship analytics and a full services suite.",
  url: "/features",
  keywords: [
    "F1 features",
    "telemetry analysis",
    "lap time analysis",
    "track mapping",
    "real-time F1 data",
    "speed trace analysis",
    "F1 services",
  ],
});

const coreFeatures = [
  {
    icon: BarChart3,
    title: "Advanced lap time analysis",
    description:
      "Sector-by-sector performance with millisecond precision and comparative analysis across sessions.",
    bullets: ["Sector breakdowns", "Performance trends", "Session compares", "Weather impact"],
  },
  {
    icon: Zap,
    title: "Real-time telemetry",
    description:
      "Live data during practice, qualifying and the race — streamed and visualized in real time.",
    bullets: ["Live streaming", "Instant alerts", "Performance monitoring", "WebSocket feeds"],
  },
  {
    icon: Target,
    title: "Precision speed traces",
    description:
      "Speed, throttle, brake and steering analysis with track-position mapping for complete corner insight.",
    bullets: ["Speed profiling", "Braking analysis", "Throttle mapping", "Corner optimization"],
  },
  {
    icon: MapPin,
    title: "Interactive track mapping",
    description:
      "Telemetry overlaid on accurate track maps with turn-by-turn analysis and racing line visualization.",
    bullets: ["3D tracks", "Racing line", "Corner profiling", "Sector mapping"],
  },
];

const technicalFeatures = [
  { icon: Database, title: "Historical archive", description: "Every F1 session we processed before October 2026, with advanced filters." },
  { icon: Cpu, title: "AI-powered insights", description: "Machine learning surfaces patterns and optimization wins." },
  { icon: Eye, title: "Multi-driver compare", description: "Synchronized telemetry across as many drivers as you want." },
  { icon: Settings, title: "Custom analysis", description: "Build your own workflows on top of our processing engine." },
  { icon: Download, title: "Share cards", description: "Turn a sim lap into an image card, ready for social posts." },
  { icon: Shield, title: "Secure accounts", description: "Encrypted transmission and hashed passwords." },
];

const platformFeatures = [
  { icon: Smartphone, title: "Mobile responsive", description: "Full functionality on every device, optimized for trackside use." },
  { icon: Globe, title: "Every circuit", description: "Every circuit on the F1 calendar, plus the tracks in the sims Turn One Link supports." },
  { icon: Clock, title: "Your laps, instantly", description: "Turn One Link streams each sim lap as you drive, ready to analyse when you pit." },
];

const services = [
  {
    icon: BarChart3,
    title: "Telemetry analysis",
    description: "Lap times, sector performance and vehicle dynamics with millisecond precision.",
    tags: ["Lap times", "Sectors", "Speed traces"],
  },
  {
    icon: Zap,
    title: "Real-time insights",
    description: "Instant analysis during every session with live data streaming.",
    tags: ["Live timing", "Session analysis", "Alerts"],
  },
  {
    icon: TrendingUp,
    title: "Performance trends",
    description: "Driver and team evolution across seasons, with predictive modelling.",
    tags: ["Seasons", "Predictions", "Compares"],
  },
  {
    icon: Trophy,
    title: "Championship analytics",
    description: "Title-fight scenarios with points projections and strategic recommendations.",
    tags: ["Points", "Scenarios", "Strategy"],
  },
  {
    icon: Database,
    title: "Historical data",
    description: "Decades of F1 data for comparative analysis and deep research.",
    tags: ["Archive", "Export", "Research"],
  },
  {
    icon: Users,
    title: "Team collaboration",
    description: "Share insights and collaborate securely with professional-grade tooling.",
    tags: ["Sharing", "Secure", "Realtime"],
  },
];

const advancedServices = [
  { icon: MapPin, title: "Track mapping", description: "Interactive track maps with corner-by-corner performance breakdowns." },
  { icon: Activity, title: "Performance optimization", description: "AI-powered setup, driving line and strategy recommendations." },
  { icon: Gauge, title: "Custom dashboards", description: "Build personalized dashboards with the widgets that matter to you." },
  { icon: Settings, title: "API integration", description: "REST + WebSocket APIs to plug into your own systems and workflows." },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-black">
      <MainNav />

      <PublicHero
        eyebrow="Features · Professional F1 telemetry"
        title="The whole paddock, on your screen."
        subtitle="Analysis tools for serious F1 fans, creators and sim racers. Every millisecond, surfaced."
        backgroundImage="/turn-one-car/2026-turn-one-car/0001.webp"
        cta={
          <CtaRow
            primary={{ label: "Start free", href: "/auth/signup" }}
            secondary={{ label: "See pricing", href: "/pricing" }}
          />
        }
      />

      <main className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {/* Core analysis */}
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Core analysis"
            title="Where the real lap time lives"
            subtitle="Deep tools for the four areas that matter most — laps, telemetry, traces and the track itself."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {coreFeatures.map((f) => (
              <PublicCard key={f.title} hover className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-zinc-800 bg-zinc-900">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-bold uppercase tracking-tight">{f.title}</p>
                    <p className="text-sm text-zinc-400">{f.description}</p>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {f.bullets.map((b) => (
                        <div key={b} className="flex items-center gap-2">
                          <span className="h-1 w-1 bg-primary" aria-hidden />
                          <span className="text-xs text-zinc-500">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </PublicCard>
            ))}
          </div>
        </section>

        {/* Technical */}
        <section className="space-y-6">
          <SectionHeader eyebrow="Technical capabilities" title="Built like an engineering platform" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {technicalFeatures.map((f) => (
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

        {/* Platform */}
        <section className="space-y-6">
          <SectionHeader eyebrow="Platform" title="Everywhere you race" />
          <div className="grid gap-4 md:grid-cols-3">
            {platformFeatures.map((f) => (
              <PublicCard key={f.title} className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-zinc-800 bg-zinc-900">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-bold uppercase tracking-tight">{f.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{f.description}</p>
              </PublicCard>
            ))}
          </div>
        </section>

        {/* Services (merged from /services) */}
        <section id="services-platform" className="space-y-6">
          <SectionHeader
            eyebrow="Services"
            title="Professional services suite"
            subtitle="Beyond features — the analysis services behind every chart."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <PublicCard key={s.title} hover className="p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center border border-zinc-800 bg-zinc-900">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-bold uppercase tracking-tight">{s.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{s.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.tags.map((t) => (
                    <span
                      key={t}
                      className="border border-zinc-700 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-zinc-500"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </PublicCard>
            ))}
          </div>
        </section>

        {/* Advanced (merged from /services) */}
        <section id="services-pro" className="space-y-6">
          <SectionHeader eyebrow="Advanced" title="Pro-grade tooling" />
          <div className="grid gap-4 md:grid-cols-2">
            {advancedServices.map((s) => (
              <PublicCard key={s.title} hover className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-zinc-800 bg-zinc-900">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-bold uppercase tracking-tight">{s.title}</p>
                    <p className="mt-1 text-sm text-zinc-400">{s.description}</p>
                  </div>
                </div>
              </PublicCard>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border border-zinc-800 bg-zinc-950 px-6 py-12 text-center sm:px-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Start analyzing</p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Free account · 30 tokens · No credit card
          </h2>
          <div className="mt-6 flex justify-center">
            <CtaRow
              primary={{ label: "Create free account", href: "/auth/signup" }}
              secondary={{ label: "See pricing", href: "/pricing" }}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
