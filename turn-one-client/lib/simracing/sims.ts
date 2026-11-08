/**
 * One place for what the UI says about each sim (grill 2026-11-08, G10).
 * The backend's `SimSource` enum arrives as PascalCase ("Acc", "IRacing", "F1_25");
 * leaderboards and the protocol use lower snake case ("acc", "iracing", "f1_25").
 * Both spellings resolve through `simMeta`.
 */

import type { SimSource } from "@/lib/simracing/protocol"
import type { BoardSim } from "@/lib/simracing/leaderboards"

/** The global sim filter. EA F1 25 and F1 26 share one bucket; AC only shows under "all". */
export type SimFilter = "all" | "acc" | "f1" | "iracing"

export type Platform = "PC" | "PS5" | "Xbox"

export interface SimMeta {
  source: Exclude<SimSource, "Unknown">
  /** Protocol / leaderboard id. */
  id: BoardSim
  label: string
  short: string
  filter: Exclude<SimFilter, "all"> | null
  experimental: boolean
  platforms: Platform[]
  /** Anchor of its setup guide on /simracing/download. */
  guide: string
  /** How Turn One Link reads it, in one line (shown in privacy copy). */
  reads: string
}

export const SIMS: SimMeta[] = [
  {
    source: "Acc",
    id: "acc",
    label: "Assetto Corsa Competizione",
    short: "ACC",
    filter: "acc",
    experimental: false,
    platforms: ["PC"],
    guide: "acc",
    reads: "the shared-memory telemetry ACC publishes for dashboards",
  },
  {
    source: "F1_25",
    id: "f1_25",
    label: "EA SPORTS F1 25",
    short: "F1 25",
    filter: "f1",
    experimental: false,
    platforms: ["PC", "PS5", "Xbox"],
    guide: "f1",
    reads: "the UDP telemetry feed you switch on in the game's settings",
  },
  {
    source: "F1_26",
    id: "f1_26",
    label: "EA SPORTS F1 26",
    short: "F1 26",
    filter: "f1",
    experimental: false,
    platforms: ["PC", "PS5", "Xbox"],
    guide: "f1",
    reads: "the UDP telemetry feed you switch on in the game's settings",
  },
  {
    source: "IRacing",
    id: "iracing",
    label: "iRacing",
    short: "iRacing",
    filter: "iracing",
    experimental: false,
    platforms: ["PC"],
    guide: "iracing",
    reads: "the iRacing SDK telemetry that iRacing exposes to companion apps",
  },
  {
    source: "Ac",
    id: "ac",
    label: "Assetto Corsa",
    short: "AC",
    filter: null,
    experimental: true,
    platforms: ["PC"],
    guide: "ac",
    reads: "the shared-memory telemetry Assetto Corsa publishes",
  },
]

export const SIM_FILTERS: { value: SimFilter; label: string }[] = [
  { value: "all", label: "All sims" },
  { value: "acc", label: "ACC" },
  { value: "f1", label: "F1 25 · 26" },
  { value: "iracing", label: "iRacing" },
]

const BY_KEY = new Map<string, SimMeta>()
for (const sim of SIMS) {
  BY_KEY.set(sim.source.toLowerCase(), sim)
  BY_KEY.set(sim.id, sim)
}

/** Accepts "Acc", "acc", "IRacing", "iracing", "F1_25", "f1_25". */
export function simMeta(source: string | null | undefined): SimMeta | null {
  if (!source) return null
  return BY_KEY.get(source.toLowerCase()) ?? null
}

export function simLabel(source: string | null | undefined): string {
  return simMeta(source)?.short ?? source ?? "Unknown"
}

export function isSimFilter(value: unknown): value is SimFilter {
  return value === "all" || value === "acc" || value === "f1" || value === "iracing"
}

export function matchesSimFilter(source: string | null | undefined, filter: SimFilter): boolean {
  if (filter === "all") return true
  return simMeta(source)?.filter === filter
}

/** Leaderboards show one sim at a time; keep the current one if it already fits the filter. */
export function boardSimForFilter(filter: SimFilter, current: BoardSim): BoardSim {
  if (filter === "all" || simMeta(current)?.filter === filter) return current
  return SIMS.find((s) => s.filter === filter)!.id
}
