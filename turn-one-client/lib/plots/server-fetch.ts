// Server-only fetchers for the SEO session pages (app/f1/**).
//
// Deliberately narrow: only the three SHAREABLE_PLOTS endpoints. Widening the
// SEO pages to more plot types means adding a fetcher here to match.
//
// Every fetcher returns an Outcome (lib/f1/outcome.ts) instead of throwing, and
// addresses the event by its numeric key — the API's name lookup is brittle
// ("Barcelona Grand Prix" 404s, "Italian Grand Prix" works, "Monza" doesn't)
// whereas keys resolve every event.

import { apiGet, type CacheMode } from "@/lib/f1/api"
import { classifyResponse, type Outcome } from "@/lib/f1/outcome"

export interface EventRef {
  year: number
  key: number
}

export interface ResultRow {
  Driver: string
  Team?: string
  LapTime: string
  LapTimeDelta: number
  Color?: string
}
export interface TopSpeedRow {
  team: string
  speed: number
  color: string
}
export interface ThrottleRow {
  driver: string
  throttle: number
  color: string
}

/**
 * Cache tag for one session's data. `/api/revalidate/sessions` expires it the
 * moment the F1 API has the session, so ISR pages don't sit on a cached
 * "no data" response.
 */
export function sessionTag(ev: EventRef, code: string) {
  return `f1-session:${ev.year}:${ev.key}:${code}`
}

export type FetchOpts = { ttl: number } | { fresh: true }

function cacheFor(ev: EventRef, code: string, opts: FetchOpts): CacheMode {
  return "fresh" in opts ? "no-store" : { revalidate: opts.ttl, tags: [sessionTag(ev, code)] }
}

const query = (ev: EventRef, code: string) => `year=${ev.year}&gp=${ev.key}&session=${code}`

function pickArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (raw && typeof raw === "object" && Array.isArray((raw as Record<string, unknown>).data)) {
    return (raw as { data: T[] }).data
  }
  return []
}

// Deliberately duplicates the shaping logic in lib/plots/catalog/*.tsx rather
// than importing it: those files' `fetch` closures are bundled alongside
// "use client" modules (lib/dataAcquisition.ts), and pulling that into a
// server component's module graph is exactly the boundary-crossing this file
// exists to avoid. Keep both in sync when either changes.

// The API has two row shapes for top speeds: older sessions use "Top Speed (km/h)",
// newer ones plain "Speed". Either may also arrive column-oriented (one object per field).
const SPEED_KEYS = ["Top Speed (km/h)", "Speed"] as const

export function shapeTopSpeeds(raw: unknown): TopSpeedRow[] {
  let rows: TopSpeedRow[] = []
  const speedKey = raw && typeof raw === "object" ? SPEED_KEYS.find((k) => k in (raw as object)) : undefined
  if (raw && typeof raw === "object" && "Color" in raw && "Team" in raw && speedKey) {
    const colors = (raw as Record<string, Record<string, string>>).Color
    const teams = (raw as Record<string, Record<string, string>>).Team
    const speeds = (raw as Record<string, Record<string, number>>)[speedKey]
    rows = Object.keys(teams).map((key) => ({ team: teams[key], speed: speeds[key], color: colors[key] }))
  } else if (raw && typeof raw === "object") {
    rows = (Object.values(raw) as Array<Record<string, unknown>>).map((item) => ({
      team: item?.Team as string,
      speed: (item?.["Top Speed (km/h)"] ?? item?.Speed) as number,
      color: (item?.Color as string) ?? "#ffffff",
    }))
  }
  return rows.filter((d) => typeof d.team === "string" && Number.isFinite(d.speed)).sort((x, y) => y.speed - x.speed)
}

export function shapeThrottle(raw: unknown): ThrottleRow[] {
  const list = Array.isArray(raw) ? raw : raw && typeof raw === "object" ? Object.values(raw) : []
  return (list as Array<{ Driver?: string; "Average Throttle (%)"?: number; Color?: string }>)
    .filter((item) => typeof item?.Driver === "string" && Number.isFinite(item["Average Throttle (%)"]))
    .map((item) => ({ driver: item.Driver as string, throttle: item["Average Throttle (%)"] as number, color: item.Color ?? "#ffffff" }))
}

/** Map an `ok` outcome through a shaper; shaping to nothing counts as `empty`. */
function shaped<T>(o: Outcome<unknown>, shape: (raw: unknown) => T[]): Outcome<T[]> {
  if (o.kind !== "ok") return o
  const rows = shape(o.data)
  return rows.length ? { kind: "ok", data: rows } : { kind: "empty" }
}

export async function fetchSessionResults(ev: EventRef, code: string, opts: FetchOpts): Promise<Outcome<ResultRow[]>> {
  const res = await apiGet(`qualifying-results-data?${query(ev, code)}`, cacheFor(ev, code, opts))
  return shaped(classifyResponse(res), (raw) => pickArray<ResultRow>(raw).filter((r) => typeof r?.Driver === "string" && typeof r?.LapTime === "string"))
}

export async function fetchTopSpeeds(ev: EventRef, code: string, opts: FetchOpts): Promise<Outcome<TopSpeedRow[]>> {
  const res = await apiGet(`top-speed-telemetry-data?${query(ev, code)}`, cacheFor(ev, code, opts))
  return shaped(classifyResponse(res), shapeTopSpeeds)
}

export async function fetchThrottleAverages(ev: EventRef, code: string, opts: FetchOpts): Promise<Outcome<ThrottleRow[]>> {
  const res = await apiGet(`throttle-comparison-data?${query(ev, code)}`, cacheFor(ev, code, opts))
  return shaped(classifyResponse(res), shapeThrottle)
}
