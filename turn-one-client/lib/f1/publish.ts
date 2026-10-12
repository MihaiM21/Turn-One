// Publishing finished F1 sessions to the SEO pages as soon as the F1 API has them.
//
// The /f1 pages are ISR and are rendered on first request (nothing is
// prerendered at build, so a build never depends on the F1 API). A session that
// hasn't been published yet is a 404, and without help a freshly finished
// session would stay one until its page's revalidate window ran out. This
// module closes that gap:
//
//   sweep()   — every session that is still waiting for data, or finished in
//               the last 72 h: probe the F1 API (uncached); if results exist
//               and we haven't published it yet, publish it.
//   publish() — expire the session's data tag and the season catalog, mark its
//               page, event hub, year hub, the /f1 index and the landing page
//               for revalidation, then (after the response) warm them so the
//               first real visitor gets the fresh render.
//
// Triggered by POST /api/revalidate/sessions (the .NET API calls it every few
// minutes; the external F1 API can call it with a specific session when its
// ingestion finishes). Server-only.

import { revalidatePath, revalidateTag } from "next/cache"
import { after } from "next/server"
import { ageMs } from "@/lib/f1/cache-policy"
import { catalogTag, eventRef, findInCatalog, getSeasonCatalog, invalidateCatalog, type CatalogEvent, type CatalogSession } from "@/lib/f1/catalog"
import { eventPath, sessionPath, yearPath, type SeoSessionSlug } from "@/lib/f1/session-manifest"
import { fetchSessionResults, sessionTag } from "@/lib/plots/server-fetch"

export type SessionKey = { year: string; event: string; session: SeoSessionSlug }
export type PublishOutcome = "published" | "already-published" | "pending" | "unknown-session" | "error"

const RECENT_MS = 72 * 60 * 60 * 1000

/**
 * Sessions published by this server process. Keeps each sweep to a probe of the
 * sessions still waiting for data. Lost on restart, which costs one redundant
 * (harmless) publish per recent session.
 */
const published = new Set<string>()
const keyOf = (k: SessionKey) => `${k.year}/${k.event}/${k.session}`

/** Sessions worth probing now: still waiting for data, or finished recently and not yet published. */
export async function sweepCandidates(now = new Date()): Promise<SessionKey[]> {
  const year = now.getUTCFullYear()
  const cat = await getSeasonCatalog(year)
  const out: SessionKey[] = []
  for (const { event, sessions } of cat.events) {
    for (const s of sessions) {
      const key: SessionKey = { year: String(year), event: event.slug, session: s.slug }
      const age = ageMs(s.end, now.getTime())
      const recent = age != null && age >= 0 && age <= RECENT_MS
      if (s.status === "pending" || (s.status === "final" && recent)) out.push(key)
    }
  }
  return out
}

/** Probe one session and publish it if its data has appeared. */
export async function publishIfReady(k: SessionKey, origin: string): Promise<PublishOutcome> {
  let found: ReturnType<typeof findInCatalog>
  try {
    found = findInCatalog(await getSeasonCatalog(Number(k.year)), k.event, k.session)
  } catch (e) {
    console.error("[f1-publish] catalog unavailable", e)
    return "error"
  }
  if (!found?.session) return "unknown-session"
  if (published.has(keyOf(k))) return "already-published"
  const { session } = found
  if (session.status === "upcoming" || session.status === "suspect") return "pending"

  const probe = await fetchSessionResults(eventRef(found.entry.event), session.code, { fresh: true })
  if (probe.kind === "transient") return "error"
  if (probe.kind !== "ok") return "pending"
  publish(k, found.entry.event, session, origin)
  return "published"
}

function publish(k: SessionKey, ev: CatalogEvent, session: CatalogSession, origin: string) {
  // expire now (not stale-while-revalidate): the stale value is the "no data" response
  revalidateTag(sessionTag(eventRef(ev), session.code), { expire: 0 })
  revalidateTag(catalogTag(ev.year), { expire: 0 })
  invalidateCatalog(ev.year)
  const paths = [sessionPath(k.year, k.event, k.session), eventPath(k.year, k.event), yearPath(k.year), "/f1", "/"]
  for (const p of paths) revalidatePath(p)
  published.add(keyOf(k))
  console.info(`[f1-publish] published ${keyOf(k)}`)
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
  const candidates = await sweepCandidates(now)
  // Sequential: a publish invalidates the shared catalog, and each probe is one cheap call.
  const results: (SessionKey & { outcome: PublishOutcome })[] = []
  for (const k of candidates) results.push({ ...k, outcome: await publishIfReady(k, origin) })
  return results
}
