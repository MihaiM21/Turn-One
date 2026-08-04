"use client"

import {
  ArrowUpDown,
  BookOpen,
  Disc,
  GitCompareArrows,
  Grid3x3,
  TrendingDown,
  Wrench,
} from "lucide-react"
import {
  fetchPitStrategy,
  fetchPositionChanges,
  fetchRaceGaps,
  fetchRacePaceHeatmap,
  fetchRaceStory,
  fetchTyreDegradation,
  fetchTyreStintData,
} from "@/lib/dataAcquisition"
import { TyreStintGraph } from "@/components/dashboard/telemetry generator/plots/tyre-stint"
import { PositionChangesGraph } from "@/components/dashboard/telemetry generator/plots/position-changes"
import { RaceGapsGraph } from "@/components/dashboard/telemetry generator/plots/race-gaps"
import { TyreDegradationGraph } from "@/components/dashboard/telemetry generator/plots/tyre-degradation"
import { PitStrategyGraph } from "@/components/dashboard/telemetry generator/plots/pit-strategy"
import { RacePaceHeatmapGraph } from "@/components/dashboard/telemetry generator/plots/race-pace-heatmap"
import { RaceStoryGraph } from "@/components/dashboard/telemetry generator/plots/race-story"
import type {
  PitStrategyData,
  PositionChangesData,
  RaceGapsData,
  RacePaceHeatmapData,
  RaceStoryData,
  TyreDegradationData,
} from "@/types/plot-types-v2"
import type { TyreStintEntry } from "@/types/news-types"
import { pickArray } from "../helpers"
import type { PlotDefinition } from "../types"

const CATEGORY = "Race Strategy"

const RACE_SPRINT_CODES = ["R", "S"]
const raceOnlyNote = (title: string) =>
  `${title} is only available for Race and Sprint sessions. Please select Race or Sprint above.`

