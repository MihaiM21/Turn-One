import { grandPrixCalendar, type GrandPrix } from "@/lib/constants/grand-prix"

// Only Qualifying and Race: the only two session types every one of the
// three SHAREABLE_PLOTS supports (session_results doesn't cover Practice).
export const SEO_SESSIONS = [
  { slug: "qualifying", name: "Qualifying", code: "Q" },
  { slug: "race", name: "Race", code: "R" },
] as const

export type SeoSessionSlug = (typeof SEO_SESSIONS)[number]["slug"]

export function eventSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/grand prix/i, "gp")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export interface SessionManifestEntry {
  year: string
  event: string // slug
  session: SeoSessionSlug
}

export function buildManifest(): SessionManifestEntry[] {
  const entries: SessionManifestEntry[] = []
  for (const year of Object.keys(grandPrixCalendar)) {
    const races = grandPrixCalendar[year]?.races ?? []
    for (const gp of races) {
      for (const session of SEO_SESSIONS) {
        entries.push({ year, event: eventSlug(gp.name), session: session.slug })
      }
    }
  }
  return entries
}

export function findGrandPrix(year: string, slug: string): GrandPrix | undefined {
  const races = grandPrixCalendar[year]?.races ?? []
  return races.find((gp) => eventSlug(gp.name) === slug)
}

export function findSession(slug: string) {
  return SEO_SESSIONS.find((s) => s.slug === slug)
}

/** All events for a year, in calendar order — for building prev/next + index links. */
export function eventsForYear(year: string): GrandPrix[] {
  return grandPrixCalendar[year]?.races ?? []
}
