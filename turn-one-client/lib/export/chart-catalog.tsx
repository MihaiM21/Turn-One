"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  BarChart2,
  ChartSpline,
  CircleGauge,
  Clock,
  Disc,
  Gauge,
  MonitorCog,
  TrendingUp,
  Users,
} from "lucide-react"
import type { ExportSessionType } from "@/types/export-types"
import {
  fetchLapDistributionData,
  fetchLaptimeData,
  fetchSessionResults,
  fetchSpeedDistributionData,
  fetchStaticDrivers,
  fetchThrottleAverages,
  fetchThrottleBrakeComparison,
  fetchTopSpeeds,
  fetchTrackComparison,
  fetchTyreStintData,
} from "@/lib/dataAcquisition"
import { TopSpeedGraph } from "@/components/dashboard/telemetry generator/plots/top-speed"
import { SessionResultsGraph } from "@/components/dashboard/telemetry generator/plots/session-results"
import { TyreStintGraph } from "@/components/dashboard/telemetry generator/plots/tyre-stint"
import { LapDistributionGraph } from "@/components/dashboard/telemetry generator/plots/lap-distribution"
import { LapTimeCandlestickGraph } from "@/components/dashboard/telemetry generator/plots/lap-time-candlestick"
import { ThrottleAverageGraph } from "@/components/dashboard/telemetry generator/plots/throttle_average_comparison"
import { LapTimeAnalysisGraph } from "@/components/dashboard/telemetry generator/plots/lap-time-analysis"
import { SpeedDistributionGraph } from "@/components/dashboard/telemetry generator/plots/speed-distribution"
import { ThrottleBrakeComparisonGraph } from "@/components/dashboard/telemetry generator/plots/throttle-brake-comparison"
import { TrackComparisonGraph } from "@/components/dashboard/telemetry generator/plots/track-comparison"
import type {
  AdvancedPlotSettings,
  LapTimeData,
  SpeedDistributionPoint,
  SpeedDistributionRawPoint,
  ThrottleBrakeComparisonData,
  TrackComparisonData,
} from "@/types/plot-types"
import type { TyreStintEntry, LapTimeDistributionPoint } from "@/types/news-types"

export type DriverRequirement = "none" | "single" | "pair" | "multi"

export interface ChartFetchContext {
  year: number
  /** Friendly event name passed as `gp` to the API (e.g. "Australian Grand Prix"). */
  eventName: string
  /** Full session name (e.g. "Race", "Qualifying", "Practice 1"). */
  sessionName: string
  /** Short session code (e.g. "R", "Q", "FP1"). Some endpoints require code instead of name. */
  sessionCode: string
  /** All drivers for the season (used for multi-driver fetches). */
  allDrivers: string[]
  driver1?: string
  driver2?: string
  /** User-picked subset for multi-driver charts (defaults to allDrivers). */
  multiDrivers?: string[]
  token: string
}

export interface ChartDefinition {
  key: string
  title: string
  shortTitle: string
  description: string
  icon: LucideIcon
  sessionTypes: ExportSessionType[]
  driverRequirement: DriverRequirement
  fetch: (ctx: ChartFetchContext) => Promise<unknown>
  render: (data: unknown, settings: AdvancedPlotSettings, ctx?: ChartFetchContext) => ReactNode
  /** Optional empty check — defaults: array length === 0, or null/undefined. */
  isEmpty?: (data: unknown) => boolean
}

function pickArray<T = unknown>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.data)) return obj.data as T[]
  }
  return []
}

function columnarToRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[]
  if (!raw || typeof raw !== "object") return []
  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[]
  const keys = Object.keys(obj)
  if (!keys.length) return []
  const first = obj[keys[0]]
  if (first && typeof first === "object" && !Array.isArray(first)) {
    const indices = Object.keys(first as Record<string, unknown>)
    return indices.map((i) => {
      const row: Record<string, unknown> = {}
      keys.forEach((k) => {
        row[k] = (obj[k] as Record<string, unknown>)[i]
      })
      return row
    })
  }
  return []
}

// Cache the static driver→color map for the page session.
let _driverColorsPromise: Promise<Map<string, string>> | null = null
async function getDriverColors(): Promise<Map<string, string>> {
  if (!_driverColorsPromise) {
    _driverColorsPromise = fetchStaticDrivers().catch(() => new Map<string, string>())
  }
  return _driverColorsPromise
}

