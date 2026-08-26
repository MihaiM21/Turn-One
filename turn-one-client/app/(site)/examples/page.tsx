"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Gauge,
  Clock,
  Users,
  ChartSpline,
  CircleGauge,
  MonitorCog,
  Zap,
  PlayCircle,
  Radio,
} from "lucide-react";
import { MainNav } from "@/components/navigation/main-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicHero } from "@/components/site/public-hero";
import { SectionHeader } from "@/components/site/section-header";
import { PublicCard } from "@/components/site/public-card";
import { CtaRow } from "@/components/site/cta-row";
import { useInView } from "@/hooks/use-in-view";
import { PLOT_CATALOG } from "@/lib/plots/catalog";
import { defaultOptionsFor, type PlotDefinition, type PlotFetchContext } from "@/lib/plots/types";
import { TopSpeedGraph } from "@/components/dashboard/telemetry generator/plots/top-speed";
import { ThrottleAverageGraph } from "@/components/dashboard/telemetry generator/plots/throttle_average_comparison";
import { LapTimeAnalysisGraph } from "@/components/dashboard/telemetry generator/plots/lap-time-analysis";
import { ThrottleBrakeComparisonGraph } from "@/components/dashboard/telemetry generator/plots/throttle-brake-comparison";
import { SessionResultsGraph } from "@/components/dashboard/telemetry generator/plots/session-results";
import { TrackComparisonGraph } from "@/components/dashboard/telemetry generator/plots/track-comparison";
import { SpeedDistributionGraph } from "@/components/dashboard/telemetry generator/plots/speed-distribution";
import { LiveTimingGrid } from "@/components/dashboard/live-timing-grid";
import { LiveWeather } from "@/components/dashboard/live-weather";
import {
  fetchTopSpeeds,
  fetchSessionResults,
  fetchTrackComparison,
  fetchThrottleBrakeComparison,
  fetchThrottleAverages,
  fetchLaptimeData,
  fetchSpeedDistributionData,
} from "@/lib/dataAcquisition";
import {
  TopSpeedData,
  ThrottleAverageData,
  LapTimeData,
  ThrottleBrakeComparisonData,
  SessionResultsData,
  TrackComparisonData,
  SpeedDistributionPoint,
  SpeedDistributionRawPoint,
} from "@/types/plot-types";

const mockPositions = [
  { position: 1, driverNumber: "4",  driverName: "NOR", team: "McLaren",         gap: "—",      interval: "—",      lastLapTime: "1:24.312", bestLapTime: "1:24.312", speed: 0, drs: false, isOnTrack: false, positionChange: 0,  tires: { compound: "soft" as const, age: 2 }, sector1: "28.801", sector2: "35.104", sector3: "20.407" },
  { position: 2, driverNumber: "81", driverName: "PIA", team: "McLaren",         gap: "+0.213", interval: "+0.213", lastLapTime: "1:24.525", bestLapTime: "1:24.525", speed: 0, drs: false, isOnTrack: false, positionChange: 0,  tires: { compound: "soft" as const, age: 2 }, sector1: "28.933", sector2: "35.217", sector3: "20.375" },
  { position: 3, driverNumber: "44", driverName: "HAM", team: "Ferrari",         gap: "+0.348", interval: "+0.135", lastLapTime: "1:24.660", bestLapTime: "1:24.660", speed: 0, drs: false, isOnTrack: false, positionChange: 1,  tires: { compound: "soft" as const, age: 2 }, sector1: "28.771", sector2: "35.480", sector3: "20.409" },
  { position: 4, driverNumber: "16", driverName: "LEC", team: "Ferrari",         gap: "+0.501", interval: "+0.153", lastLapTime: "1:24.813", bestLapTime: "1:24.813", speed: 0, drs: false, isOnTrack: false, positionChange: -1, tires: { compound: "soft" as const, age: 3 }, sector1: "28.855", sector2: "35.387", sector3: "20.571" },
  { position: 5, driverNumber: "1",  driverName: "VER", team: "Red Bull Racing", gap: "+0.524", interval: "+0.023", lastLapTime: "1:24.836", bestLapTime: "1:24.836", speed: 0, drs: false, isOnTrack: false, positionChange: 0,  tires: { compound: "soft" as const, age: 2 }, sector1: "28.789", sector2: "35.540", sector3: "20.507" },
  { position: 6, driverNumber: "63", driverName: "RUS", team: "Mercedes",        gap: "+0.698", interval: "+0.174", lastLapTime: "1:25.010", bestLapTime: "1:25.010", speed: 0, drs: false, isOnTrack: false, positionChange: 0,  tires: { compound: "soft" as const, age: 3 }, sector1: "28.912", sector2: "35.622", sector3: "20.476" },
] as const;