export const RACE_STRATEGY_PLOTS: PlotDefinition[] = [
  {
    key: "tyre_stint",
    title: "Tyre Stint Strategy",
    shortTitle: "Tyre Stints",
    description: "Visualize tyre compounds and pit stop strategy for every driver (Race & Sprint only)",
    icon: Disc,
    category: CATEGORY,
    sessionTypes: ["RACE"],
    sessionCodes: RACE_SPRINT_CODES,
    sessionRestrictionNote: raceOnlyNote("Tyre stint analysis"),
    driverRequirement: { kind: "none" },
    emptyMessage: "No tyre stint data returned for the selected session",
    fetch: async ({ token, year, eventName, sessionName }) => {
      const raw = await fetchTyreStintData(token, year, eventName, sessionName, "v2")
      return pickArray<TyreStintEntry>(raw)
    },
    render: (data, settings) => (
      <TyreStintGraph data={data as TyreStintEntry[]} advancedSettings={settings} />
    ),
    stats: (data) => {
      const d = data as TyreStintEntry[]
      if (!d.length) return null
      const driverCount = [...new Set(d.map((s) => s.driver))].length
      const totalLaps = Math.max(...d.map((s) => s.end_lap))
      const compounds = [...new Set(d.map((s) => s.compound.toUpperCase()))]
      const avgStops = (d.reduce((acc, s) => acc + s.stint_number, 0) / driverCount / driverCount).toFixed(1)
      return [
        { label: "Drivers", value: driverCount },
        { label: "Total Laps", value: totalLaps },
        { label: "Compounds Used", value: compounds.join(", ") },
        { label: "Avg Pit Stops", value: avgStops },
      ]
    },
  },
  {
    key: "position_changes",
    title: "Position Changes",
    shortTitle: "Positions",
    description: "Lap-by-lap driver position throughout the race",
    icon: ArrowUpDown,
    category: CATEGORY,
    isPro: true,
    sessionTypes: ["RACE"],
    sessionCodes: RACE_SPRINT_CODES,
    sessionRestrictionNote: raceOnlyNote("Position Changes"),
    driverRequirement: { kind: "none" },
    emptyMessage: "No position changes data returned for the selected session",
    fetch: async ({ year, eventName, sessionName }) =>
      (await fetchPositionChanges(year, eventName, sessionName)) as PositionChangesData,
    render: (data, settings) => (
      <PositionChangesGraph data={data as PositionChangesData} advancedSettings={settings} />
    ),
    stats: (data) => {
      const d = data as PositionChangesData
      if (!d.length) return null
      const biggestMover = [...d].sort(
        (a, b) => (b.start_pos - b.end_pos) - (a.start_pos - a.end_pos)
      )[0]
      const podium = [...d].sort((a, b) => a.end_pos - b.end_pos).slice(0, 3).map((x) => x.driver)
      return [
        { label: "Biggest Mover", value: `${biggestMover.start_pos - biggestMover.end_pos >= 0 ? "+" : ""}${biggestMover.start_pos - biggestMover.end_pos}`, sub: biggestMover.driver },
        { label: "Podium", value: podium.join(", ") },
        { label: "Drivers", value: d.length },
        { label: "Starting P1", value: d.find((x) => x.start_pos === 1)?.driver || "-" },
      ]
    },
  },
  {
    key: "race_gaps",
    title: "Race Gaps",
    shortTitle: "Race Gaps",
    description: "Per-driver gap to leader or vs average race pace",
    icon: GitCompareArrows,
    category: CATEGORY,
    isPro: true,
    sessionTypes: ["RACE"],
    sessionCodes: RACE_SPRINT_CODES,
    sessionRestrictionNote: raceOnlyNote("Race Gaps"),
    driverRequirement: { kind: "multi", optional: true, emptyMeansAll: true },
    options: [
      {
        id: "reference",
        label: "Reference",
        type: "select",
        choices: [
          { value: "leader", label: "Gap to leader" },
          { value: "average", label: "Vs average race pace" },
        ],
        defaultValue: "leader",
      },
    ],
    emptyMessage: "No race gaps data returned for the selected session",
    fetch: async ({ year, eventName, sessionName, multiDrivers, options }) =>
      (await fetchRaceGaps(
        year,
        eventName,
        sessionName,
        ((options.reference as string) || "leader") as "leader" | "average",
        multiDrivers && multiDrivers.length > 0 ? multiDrivers : undefined
      )) as RaceGapsData,
    render: (data, settings, ctx) => (
      <RaceGapsGraph
        data={data as RaceGapsData}
        reference={((ctx?.options?.reference as string) || "leader") as "leader" | "average"}
        advancedSettings={settings}
      />
    ),
    stats: (data) => {
      const d = data as RaceGapsData
      if (!d.length) return null
      const finalGaps = d.map((x) => {
        const laps = x.laps.filter((l) => l.gap_s !== null)
        return { driver: x.driver, gap: laps.length > 0 ? laps[laps.length - 1].gap_s! : 0 }
      })
      const largest = [...finalGaps].sort((a, b) => b.gap - a.gap)[0]
      const avg = finalGaps.reduce((a, c) => a + c.gap, 0) / (finalGaps.length || 1)
      return [
        { label: "Winner", value: d[0]?.driver || "-" },
        { label: "Largest Gap", value: largest ? `+${largest.gap.toFixed(3)}s` : "-", sub: largest?.driver },
        { label: "Average Gap", value: `${avg.toFixed(3)}s` },
        { label: "Drivers", value: d.length },
      ]
    },
  },
  {
    key: "tyre_degradation",
    title: "Tyre Degradation",
    shortTitle: "Tyre Deg",
    description: "Per-compound tyre performance and degradation rate",
    icon: TrendingDown,
    category: CATEGORY,
    isPro: true,
    sessionTypes: ["RACE"],
    sessionCodes: RACE_SPRINT_CODES,
    sessionRestrictionNote: raceOnlyNote("Tyre Degradation"),
    driverRequirement: { kind: "single-optional", allLabel: "All drivers" },
    options: [
      {
        id: "fuelCorrected",
        label: "Fuel-corrected lap times",
        type: "toggle",
        defaultValue: false,
      },
    ],
    emptyMessage: "No tyre degradation data returned for the selected session",
    fetch: async ({ year, eventName, sessionName, driver1, options }) =>
      (await fetchTyreDegradation(
        year,
        eventName,
        sessionName,
        driver1 || undefined,
        Boolean(options.fuelCorrected)
      )) as TyreDegradationData,
    render: (data, settings) => (
      <TyreDegradationGraph data={data as TyreDegradationData} advancedSettings={settings} />
    ),
  },
  {
    key: "pit_strategy",
    title: "Pit Strategy",
    shortTitle: "Pit Strategy",
    description: "Pit stops, undercuts, and free tyre changes",
    icon: Wrench,
    category: CATEGORY,
    isPro: true,
    sessionTypes: ["RACE"],
    sessionCodes: RACE_SPRINT_CODES,
    sessionRestrictionNote: raceOnlyNote("Pit Strategy"),
    driverRequirement: { kind: "none" },
    emptyMessage: "No pit strategy data returned for the selected session",
    fetch: async ({ year, eventName, sessionName }) =>
      (await fetchPitStrategy(year, eventName, sessionName)) as PitStrategyData,
    render: (data, settings) => (
      <PitStrategyGraph data={data as PitStrategyData} advancedSettings={settings} />
    ),
    isEmpty: (data) => {
      const d = data as PitStrategyData | null
      return !d || !d.stops || d.stops.length === 0
    },
    stats: (data) => {
      const d = data as PitStrategyData | null
      if (!d) return null
      const undercuts = d.undercuts ?? []
      const bestUndercut = [...undercuts].sort((a, b) => (b.gain_s ?? -Infinity) - (a.gain_s ?? -Infinity))[0]
      const fastest = d.summary?.fastest_stop
      return [
        { label: "Fastest Stop", value: fastest ? `${fastest.pit_lane_time_s.toFixed(3)}s` : "-", sub: fastest?.driver || "-" },
        { label: "Total Stops", value: d.stops.length },
        { label: "Best Undercut", value: bestUndercut && typeof bestUndercut.gain_s === "number" ? `+${bestUndercut.gain_s.toFixed(3)}s` : "-", sub: bestUndercut ? `${bestUndercut.attacker ?? "-"} vs ${bestUndercut.attacked ?? "-"}` : "-" },
        { label: "Undercuts Tried", value: undercuts.length },
      ]
    },
  },
  {
    key: "race_pace_heatmap",
    title: "Race Pace Heatmap",
    shortTitle: "Pace Heatmap",
    description: "Driver x lap grid of delta to field median lap time",
    icon: Grid3x3,
    category: CATEGORY,
    isPro: true,
    sessionTypes: ["RACE"],
    sessionCodes: RACE_SPRINT_CODES,
    sessionRestrictionNote: raceOnlyNote("Race Pace Heatmap"),
    driverRequirement: { kind: "none" },
    emptyMessage: "No race pace heatmap data returned for the selected session",
    fetch: async ({ year, eventName, sessionName }) =>
      (await fetchRacePaceHeatmap(year, eventName, sessionName)) as RacePaceHeatmapData,
    render: (data, settings) => (
      <RacePaceHeatmapGraph data={data as RacePaceHeatmapData} advancedSettings={settings} />
    ),
    isEmpty: (data) => {
      const d = data as RacePaceHeatmapData | null
      return !d || !d.grid || Object.keys(d.grid).length === 0
    },
  },
  {
    key: "race_story",
    title: "Race Story",
    shortTitle: "Race Story",
    description: "Gap-to-leader series, pit stops, and key moments",
    icon: BookOpen,
    category: CATEGORY,
    isPro: true,
    sessionTypes: ["RACE"],
    sessionCodes: RACE_SPRINT_CODES,
    sessionRestrictionNote: raceOnlyNote("Race Story"),
    driverRequirement: { kind: "none" },
    emptyMessage: "No race story data returned for the selected session",
    fetch: async ({ year, eventName, sessionName }) =>
      (await fetchRaceStory(year, eventName, sessionName)) as RaceStoryData,
    render: (data, settings) => (
      <RaceStoryGraph data={data as RaceStoryData} advancedSettings={settings} />
    ),
    isEmpty: (data) => {
      const d = data as RaceStoryData | null
      return !d || !d.drivers || d.drivers.length === 0
    },
  },
]
