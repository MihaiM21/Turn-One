/**
 * A tiny, best-effort registry of "when did this session start?".
 *
 * The cache policy (lib/cache/f1-freshness.ts) needs to know whether a session
 * of the *current* season has already finished, because a finished session's
 * data never changes and can be cached hard. Nothing in a plot request carries
 * that timestamp, but the app already fetches it: the sessions-by-event
 * response includes `start_date`, and useGeneratorCore loads it before any plot
 * can be generated for that event.
 *
 * The sessions endpoint returns both `start_date` and `end_date`; the end time
 * is used directly when present, falling back to start-plus-a-generous-runtime
 * otherwise.
 *
 * Rather than thread a timestamp through all 26 PlotDefinition.fetch()
 * closures, callers record what they already know here and the classifier reads
 * it out of band. This is deliberately a *hint*: a miss returns "unknown", which
 * falls back to the conservative pre-existing cache behaviour. Erring toward
 * "unknown" is the safe direction — mislabelling a live session as finished
 * would pin stale data for days, while mislabelling a finished session as
 * unknown only costs a missed cache opportunity.
 */

/** Hours after lights-out before a session is certainly over, by session code. */
const SESSION_DURATION_HOURS: Record<string, number> = {
  R: 3.5,
  S: 1.5,
  SQ: 2,
  Q: 2,
}
const DEFAULT_DURATION_HOURS = 2

/** Session code -> the moment it is certainly over (epoch ms). */
const endTimes = new Map<string, number>()

/**
 * Normalises the event portion of a key. Callers identify an event
 * inconsistently — the generator passes an event name (sometimes URL-encoded),
 * the news page passes a round number — so anything that doesn't match simply
 * misses and degrades to "unknown".
 */
function eventKey(gp: string | number): string {
  const raw = String(gp)
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    /* malformed escape sequence — use the raw value */
  }
  return decoded.trim().toLowerCase()
}

function key(year: number, gp: string | number, sessionCode: string): string {
  return `${year}:${eventKey(gp)}:${sessionCode.trim().toUpperCase()}`
}

/**
 * Records when a session finishes. Prefers the upstream `end_date`; when only a
 * start time is known, adds a generous per-session runtime so we never call a
 * session finished while it might still be running. Unparseable dates are
 * ignored, leaving the session "unknown".
 */
export function recordSessionEnd(
  year: number,
  gp: string | number,
  sessionCode: string,
  dates: { startDate?: string; endDate?: string },
): void {
  const code = sessionCode.trim().toUpperCase()

  const end = dates.endDate ? new Date(dates.endDate).getTime() : NaN
  if (Number.isFinite(end)) {
    endTimes.set(key(year, gp, code), end)
    return
  }

  const start = dates.startDate ? new Date(dates.startDate).getTime() : NaN
  if (!Number.isFinite(start)) return
  const runtimeMs = (SESSION_DURATION_HOURS[code] ?? DEFAULT_DURATION_HOURS) * 3_600_000
  endTimes.set(key(year, gp, code), start + runtimeMs)
}

export type SessionFreshness = "finished" | "live" | "unknown"

/**
 * Best-effort: has this session finished? "unknown" when we were never told
 * about it, which callers treat as "cache conservatively".
 *
 * A settling margin is applied after the flag falls, because timing data is
 * published a little after a session actually ends.
 */
const PUBLISH_SETTLE_MS = 30 * 60_000

export function lookupSessionFreshness(
  year: number,
  gp: string | number,
  sessionCode: string,
  now: number = Date.now(),
): SessionFreshness {
  const end = endTimes.get(key(year, gp, sessionCode))
  if (end == null) return "unknown"
  return now > end + PUBLISH_SETTLE_MS ? "finished" : "live"
}

/** Test seam. */
export function __clearSessionClock(): void {
  endTimes.clear()
}
