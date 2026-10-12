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
import { classifyResponse, type Outcome } from "@/lib/f1/outcome"
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

type Probe = Outcome<ResultRow[]> | null // null: definitely in the future, not probed
type Slot = { event: CatalogEvent; s: CatalogSession }

const keyOf = (ev: CatalogEvent, code: string) => `${ev.key}:${code}`

/** Status of every slot from its probe, including the copied-results check. */
function assess(events: CatalogEvent[], slots: Slot[], probes: Probe[]): Map<string, SeasonSession> {
  const status = new Map<string, SeasonSession>()
  slots.forEach(({ event, s }, i) => {
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
      .map((event) => ({ key: keyOf(event, code), session: status.get(keyOf(event, code)) }))
      .filter((e): e is { key: string; session: SeasonSession } => e.session?.status === "final" && !!e.session.results)
      .map((e) => ({ key: e.key, rows: e.session.results as ResultRow[] }))
    for (const key of findCopied(entries).keys()) {
      const s = status.get(key)
      if (s) {
        s.status = "suspect"
        s.results = null
      }
    }
  }
  return status
}

async function buildCatalog(year: number, previous?: SeasonCatalog): Promise<SeasonCatalog> {
  const events = await getSeasonEvents(year)
  const sessionLists = await mapLimit(events, CONCURRENCY, (ev) => getEventSessions(ev))
  const slots: Slot[] = events.flatMap((event, ei) => sessionLists[ei].map((s) => ({ event, s })))

  const probes: Probe[] = await mapLimit(slots, CONCURRENCY, async ({ event, s }) =>
    definitelyFuture(s.start) ? null : fetchSessionResults(eventRef(event), s.code, { ttl: ttlSeconds(s.end) }),
  )
  if (probes.length && probes.every((p) => p?.kind === "transient")) {
    throw new UpstreamUnavailableError(`results ${year}`, "every probe failed")
  }

  // A probe that merely failed keeps what we last knew, instead of dropping a
  // published session from the index for a blip.
  const lastKnown = new Map<string, SeasonSession>()
  for (const e of previous?.events ?? []) for (const s of e.sessions) if (s.status === "final") lastKnown.set(keyOf(e.event, s.code), s)
  slots.forEach(({ event, s }, i) => {
    const prev = lastKnown.get(keyOf(event, s.code))
    if (probes[i]?.kind === "transient" && prev?.results) probes[i] = { kind: "ok", data: prev.results }
  })

  let status = assess(events, slots, probes)

  // Anything not published yet is probed again, bypassing the data cache. Cached
  // answers for finished sessions live up to an hour, and a stale empty or a
  // stale copy (from before the API was fixed) would otherwise keep a session
  // hidden long after the API serves it correctly.
  const redo = slots
    .map((slot, i) => ({ slot, i }))
    .filter(({ slot, i }) => probes[i] !== null && ["pending", "suspect"].includes(status.get(keyOf(slot.event, slot.s.code))?.status ?? ""))
  if (redo.length) {
    await mapLimit(redo, CONCURRENCY, async ({ slot, i }) => {
      const fresh = await fetchSessionResults(eventRef(slot.event), slot.s.code, { fresh: true })
      if (fresh.kind !== "transient") probes[i] = fresh
    })
    status = assess(events, slots, probes)
  }

  return {
    year,
    events: events.map((event, ei) => ({
      event,
      sessions: sessionLists[ei].map((s) => status.get(keyOf(event, s.code)) as SeasonSession),
    })),
  }
}

// One catalog build is ~100 upstream calls when the cache is cold, and every
// page render wants it. Share it process-wide (globalThis, because route
// bundles can each get their own copy of this module): concurrent renders join
// one in-flight build instead of each firing their own burst at the API, and a
// failed refresh keeps serving the last good catalog.
const MEMO_TTL_MS = 5 * 60 * 1000
type Memo = { at: number; value?: SeasonCatalog; inflight?: Promise<SeasonCatalog> }
const g = globalThis as unknown as { __f1CatalogMemo?: Map<number, Memo> }
const memo = (g.__f1CatalogMemo ??= new Map<number, Memo>())

/** Forget a season's catalog so the next read rebuilds it (used when a session is published). */
export function invalidateCatalog(year: number) {
  memo.delete(year)
}

/** A cold build is paced by the API's rate limit and can take minutes; a page render must not hang that long. */
const COLD_DEADLINE_MS = 25_000

function ensureCatalog(year: number): Promise<SeasonCatalog> | SeasonCatalog {
  const m: Memo = memo.get(year) ?? { at: 0 }
  memo.set(year, m)
  if (m.value && Date.now() - m.at < MEMO_TTL_MS) return m.value

  if (!m.inflight) {
    m.inflight = buildCatalog(year, m.value)
      .then((v) => {
        m.value = v
        m.at = Date.now()
        return v
      })
      .finally(() => {
        m.inflight = undefined
      })
    // Nobody may be awaiting a background refresh; its failure must not go unhandled.
    m.inflight.catch((e) => console.error(`[f1-catalog] refresh ${year} failed:`, e))
  }
  // Stale-while-revalidate: with a previous catalog, answer now and refresh behind it.
  return m.value ?? (m.inflight as Promise<SeasonCatalog>)
}

async function loadCatalog(year: number): Promise<SeasonCatalog> {
  const got = ensureCatalog(year)
  if (!(got instanceof Promise)) return got
  // No catalog yet: wait for the build, but not forever. It keeps running behind
  // this call, so the next render finds it ready (or still joins the same build).
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new UpstreamUnavailableError(`season ${year}`, "catalog is still warming up")), COLD_DEADLINE_MS)
  })
  try {
    return await Promise.race([got, deadline])
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Build the catalogs ahead of any visitor, newest season first. Runs at server
 * start (instrumentation.ts) and from the publish sweep, so a deploy's cold
 * cache is filled in the background within the API's rate limit.
 */
export async function warmCatalogs(years: number[]): Promise<void> {
  for (const year of years) {
    try {
      await ensureCatalog(year)
    } catch (e) {
      console.error(`[f1-catalog] warm ${year} failed:`, e)
    }
  }
}

/**
 * Every event of a season with the status of each public session. Results for
 * finished sessions are carried along (the pages need them anyway).
 */
export const getSeasonCatalog = cache(loadCatalog)

/** Resolve a URL's {event, session} against a season catalog. */
export function findInCatalog(cat: SeasonCatalog, eventSlugParam: string, sessionSlug?: string) {
  const entry = cat.events.find((e) => e.event.slug === eventSlugParam)
  if (!entry) return null
  const session = sessionSlug ? entry.sessions.find((s) => s.slug === sessionSlug) : undefined
  return { entry, session }
}

export const finalSessions = (entry: SeasonEvent) => entry.sessions.filter((s) => s.status === "final")

/**
 * For pages that list the whole season (index, sitemap, landing): refuse a
 * catalog in which some probe merely failed. Those pages are cached, and a
 * cached list with sessions missing for a blip is worse than the previous list
 * (or an error, which ISR answers with the previous list).
 */
export function assertComplete(cat: SeasonCatalog) {
  const failed = cat.events.flatMap((e) => e.sessions.filter((s) => s.status === "error").map((s) => `${e.event.name} ${s.name}`))
  if (failed.length) throw new UpstreamUnavailableError(`season ${cat.year}`, `${failed.length} results probe(s) failed, e.g. ${failed[0]}`)
  return cat
}

/**
 * Hubs 404 when an event has nothing published — unless a probe merely failed,
 * in which case the page must error (and ISR keep the old one) rather than cache a 404.
 */
export function assertPublished(entry: SeasonEvent) {
  if (finalSessions(entry).length > 0) return true
  if (entry.sessions.some((s) => s.status === "error")) throw new UpstreamUnavailableError(entry.event.name, "results probe failed")
  return false
}
