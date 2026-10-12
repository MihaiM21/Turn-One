// The one place that knows which F1 sessions exist, when they ran, and whether
// the API has trustworthy data for them. The /f1 index, the hub pages, the
// session pages, the sitemap, the landing page and the publish sweep all read
// from here, so "is this page real?" has a single answer.
//
//   events     <- GET /v2/seasons/{year}/events           (what the API knows about)
//   sessions   <- GET /v2/seasons/{year}/events/{key}/sessions  (Q/R/Sprint/SQ + times)
//   data       <- GET /v2/qualifying-results-data         (probed to decide final vs pending)
//
// A session is `final` only when it has results AND those results aren't a copy
// of an earlier event's (lib/f1/integrity.ts). Anything else gets no link, no
// sitemap entry and a real 404 — and heals by itself once the API is fixed.

import { cache } from "react"
import { apiGet, mapLimit } from "@/lib/f1/api"
import { definitelyFuture, ttlSeconds } from "@/lib/f1/cache-policy"
import { findCopied } from "@/lib/f1/integrity"
import { classifyResponse } from "@/lib/f1/outcome"
import { SEO_SESSIONS, eventSlug, findSessionByApiName, type SeoSessionSlug } from "@/lib/f1/session-manifest"
import { fetchSessionResults, type ResultRow } from "@/lib/plots/server-fetch"

const CATALOG_TTL = 6 * 60 * 60
const CONCURRENCY = 4

export const catalogTag = (year: number) => `f1-catalog:${year}`

export interface CatalogEvent {
  year: number
  key: number
  round: number
  apiName: string
  officialName: string
  slug: string
  name: string // display name
  location: string
  country: string
  note?: string
}

export interface CatalogSession {
  slug: SeoSessionSlug
  code: string
  name: string
  start: string | null // track-local, no offset (see cache-policy.ts)
  end: string | null
}

export type SessionStatus = "final" | "upcoming" | "pending" | "suspect" | "error"

export interface SeasonSession extends CatalogSession {
  status: SessionStatus
  results: ResultRow[] | null
}
export interface SeasonEvent {
  event: CatalogEvent
  sessions: SeasonSession[]
}
export interface SeasonCatalog {
  year: number
  events: SeasonEvent[]
}

/**
 * Where the API's own labels are wrong. The Sepang round is listed as
 * "Bahrain Grand Prix", country "Bahrain", location "Kuala Lumpur" (the 2026
 * Bahrain round was cancelled and run in Malaysia instead — see the 2026
 * calendar note in lib/constants/f1_races.ts).
 */
const EVENT_OVERRIDES: Record<string, Partial<Pick<CatalogEvent, "name" | "location" | "country" | "note">>> = {
  "2026:1308": {
    name: "Bahrain Grand Prix (Sepang)",
    location: "Sepang",
    country: "Malaysia",
    note: "The 2026 Bahrain Grand Prix was run at Sepang International Circuit in Malaysia after the original Bahrain round was cancelled.",
  },
}

export class UpstreamUnavailableError extends Error {
  constructor(what: string, detail?: string) {
    super(`F1 API unavailable (${what})${detail ? `: ${detail}` : ""}`)
    this.name = "UpstreamUnavailableError"
  }
}

interface RawEvent {
  name: string
  official_name: string
  location: string
  country: string
  key: number
}

export const getSeasonEvents = cache(async (year: number): Promise<CatalogEvent[]> => {
  const res = await apiGet(`seasons/${year}/events`, { revalidate: CATALOG_TTL, tags: [catalogTag(year)] })
  const o = classifyResponse(res)
  if (o.kind === "transient") throw new UpstreamUnavailableError(`events ${year}`, o.detail)
  if (o.kind !== "ok") return []
  const raw = (o.data as { events?: RawEvent[] }).events ?? []
  return raw
    .filter((e) => typeof e?.key === "number" && typeof e.name === "string" && !/testing/i.test(e.name))
    .map((e, i) => ({
      year,
      key: e.key,
      round: i + 1,
      apiName: e.name,
      officialName: e.official_name,
      slug: eventSlug(e.name),
      name: e.name,
      location: e.location,
      country: e.country,
      ...EVENT_OVERRIDES[`${year}:${e.key}`],
    }))
})

