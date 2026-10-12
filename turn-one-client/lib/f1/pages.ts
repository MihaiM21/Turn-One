// Shared plumbing for the /f1 route files: load a season, resolve an event slug
// (redirecting legacy slugs), and the naming used in titles and headings.

import { cache } from "react"
import { notFound, permanentRedirect } from "next/navigation"
import { connection } from "next/server"
import { assertComplete, getSeasonCatalog, type CatalogEvent, type SeasonCatalog, type SeasonEvent } from "@/lib/f1/catalog"
import { canonicalEventSlug, isSupportedYear, supportedYears } from "@/lib/f1/session-manifest"

/** 404 for years the API doesn't cover, so crawlers can't make us probe arbitrary years. */
export const loadSeason = cache(async (yearParam: string): Promise<SeasonCatalog> => {
  if (!isSupportedYear(yearParam)) notFound()
  return getSeasonCatalog(Number(yearParam))
})

/**
 * The season catalogs for the index, sitemap and landing page. If the F1 API
 * can't be reached while `next build` is prerendering, opt the route out of
 * static generation instead of baking an empty page: it renders on request and
 * ISR takes over once the API answers.
 */
export async function loadSeasonsForStaticPage(): Promise<SeasonCatalog[]> {
  try {
    return (await Promise.all(supportedYears().map((y) => getSeasonCatalog(y)))).map(assertComplete)
  } catch (e) {
    if (process.env.NEXT_PHASE === "phase-production-build") await connection()
    throw e
  }
}

/** Like loadSeasonsForStaticPage, but a request-time API outage yields null (callers hide the section) instead of an error. */
export async function loadSeasonsOrNull(): Promise<SeasonCatalog[] | null> {
  try {
    return await loadSeasonsForStaticPage()
  } catch (e) {
    if (process.env.NEXT_PHASE === "phase-production-build") throw e // keep the route out of static generation
    console.error("[f1] seasons unavailable:", e)
    return null
  }
}

/**
 * Find the event for a URL slug. A slug an older version of the site generated
 * (e.g. s-o-paulo-gp) 308s to its current form; anything else is a 404.
 */
export function resolveEvent(cat: SeasonCatalog, slug: string, rebuild: (canonicalSlug: string) => string): SeasonEvent {
  const hit = cat.events.find((e) => e.event.slug === slug)
  if (hit) return hit
  const canonical = canonicalEventSlug(slug)
  if (canonical && cat.events.some((e) => e.event.slug === canonical)) permanentRedirect(rebuild(canonical))
  notFound()
}

/** "Singapore Grand Prix" -> "Singapore GP", for titles that have to stay short. */
export const shortName = (name: string) => name.replace(/Grand Prix/i, "GP")

export const eventTitle = (ev: CatalogEvent) => `${ev.name} ${ev.year}`

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })

/** "2026-03-28T15:00:00" -> "28 March 2026" (the date part is the track-local date). */
export function formatSessionDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : DATE.format(d)
}
