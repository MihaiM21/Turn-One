"use client"

import { Activity, BarChart2, Clock, Sigma, Thermometer } from "lucide-react"
import {
  fetchLapDistributionData,
  fetchLaptimeData,
  fetchTheoreticalBest,
  fetchTrackEvolution,
} from "@/lib/dataAcquisition"
import { LapTimeAnalysisGraph } from "@/components/dashboard/telemetry generator/plots/lap-time-analysis"
import { LapDistributionGraph } from "@/components/dashboard/telemetry generator/plots/lap-distribution"
import { LapTimeCandlestickGraph } from "@/components/dashboard/telemetry generator/plots/lap-time-candlestick"
import { TheoreticalBestGraph } from "@/components/dashboard/telemetry generator/plots/theoretical-best"
import { TrackEvolutionGraph } from "@/components/dashboard/telemetry generator/plots/track-evolution"
import type { LapTimeData } from "@/types/plot-types"
import type { TheoreticalBestData, TrackEvolutionData } from "@/types/plot-types-v2"
import type { LapTimeDistributionPoint } from "@/types/news-types"
import { columnarToRows, formatSecs, getDriverColors } from "../helpers"
import type { PlotDefinition, PlotFetchContext, StatItem } from "../types"

const CATEGORY = "Lap Analysis"

// Shared by lap_distribution and lap_distribution_candlestick: fetch the
// selected drivers' laps (all drivers when none selected) with team colors.
async function fetchLapDistribution(ctx: PlotFetchContext): Promise<LapTimeDistributionPoint[]> {
  const { token, year, eventName, sessionCode, multiDrivers, allDrivers } = ctx
  const drivers = multiDrivers && multiDrivers.length ? multiDrivers : allDrivers
  if (!drivers.length) return []
  const [colorMap, ...lists] = await Promise.all([
    getDriverColors(),
    ...drivers.map((d) =>
      // NOTE: laptimes-distribution-data expects the session CODE (R/Q/FP1), not the name.
      fetchLapDistributionData(token, year, eventName, sessionCode, d, "v2").catch(() => [])
    ),
  ])
  return (lists as LapTimeDistributionPoint[][])
    .flat()
    .map((p) => ({ ...p, color: colorMap.get(p.driver) || p.color }))
}

function lapDistributionStats(data: unknown): StatItem[] | null {
  const points = data as LapTimeDistributionPoint[]
  if (!points.length) return null
  const lapDrivers = [...new Set(points.map((p) => p.driver))]
  const sortedTimes = points.map((p) => p.lapTime).sort((a, b) => a - b)
  const fastestTime = sortedTimes[0]
  const medianTime = sortedTimes[Math.floor(sortedTimes.length / 2)]
  const fastestDriver = points.find((p) => p.lapTime === fastestTime)?.driver ?? "-"
  const totalLaps = [...new Set(points.map((p) => p.lap))].length
  return [
    { label: "Drivers", value: lapDrivers.length },
    { label: "Fastest Lap", value: formatSecs(fastestTime), sub: fastestDriver },
    { label: "Median Lap", value: formatSecs(medianTime) },
    { label: "Total Laps", value: totalLaps },
  ]
}

