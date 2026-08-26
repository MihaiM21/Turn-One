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

async function serverFetch(endpoint: string): Promise<unknown> {
  const res = await fetch(`${apiBase()}/v2/${endpoint}`, {
    headers: { "X-API-Key": process.env.F1_API_KEY ?? "" },
    // Finished sessions never change, but a shared cache profile keeps this
    // simple; revalidating daily is cheap relative to a full rebuild.
    next: { revalidate: ONE_DAY },
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
  const raw = await serverFetch(`top-speed-telemetry-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`)
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
  const raw = await serverFetch(`throttle-comparison-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`)
  const dict = raw as Record<string, { Driver: string; "Average Throttle (%)": number; Color: string }> | unknown[]
  const list = Array.isArray(dict)
    ? (dict as Array<{ Driver: string; "Average Throttle (%)": number; Color: string }>)
    : Object.values(dict)
  return list.map((item) => ({ driver: item.Driver, throttle: item["Average Throttle (%)"], color: item.Color }))
}

export async function serverFetchSessionResults(year: number, gp: string, session: string) {
  const raw = await serverFetch(`qualifying-results-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`)
  return pickArray<{ Driver: string; LapTime: string; LapTimeDelta: number }>(raw)
}