const formatSecs = (secs: number) => {
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(3)
  return `${m}:${s.padStart(6, "0")}`
}

export const CHART_CATALOG: ChartDefinition[] = [
  {
    key: "session_results",
    title: "Session Results",
    shortTitle: "Results",
    description: "Visualize session results and lap time deltas",
    icon: MonitorCog,
    sessionTypes: ["RACE", "QUALIFYING"],
    driverRequirement: "none",
    fetch: async ({ token, year, eventName, sessionName }) => {
      const raw = await fetchSessionResults(token, year, eventName, sessionName, "v2")
      return pickArray(raw)
    },
    render: (data, settings) => (
      <SessionResultsGraph data={data as never} advancedSettings={settings} />
    ),
  },
  {
    key: "top_speed",
    title: "Top Speed by Team",
    shortTitle: "Top Speed",
    description: "Compare top speeds across teams",
    icon: Gauge,
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: "none",
    fetch: async ({ token, year, eventName, sessionName }) => {
      const raw = await fetchTopSpeeds(token, year, eventName, sessionName, "v2")
      let processed: { team: string; speed: number; color: string }[] = []
      if (
        raw &&
        typeof raw === "object" &&
        "Color" in raw &&
        "Team" in raw &&
        "Top Speed (km/h)" in raw
      ) {
        const colors = (raw as Record<string, Record<string, string>>).Color
        const teams = (raw as Record<string, Record<string, string>>).Team
        const speeds = (raw as Record<string, Record<string, number>>)[
          "Top Speed (km/h)"
        ]
        processed = Object.keys(teams).map((key) => ({
          team: teams[key],
          speed: speeds[key],
          color: colors[key],
        }))
      } else if (raw && typeof raw === "object") {
        processed = Object.values(
          raw as Record<string, { Team: string; "Top Speed (km/h)": number; Color: string }>
        ).map((item) => ({
          team: item.Team,
          speed: item["Top Speed (km/h)"],
          color: item.Color,
        }))
      }
      return processed
        .filter((d) => Number.isFinite(d.speed))
        .sort((a, b) => b.speed - a.speed)
    },
    render: (data, settings) => (
      <TopSpeedGraph data={data as never} advancedSettings={settings} />
    ),
  },
  {
    key: "throttle_average",
    title: "Throttle Average",
    shortTitle: "Throttle Avg",
    description: "Compare average throttle across drivers",
    icon: CircleGauge,
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: "none",
    fetch: async ({ token, year, eventName, sessionName }) => {
      const raw = await fetchThrottleAverages(token, year, eventName, sessionName, "v2")
      const dict = raw as Record<string, { Driver: string; "Average Throttle (%)": number; Color: string }> | unknown[]
      const list = Array.isArray(dict) ? (dict as Array<{ Driver: string; "Average Throttle (%)": number; Color: string }>) : Object.values(dict)
      return list
        .map((item) => ({
          driver: item.Driver,
          throttle: item["Average Throttle (%)"],
          color: item.Color,
        }))
        .filter((d) => Number.isFinite(d.throttle))
        .sort((a, b) => b.throttle - a.throttle)
    },
    render: (data, settings) => (
      <ThrottleAverageGraph data={data as never} advancedSettings={settings} />
    ),
  },
  {
    key: "tyre_stint",
    title: "Tyre Stint Strategy",
    shortTitle: "Tyre Stints",
    description: "Tyre compounds and pit stops per driver",
    icon: Disc,
    sessionTypes: ["RACE"],
    driverRequirement: "none",
    fetch: async ({ token, year, eventName, sessionName }) => {
      const raw = await fetchTyreStintData(token, year, eventName, sessionName, "v2")
      return pickArray<TyreStintEntry>(raw)
    },
    render: (data, settings) => (
      <TyreStintGraph data={data as TyreStintEntry[]} advancedSettings={settings} />
    ),
  },
  {
    key: "lap_distribution",
    title: "Lap Distribution",
    shortTitle: "Lap Distribution",
    description: "Lap-by-lap time evolution",
    icon: Activity,
    sessionTypes: ["RACE"],
    driverRequirement: "multi",
    // NOTE: laptimes-distribution-data expects the session CODE (R/Q/FP1), not the name.
    fetch: async ({ token, year, eventName, sessionCode, multiDrivers, allDrivers }) => {
      const drivers = multiDrivers && multiDrivers.length ? multiDrivers : allDrivers
      if (!drivers.length) return [] as LapTimeDistributionPoint[]
      const [colorMap, ...lists] = await Promise.all([
        getDriverColors(),
        ...drivers.map((d) =>
          fetchLapDistributionData(token, year, eventName, sessionCode, d, "v2").catch(() => [])
        ),
      ])
      return (lists as LapTimeDistributionPoint[][])
        .flat()
        .map((p) => ({ ...p, color: colorMap.get(p.driver) || p.color }))
    },
    render: (data, settings) => (
      <LapDistributionGraph
        data={data as LapTimeDistributionPoint[]}
        advancedSettings={settings}
      />
    ),
  },
  {
    key: "lap_distribution_candlestick",
    title: "Lap Time Box Plot",
    shortTitle: "Box Plot",
    description: "Box-and-whisker lap times per driver, sorted fastest first",
    icon: BarChart2,
    sessionTypes: ["RACE"],
    driverRequirement: "multi",
    fetch: async ({ token, year, eventName, sessionCode, multiDrivers, allDrivers }) => {
      const drivers = multiDrivers && multiDrivers.length ? multiDrivers : allDrivers
      if (!drivers.length) return [] as LapTimeDistributionPoint[]
      const [colorMap, ...lists] = await Promise.all([
        getDriverColors(),
        ...drivers.map((d) =>
          fetchLapDistributionData(token, year, eventName, sessionCode, d, "v2").catch(() => [])
        ),
      ])
      const allPoints = (lists as LapTimeDistributionPoint[][])
        .flat()
        .map((p) => ({ ...p, color: colorMap.get(p.driver) || p.color }))

      // Sort drivers by median lap time (fastest first) so the box plot reads left → right.
      const byDriver = new Map<string, number[]>()
      for (const p of allPoints) {
        if (!byDriver.has(p.driver)) byDriver.set(p.driver, [])
        byDriver.get(p.driver)!.push(p.lapTime)
      }
      const medianOf = (xs: number[]) => {
        const s = [...xs].sort((a, b) => a - b)
        return s[Math.floor(s.length / 2)] ?? Infinity
      }
      const driverOrder = Array.from(byDriver.keys()).sort(
        (a, b) => medianOf(byDriver.get(a)!) - medianOf(byDriver.get(b)!)
      )
      const rank = new Map(driverOrder.map((d, i) => [d, i]))
      return allPoints.sort((a, b) => (rank.get(a.driver)! - rank.get(b.driver)!))
    },
    render: (data, settings) => (
      <LapTimeCandlestickGraph
        data={data as LapTimeDistributionPoint[]}
        advancedSettings={settings}
      />
    ),
  },
  {
    key: "laptime",
    title: "Lap Time Analysis",
    shortTitle: "Lap Time",
    description: "Lap times and sector performance for a driver",
    icon: Clock,
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: "single",
    fetch: async ({ token, year, eventName, sessionName, driver1 }) => {
      if (!driver1) return [] as LapTimeData[]
      const raw = await fetchLaptimeData(token, year, eventName, sessionName, driver1, "v2")
      const rows = columnarToRows(raw)
      return rows
        .map((row) => {
          const lap = Number(row.LapNumber ?? row.lap_number ?? row.lap_numbers ?? 0)
          const rawTime = Number(row.LapTime ?? row.lap_time ?? row.lap_times_seconds ?? 0)
          const secs = rawTime > 1_000_000 ? rawTime / 1_000_000_000 : rawTime
          return {
            driver: String(row.Driver ?? row.driver ?? driver1),
            lap_numbers: lap,
            lap_times_seconds: secs,
            lap_times_formatted: String(row.lap_times_formatted ?? formatSecs(secs)),
            compound: String(row.Compound ?? row.compound ?? "UNKNOWN").toUpperCase(),
          } as LapTimeData
        })
        .filter((d) => d.lap_numbers > 0 && d.lap_times_seconds > 0)
    },
    render: (data, settings) => (
      <LapTimeAnalysisGraph lapTimeData={data as LapTimeData[]} advancedSettings={settings} />
    ),
  },
  {
    key: "speed_distribution",
    title: "Speed Trace",
    shortTitle: "Speed Trace",
    description: "Overlay drivers by speed over time",
    icon: TrendingUp,
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: "multi",
    fetch: async ({ token, year, eventName, sessionName, multiDrivers, allDrivers }) => {
      const drivers = (multiDrivers && multiDrivers.length ? multiDrivers : allDrivers.slice(0, 3))
      if (!drivers.length) return { drivers: [], points: [] as SpeedDistributionPoint[] }
      const [colorMap, ...rawResponses] = await Promise.all([
        getDriverColors(),
        ...drivers.map((d) =>
          fetchSpeedDistributionData(token, year, eventName, sessionName, d, "v2").catch(() => [])
        ),
      ])
      const merged = rawResponses.flatMap((raw) =>
        Array.isArray(raw) ? raw : Object.values((raw as object) || {})
      )
      const points: SpeedDistributionPoint[] = merged
        .map((item) => {
          const row = item as SpeedDistributionRawPoint & Partial<SpeedDistributionPoint>
          const driverCode = String(row.Driver ?? row.driver ?? "")
          return {
            time: Number(row["Time (s)"] ?? row.time),
            speed: Number(row["Speed (km/h)"] ?? row.speed),
            driver: driverCode,
            color: String(
              row.Color ?? row.color ?? colorMap.get(driverCode) ?? "#F9FAFB"
            ),
          }
        })
        .filter((p) => Number.isFinite(p.time) && Number.isFinite(p.speed) && p.driver)
      return { drivers, points: points.filter((p) => drivers.includes(p.driver)) }
    },
    render: (data, settings) => {
      const d = data as { drivers: string[]; points: SpeedDistributionPoint[] }
      return (
        <SpeedDistributionGraph
          data={d.points}
          selectedDrivers={d.drivers}
          advancedSettings={settings}
        />
      )
    },
    isEmpty: (data) => {
      const d = data as { points?: SpeedDistributionPoint[] }
      return !d?.points || d.points.length === 0
    },
  },
  {
    key: "throttle_brake",
    title: "H2H Throttle & Brake",
    shortTitle: "Throttle/Brake",
    description: "Compare throttle/brake inputs across drivers",
    icon: ChartSpline,
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: "pair",
    fetch: async ({ token, year, eventName, sessionName, driver1, driver2 }) => {
      if (!driver1 || !driver2 || driver1 === driver2) return null
      return await fetchThrottleBrakeComparison(token, year, eventName, sessionName, driver1, driver2, "v2")
    },
    render: (data, settings) =>
      data ? (
        <ThrottleBrakeComparisonGraph
          data={data as ThrottleBrakeComparisonData}
          advancedSettings={settings}
        />
      ) : null,
    isEmpty: (data) => {
      const d = data as ThrottleBrakeComparisonData | null
      return !d || !d.telemetry || d.telemetry.length === 0
    },
  },
  {
    key: "track_comparison",
    title: "H2H Track Comparison",
    shortTitle: "Track H2H",
    description: "Head-to-head track comparison visualization",
    icon: Users,
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: "pair",
    fetch: async ({ token, year, eventName, sessionName, driver1, driver2 }) => {
      if (!driver1 || !driver2 || driver1 === driver2) return null
      return await fetchTrackComparison(token, year, eventName, sessionName, driver1, driver2, "v2")
    },
    render: (data, settings) =>
      data ? (
        <TrackComparisonGraph
          data={data as TrackComparisonData}
          advancedSettings={settings}
        />
      ) : null,
    isEmpty: (data) => {
      const d = data as TrackComparisonData | null
      return !d || !d.telemetry || d.telemetry.length === 0
    },
  },
]

export const CHART_BY_KEY = new Map(CHART_CATALOG.map((c) => [c.key, c]))

export function chartsForSession(sessionType: ExportSessionType): ChartDefinition[] {
  return CHART_CATALOG.filter((c) => c.sessionTypes.includes(sessionType))
}

export function isChartDataEmpty(chart: ChartDefinition, data: unknown): boolean {
  if (chart.isEmpty) return chart.isEmpty(data)
  if (data == null) return true
  if (Array.isArray(data)) return data.length === 0
  return false
}