export const LAP_ANALYSIS_PLOTS: PlotDefinition[] = [
  {
    key: "laptime",
    title: "Lap Time Analysis",
    shortTitle: "Lap Time",
    description: "Compare lap times and sector performance",
    icon: Clock,
    category: CATEGORY,
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: { kind: "single" },
    emptyMessage: "No lap time data returned for the selected driver/session",
    fetch: async ({ token, year, eventName, sessionName, driver1 }) => {
      if (!driver1) return [] as LapTimeData[]
      const raw = await fetchLaptimeData(token, year, eventName, sessionName, driver1, "v2")
      const rows = columnarToRows(raw)
      return rows
        .map((row) => {
          const lap = Number(row.LapNumber ?? row.lap_number ?? row.lap_numbers ?? 0)
          const rawTime = Number(row.LapTime ?? row.lap_time ?? row.lap_times_seconds ?? 0)
          // FastF1 may return timedelta as nanoseconds; convert to seconds
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
    key: "lap_distribution",
    title: "Lap Distribution",
    shortTitle: "Lap Distribution",
    description: "Lap-by-lap time evolution per driver",
    icon: Activity,
    category: CATEGORY,
    sessionTypes: ["RACE"],
    driverRequirement: { kind: "multi", optional: true, emptyMeansAll: true },
    emptyMessage: "No lap distribution data returned for this session",
    fetch: fetchLapDistribution,
    render: (data, settings) => (
      <LapDistributionGraph data={data as LapTimeDistributionPoint[]} advancedSettings={settings} />
    ),
    stats: lapDistributionStats,
  },
  {
    key: "lap_distribution_candlestick",
    title: "Lap Time Box Plot",
    shortTitle: "Box Plot",
    description: "Box-and-whisker distribution of lap times per driver",
    icon: BarChart2,
    category: CATEGORY,
    sessionTypes: ["RACE"],
    driverRequirement: { kind: "multi", optional: true, emptyMeansAll: true },
    emptyMessage: "No lap distribution data returned for this session",
    fetch: async (ctx) => {
      const allPoints = await fetchLapDistribution(ctx)

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
      return allPoints.sort((a, b) => rank.get(a.driver)! - rank.get(b.driver)!)
    },
    render: (data, settings) => (
      <LapTimeCandlestickGraph data={data as LapTimeDistributionPoint[]} advancedSettings={settings} />
    ),
    stats: lapDistributionStats,
  },
  {
    key: "theoretical_best",
    title: "Theoretical Best",
    shortTitle: "Theo Best",
    description: "Best sectors combined vs actual best lap",
    icon: Sigma,
    category: CATEGORY,
    isPro: true,
    sessionTypes: ["QUALIFYING"],
    sessionCodes: ["Q"],
    sessionRestrictionNote:
      "Theoretical Best is only available for Qualifying sessions. Please select Qualifying above.",
    driverRequirement: { kind: "none" },
    emptyMessage: "No theoretical best data returned for the selected session",
    fetch: async ({ year, eventName, sessionName }) =>
      (await fetchTheoreticalBest(year, eventName, sessionName)) as TheoreticalBestData,
    render: (data, settings) => (
      <TheoreticalBestGraph data={data as TheoreticalBestData} advancedSettings={settings} />
    ),
    stats: (data) => {
      const d = data as TheoreticalBestData
      if (!d.length) return null
      const sorted = [...d].sort((a, b) => a.delta_s - b.delta_s)
      const avgDelta = d.reduce((a, c) => a + c.delta_s, 0) / d.length
      return [
        { label: "Smallest Delta", value: `+${sorted[0].delta_s.toFixed(3)}s`, sub: sorted[0].driver },
        { label: "Largest Delta", value: `+${sorted[sorted.length - 1].delta_s.toFixed(3)}s`, sub: sorted[sorted.length - 1].driver },
        { label: "Average Delta", value: `+${avgDelta.toFixed(3)}s` },
        { label: "Drivers", value: d.length },
      ]
    },
  },
  {
    key: "track_evolution",
    title: "Track Evolution",
    shortTitle: "Track Evo",
    description: "Running best lap time vs track temperature",
    icon: Thermometer,
    category: CATEGORY,
    isPro: true,
    sessionTypes: ["PRACTICE", "QUALIFYING"],
    sessionCodes: ["FP1", "FP2", "FP3", "Q"],
    sessionRestrictionNote:
      "Track Evolution is only available for Practice (FP1-FP3) and Qualifying sessions. Please select one above.",
    driverRequirement: { kind: "multi", optional: true, emptyMeansAll: true },
    emptyMessage: "No track evolution data returned for the selected session",
    fetch: async ({ year, eventName, sessionName, multiDrivers }) =>
      (await fetchTrackEvolution(
        year,
        eventName,
        sessionName,
        multiDrivers && multiDrivers.length > 0 ? multiDrivers : undefined
      )) as TrackEvolutionData,
    render: (data, settings) => (
      <TrackEvolutionGraph data={data as TrackEvolutionData} advancedSettings={settings} />
    ),
    isEmpty: (data) => {
      const d = data as TrackEvolutionData | null
      return !d || !d.drivers || Object.keys(d.drivers).length === 0
    },
  },
]
