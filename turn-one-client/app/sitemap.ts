import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://turnonehub.com'
  const currentDate = new Date()

  // Static pages with their priorities and change frequencies
  const staticPages = [
    // Home and main pages - highest priority
    { url: '', changeFrequency: 'daily' as const, priority: 1.0 },
    { url: '/home', changeFrequency: 'daily' as const, priority: 0.9 },
    { url: '/dashboard', changeFrequency: 'daily' as const, priority: 0.9 },
    
    // Live features - updated frequently
    { url: '/live', changeFrequency: 'hourly' as const, priority: 0.95 },
    { url: '/live2', changeFrequency: 'hourly' as const, priority: 0.9 },
    
    // Gaming features - high priority
    { url: '/games', changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: '/games/trivia', changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: '/predictions', changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: '/generator', changeFrequency: 'monthly' as const, priority: 0.7 },
    
    // Community & Profile
    { url: '/profile', changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: '/rewards', changeFrequency: 'weekly' as const, priority: 0.7 },
    
    // Information pages
    { url: '/features', changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: '/about', changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: '/pricing', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/services', changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: '/news', changeFrequency: 'daily' as const, priority: 0.8 },
    { url: '/docs', changeFrequency: 'monthly' as const, priority: 0.5 },
    
    // Legal pages
    { url: '/contact', changeFrequency: 'yearly' as const, priority: 0.5 },
    { url: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: '/cookies', changeFrequency: 'yearly' as const, priority: 0.3 },
  ]

  return staticPages.map(page => ({
    url: `${baseUrl}${page.url}`,
    lastModified: currentDate,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))
}
