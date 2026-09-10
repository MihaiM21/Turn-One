/**
 * Cache freshness policy for the external F1 stats API.
 *
 * The domain insight this is built on: **a finished F1 session's data never
 * changes.** Everything in the app previously cached by wall-clock TTL (or not
 * at all), which is the wrong axis — a 2023 qualifying lap is as immutable as
 * data gets, while the current session's dashboard is stale in seconds.
 *
 * Classification is a pure function of the request path and query, so both the
 * server proxy (app/api/[...endpoint]/route.ts) and the client request cache
 * (lib/cache/request-cache.ts) derive identical policy from the same input.
 */
import { lookupSessionFreshness } from "./session-clock"

export type FreshnessTier = "static" | "schedule" | "standings" | "finished" | "live" | "unknown" | "never"

export interface TierPolicy {
  tier: FreshnessTier
  /** Client request-cache TTL, seconds. */
  ttl: number
  /** Shared/CDN cache lifetime (s-maxage), seconds. 0 means no-store. */
  sharedTtl: number
  /** stale-while-revalidate window, seconds. */
  swr: number
  /** Whether the client request cache may store this response at all. */
  cacheable: boolean
}

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const POLICIES = {
  /** Reference data (driver/team lists and colours) — changes a few times a season. */
  static: { tier: "static", ttl: DAY, sharedTtl: DAY, swr: 7 * DAY, cacheable: true },
  /**
   * Current-season schedule. Deliberately short: event and session lists shift
   * during a live race weekend, and fetchEventsByYear previously used
   * `cache: 'no-store'` for exactly that reason. Five minutes still collapses
   * the request burst and repeated mounts without ever showing a stale weekend.
   */
  scheduleCurrent: { tier: "schedule", ttl: 5 * MINUTE, sharedTtl: 5 * MINUTE, swr: 10 * MINUTE, cacheable: true },
  /** Past-season schedule — settled history. */
  schedulePast: { tier: "schedule", ttl: 30 * DAY, sharedTtl: 30 * DAY, swr: DAY, cacheable: true },
  /** Standings move once per race weekend. */
  standingsCurrent: { tier: "standings", ttl: HOUR, sharedTtl: HOUR, swr: 2 * HOUR, cacheable: true },
  /** A session that has ended: immutable. */
  finished: { tier: "finished", ttl: 30 * DAY, sharedTtl: 7 * DAY, swr: 30 * DAY, cacheable: true },
  /** Current or just-finished session. */
  live: { tier: "live", ttl: 30, sharedTtl: 30, swr: MINUTE, cacheable: true },
  /** Unclassified — preserves the pre-existing proxy behaviour exactly. */
  unknown: { tier: "unknown", ttl: 0, sharedTtl: MINUTE, swr: 2 * MINUTE, cacheable: false },
  /** Must never be cached anywhere (analytics writes, unknown mutations). */
  never: { tier: "never", ttl: 0, sharedTtl: 0, swr: 0, cacheable: false },
} as const satisfies Record<string, TierPolicy>

/** Strips the leading proxy base and any version prefix, returning path + query. */
function normalise(endpointWithQuery: string): { path: string; query: URLSearchParams } {
  const withoutBase = endpointWithQuery.replace(/^\/?api\//, "").replace(/^\/+/, "")
  const [rawPath, rawQuery = ""] = withoutBase.split("?")
  // v1/ and v2/ are transport versions, not resources — classify on the resource.
  const path = rawPath.replace(/^v[12]\//, "")
  return { path, query: new URLSearchParams(rawQuery) }
}

export function classify(
  endpointWithQuery: string,
  opts: { now?: number; currentYear?: number } = {},
): TierPolicy {
  const now = opts.now ?? Date.now()
  const currentYear = opts.currentYear ?? new Date(now).getFullYear()
  const { path, query } = normalise(endpointWithQuery)

  // Usage analytics — never cacheable.
  if (path.startsWith("analytics/")) return POLICIES.never

  // Reference data.
  if (path.startsWith("static/")) return POLICIES.static

  // The latest-session dashboard is the definition of "live".
  if (path === "dashboard") return POLICIES.live

  // Season-scoped resources carry the year in the path rather than the query.
  // Both spellings are in use: `seasons/{year}/...` for schedule and
  // teammate data, `season/{year}/...` for season driver/team aggregates.
  const seasonMatch = path.match(/^seasons?\/(\d{4})(?:\/(.*))?$/)
  if (seasonMatch) {
    const year = Number(seasonMatch[1])
    const rest = seasonMatch[2] ?? ""
    const isSchedule = rest === "events" || /^events\/[^/]+\/sessions$/.test(rest)
    if (year < currentYear) return isSchedule ? POLICIES.schedulePast : POLICIES.finished
    return isSchedule ? POLICIES.scheduleCurrent : POLICIES.standingsCurrent
  }

  if (path.startsWith("standings/")) {
    const year = Number(query.get("year"))
    if (Number.isFinite(year) && year > 0 && year < currentYear) return POLICIES.finished
    return POLICIES.standingsCurrent
  }

  // The large family of per-session plot endpoints: `<name>-data?year&gp&session`.
  const year = Number(query.get("year"))
  if (Number.isFinite(year) && year > 0) {
    // A past season is unambiguously over — no session clock needed.
    if (year < currentYear) return POLICIES.finished

    const gp = query.get("gp")
    const session = query.get("session")
    if (gp && session) {
      const freshness = lookupSessionFreshness(year, gp, session, now)
      if (freshness === "finished") return POLICIES.finished
      if (freshness === "live") return POLICIES.live
    }
  }

  return POLICIES.unknown
}

/** Builds the `Cache-Control` response header for a policy. */
export function cacheControlFor(policy: TierPolicy): string {
  if (policy.sharedTtl <= 0) return "no-store"
  return `public, s-maxage=${policy.sharedTtl}, stale-while-revalidate=${policy.swr}`
}

/** The header for anything that must not be cached (errors, timeouts). */
export const NO_STORE = "no-store"
