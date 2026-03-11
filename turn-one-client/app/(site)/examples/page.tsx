"use client"

import { useState, useEffect } from "react"
import { MainNav } from "@/components/navigation/main-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import {
  ArrowRight,
  Gauge,
  Clock,
  Users,
  ChartSpline,
  CircleGauge,
  MonitorCog,
  Zap,
  Trophy,
  PlayCircle,
  Radio,
} from "lucide-react"
import { TopSpeedGraph } from "@/components/dashboard/telemetry generator/plots/top-speed"
import { ThrottleAverageGraph } from "@/components/dashboard/telemetry generator/plots/throttle_average_comparison"
import { LapTimeAnalysisGraph } from "@/components/dashboard/telemetry generator/plots/lap-time-analysis"
import { ThrottleBrakeComparisonGraph } from "@/components/dashboard/telemetry generator/plots/throttle-brake-comparison"
import { SessionResultsGraph } from "@/components/dashboard/telemetry generator/plots/session-results"
import { TrackComparisonGraph } from "@/components/dashboard/telemetry generator/plots/track-comparison"
import { LiveTimingGrid } from "@/components/dashboard/live-timing-grid"
import { LiveWeather } from "@/components/dashboard/live-weather"
import {
  fetchTopSpeeds,
  fetchSessionResults,
  fetchTrackComparison,
  fetchThrottleBrakeComparison,
  fetchThrottleAverages,
  fetchLaptimeData,
} from "@/lib/dataAcquisition"
import {
  TopSpeedData,
  ThrottleAverageData,
  LapTimeData,
  ThrottleBrakeComparisonData,
  SessionResultsData,
  TrackComparisonData,
} from "@/types/plot-types"

