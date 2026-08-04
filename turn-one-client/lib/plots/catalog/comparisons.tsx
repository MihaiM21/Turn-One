"use client"

import { AlertTriangle, ChartSpline, Crosshair, Info, Swords, Users } from "lucide-react"
import {
  fetchCornerDuel,
  fetchTeammateBattle,
  fetchThrottleBrakeComparison,
  fetchTrackComparison,
  fetchTrackComparisonPlot,
} from "@/lib/dataAcquisition"
import { ThrottleBrakeComparisonGraph } from "@/components/dashboard/telemetry generator/plots/throttle-brake-comparison"
import { TrackComparisonGraph } from "@/components/dashboard/telemetry generator/plots/track-comparison"
import { CornerDuelGraph } from "@/components/dashboard/telemetry generator/plots/corner-duel"
import { TeammateBattleGraph } from "@/components/dashboard/telemetry generator/plots/teammate-battle"
import type { ThrottleBrakeComparisonData, TrackComparisonData } from "@/types/plot-types"
import type { CornerDuelData, TeammateBattleData } from "@/types/plot-types-v2"
import type { PlotDefinition, PlotFetchContext } from "../types"

const CATEGORY = "Comparisons"

/**
 * track_comparison fetches either the official plot image (default) or the
 * raw telemetry rendered by the legacy custom visual (experimental mode).
 */
export type TrackComparisonResult =
  | { mode: "image"; url: string }
  | { mode: "data"; data: TrackComparisonData }

const requireTwoDistinctDrivers = (ctx: PlotFetchContext): string | null =>
  !ctx.driver1 || !ctx.driver2 || ctx.driver1 === ctx.driver2
    ? "Please select two different drivers"
    : null

