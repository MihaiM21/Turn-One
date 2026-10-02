// Publishing finished F1 sessions to the SEO pages as soon as the F1 API has them.
//
// The /f1/{year}/{event}/{session} pages are ISR (revalidate: 1 day) and are
// prerendered at build time — before most sessions have happened — so a new
// session's page starts life as a cached 404, and without help would stay one
// for up to a day after the data lands. This module closes that gap:
//
//   sweep()   — every Qualifying/Race whose scheduled end is in the last 72 h:
//               probe the F1 API (uncached); if results exist and we haven't
//               published it yet, publish it.
//   publish() — expire the session's data tag, mark its page + the landing
//               page + the /f1 index for revalidation, then (after the response)
//               warm them so the first real visitor gets the fresh render.
//
// Triggered by POST /api/revalidate/sessions (the .NET API calls it every few
// minutes; the external F1 API can call it with a specific session when its
// ingestion finishes). Server-only.

import { revalidatePath, revalidateTag } from "next/cache"
import { after } from "next/server"
import { f1_2025_races, f1_2026_races } from "@/lib/constants/f1_races"
import { eventSlug, findGrandPrix, findSession, type SeoSessionSlug } from "@/lib/f1/session-manifest"
import { serverFetchSessionResults, sessionTag } from "@/lib/plots/server-fetch"

export type SessionKey = { year: string; event: string; session: SeoSessionSlug }
export type PublishOutcome = "published" | "already-published" | "pending" | "unknown-session" | "error"

type CalSession = { name: string; startTime: Date; endTime: Date }
type CalRace = { grandPrix: string; cancelled: boolean; sessions: CalSession[] }

const CALENDARS = { "2025": f1_2025_races, "2026": f1_2026_races } as unknown as Record<string, CalRace[]>
const SESSION_BY_NAME: Record<string, SeoSessionSlug> = { Qualifying: "qualifying", Race: "race" }
const WINDOW_MS = 72 * 60 * 60 * 1000

/**
 * Sessions published by this server process. Keeps each sweep to a probe of the
 * sessions still waiting for data. Lost on restart, which costs one redundant
 * (harmless) publish per recent session.
 */
const published = new Set<string>()
const keyOf = (k: SessionKey) => `${k.year}/${k.event}/${k.session}`
export const sessionPath = (k: SessionKey) => `/f1/${keyOf(k)}`

/** Qualifying and Race sessions whose scheduled end falls in the last 72 h. */
export function recentSessions(now = new Date()): SessionKey[] {
  const out: SessionKey[] = []
  for (const [year, races] of Object.entries(CALENDARS)) {
    for (const race of races) {
      if (race.cancelled) continue
      for (const s of race.sessions) {
        const slug = SESSION_BY_NAME[s.name]
        if (!slug) continue
        const age = now.getTime() - s.endTime.getTime()
        if (age >= 0 && age <= WINDOW_MS) out.push({ year, event: eventSlug(race.grandPrix), session: slug })
      }
    }
  }
  return out
}

function resolve(k: SessionKey) {
  const gp = findGrandPrix(k.year, k.event)
  const s = findSession(k.session)
  return gp && s ? { gpName: gp.name, code: s.code } : null
}

/**
 * Whether the F1 API has results for a session. `fresh` skips Next's data cache
 * (for probing); without it this reads the same cached, tagged response the
 * pages use. `null` means the API isn't configured or didn't answer.
 */
export async function hasResults(year: number, gpName: string, code: string, fresh = false): Promise<boolean | null> {
  if (!process.env.F1_API_URL) return null
  try {
    return (await serverFetchSessionResults(year, gpName, code, { fresh })).length > 0
  } catch {
    return null
  }
}

/** Probe one session and publish it if its data has appeared. */
export async function publishIfReady(k: SessionKey, origin: string): Promise<PublishOutcome> {
  const r = resolve(k)
  if (!r) return "unknown-session"
  if (published.has(keyOf(k))) return "already-published"
  const ready = await hasResults(Number(k.year), r.gpName, r.code, true)
  if (ready === null) return "error"
  if (!ready) return "pending"
  publish(k, r.gpName, r.code, origin)
  return "published"
}

function publish(k: SessionKey, gpName: string, code: string, origin: string) {
  // expire now (not stale-while-revalidate): the stale value is the "no data" response
  revalidateTag(sessionTag(Number(k.year), gpName, code), { expire: 0 })
  const paths = [sessionPath(k), "/", "/f1"]
  for (const p of paths) revalidatePath(p)
  published.add(keyOf(k))
  // The page render happens on the next visit; make that visit ours rather than
  // a searcher's. A route handler's revalidations are only applied once it has
  // returned, so warm from after() — and give the invalidation a moment to land.
  after(async () => {
    await new Promise((r) => setTimeout(r, 2_000))
    await Promise.allSettled(
      paths.map((p) => fetch(new URL(p, origin), { cache: "no-store", signal: AbortSignal.timeout(20_000) })),
    )
  })
}

export async function sweep(origin: string, now = new Date()) {
  const results = await Promise.all(
    recentSessions(now).map(async (k) => ({ ...k, outcome: await publishIfReady(k, origin) })),
  )
  return results
}
