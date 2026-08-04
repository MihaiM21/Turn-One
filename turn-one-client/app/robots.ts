import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://turnonehub.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/cdn-cgi/',
          '/private/',
          '/*.json$',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