// ─────────────────────────────────────────────────────────────────────────────
// LIVE DASHBOARD MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const mockPositions = [
  { position: 1, driverNumber: "4",  driverName: "NOR", team: "McLaren",        gap: "—",      interval: "—",      lastLapTime: "1:24.312", bestLapTime: "1:24.312", speed: 0, drs: false, isOnTrack: false, positionChange: 0,  tires: { compound: "soft" as const, age: 2 }, sector1: "28.801", sector2: "35.104", sector3: "20.407" },
  { position: 2, driverNumber: "81", driverName: "PIA", team: "McLaren",        gap: "+0.213", interval: "+0.213", lastLapTime: "1:24.525", bestLapTime: "1:24.525", speed: 0, drs: false, isOnTrack: false, positionChange: 0,  tires: { compound: "soft" as const, age: 2 }, sector1: "28.933", sector2: "35.217", sector3: "20.375" },
  { position: 3, driverNumber: "44", driverName: "HAM", team: "Ferrari",        gap: "+0.348", interval: "+0.135", lastLapTime: "1:24.660", bestLapTime: "1:24.660", speed: 0, drs: false, isOnTrack: false, positionChange: 1,  tires: { compound: "soft" as const, age: 2 }, sector1: "28.771", sector2: "35.480", sector3: "20.409" },
  { position: 4, driverNumber: "16", driverName: "LEC", team: "Ferrari",        gap: "+0.501", interval: "+0.153", lastLapTime: "1:24.813", bestLapTime: "1:24.813", speed: 0, drs: false, isOnTrack: false, positionChange: -1, tires: { compound: "soft" as const, age: 3 }, sector1: "28.855", sector2: "35.387", sector3: "20.571" },
  { position: 5, driverNumber: "1",  driverName: "VER", team: "Red Bull Racing", gap: "+0.524", interval: "+0.023", lastLapTime: "1:24.836", bestLapTime: "1:24.836", speed: 0, drs: false, isOnTrack: false, positionChange: 0,  tires: { compound: "soft" as const, age: 2 }, sector1: "28.789", sector2: "35.540", sector3: "20.507" },
  { position: 6, driverNumber: "63", driverName: "RUS", team: "Mercedes",       gap: "+0.698", interval: "+0.174", lastLapTime: "1:25.010", bestLapTime: "1:25.010", speed: 0, drs: false, isOnTrack: false, positionChange: 0,  tires: { compound: "soft" as const, age: 3 }, sector1: "28.912", sector2: "35.622", sector3: "20.476" },
] as const

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
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function PlotSkeleton({ height = 450 }: { height?: number }) {
  return (
    <div
      className="rounded-lg bg-muted/20 animate-pulse flex flex-col items-center justify-center gap-3"
      style={{ height }}
    >
      <div className="w-9 h-9 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span className="text-sm text-muted-foreground tracking-wide">Loading live data…</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PLOT SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

const chartSettings = {
  showGrid: true,
  showLegend: true,
  animateChart: true,
  chartHeight: 450,
  lineThickness: 2,
  showDataLabels: true,
}

const lapChartSettings = { ...chartSettings, chartHeight: 420, showDataLabels: false }
const trackChartSettings = { ...chartSettings, chartHeight: 460 }

// ─────────────────────────────────────────────────────────────────────────────
// PLOT SHOWCASE SECTIONS
// ─────────────────────────────────────────────────────────────────────────────

interface ShowcaseSection {
  id: string
  icon: React.ElementType
  badge: string
  title: string
  subtitle: string
  description: string
  bullets: string[]
  chart: React.ReactNode
  reversed?: boolean
  ctaHref?: string
  ctaLabel?: string
}

const YEAR = 2025
const GP = 12

export default function ExamplesPage() {
  const [topSpeeds, setTopSpeeds] = useState<TopSpeedData[] | null>(null)
  const [sessionResults, setSessionResults] = useState<SessionResultsData[] | null>(null)
  const [trackComparison, setTrackComparison] = useState<TrackComparisonData | null>(null)
  const [throttleBrake, setThrottleBrake] = useState<ThrottleBrakeComparisonData | null>(null)
  const [throttleAverages, setThrottleAverages] = useState<ThrottleAverageData[] | null>(null)
  const [lapTimes, setLapTimes] = useState<LapTimeData[] | null>(null)

  useEffect(() => {
    fetchTopSpeeds("", YEAR, GP, "Q").then((data: any) => {
      let processed: TopSpeedData[]
      if (data && typeof data === 'object' && 'Color' in data && 'Team' in data && 'Top Speed (km/h)' in data) {
        const colors = data.Color as Record<string, string>
        const teams = data.Team as Record<string, string>
        const speeds = data['Top Speed (km/h)'] as Record<string, number>
        processed = Object.keys(teams).map(k => ({ team: teams[k], speed: speeds[k], color: colors[k] }))
      } else {
        processed = Object.values(data as Record<string, any>).map(item => ({
          team: item.Team,
          speed: item['Top Speed (km/h)'],
          color: item.Color,
        }))
      }
      processed.sort((a, b) => b.speed - a.speed)
      setTopSpeeds(processed)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    fetchSessionResults("", YEAR, GP, "Q").then(setSessionResults).catch(console.error)
  }, [])

  useEffect(() => {
    fetchTrackComparison("", YEAR, GP, "Q", "VER", "NOR").then(setTrackComparison).catch(console.error)
  }, [])

  useEffect(() => {
    fetchThrottleBrakeComparison("", YEAR, GP, "Q", "VER", "NOR").then(setThrottleBrake).catch(console.error)
  }, [])

  useEffect(() => {
    fetchThrottleAverages("", YEAR, GP, "Q").then((data: any) => {
      const processed: ThrottleAverageData[] = Object.values(data as Record<string, any>)
        .map(item => ({
          driver: item.Driver,
          throttle: item['Average Throttle (%)'],
          color: item.Color,
        }))
        .sort((a, b) => b.throttle - a.throttle)
      setThrottleAverages(processed)
    }).catch(console.error) 
  }, [])

  useEffect(() => {
    fetchLaptimeData("", YEAR, GP, "R", "VER").then(setLapTimes).catch(console.error)
  }, [])

  const sections: ShowcaseSection[] = [
    {
      id: "topspeeds",
      icon: Gauge,
      badge: "Speed Analysis",
      title: "Top Speed by Constructor",
      subtitle: "2025 British Grand Prix · Qualifying",
      description:
        "Instantly compare every constructor's maximum recorded speed in a session. Spot the aerodynamic and power unit pecking order at a glance — see who's carrying momentum down the straights and who's sacrificing top speed for downforce.",
      bullets: [
        "Session-accurate data from official F1 telemetry feeds",
        "Color-coded by constructor livery for instant recognition",
        "Covers all 10 constructors in a single chart",
        "Available for every session of every race weekend",
      ],
      chart: topSpeeds ? (
        <TopSpeedGraph
          data={topSpeeds}
          advancedSettings={{ ...chartSettings, chartHeight: 460 }}
        />
      ) : (
        <PlotSkeleton height={460} />
      ),
    },
    {
      id: "qualifying",
      icon: MonitorCog,
      badge: "Session Analysis",
      title: "Optimal Qualifying Lap",
      subtitle: "2025 British Grand Prix · Qualifying",
      description:
        "Reconstruct the ideal lap from qualifying by combining each driver's best sector times. Understand exactly how much time separates the field — who nailed the perfect lap, and who left tenths on the table.",
      bullets: [
        "Gap to pole position displayed in milliseconds",
        "Teams and lap times combined in one clean view",
        "Highlights performance clusters and outliers",
        "Perfect for identifying best vs representative laps",
      ],
      chart: sessionResults ? (
        <SessionResultsGraph
          data={sessionResults}
          advancedSettings={{ ...chartSettings, chartHeight: 460 }}
        />
      ) : (
        <PlotSkeleton height={460} />
      ),
      reversed: true,
    },
    {
      id: "trackcomparison",
      icon: Users,
      badge: "Head-to-Head",
      title: "Mini-Sector Track Map",
      subtitle: "VER vs NOR · 2025 British Grand Prix · Qualifying",
      description:
        "The most powerful head-to-head tool in the box. Each segment of the circuit is painted in the colour of whichever driver was faster through it. In one glance you can see exactly where Verstappen edges Norris — and where Norris fires back.",
      bullets: [
        "Rendered directly from GPS telemetry coordinates",
        "Mini-sector granularity reveals corner-by-corner advantages",
        "Instantly see who dominates the high-speed complex vs the slow corners",
        "Compatible with every combination of drivers and sessions",
      ],
      chart: trackComparison ? (
        <TrackComparisonGraph
          data={trackComparison}
          height={trackChartSettings.chartHeight}
          width={700}
          advancedSettings={trackChartSettings}
        />
      ) : (
        <PlotSkeleton height={trackChartSettings.chartHeight} />
      ),
    },
    {
      id: "throttlebrake",
      icon: ChartSpline,
      badge: "Driver Inputs",
      title: "Throttle & Brake Comparison",
      subtitle: "VER vs NOR · 2025 British Grand Prix · Qualifying",
      description:
        "Overlay two drivers' throttle and brake traces across the entire lap. Discover braking points, trail-braking techniques, throttle application in the apex — the invisible micro-decisions that separate a podium from a DNQ.",
      bullets: [
        "Full-lap resolution throttle percentage and brake on/off",
        "Synchronised on distance so drivers are directly comparable",
        "Reveals late-braking habits and early throttle discipline",
        "Coaching-grade insight previously only available to teams",
      ],
      chart: throttleBrake ? (
        <ThrottleBrakeComparisonGraph
          data={throttleBrake}
          advancedSettings={{ ...chartSettings, chartHeight: 460 }}
        />
      ) : (
        <PlotSkeleton height={460} />
      ),
      reversed: true,
    },
    {
      id: "throttleaverage",
      icon: CircleGauge,
      badge: "Mechanical Grip",
      title: "Average Throttle Application",
      subtitle: "2025 British Grand Prix · Qualifying",
      description:
        "Which driver is trusting their car the most? Average throttle across the lap is a direct proxy for car balance and mechanical grip. High percentages mean confidence in corner exit — a sign of a well-set-up car.",
      bullets: [
        "Ranked across the full grid in a single view",
        "Highlights chassis and setup differences between teammates",
        "Correlates strongly with tire degradation and race pace",
        "One of the most underrated statistics in F1 analytics",
      ],
      chart: throttleAverages ? (
        <ThrottleAverageGraph
          data={throttleAverages}
          advancedSettings={{ ...chartSettings, chartHeight: 460 }}
        />
      ) : (
        <PlotSkeleton height={460} />
      ),
    },
    {
      id: "laptimes",
      icon: Clock,
      badge: "Race Strategy",
      title: "Lap Time Evolution",
      subtitle: "VER · 2025 British Grand Prix · Race",
      description:
        "Watch a race unfold through a driver's lap times. Tire degradation, pit stop windows, safety car phases, and push laps all show up as distinctive patterns. This is strategy intelligence rendered visually.",
      bullets: [
        "Dots color-coded by tire compound (soft / medium / hard / inters / wets)",
        "Outlier laps automatically filtered to keep the trend clean",
        "Exposes fuel load effect, safety cars, and undercut threats",
        "Available for every classified finisher going back to 2020",
      ],
      chart: lapTimes ? (
        <LapTimeAnalysisGraph
          lapTimeData={lapTimes}
          advancedSettings={lapChartSettings}
        />
      ) : (
        <PlotSkeleton height={lapChartSettings.chartHeight} />
      ),
      reversed: true,
    },
    {
      id: "livedashboard",
      icon: Radio,
      badge: "Real-Time",
      title: "Live Race Dashboard",
      subtitle: "Timing tower · Weather · Track position — all in one screen",
      description:
        "Every session, live. The Turn One dashboard connects directly to the official F1 timing stream and delivers real-time gaps, sector colours, tire age, DRS status, and weather conditions — updating every fraction of a second as the session unfolds.",
      bullets: [
        "Live timing grid with gap, interval, sector colours and tire compound",
        "Real-time track and air temperature, wind speed and rainfall status",
        "Qualifying segment tracker with Q1/Q2/Q3 cutoff indicators",
        "Fully customisable — rearrange and hide widgets to suit your workflow",
      ],
      chart: (
        <div className="space-y-3">
          <LiveTimingGrid
            positions={mockPositions as any}
            sessionType="Qualifying"
            sessionYear={2025}
            qualiSegment="Q3"
          />
          <LiveWeather weather={mockWeather} />
        </div>
      ),
      ctaHref: "/live",
      ctaLabel: "Open Live Dashboard",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <MainNav variant="homepage" />

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-blue-600/6 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-6 border-primary/50 text-primary px-4 py-1.5 text-sm">
            Live Examples
          </Badge>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
            See Turn One
            <br />
            <span className="text-primary">in Action</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Professional-grade F1 telemetry visualisations — the same tools used to analyse every lap, every sector,
            and every driver input across the full Formula One season.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2 text-base font-semibold px-8">
              <Link href="/generator">
                <PlayCircle className="w-5 h-5" />
                Generate Your Own Plot
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 text-base px-8">
              <Link href="/pricing">
                <Trophy className="w-5 h-5" />
                View Plans
              </Link>
            </Button>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { label: "Plot Types", value: "9+" },
              { label: "Sessions Covered", value: "500+" },
              { label: "Years of Data", value: "2020–2025" },
              { label: "Drivers Tracked", value: "All" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black text-foreground">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="container mx-auto px-4">
        <div className="h-px bg-border" />
      </div>

      {/* ── SHOWCASE SECTIONS ── */}
      <div className="container mx-auto px-4 py-4">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <section key={section.id} className="py-20 border-b border-border last:border-0">
              <div
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  section.reversed ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                {/* Text column */}
                <div className="flex flex-col justify-center space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs font-semibold uppercase tracking-wider">
                      {section.badge}
                    </Badge>
                  </div>

                  <div>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-2">
                      {section.title}
                    </h2>
                    <p className="text-sm text-primary/80 font-medium">{section.subtitle}</p>
                  </div>

                  <p className="text-muted-foreground leading-relaxed text-lg">{section.description}</p>

                  <ul className="space-y-3">
                    {section.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span className="text-sm text-muted-foreground">{b}</span>
                      </li>
                    ))}
                  </ul>

                  <div>
                    <Button asChild variant="outline" size="sm" className="gap-2 mt-2">
                      <Link href={section.ctaHref ?? "/generator"}>
                        {section.ctaLabel ?? "Try this plot"}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Chart column */}
                <div className="relative">
                  <Card className="border-border/50 shadow-2xl overflow-hidden bg-card/60 backdrop-blur-sm">
                    <CardHeader className="pb-3 pt-4 px-6 border-b border-border/40">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-semibold text-foreground">{section.title}</CardTitle>
                          <CardDescription className="text-xs mt-0.5">{section.subtitle}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary shrink-0">
                          LIVE DATA
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-5">{section.chart}</CardContent>
                  </Card>

                  {/* Decorative glow */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary/5 via-transparent to-blue-600/5 rounded-xl -z-10 blur-lg pointer-events-none" />
                </div>
              </div>
            </section>
          )
        })}
      </div>

      {/* ── CTA ── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/8 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-6 border-primary/50 text-primary px-4 py-1.5">
            Free to Start
          </Badge>

          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Your Turn to
            <br />
            <span className="text-primary">Explore the Data</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Create an account — it's free. Pick a race, pick a session, pick your drivers and generate any of these
            visualisations in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2 text-base font-semibold px-10 py-6">
              <Link href="/auth/register">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 text-base px-10 py-6">
              <Link href="/generator">
                <Zap className="w-5 h-5" />
                Open Generator
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            200 free tokens every month · No credit card required · Full access on sign-up
          </p>
        </div>
      </section>
    </div>
  )
}
