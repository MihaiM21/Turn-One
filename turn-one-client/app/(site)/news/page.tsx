"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Gauge, Zap, Calendar, Flag, ArrowLeft, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewsPageData } from "@/types/news-types";
import { getNewsPageData } from "@/lib/newsService";
import { MainNav } from "@/components/navigation/main-nav";
import { Loading } from "@/components/ui/loading";
import { QualifyingChart } from "@/components/news/qualifying-chart";
import { TopSpeedChart } from "@/components/news/top-speed-chart";
import { ThrottleChart } from "@/components/news/throttle-chart";
import { StandingsTable } from "@/components/news/standings-table";
import { LapDistributionChart } from "@/components/news/lap-distribution-chart";
import { TireStrategyChart } from "@/components/news/tire-strategy-chart";
import { GatedPreview } from "@/components/site/gated-preview";
import { SectionHeader } from "@/components/site/section-header";
import { PublicCard } from "@/components/site/public-card";

const sessionColor = (type: string) => {
  switch (type) {
    case "qualifying":
      return "border-yellow-500/40 text-yellow-400";
    case "race":
      return "border-red-500/40 text-red-400";
    default:
      return "border-blue-500/40 text-blue-400";
  }
};
const sessionIcon = (type: string) => {
  switch (type) {
    case "qualifying":
      return <Trophy className="h-3.5 w-3.5" />;
    case "race":
      return <Flag className="h-3.5 w-3.5" />;
    default:
      return <Gauge className="h-3.5 w-3.5" />;
  }
};

const sessionName = (type: string) => {
  if(type === "qualifying" || type === "q" || type === "Q" ) return "Qualifying";
  if(type === "race" || type === "r" || type === "R" ) return "Race";
  if(type === "fp1" || type === "FP1" ) return "Free Practice 1";
  if(type === "fp2" || type === "FP2" ) return "Free Practice 2";
  if(type === "fp3" || type === "FP3" ) return "Free Practice 3";
  return "Session";
}

