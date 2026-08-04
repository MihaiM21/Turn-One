import type { ExportSessionType } from "@/types/export-types"
import type { PlotDefinition } from "../types"
import { SPEED_PACE_PLOTS } from "./speed-pace"
import { LAP_ANALYSIS_PLOTS } from "./lap-analysis"
import { COMPARISON_PLOTS } from "./comparisons"
import { SESSION_INFO_PLOTS } from "./session-info"
import { RACE_STRATEGY_PLOTS } from "./race-strategy"
import { SEASON_CAREER_PLOTS } from "./season-career"

// Explicit ordering — this is the order plots appear in the pickers.
const ORDERED_KEYS = [
  "topspeeds",
  "throttle_average",
  "speed_distribution",
  "laptime",
  "lap_distribution",
  "lap_distribution_candlestick",
  "track_comparison",
  "throttle_brake",
  "session_results",
  "tyre_stint",
  "theoretical_best",
  "track_evolution",
  "corner_duel",
  "teammate_battle",
  "session_weather",
  "track_map",
  "position_changes",
  "race_gaps",
  "tyre_degradation",
  "pit_strategy",
  "race_pace_heatmap",
  "race_story",
  "form_guide",
  "driver_radar_season",
  "driver_radar_career",
  "driver_radar_session",
]

const ALL_PLOTS = [
  ...SPEED_PACE_PLOTS,
  ...LAP_ANALYSIS_PLOTS,
  ...COMPARISON_PLOTS,
  ...SESSION_INFO_PLOTS,
  ...RACE_STRATEGY_PLOTS,
  ...SEASON_CAREER_PLOTS,
]

export const PLOT_CATALOG: PlotDefinition[] = [...ALL_PLOTS].sort((a, b) => {
  const ia = ORDERED_KEYS.indexOf(a.key)
  const ib = ORDERED_KEYS.indexOf(b.key)
  return (ia === -1 ? ORDERED_KEYS.length : ia) - (ib === -1 ? ORDERED_KEYS.length : ib)
})

export const PLOT_BY_KEY = new Map(PLOT_CATALOG.map((p) => [p.key, p]))

/** Renamed keys — maps legacy identifiers (e.g. from saved presets) to current ones. */
export const LEGACY_PLOT_KEYS: Record<string, string> = {
  top_speed: "topspeeds",
}

export function resolvePlotKey(key: string): string {
  return PLOT_BY_KEY.has(key) ? key : LEGACY_PLOT_KEYS[key] ?? key
}

/** Plots the admin export page may render offscreen (capture verified). */
export const EXPORTABLE_PLOTS: PlotDefinition[] = PLOT_CATALOG.filter(
  (p) => p.exportable !== false
)

export function plotsForSession(sessionType: ExportSessionType): PlotDefinition[] {
  return PLOT_CATALOG.filter((p) => p.sessionTypes.includes(sessionType))
}

/** True when the plot restricts session codes and the current one isn't allowed. */
export function isSessionRestricted(def: PlotDefinition, sessionCode: string): boolean {
  if (def.scope && def.scope !== "session") return false
  if (!def.sessionCodes || def.sessionCodes.length === 0) return false
  return !def.sessionCodes.includes(sessionCode)
}

export function isPlotDataEmpty(def: PlotDefinition, data: unknown): boolean {
  if (def.isEmpty) return def.isEmpty(data)
  if (data == null) return true
  if (Array.isArray(data)) return data.length === 0
  return false
}
