import { MetadataRoute } from 'next'
import { buildManifest } from '@/lib/f1/session-manifest'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://turnonehub.com'
  const currentDate = new Date()

  // Static pages with their priorities and change frequencies
  // Note: gated/auth-walled routes (dashboard, live, live2, games, predictions,
  // generator, account, rewards) are intentionally excluded — they're noindexed
  // and would waste crawl budget on auth-redirect shells.
  const staticPages = [
    // Home and main pages - highest priority
    { url: '', changeFrequency: 'daily' as const, priority: 1.0 },
    { url: '/home', changeFrequency: 'daily' as const, priority: 0.9 },

    // Information pages
    { url: '/about', changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: '/features', changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: '/pricing', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/news', changeFrequency: 'daily' as const, priority: 0.8 },
    { url: '/examples', changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: '/api-launch', changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: '/f1', changeFrequency: 'weekly' as const, priority: 0.7 },

    // Legal pages
    { url: '/contact', changeFrequency: 'yearly' as const, priority: 0.5 },
    { url: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: '/cookies', changeFrequency: 'yearly' as const, priority: 0.3 },
  ]

  const staticEntries = staticPages.map(page => ({
    url: `${baseUrl}${page.url}`,
    lastModified: currentDate,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))

  // Session pages that failed to publish (no upstream data yet) simply 404 at
  // request time — the sitemap lists the full manifest optimistically rather
  // than needing a second source of truth for "which ones actually have data".
  const sessionEntries = buildManifest().map((entry) => ({
    url: `${baseUrl}/f1/${entry.year}/${entry.event}/${entry.session}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  return [...staticEntries, ...sessionEntries]
}