export default function NewsPage() {
  const [data, setData] = useState<NewsPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getNewsPageData();
        if (!cancelled) setData(result);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Loading message="Loading session data..." />;

  if (!data?.session) {
    return (
      <div className="min-h-screen bg-black">
        <MainNav variant="homepage" />
        <div className="flex items-center justify-center min-h-[80vh]">
          <PublicCard className="max-w-md p-6">
            <p className="text-sm font-bold uppercase tracking-tight text-primary">No data</p>
            <p className="mt-2 text-sm text-zinc-400">
              Failed to load the latest session. Please try again later.
            </p>
            <Button asChild variant="outline" className="mt-4 w-full rounded-none border-zinc-700">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to home
              </Link>
            </Button>
          </PublicCard>
        </div>
      </div>
    );
  }

  const session = data.session;

  return (
    <div className="min-h-screen bg-black">
      <MainNav variant="homepage" />

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-24 sm:px-6 lg:px-8">
        {/* Nav */}
        <div className="flex items-center gap-3 animate-in fade-in duration-500">
          <Button asChild variant="ghost" size="sm" className="rounded-none text-zinc-400 hover:text-foreground">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="rounded-none text-zinc-400 hover:text-foreground">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" /> Home
            </Link>
          </Button>
        </div>

        {/* Header */}
        <header className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Latest session analysis</p>
          <h1 className="text-4xl font-black uppercase tracking-tight sm:text-5xl">
            {sessionName(session.session_name)}
          </h1>
          <p className="text-sm text-zinc-400">
            Live data from the latest F1 session. Free for everyone — sign up to unlock the deeper analytics.
          </p>
        </header>

        {/* Session info bar */}
        <PublicCard accent className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={`rounded-none px-2 py-0.5 text-[10px] uppercase tracking-wider ${sessionColor(session.session_type)}`}
            >
              {sessionIcon(session.session_type)}
              <span className="ml-1.5">{sessionName(session.session_name)}</span>
            </Badge>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Calendar className="h-3 w-3" />
              <span className="font-mono">{session.year}</span>
              <span className="text-zinc-700">·</span>
              <span>Round {session.round}</span>
            </div>
          </div>
        </PublicCard>

        {/* Free: standings overview */}
        <section className="space-y-4">
          <SectionHeader
            eyebrow="Season standings"
            title="Drivers & constructors"
            subtitle="Where every contender sits in this year's championship."
          />
          <StandingsTable
            drivers={data.driverStandings ?? undefined}
            constructors={data.constructorStandings ?? undefined}
          />
        </section>

        {/* Free: qualifying chart */}
        {session.qualifying_results && session.qualifying_results.length > 0 && (
          <section>
            <QualifyingChart data={session.qualifying_results} sessionName={session.session_name} />
          </section>
        )}

        {/* Free: top speed */}
        <section className="grid gap-6">
          <TopSpeedChart data={session.top_speed} />
        </section>

        {/* Gated: deeper telemetry */}
        <section className="space-y-4">
          <SectionHeader
            eyebrow="Deep telemetry"
            title="Members-only analysis"
            subtitle="Sign in to unlock throttle comparisons, lap-time distribution and tire strategy breakdowns."
          />

          <GatedPreview
            teaser="Throttle comparison across every driver this session — see who's flat-out and who's lifting."
            cta={{ label: "Sign up to unlock", href: "/auth/signup" }}
          >
            <ThrottleChart data={session.throttle_comparison} />
          </GatedPreview>

          <div className="grid gap-6 lg:grid-cols-2">
            <GatedPreview
              teaser="Lap-by-lap pace evolution. Spot pit windows, tire degradation and pace deltas."
              cta={{ label: "Unlock free", href: "/auth/signup" }}
            >
              <LapDistributionChart data={data.lapDistribution ?? undefined} />
            </GatedPreview>
            <GatedPreview
              teaser="Tire strategy and pit stops for every driver — visualize the race within the race."
              cta={{ label: "Unlock free", href: "/auth/signup" }}
            >
              <TireStrategyChart data={data.tireStrategy ?? undefined} />
            </GatedPreview>
          </div>
        </section>

        {/* Insights */}
        <PublicCard className="p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Key insights</p>
          <div className="mt-4 space-y-3">
            {session.qualifying_results && session.qualifying_results.length > 0 && (
              <div className="flex items-start gap-3">
                <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                <p className="text-sm text-zinc-300">
                  <span className="font-semibold" style={{ color: session.qualifying_results[0].Color }}>
                    {session.qualifying_results[0].Driver}
                  </span>{" "}
                  <span className="text-zinc-500">set the fastest lap</span>{" "}
                  <span className="font-mono">{session.qualifying_results[0].LapTime}</span>
                </p>
              </div>
            )}
            {session.top_speed && session.top_speed.length > 0 && (
              <div className="flex items-start gap-3">
                <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <p className="text-sm text-zinc-300">
                  <span className="font-semibold" style={{ color: session.top_speed[0].Color }}>
                    {session.top_speed[0].Team}
                  </span>{" "}
                  <span className="text-zinc-500">reached</span>{" "}
                  <span className="font-mono">{session.top_speed[0]["Top Speed (km/h)"]} km/h</span>
                </p>
              </div>
            )}
            {session.throttle_comparison && session.throttle_comparison.length > 0 && (
              <div className="flex items-start gap-3">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <p className="text-sm text-zinc-300">
                  <span className="font-semibold" style={{ color: session.throttle_comparison[0].Color }}>
                    {session.throttle_comparison[0].Driver}
                  </span>{" "}
                  <span className="text-zinc-500">highest throttle at</span>{" "}
                  <span className="font-mono">
                    {session.throttle_comparison[0]["Average Throttle (%)"].toFixed(1)}%
                  </span>
                </p>
              </div>
            )}
          </div>
        </PublicCard>
      </main>
    </div>
  );
}
