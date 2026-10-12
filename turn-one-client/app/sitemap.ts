import { MetadataRoute } from 'next'
import { connection } from 'next/server'
import { assertComplete, getSeasonCatalog, finalSessions } from '@/lib/f1/catalog'
import { parseNaive } from '@/lib/f1/cache-policy'
import { eventPath, sessionPath, supportedYears, yearPath } from '@/lib/f1/session-manifest'

// Rendered on request (not at build) so a build never depends on the F1 API;
// the F1 pages below come straight from the catalog, which Next's data cache
// keeps cheap. Only sessions that really have published data are listed.
export const revalidate = 3600

type Entry = MetadataRoute.Sitemap[number]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://turnonehub.com'
  const currentDate = new Date()

  // Note: gated/auth-walled routes (dashboard, live, live2, games, predictions,
  // generator, account, rewards) are intentionally excluded — they're noindexed
  // and would waste crawl budget on auth-redirect shells.
  const staticPages = [
    { url: '', changeFrequency: 'daily' as const, priority: 1.0 },
    { url: '/about', changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: '/features', changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: '/pricing', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/news', changeFrequency: 'daily' as const, priority: 0.8 },
    { url: '/examples', changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: '/api-launch', changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: '/contact', changeFrequency: 'yearly' as const, priority: 0.5 },
    { url: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: '/cookies', changeFrequency: 'yearly' as const, priority: 0.3 },
  ]

  const staticEntries: Entry[] = staticPages.map(page => ({
    url: `${baseUrl}${page.url}`,
    lastModified: currentDate,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))

  // F1 session pages. lastModified is the session's own end time — it changes
  // when the data does, not on every build.
  let f1Entries: Entry[] = []
  try {
    const seasons = await Promise.all(supportedYears().map(async (y) => assertComplete(await getSeasonCatalog(y))))
    const published = seasons.map((cat) => ({
      year: cat.year,
      events: cat.events.filter((e) => finalSessions(e).length > 0),
    })).filter((s) => s.events.length > 0)

    const at = (iso: string | null) => {
      const t = parseNaive(iso)
      return t == null ? undefined : new Date(Math.min(t, currentDate.getTime()))
    }

    f1Entries = [
      { url: `${baseUrl}/f1`, lastModified: currentDate, changeFrequency: 'daily' as const, priority: 0.8 },
      ...published.flatMap(({ year, events }) => {
        const lastOfYear = events.flatMap((e) => finalSessions(e).map((s) => s.end)).sort().at(-1) ?? null
        return [
          { url: `${baseUrl}${yearPath(year)}`, lastModified: at(lastOfYear), changeFrequency: 'weekly' as const, priority: 0.7 },
          ...events.flatMap((entry) => {
            const done = finalSessions(entry)
            const lastOfEvent = done.map((s) => s.end).sort().at(-1) ?? null
            return [
              { url: `${baseUrl}${eventPath(year, entry.event.slug)}`, lastModified: at(lastOfEvent), changeFrequency: 'weekly' as const, priority: 0.6 },
              ...done.map((s) => ({ url: `${baseUrl}${sessionPath(year, entry.event.slug, s.slug)}`, lastModified: at(s.end), changeFrequency: 'monthly' as const, priority: 0.5 })),
            ]
          }),
        ]
      }),
    ]
  } catch (e) {
    // At build time with the API unreachable, render on request instead of
    // baking a sitemap with the F1 section missing. At request time an outage
    // just leaves the F1 section out of this one response — a 500 would be worse.
    if (process.env.NEXT_PHASE === 'phase-production-build') await connection()
    console.error('[sitemap] F1 sessions omitted:', e)
  }

  return [...staticEntries, ...f1Entries]
}
