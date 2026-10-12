// How long to keep an F1 API response, by how long ago the session ended.
//
// The API stamps even an empty `[]` for a not-yet-run session with
// `Cache-Control: immutable, max-age=86400`, and Next caches any 200 — so a
// "no data yet" answer would otherwise sit for a day after the data lands.
// Recent sessions therefore get a short TTL; the sweep (lib/f1/publish.ts)
// also expires them by tag the moment data appears.

const HOUR = 60 * 60
const DAY = 24 * HOUR

/**
 * Session times from the sessions endpoint are track-local with no offset
 * (e.g. "2026-03-28T15:00:00" for a Suzuka session). Local offsets span about
 * UTC-12..UTC+14, so reading them as UTC is off by at most that much.
 */
const MAX_OFFSET_MS = 14 * HOUR * 1000

export function parseNaive(iso: string | null | undefined): number | null {
  if (!iso) return null
  const t = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`)
  return Number.isNaN(t) ? null : t
}

/** True only when the session cannot have started yet, whatever the local offset. */
export function definitelyFuture(start: string | null | undefined, now = Date.now()): boolean {
  const t = parseNaive(start)
  return t != null && t - MAX_OFFSET_MS > now
}

export function ageMs(end: string | null | undefined, now = Date.now()): number | null {
  const t = parseNaive(end)
  return t == null ? null : now - t
}

/** Seconds for Next's `revalidate`. */
export function ttlSeconds(end: string | null | undefined, now = Date.now()): number {
  const age = ageMs(end, now)
  if (age == null || age < 3 * DAY * 1000) return 5 * 60
  if (age < 30 * DAY * 1000) return HOUR
  return 6 * HOUR
}
