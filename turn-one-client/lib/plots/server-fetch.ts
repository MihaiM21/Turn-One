// Server-only fetchers for the SEO session pages (app/f1/[year]/[event]/[session]).
// These call F1_API_URL directly with the API key — bypassing the browser
// catch-all proxy entirely, since a static/ISR page has no request-scoped
// cookies or JWT to satisfy that proxy's auth gate. Cost control comes from
// Next's own fetch cache (`next: { revalidate }`) rather than a bespoke
// on-disk cache: simpler, and already persisted the same way every other
// `fetch()` call in this app is.
//
// Deliberately narrow: only the three SHAREABLE_PLOTS endpoints. Widening the
// SEO pages to more plot types means adding a fetcher here to match.

const ONE_DAY = 60 * 60 * 24

function apiBase() {
  const base = process.env.F1_API_URL
  if (!base) throw new Error("F1_API_URL is not configured")
  return base.replace(/\/$/, "")
}

/**
 * Cache tag for one session's data. `/api/revalidate/sessions` expires it the
 * moment the F1 API has the session, so the ISR pages don't sit on a cached
 * 404 / empty response for the rest of the day.
 */
export function sessionTag(year: number, gp: string, session: string) {
  return `f1-session:${year}:${gp.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:${session}`
}

type FetchMode = { tag: string; fresh?: boolean }

async function serverFetch(endpoint: string, { tag, fresh = false }: FetchMode): Promise<unknown> {
  const res = await fetch(`${apiBase()}/v2/${endpoint}`, {
    headers: { "X-API-Key": process.env.F1_API_KEY ?? "" },
    // Finished sessions never change, so a day is plenty; newly-published
    // sessions don't wait for it — the revalidation route expires `tag`.
    // `fresh` bypasses the cache entirely: that's how the route probes whether
    // data has appeared without disturbing what the pages currently see.
    ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: ONE_DAY, tags: [tag] } }),
  })
  if (!res.ok) {
    throw new Error(`F1 API request failed (${res.status}): ${endpoint}`)
  }
  return res.json()
}

// Deliberately duplicates the shaping logic in lib/plots/catalog/*.tsx rather
// than importing it: those files' `fetch` closures are bundled alongside
// "use client" modules (lib/dataAcquisition.ts), and pulling that into a
// server component's module graph is exactly the boundary-crossing this file
// exists to avoid. Keep both in sync when either changes.

function pickArray<T = unknown>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.data)) return obj.data as T[]
  }
  return []
}

export async function serverFetchTopSpeeds(year: number, gp: string, session: string) {
  const raw = await serverFetch(`top-speed-telemetry-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`, {
    tag: sessionTag(year, gp, session),
  })
  let processed: { team: string; speed: number; color: string }[] = []
  if (raw && typeof raw === "object" && "Color" in raw && "Team" in raw && "Top Speed (km/h)" in raw) {
    const colors = (raw as Record<string, Record<string, string>>).Color
    const teams = (raw as Record<string, Record<string, string>>).Team
    const speeds = (raw as Record<string, Record<string, number>>)["Top Speed (km/h)"]
    processed = Object.keys(teams).map((key) => ({ team: teams[key], speed: speeds[key], color: colors[key] }))
  } else if (raw && typeof raw === "object") {
    processed = Object.values(raw as Record<string, { Team: string; "Top Speed (km/h)": number; Color: string }>).map((item) => ({
      team: item.Team,
      speed: item["Top Speed (km/h)"],
      color: item.Color,
    }))
  }
  return processed.filter((d) => Number.isFinite(d.speed)).sort((a, b) => b.speed - a.speed)
}

export async function serverFetchThrottleAverages(year: number, gp: string, session: string) {
  const raw = await serverFetch(`throttle-comparison-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`, {
    tag: sessionTag(year, gp, session),
  })
  const dict = raw as Record<string, { Driver: string; "Average Throttle (%)": number; Color: string }> | unknown[]
  const list = Array.isArray(dict)
    ? (dict as Array<{ Driver: string; "Average Throttle (%)": number; Color: string }>)
    : Object.values(dict)
  return list.map((item) => ({ driver: item.Driver, throttle: item["Average Throttle (%)"], color: item.Color }))
}

export async function serverFetchSessionResults(year: number, gp: string, session: string, opts: { fresh?: boolean } = {}) {
  const raw = await serverFetch(`qualifying-results-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`, {
    tag: sessionTag(year, gp, session),
    fresh: opts.fresh,
  })
  return pickArray<{ Driver: string; LapTime: string; LapTimeDelta: number }>(raw)
}