const mockWeather = {
  temperature: 22,
  humidity: 62,
  trackTemp: 38,
  windSpeed: 15,
  windDirection: 240,
  visibility: 10,
  rainfall: false,
  pressure: 1013,
  conditions: "cloudy" as const,
};

function PlotSkeleton({ height = 450 }: { height?: number }) {
  return (
    <div
      className="flex animate-pulse flex-col items-center justify-center gap-3 border border-zinc-800 bg-zinc-950"
      style={{ height }}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="text-xs uppercase tracking-[0.25em] text-zinc-500">Loading live data…</span>
    </div>
  );
}

const chartSettings = {
  showGrid: true,
  showLegend: true,
  animateChart: true,
  chartHeight: 450,
  lineThickness: 2,
  showDataLabels: true,
};
const lapChartSettings = { ...chartSettings, chartHeight: 420, showDataLabels: false };
const trackChartSettings = { ...chartSettings, chartHeight: 460 };

interface ShowcaseSection {
  id: string;
  icon: React.ElementType;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  chart: React.ReactNode;
  reversed?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
}

const YEAR = 2025;
const GP = "British Grand Prix";
const SPEED_DISTRIBUTION_DRIVERS = ["VER", "NOR", "HAM"];

// Catalog keys already shown as full showcase sections above — everything else in
// PLOT_CATALOG is either a lazy flagship section or a compact library card.
const SHOWCASED_KEYS = [
  "topspeeds",
  "session_results",
  "track_comparison",
  "throttle_brake",
  "speed_distribution",
  "throttle_average",
  "laptime",
];
const FLAGSHIP_KEYS = ["tyre_degradation", "pit_strategy"];

const RACE_FETCH_CTX: PlotFetchContext = {
  year: YEAR,
  eventName: GP,
  sessionName: "Race",
  sessionCode: "R",
  allDrivers: [],
  options: {},
  token: "",
};

const missingPlots = PLOT_CATALOG.filter((p) => !SHOWCASED_KEYS.includes(p.key));
const flagshipPlots = missingPlots.filter((p) => FLAGSHIP_KEYS.includes(p.key));
const libraryPlots = missingPlots.filter((p) => !FLAGSHIP_KEYS.includes(p.key));
const libraryCategories = Array.from(new Set(libraryPlots.map((p) => p.category)));

/** Fetches its plot's data only once it scrolls into view — keeps initial page load light. */
function LazyPlotShowcase({ def, height = 460 }: { def: PlotDefinition; height?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [data, setData] = useState<unknown>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!inView || data !== null || failed) return;
    def.fetch({ ...RACE_FETCH_CTX, options: defaultOptionsFor(def) })
      .then(setData)
      .catch((err) => {
        console.error(err);
        setFailed(true);
      });
  }, [inView, data, failed]);

  return (
    <div ref={ref}>
      {failed ? (
        <div
          className="flex flex-col items-center justify-center gap-2 border border-zinc-800 bg-zinc-950 text-xs text-zinc-500"
          style={{ height }}
        >
          Couldn&apos;t load this plot right now.
        </div>
      ) : data !== null ? (
        def.render(data, { ...chartSettings, chartHeight: height }, { ...RACE_FETCH_CTX, options: defaultOptionsFor(def) })
      ) : (
        <PlotSkeleton height={height} />
      )}
    </div>
  );
}

