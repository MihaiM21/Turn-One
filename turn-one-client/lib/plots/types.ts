import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import type { ExportSessionType } from "@/types/export-types"
import type { AdvancedPlotSettings } from "@/types/plot-types"

/**
 * How a plot consumes driver selection.
 * - none:            no driver input
 * - single:          exactly one driver (ctx.driver1)
 * - single-optional: one driver or "all" (ctx.driver1 undefined = all)
 * - pair:            two distinct drivers (ctx.driver1 / ctx.driver2)
 * - multi:           a set of drivers (ctx.multiDrivers); `max` caps the count,
 *                    `optional` allows empty, `emptyMeansAll` treats empty as
 *                    "every driver" (otherwise empty means "let the API decide")
 */
export type DriverRequirement =
  | { kind: "none" }
  | { kind: "single" }
  | { kind: "single-optional"; allLabel?: string }
  | { kind: "pair" }
  | { kind: "multi"; max?: number; optional?: boolean; emptyMeansAll?: boolean; emptyHint?: string }

/** What timeframe the plot spans; anything but "session" hides GP/session pickers. */
export type PlotScope = "session" | "season" | "career"

/** Value shape for a "year-range" option. */
export type YearRangeValue =
  | { mode: "span"; start: string; end: string }
  | { mode: "list"; years: string[] }

/** A per-plot configurable input rendered generically by the options panel. */
export interface PlotOptionDef {
  /** Maps into ctx.options[id]. */
  id: string
  label: string
  type: "select" | "toggle" | "number" | "year-range"
  choices?: { value: string; label: string }[]
  defaultValue: unknown
  min?: number
  max?: number
  help?: string
}

/**
 * Plain-English copy for the beginner-facing Simple Mode page.
 *
 * Every competitor surveyed puts its "what does this mean" material somewhere
 * else entirely — a separate FAQ page or a blog post — so explaining a chart at
 * the point of confusion is the clearest differentiator available. Optional and
 * additive: a plot without an explainer is simply not offered in Simple Mode
 * and is otherwise unaffected.
 */
export interface PlotExplainer {
  /** One sentence, jargon-free: what is actually plotted. */
  whatItShows: string
  /** Two or three concrete reading instructions ("taller bar = faster"). */
  howToRead: string[]
  /** What an interesting or notable result looks like. */
  whatToLookFor?: string
  /** Terms worth defining inline for a newcomer. */
  glossary?: { term: string; definition: string }[]
}

export interface PlotFetchContext {
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
  /** Values for this plot's PlotOptionDefs, keyed by option id. */
  options: Record<string, unknown>
  token: string
}

export interface StatItem {
  label: string
  value: string | number
  sub?: string
}

export interface PlotDefinition {
  key: string
  title: string
  shortTitle: string
  description: string
  icon: LucideIcon
  /** Grouping shown in the user-facing plot picker. */
  category: string
  /** PRO-plan gating flag for the user-facing picker. */
  isPro?: boolean
  /** Defaults to "session". */
  scope?: PlotScope
  /** Coarse compatibility used by the admin export presets. */
  sessionTypes: ExportSessionType[]
  /**
   * Fine-grained allowed session codes (e.g. ["R", "S"]). When set, the user
   * generator blocks fetching on other sessions and shows a warning banner.
   */
  sessionCodes?: string[]
  /** Human text for the warning banner when the session is incompatible. */
  sessionRestrictionNote?: string
  driverRequirement: DriverRequirement
  options?: PlotOptionDef[]
  /** Default true; false hides the plot from the admin export page until its offscreen capture is verified. */
  exportable?: boolean
  /**
   * Default false. Opt-in flag for the shareable-plots feature (permanent
   * /plot/[slug] URLs, OG capture, share controls, embeds, SEO pages). Mirrors
   * `exportable` — it exists to gate rollout to a verified subset of plots, not
   * to describe a permanent capability difference. Widening the rollout is a
   * one-line change here plus the matching entry in the backend's
   * SharePolicy.AllowedPlotKeys allowlist (the real enforcement boundary).
   */
  shareable?: boolean
  /**
   * Default false. Opt-in flag for data-level X-axis zoom: the plot's chart
   * component reads useChartViewport() to restrict its own domain and offers a
   * drag-to-select range, so axes re-tick instead of merely being magnified.
   * Mirrors `shareable`/`exportable` — it gates rollout to charts that have
   * been wired up, not a permanent capability difference. Only meaningful for
   * charts with a continuous numeric X axis; the visual zoom and full-screen
   * view in ChartViewport apply to every plot regardless of this flag.
   */
  domainZoomable?: boolean
  /** Beginner-facing copy; see PlotExplainer. Required for Simple Mode. */
  explainer?: PlotExplainer
  fetch: (ctx: PlotFetchContext) => Promise<unknown>
  render: (data: unknown, settings: AdvancedPlotSettings, ctx?: PlotFetchContext) => ReactNode
  /** Optional empty check — defaults: array length === 0, or null/undefined. */
  isEmpty?: (data: unknown) => boolean
  /** Message surfaced when fetch succeeds but returns no data. */
  emptyMessage?: string
  /** Summary tiles rendered under the plot on the user generator. */
  stats?: (data: unknown, ctx: PlotFetchContext) => StatItem[] | null
  /** Pre-fetch validation; return an error message to block generation. */
  validate?: (ctx: PlotFetchContext) => string | null
}

/** Builds the default options object for a plot from its option definitions. */
export function defaultOptionsFor(def: PlotDefinition): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const opt of def.options ?? []) out[opt.id] = opt.defaultValue
  return out
}
