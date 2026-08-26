import Link from "next/link";
import {
  ArrowRight,
  ChartSpline,
  Trophy,
  Flag,
  MonitorCog,
  Users,
  SlidersHorizontal,
  Play,
  Medal,
  Coins,
  ClipboardList,
  Gauge,
  LineChart,
  Bot,
  GitCompareArrows,
  Radio,
} from "lucide-react";
import { MainNav } from "@/components/navigation/main-nav";
import { Button } from "@/components/ui/button";
import { PublicHero } from "@/components/site/public-hero";
import { SectionHeader } from "@/components/site/section-header";
import { PublicCard } from "@/components/site/public-card";
import { CtaRow } from "@/components/site/cta-row";
import {
  GeneratorIllustration,
  PredictionsIllustration,
  SimRacingIllustration,
} from "@/components/site/tutorial-illustrations";

interface GuideStep {
  icon: React.ElementType;
  title: string;
  description: string;
}

interface GuideSection {
  id: string;
  icon: React.ElementType;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  steps: GuideStep[];
  illustration: React.ReactNode;
  reversed?: boolean;
  ctaHref: string;
  ctaLabel: string;
}

const sections: GuideSection[] = [
  {
    id: "generator",
    icon: ChartSpline,
    badge: "Telemetry generator",
    title: "Build any plot in five steps.",
    subtitle: "Pick a plot, pick a session, generate.",
    description:
      "The generator turns raw F1 timing and telemetry into the same charts race engineers use — no spreadsheets, no scripts.",
    steps: [
      { icon: SlidersHorizontal, title: "Pick a plot type", description: "Browse the tile picker — 26 plot types across speed, strategy, comparisons and season trends." },
      { icon: Flag, title: "Choose year, GP and session", description: "Any season, any Grand Prix, any session — practice through race." },
      { icon: Users, title: "Pick your driver(s)", description: "Single driver, head-to-head pair, or a multi-driver overlay, depending on the plot." },
      { icon: MonitorCog, title: "Tune advanced settings", description: "Optional: grid lines, legends, animation, chart height and line thickness." },
      { icon: Play, title: "Generate", description: "One click, one token. Your chart renders in seconds and can be exported." },
    ],
    illustration: <GeneratorIllustration />,
    ctaHref: "/generator",
    ctaLabel: "Open the generator",
  },
  {
    id: "predictions",
    icon: Trophy,
    badge: "Predictions",
    title: "Call the podium, win coins.",
    subtitle: "Predict race outcomes before lights out.",
    description:
      "Every Grand Prix weekend, put your F1 knowledge on the line — predict the podium and a few extras, wager coins, and see how you rank against everyone else.",
    steps: [
      { icon: Flag, title: "Pick an upcoming GP", description: "Races you've already predicted are locked out — one shot per weekend." },
      { icon: Medal, title: "Predict the podium", description: "P1, P2, P3 — the core prediction, worth 100/75/50 points." },
      { icon: ClipboardList, title: "Add optional extras", description: "Fastest lap, pole position, first retirement, DNF count, safety car — each worth extra points." },
      { icon: Coins, title: "Set your wager", description: "Slide between 50–1000 coins; your potential payout scales with how many picks you make." },
      { icon: Trophy, title: "Submit and track it", description: "Results are scored after the race — check My Predictions and the leaderboard to see how you did." },
    ],
    illustration: <PredictionsIllustration />,
    reversed: true,
    ctaHref: "/games?tab=my-predictions",
    ctaLabel: "Make a prediction",
  },
  {
    id: "simracing",
    icon: Gauge,
    badge: "Sim racing",
    title: "Bring your own sessions.",
    subtitle: "Log, compare, coach, and go live.",
    description:
      "Turn One isn't just for real F1 data — connect your sim racing sessions to get the same telemetry-grade analysis on your own laps.",
    steps: [
      { icon: LineChart, title: "Log your sessions", description: "Practice, qualifying or race runs from your sim show up in your session history." },
      { icon: GitCompareArrows, title: "Review telemetry & PBs", description: "Track personal bests and dig into lap-by-lap telemetry for every session." },
      { icon: Bot, title: "Get AI Coach feedback", description: "Ask the AI Coach where you're losing time and how to fix it." },
      { icon: ChartSpline, title: "Compare laps", description: "Overlay two laps to see exactly where one beats the other." },
      { icon: Radio, title: "Go live", description: "Use Streamer Mode to overlay live telemetry on stream, or let others Spectate your session." },
    ],
    illustration: <SimRacingIllustration />,
    ctaHref: "/simracing",
    ctaLabel: "Open sim racing",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-black">
      <MainNav variant="homepage" />

      <PublicHero
        eyebrow="Start here"
        title="How Turn One works."
        subtitle="Three tools, one platform: generate professional telemetry visualizations, predict race outcomes, and analyze your own sim racing sessions."
        backgroundImage="/turn-one-car/2026-turn-one-car/Cockpit_Image_01.webp"
        cta={
          <CtaRow
            primary={{ label: "Try the generator", href: "/generator" }}
            secondary={{ label: "See examples", href: "/examples" }}
          />
        }
      />

      <main className="mx-auto max-w-7xl space-y-16 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <section
              key={section.id}
              className="animate-in fade-in slide-in-from-bottom-2 border-b border-zinc-800 pb-16 duration-700 last:border-0"
            >
              <div
                className={`grid items-start gap-8 lg:grid-cols-2 ${
                  section.reversed ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center border border-zinc-800 bg-zinc-900">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] text-zinc-400">
                      {section.badge}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight leading-none sm:text-4xl">
                      {section.title}
                    </h2>
                    <p className="mt-1 font-mono text-xs uppercase tracking-wider text-primary/80">
                      {section.subtitle}
                    </p>
                  </div>

                  <p className="text-sm text-zinc-400">{section.description}</p>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-none border-zinc-700 bg-transparent text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900"
                  >
                    <Link href={section.ctaHref}>
                      {section.ctaLabel}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>

                <PublicCard className="overflow-hidden p-0">
                  <div className="border-b border-zinc-800 bg-zinc-900/40">{section.illustration}</div>
                  <ol className="divide-y divide-zinc-800">
                    {section.steps.map((step, i) => {
                      const StepIcon = step.icon;
                      return (
                        <li key={step.title} className="flex gap-4 p-4">
                          <div className="flex flex-col items-center gap-1">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-primary/40 font-mono text-[10px] font-bold text-primary">
                              {i + 1}
                            </span>
                            {i < section.steps.length - 1 && (
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
              </div>
            </section>
          );
        })}

        {/* Final CTA */}
        <section className="border border-zinc-800 bg-zinc-950 px-6 py-12 text-center sm:px-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Free to start</p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Ready to try it yourself?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400">
            Create a free account and get 200 tokens a month — enough to explore the generator, make predictions, and analyze your sim sessions.
          </p>
          <div className="mt-6 flex justify-center">
            <CtaRow
              primary={{ label: "Get started free", href: "/auth/signup" }}
              secondary={{ label: "Open generator", href: "/generator" }}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