export default function ExamplesPage() {
  const [topSpeeds, setTopSpeeds] = useState<TopSpeedData[] | null>(null);
  const [sessionResults, setSessionResults] = useState<SessionResultsData[] | null>(null);
  const [trackComparison, setTrackComparison] = useState<TrackComparisonData | null>(null);
  const [throttleBrake, setThrottleBrake] = useState<ThrottleBrakeComparisonData | null>(null);
  const [throttleAverages, setThrottleAverages] = useState<ThrottleAverageData[] | null>(null);
  const [lapTimes, setLapTimes] = useState<LapTimeData[] | null>(null);
  const [speedDistribution, setSpeedDistribution] = useState<SpeedDistributionPoint[] | null>(null);

  useEffect(() => {
    fetchTopSpeeds("", YEAR, GP, "Q", "v2").then((data: any) => {
      let processed: TopSpeedData[];
      if (data && typeof data === "object" && "Color" in data && "Team" in data && "Top Speed (km/h)" in data) {
        const colors = data.Color as Record<string, string>;
        const teams = data.Team as Record<string, string>;
        const speeds = data["Top Speed (km/h)"] as Record<string, number>;
        processed = Object.keys(teams).map((k) => ({ team: teams[k], speed: speeds[k], color: colors[k] }));
      } else {
        processed = Object.values(data as Record<string, any>).map((item) => ({
          team: item.Team,
          speed: item["Top Speed (km/h)"],
          color: item.Color,
        }));
      }
      processed.sort((a, b) => b.speed - a.speed);
      setTopSpeeds(processed);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchSessionResults("", YEAR, GP, "Q", "v2").then(setSessionResults).catch(console.error);
  }, []);

  useEffect(() => {
    fetchTrackComparison("", YEAR, GP, "Q", "VER", "NOR", "v2").then(setTrackComparison).catch(console.error);
  }, []);

  useEffect(() => {
    fetchThrottleBrakeComparison("", YEAR, GP, "Q", "VER", "NOR", "v2").then(setThrottleBrake).catch(console.error);
  }, []);

  useEffect(() => {
    fetchThrottleAverages("", YEAR, GP, "Q", "v2").then((data: any) => {
      const processed: ThrottleAverageData[] = Object.values(data as Record<string, any>)
        .map((item) => ({
          driver: item.Driver,
          throttle: item["Average Throttle (%)"],
          color: item.Color,
        }))
        .sort((a, b) => b.throttle - a.throttle);
      setThrottleAverages(processed);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchLaptimeData("", YEAR, GP, "R", "VER", "v2").then((raw: any) => {
      let rows: any[] = [];
      if (Array.isArray(raw)) rows = raw;
      else if (raw && typeof raw === "object") {
        const keys = Object.keys(raw);
        if (keys.length > 0) {
          const indices = Object.keys(raw[keys[0]]);
          rows = indices.map((i) => {
            const obj: any = {};
            keys.forEach((k) => { obj[k] = raw[k][i]; });
            return obj;
          });
        }
      }
      const formatSecs = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = (secs % 60).toFixed(3);
        return `${m}:${s.padStart(6, "0")}`;
      };
      const normalized: LapTimeData[] = rows.map((row) => {
        const lapNum = Number(row.LapNumber ?? row.lap_number ?? row.lap_numbers ?? 0);
        const rawTime = Number(row.LapTime ?? row.lap_time ?? row.lap_times_seconds ?? 0);
        const secs = rawTime > 1_000_000 ? rawTime / 1_000_000_000 : rawTime;
        return {
          driver: String(row.Driver ?? row.driver ?? "VER"),
          lap_numbers: lapNum,
          lap_times_seconds: secs,
          lap_times_formatted: row.lap_times_formatted ?? formatSecs(secs),
          compound: String(row.Compound ?? row.compound ?? "UNKNOWN").toUpperCase(),
        };
      }).filter((d) => d.lap_numbers > 0 && d.lap_times_seconds > 0);
      if (normalized.length > 0) setLapTimes(normalized);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    Promise.all(
      SPEED_DISTRIBUTION_DRIVERS.map((driverCode) =>
        fetchSpeedDistributionData("", YEAR, GP, "Q", driverCode, "v2"),
      ),
    )
      .then((responses) => {
        const mergedRows = responses.flatMap((response) =>
          Array.isArray(response) ? response : Object.values(response || {}),
        );
        const normalized = mergedRows
          .map((item) => {
            const row = item as SpeedDistributionRawPoint & Partial<SpeedDistributionPoint>;
            return {
              time: Number(row["Time (s)"] ?? row.time),
              speed: Number(row["Speed (km/h)"] ?? row.speed),
              driver: String(row.Driver ?? row.driver ?? ""),
              color: String(row.Color ?? row.color ?? "#F9FAFB"),
            };
          })
          .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.speed) && point.driver);
        setSpeedDistribution(normalized);
      })
      .catch(console.error);
  }, []);

  const sections: ShowcaseSection[] = [
    {
      id: "topspeeds",
      icon: Gauge,
      badge: "Speed analysis",
      title: "Top speed by constructor",
      subtitle: "2025 British GP · Qualifying",
      description: "Instantly compare every constructor's maximum recorded speed. Spot the aerodynamic and power-unit pecking order at a glance.",
      bullets: ["Official F1 timing data", "Constructor livery colors", "All 10 teams in one chart", "Every session, every weekend"],
      chart: topSpeeds ? <TopSpeedGraph data={topSpeeds} advancedSettings={{ ...chartSettings, chartHeight: 460 }} /> : <PlotSkeleton height={460} />,
    },
    {
      id: "qualifying",
      icon: MonitorCog,
      badge: "Session analysis",
      title: "Optimal qualifying lap",
      subtitle: "2025 British GP · Qualifying",
      description: "Reconstruct the ideal lap from sector bests. See how much time separates the field and who left tenths on the table.",
      bullets: ["Gap to pole in milliseconds", "Teams + times in one view", "Highlights clusters and outliers", "Best vs representative laps"],
      chart: sessionResults ? <SessionResultsGraph data={sessionResults} advancedSettings={{ ...chartSettings, chartHeight: 460 }} /> : <PlotSkeleton height={460} />,
      reversed: true,
    },
    {
      id: "trackcomparison",
      icon: Users,
      badge: "Head to head",
      title: "Mini-sector track map",
      subtitle: "VER vs NOR · 2025 British GP · Qualifying",
      description: "Each segment of the circuit is painted in the color of whoever was faster through it. See exactly where the lap time lives.",
      bullets: ["GPS-derived telemetry", "Mini-sector granularity", "High-speed vs slow-corner advantage", "Any driver, any session"],
      chart: trackComparison ? <TrackComparisonGraph data={trackComparison} height={trackChartSettings.chartHeight} width={700} advancedSettings={trackChartSettings} /> : <PlotSkeleton height={trackChartSettings.chartHeight} />,
    },
    {
      id: "throttlebrake",
      icon: ChartSpline,
      badge: "Driver inputs",
      title: "Throttle & brake comparison",
      subtitle: "VER vs NOR · 2025 British GP · Qualifying",
      description: "Overlay two drivers' throttle and brake traces. Discover braking points, trail braking and apex throttle application.",
      bullets: ["Full-lap resolution", "Synchronized on distance", "Reveals late-braking habits", "Coaching-grade insight"],
      chart: throttleBrake ? <ThrottleBrakeComparisonGraph data={throttleBrake} advancedSettings={{ ...chartSettings, chartHeight: 460 }} /> : <PlotSkeleton height={460} />,
      reversed: true,
    },
    {
      id: "speed_distribution",
      icon: Gauge,
      badge: "Speed trace",
      title: "Speed vs time overlay",
      subtitle: "VER vs NOR vs HAM · 2025 British GP · Qualifying",
      description: "Overlay multiple drivers on the same speed-vs-time graph. Compare acceleration phases, peak velocity points and where momentum is gained or lost.",
      bullets: ["Three-driver overlay", "Hover any point for all drivers", "Merged from per-driver calls", "Ideal for straight-line compare"],
      chart: speedDistribution ? <SpeedDistributionGraph data={speedDistribution} selectedDrivers={SPEED_DISTRIBUTION_DRIVERS} advancedSettings={{ ...chartSettings, chartHeight: 460 }} /> : <PlotSkeleton height={460} />,
    },
    {
      id: "throttleaverage",
      icon: CircleGauge,
      badge: "Mechanical grip",
      title: "Average throttle application",
      subtitle: "2025 British GP · Qualifying",
      description: "Which driver is trusting their car the most? Average throttle is a direct proxy for car balance and mechanical grip.",
      bullets: ["Ranked across the full grid", "Setup differences between teammates", "Correlates with race pace", "Underrated F1 metric"],
      chart: throttleAverages ? <ThrottleAverageGraph data={throttleAverages} advancedSettings={{ ...chartSettings, chartHeight: 460 }} /> : <PlotSkeleton height={460} />,
    },
    {
      id: "laptimes",
      icon: Clock,
      badge: "Race strategy",
      title: "Lap time evolution",
      subtitle: "VER · 2025 British GP · Race",
      description: "Tire degradation, pit windows, safety car phases and push laps all show up as distinctive patterns. Strategy intelligence, rendered visually.",
      bullets: ["Color-coded by compound", "Outlier laps filtered", "Exposes fuel effect & undercuts", "Every classified finisher since 2020"],
      chart: lapTimes ? <LapTimeAnalysisGraph lapTimeData={lapTimes} advancedSettings={lapChartSettings} /> : <PlotSkeleton height={lapChartSettings.chartHeight} />,
      reversed: true,
    },
    {
      id: "livedashboard",
      icon: Radio,
      badge: "Real-time",
      title: "Live race dashboard",
      subtitle: "Timing tower · Weather · Track position",
      description: "Every session, live. Real-time gaps, sector colors, tire age, DRS and weather — updating every fraction of a second.",
      bullets: ["Live timing grid with gap & sector colors", "Real-time temperature, wind, rainfall", "Q1/Q2/Q3 cutoff indicators", "Customizable widget layout"],
      chart: (
        <div className="space-y-3">
          <LiveTimingGrid positions={mockPositions as any} sessionType="Qualifying" sessionYear={2025} qualiSegment="Q3" />
          <LiveWeather weather={mockWeather} />
        </div>
      ),
      ctaHref: "/live",
      ctaLabel: "Open live dashboard",
    },
    ...flagshipPlots.map((def, i): ShowcaseSection => ({
      id: def.key,
      icon: def.icon,
      badge: `${def.category} · PRO`,
      title: def.title,
      subtitle: "2025 British GP · Race",
      description: def.description,
      bullets: ["Full race session data", "Same engine as the generator", "Included on the PRO plan"],
      chart: <LazyPlotShowcase def={def} />,
      reversed: i % 2 === 1,
      ctaHref: `/generator?plot=${def.key}`,
      ctaLabel: "Try this plot",
    })),
  ];

  return (
    <div className="min-h-screen bg-black">
      <MainNav variant="homepage" />

      <PublicHero
        eyebrow="Live examples · Real F1 data"
        title="See Turn One in action."
        subtitle="Professional-grade telemetry visualizations — the same tools used to analyze every lap, every sector, and every input across the season."
        backgroundImage="/turn-one-car/2026-turn-one-car/Cockpit_Image_01.webp"
        cta={
          <CtaRow
            primary={{ label: "Generate your own", href: "/generator" }}
            secondary={{ label: "View pricing", href: "/pricing" }}
          />
        }
      >
        <div className="grid max-w-3xl grid-cols-2 gap-4 border-t border-zinc-800 pt-6 md:grid-cols-4">
          {[
            { value: "9+", label: "Plot types" },
            { value: "1000+", label: "Sessions" },
            { value: "2020–26", label: "Years" },
            { value: "All", label: "Drivers" },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-mono text-xl font-black tabular-nums sm:text-2xl">{s.value}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>
      </PublicHero>

      <main className="mx-auto max-w-7xl space-y-12 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.id} className="border-b border-zinc-800 pb-12 last:border-0">
              <div
                className={`grid items-center gap-8 lg:grid-cols-2 ${
                  section.reversed ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                {/* Text column */}
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

                  <ul className="space-y-2">
                    {section.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-xs text-zinc-400">
                        <span className="mt-1.5 h-1 w-1 shrink-0 bg-primary" aria-hidden />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-none border-zinc-700 bg-transparent text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900"
                  >
                    <Link href={section.ctaHref ?? "/generator"}>
                      {section.ctaLabel ?? "Try this plot"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>

                {/* Chart column */}
                <PublicCard className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-tight">{section.title}</p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                        {section.subtitle}
                      </p>
                    </div>
                    <span className="border border-primary/40 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.25em] text-primary">
                      Live data
                    </span>
                  </div>
                  <div className="p-4">{section.chart}</div>
                </PublicCard>
              </div>
            </section>
          );
        })}

        {/* Full plot library */}
        <section className="border-b border-zinc-800 pb-12">
          <SectionHeader
            eyebrow="The full library"
            title="9+ more plots in the generator"
            subtitle="Every one of these is live in the generator today — pick one to jump straight in."
          />
          <div className="mt-8 space-y-10">
            {libraryCategories.map((category) => (
              <div key={category}>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
                  {category}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {libraryPlots
                    .filter((p) => p.category === category)
                    .map((p) => {
                      const CardIcon = p.icon;
                      return (
                        <Link key={p.key} href={`/generator?plot=${p.key}`}>
                          <PublicCard
                            hover
                            className="relative flex h-full flex-col gap-3 p-5"
                          >
                            {p.isPro && (
                              <Badge
                                variant="secondary"
                                className="accent-glow absolute -top-2 -right-2 h-4 border border-primary/50 bg-primary/90 px-1 py-0 text-[8px] font-bold text-primary-foreground"
                              >
                                PRO
                              </Badge>
                            )}
                            <div className="flex h-9 w-9 items-center justify-center border border-zinc-800 bg-zinc-900">
                              <CardIcon className="h-4 w-4 text-primary" />
                            </div>
                            <p className="text-sm font-bold uppercase tracking-tight">{p.title}</p>
                            <p className="text-xs text-zinc-400">{p.description}</p>
                          </PublicCard>
                        </Link>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border border-zinc-800 bg-zinc-950 px-6 py-12 text-center sm:px-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Free to start</p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Your turn to explore the data.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400">
            Create a free account. Pick a race, pick a session, pick your drivers and generate any of these visualizations in seconds.
          </p>
          <div className="mt-6 flex justify-center">
            <CtaRow
              primary={{ label: "Get started free", href: "/auth/signup" }}
              secondary={{ label: "Open generator", href: "/generator" }}
            />
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            <Zap className="mr-1 inline h-3 w-3 text-primary" /> 200 free tokens / month · No credit card · Full access on sign-up
          </p>
          <p className="mt-3 text-xs text-zinc-500">
            New here?{" "}
            <Link href="/how-it-works" className="text-primary underline underline-offset-4 hover:text-primary/80">
              See how the generator, predictions and sim racing work
            </Link>
          </p>
          <Button asChild variant="ghost" size="sm" className="mt-2 hidden">
            <Link href="/generator">
              <PlayCircle className="mr-2 h-4 w-4" /> Open generator
            </Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
