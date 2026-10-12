// Pure naming + routing rules for the public /f1/{year}/{event}/{session} pages.
// What actually exists (events, sprint weekends, data) comes from lib/f1/catalog.ts.

/** Session types with a public page. Codes are what the F1 API expects as `session=`. */
export const SEO_SESSIONS = [
  { slug: "qualifying", name: "Qualifying", code: "Q", apiName: "Qualifying" },
  { slug: "race", name: "Race", code: "R", apiName: "Race" },
  { slug: "sprint-qualifying", name: "Sprint Qualifying", code: "SQ", apiName: "Sprint Qualifying" },
  { slug: "sprint", name: "Sprint", code: "S", apiName: "Sprint" },
] as const

export type SeoSession = (typeof SEO_SESSIONS)[number]
export type SeoSessionSlug = SeoSession["slug"]

export const FIRST_SUPPORTED_YEAR = 2025

/** Seasons the F1 API covers (2025 onwards), newest first. */
export function supportedYears(now = new Date()): number[] {
  const years: number[] = []
  for (let y = now.getUTCFullYear(); y >= FIRST_SUPPORTED_YEAR; y--) years.push(y)
  return years
}

export function isSupportedYear(year: string, now = new Date()): boolean {
  return /^\d{4}$/.test(year) && supportedYears(now).includes(Number(year))
}

export function findSession(slug: string): SeoSession | undefined {
  return SEO_SESSIONS.find((s) => s.slug === slug)
}

export function findSessionByApiName(name: string): SeoSession | undefined {
  return SEO_SESSIONS.find((s) => s.apiName === name)
}

/** "São Paulo Grand Prix" -> "sao-paulo-gp". Accents are folded, not turned into hyphens. */
export function eventSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/grand prix/i, "gp")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Slugs that earlier versions of the site generated, mapped to today's. Only
 * consulted when the requested slug isn't an event of that year, so a current
 * slug is never shadowed. Lets old links and the old sitemap 308 instead of 404.
 */
export const LEGACY_EVENT_SLUGS: Record<string, string> = {
  "gran-premio-de-barcelona-catalunya": "barcelona-gp",
  "s-o-paulo-gp": "sao-paulo-gp",
  "monza-gp": "italian-gp",
  "mexico-gp": "mexico-city-gp",
  "brazil-gp": "sao-paulo-gp",
}

export function canonicalEventSlug(slug: string): string | undefined {
  return LEGACY_EVENT_SLUGS[slug]
}

export const sessionPath = (year: number | string, event: string, session: string) => `/f1/${year}/${event}/${session}`
export const eventPath = (year: number | string, event: string) => `/f1/${year}/${event}`
export const yearPath = (year: number | string) => `/f1/${year}`