export const getEventSessions = cache(async (ev: CatalogEvent): Promise<CatalogSession[]> => {
  const res = await apiGet(`seasons/${ev.year}/events/${ev.key}/sessions`, { revalidate: CATALOG_TTL, tags: [catalogTag(ev.year)] })
  const o = classifyResponse(res)
  if (o.kind === "transient") throw new UpstreamUnavailableError(`sessions ${ev.year}/${ev.key}`, o.detail)
  if (o.kind !== "ok") return []
  const raw = (o.data as { sessions?: { name: string; start_date?: string; end_date?: string }[] }).sessions ?? []
  const out: CatalogSession[] = []
  for (const s of raw) {
    const known = findSessionByApiName(s.name)
    if (known) out.push({ slug: known.slug, code: known.code, name: known.name, start: s.start_date ?? null, end: s.end_date ?? null })
  }
  // calendar order: Sprint Qualifying, Sprint, Qualifying, Race
  const order = SEO_SESSIONS.map((s) => s.slug)
  return out.sort((a, b) => (a.start && b.start ? a.start.localeCompare(b.start) : order.indexOf(a.slug) - order.indexOf(b.slug)))
})

export const eventRef = (ev: CatalogEvent) => ({ year: ev.year, key: ev.key })

/**
 * Every event of a season with the status of each public session. Results for
 * finished sessions are carried along (the pages need them anyway) and are
 * served from Next's data cache, so a warm call costs no upstream traffic.
 */
export const getSeasonCatalog = cache(async (year: number): Promise<SeasonCatalog> => {
  const events = await getSeasonEvents(year)
  const sessionLists = await mapLimit(events, CONCURRENCY, (ev) => getEventSessions(ev))

  const flat = events.flatMap((event, ei) => sessionLists[ei].map((s) => ({ event, s })))
  const probes = await mapLimit(flat, CONCURRENCY, async ({ event, s }) =>
    definitelyFuture(s.start) ? null : fetchSessionResults(eventRef(event), s.code, { ttl: ttlSeconds(s.end) }),
  )
  if (probes.length && probes.every((p) => p?.kind === "transient")) {
    throw new UpstreamUnavailableError(`results ${year}`, "every probe failed")
  }

  const status = new Map<string, SeasonSession>()
  const keyOf = (ev: CatalogEvent, code: string) => `${ev.key}:${code}`
  flat.forEach(({ event, s }, i) => {
    const p = probes[i]
    const base: SeasonSession = { ...s, status: "upcoming", results: null }
    if (p === null) {
      /* definitely in the future */
    } else if (p.kind === "ok") {
      base.status = "final"
      base.results = p.data
    } else if (p.kind === "transient") {
      base.status = "error"
    } else {
      base.status = "pending"
    }
    status.set(keyOf(event, s.code), base)
  })

  // Integrity: per session type, in calendar order, flag results copied from an earlier event.
  for (const { code } of SEO_SESSIONS) {
    const entries = events
      .map((event) => ({ key: keyOf(event, code), rows: status.get(keyOf(event, code)) }))
      .filter((e): e is { key: string; rows: SeasonSession } => e.rows?.status === "final" && !!e.rows.results)
      .map((e) => ({ key: e.key, rows: e.rows.results as ResultRow[] }))
    for (const key of findCopied(entries).keys()) {
      const s = status.get(key)
      if (s) {
        s.status = "suspect"
        s.results = null
      }
    }
  }

  return {
    year,
    events: events.map((event, ei) => ({
      event,
      sessions: sessionLists[ei].map((s) => status.get(keyOf(event, s.code)) as SeasonSession),
    })),
  }
})

/** Resolve a URL's {event, session} against a season catalog. */
export function findInCatalog(cat: SeasonCatalog, eventSlugParam: string, sessionSlug?: string) {
  const entry = cat.events.find((e) => e.event.slug === eventSlugParam)
  if (!entry) return null
  const session = sessionSlug ? entry.sessions.find((s) => s.slug === sessionSlug) : undefined
  return { entry, session }
}

export const finalSessions = (entry: SeasonEvent) => entry.sessions.filter((s) => s.status === "final")

/**
 * Hubs 404 when an event has nothing published — unless a probe merely failed,
 * in which case the page must error (and ISR keep the old one) rather than cache a 404.
 */
export function assertPublished(entry: SeasonEvent) {
  if (finalSessions(entry).length > 0) return true
  if (entry.sessions.some((s) => s.status === "error")) throw new UpstreamUnavailableError(entry.event.name, "results probe failed")
  return false
}