export const COMPARISON_PLOTS: PlotDefinition[] = [
  {
    key: "track_comparison",
    title: "H2H Track Comparison",
    shortTitle: "Track H2H",
    description: "Head-to-head track comparison visualization",
    icon: Users,
    category: CATEGORY,
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: { kind: "pair" },
    options: [
      {
        id: "experimental",
        label: "Experimental",
        type: "toggle",
        defaultValue: false,
        help: "Default mode uses the external plot image endpoint for stability. Enable experimental mode to use the legacy custom telemetry rendering.",
      },
    ],
    validate: requireTwoDistinctDrivers,
    emptyMessage: "No track comparison data available",
    fetch: async (ctx): Promise<TrackComparisonResult | null> => {
      const { token, year, eventName, sessionName, driver1, driver2, options } = ctx
      if (!driver1 || !driver2 || driver1 === driver2) return null
      if (options.experimental) {
        const data = await fetchTrackComparison(token, year, eventName, sessionName, driver1, driver2, "v2")
        return { mode: "data", data: data as TrackComparisonData }
      }
      const url = await fetchTrackComparisonPlot(token, year, eventName, sessionName, driver1, driver2, "v2")
      return { mode: "image", url }
    },
    render: (data, settings, ctx) => {
      const result = data as TrackComparisonResult | null
      if (!result) return null
      if (result.mode === "data") {
        return (
          <div className="space-y-4">
            {!settings.isExport && (
              <div className="flex items-start gap-2 border border-yellow-500/40 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-400">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Experimental mode — using the legacy custom telemetry visual. Data quality may vary.</span>
              </div>
            )}
            <TrackComparisonGraph data={result.data} advancedSettings={settings} />
          </div>
        )
      }
      return (
        <div className="space-y-4">
          {!settings.isExport && (
            <div className="flex items-start gap-2 border border-zinc-700/50 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-400">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Showing the official plot image from the external API endpoint.</span>
            </div>
          )}
          <div className="flex items-center justify-center min-h-[700px] border border-zinc-800 bg-zinc-950/50 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.url}
              alt={`H2H Track Comparison Plot (${ctx?.driver1 ?? ""} vs ${ctx?.driver2 ?? ""})`}
              className="max-h-[700px] w-auto max-w-full rounded-md object-contain"
            />
          </div>
        </div>
      )
    },
    isEmpty: (data) => {
      const result = data as TrackComparisonResult | null
      if (!result) return true
      if (result.mode === "image") return !result.url
      return !result.data || !result.data.telemetry || result.data.telemetry.length === 0
    },
  },
  {
    key: "throttle_brake",
    title: "H2H Throttle & Brake",
    shortTitle: "Throttle/Brake",
    description: "Compare throttle and brake inputs across drivers on their fastest laps",
    icon: ChartSpline,
    category: CATEGORY,
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: { kind: "pair" },
    validate: requireTwoDistinctDrivers,
    emptyMessage: "No throttle & brake comparison data available",
    fetch: async ({ token, year, eventName, sessionName, driver1, driver2 }) => {
      if (!driver1 || !driver2 || driver1 === driver2) return null
      return await fetchThrottleBrakeComparison(token, year, eventName, sessionName, driver1, driver2, "v2")
    },
    render: (data, settings) =>
      data ? (
        <ThrottleBrakeComparisonGraph data={data as ThrottleBrakeComparisonData} advancedSettings={settings} />
      ) : null,
    isEmpty: (data) => {
      const d = data as ThrottleBrakeComparisonData | null
      return !d || !d.telemetry || d.telemetry.length === 0
    },
    stats: (data) => {
      const d = data as ThrottleBrakeComparisonData | null
      return [
        { label: "Head to Head", value: d ? `${d.driver1} vs ${d.driver2}` : "-" },
        { label: "Data Points", value: d?.telemetry?.length || 0 },
        { label: "Event", value: d?.session_info?.event_name || "-" },
        { label: "Session", value: d?.session_info?.session_name || "-" },
      ]
    },
  },
  {
    key: "corner_duel",
    title: "Corner Duel",
    shortTitle: "Corner Duel",
    description: "Corner-by-corner telemetry comparison between two drivers",
    icon: Crosshair,
    category: CATEGORY,
    isPro: true,
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: { kind: "pair" },
    validate: requireTwoDistinctDrivers,
    emptyMessage: "No corner duel data returned for the selected drivers/session",
    fetch: async ({ year, eventName, sessionName, driver1, driver2 }) => {
      if (!driver1 || !driver2 || driver1 === driver2) return null
      return (await fetchCornerDuel(year, eventName, sessionName, driver1, driver2)) as CornerDuelData
    },
    render: (data, settings) =>
      data ? <CornerDuelGraph data={data as CornerDuelData} advancedSettings={settings} /> : null,
    isEmpty: (data) => {
      const d = data as CornerDuelData | null
      return !d || !d.corners || d.corners.length === 0
    },
  },
  {
    key: "teammate_battle",
    title: "Teammate Battle",
    shortTitle: "Teammates",
    description: "Head-to-head quali/race records per team",
    icon: Swords,
    category: CATEGORY,
    isPro: true,
    scope: "season",
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: { kind: "none" },
    emptyMessage: "No teammate battle data returned for the selected season",
    fetch: async ({ year }) => (await fetchTeammateBattle(year)) as TeammateBattleData,
    render: (data, settings) => (
      <TeammateBattleGraph data={data as TeammateBattleData} advancedSettings={settings} />
    ),
    isEmpty: (data) => {
      const d = data as TeammateBattleData | null
      return !d || !d.teams || d.teams.length === 0
    },
    stats: (data, ctx) => {
      const d = data as TeammateBattleData | null
      if (!d) return null
      const withDiff = d.teams.map((t) => ({
        ...t,
        raceDiff: Math.abs(t.race_h2h[0] - t.race_h2h[1]),
      }))
      const mostDominant = [...withDiff].sort((a, b) => b.raceDiff - a.raceDiff)[0]
      const closest = [...withDiff].sort((a, b) => a.raceDiff - b.raceDiff)[0]
      return [
        { label: "Most Dominant", value: mostDominant ? `${mostDominant.race_h2h[0]}-${mostDominant.race_h2h[1]}` : "-", sub: mostDominant?.team },
        { label: "Closest Battle", value: closest ? `${closest.race_h2h[0]}-${closest.race_h2h[1]}` : "-", sub: closest?.team },
        { label: "Teams", value: d.teams.length },
        { label: "Season", value: ctx.year },
      ]
    },
  },
]
