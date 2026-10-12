/**
 * SEO Configuration and Utilities for Turn One F1 Platform
 * Comprehensive SEO metadata management for optimal search engine visibility
 */

import type { Metadata } from 'next'
import { SOCIAL_LINKS } from '@/lib/social-links'

// Base domain configuration
export const SITE_CONFIG = {
  name: 'Turn One - Formula 1 Live Timing & Telemetry Platform',
  shortName: 'Turn One F1',
  description: 'Turn One: Your ultimate Formula 1 destination for live timing, telemetry analysis, and real-time F1 race data. Follow F1 races live with professional-grade timing screens, comprehensive race statistics, and advanced telemetry insights. The premier F1 platform for racing fans and data enthusiasts.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://turnonehub.com',
  domain: 'turnonehub.com',
  author: 'Turn One',
  keywords: [
    // Core F1 Keywords - High Search Volume
    'Formula 1',
    'F1',
    'F1 racing',
    'Formula 1 racing',
    'F1 2026',
    'F1 season 2026',
    'Formula One',
    'F1 races',
    'Formula 1 races',

    // Primary Live Timing & Telemetry Keywords
    'F1 live timing',
    'Formula 1 live timing',
    'F1 telemetry',
    'Formula 1 telemetry',
    'F1 live race',
    'F1 live',
    'live F1 timing',
    'F1 real-time data',
    'F1 telemetry analysis',
    'real-time F1 telemetry',

    // Live Race & Tracking Keywords
    'F1 live race tracker',
    'Formula 1 live updates',
    'F1 live dashboard',
    'Formula 1 race tracking',
    'F1 timing screens',
    'F1 lap times',
    'F1 sector times',
    'F1 race data',
    'F1 pit stop timing',

    // Analytics & Statistics Keywords
    'F1 analytics',
    'Formula 1 statistics',
    'F1 data',
    'F1 stats',
    'Formula 1 data analysis',
    'F1 performance data',
    'F1 race analytics',

    // Team & Driver Keywords
    'F1 drivers',
    'F1 teams',
    'F1 standings',
    'F1 championship',
    'Formula 1 championship',
    'F1 results',

    // News & Updates
    'F1 news',
    'Formula 1 news',
    'F1 updates',
    'F1 today',

    // Community & Features
    'F1 dashboard',
    'F1 predictions',
    'F1 community',
    'Formula 1 fans',
    'F1 platform'
  ],
  locale: 'en_US',
  type: 'website',
  twitter: '@TurnOneOfficial',
  twitterCard: 'summary_large_image',
}

// Social media sharing images
export const OG_IMAGES = {
  default: '/og-images/turn-one-og-default.jpg',
  home: '/og-images/turn-one-home.jpg',
  dashboard: '/og-images/turn-one-dashboard.jpg',
  live: '/og-images/turn-one-live-race.jpg',
  games: '/og-images/turn-one-games.jpg',
  predictions: '/og-images/turn-one-predictions.jpg',
}

interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  /** MIME type of `image`. Defaults to JPEG (the static OG image set); pass 'image/png' for dynamic OG cards. */
  imageType?: string
  url?: string
  type?: string
  noIndex?: boolean
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  tags?: string[]
}

/**
 * Generate comprehensive SEO metadata for pages
 */
export function generateSEO({
  title,
  description = SITE_CONFIG.description,
  keywords = [],
  image = OG_IMAGES.default,
  imageType = 'image/jpeg',
  url,
  type = 'website',
  noIndex = false,
  publishedTime,
  modifiedTime,
  author = SITE_CONFIG.author,
  section,
  tags = [],
}: SEOProps = {}): Metadata {
  const pageTitle = title
    ? `${title} | ${SITE_CONFIG.shortName}`
    : SITE_CONFIG.name

  const pageUrl = url ? `${SITE_CONFIG.url}${url}` : SITE_CONFIG.url
  const fullImageUrl = image.startsWith('http') ? image : `${SITE_CONFIG.url}${image}`

  const allKeywords = [...SITE_CONFIG.keywords, ...keywords]

  const metadata: Metadata = {
    metadataBase: new URL(SITE_CONFIG.url),
    title: pageTitle,
    description,
    keywords: allKeywords.join(', '),
    authors: [{ name: author }],
    creator: SITE_CONFIG.author,
    publisher: SITE_CONFIG.author,

    // Robots
    robots: noIndex
      ? {
        index: false,
        follow: false,
        nocache: true,
      }
      : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },

    // Open Graph
    openGraph: {
      type: type as any,
      locale: SITE_CONFIG.locale,
      url: pageUrl,
      siteName: SITE_CONFIG.name,
      title: pageTitle,
      description,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title || SITE_CONFIG.name,
          type: imageType,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },

    // Twitter Card
    twitter: {
      card: SITE_CONFIG.twitterCard as any,
      site: SITE_CONFIG.twitter,
      creator: SITE_CONFIG.twitter,
      title: pageTitle,
      description,
      images: [fullImageUrl],
    },

    // Alternate languages (expand as needed)
    alternates: {
      canonical: pageUrl,
      languages: {
        'en-US': pageUrl,
        'en-GB': pageUrl,
      },
    },

    // Additional metadata
    category: 'Sports & Gaming',
    classification: 'Formula 1 Gaming Platform',

    // App links for mobile
    appleWebApp: {
      capable: true,
      title: SITE_CONFIG.shortName,
      statusBarStyle: 'black-translucent',
    },

    // PWA & Mobile
    applicationName: SITE_CONFIG.shortName,

    // Icons & manifest
    icons: {
      icon: [
        { url: '/icons/favicon.svg', type: 'image/svg+xml' },
        { url: '/icons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      ],
      apple: '/icons/apple-touch-icon.png',
    },
    manifest: '/manifest.json',

    // Verification tags (add your actual codes)
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
      // yandex: 'YOUR_YANDEX_VERIFICATION',
      // bing: 'YOUR_BING_VERIFICATION',
    },
  }

  return metadata
}

/**
 * Generate JSON-LD structured data for rich snippets
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/logo.png`,
    description: SITE_CONFIG.description,
    sameAs: [
      SOCIAL_LINKS.twitter,
      SOCIAL_LINKS.instagram,
      SOCIAL_LINKS.youtube,
      SOCIAL_LINKS.discord,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'contact@t1f1.com',
      availableLanguage: ['English'],
    },
  }
}

/**
 * Generate WebSite structured data
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

const abs = (path: string) => (path.startsWith('http') ? path : `${SITE_CONFIG.url}${path}`)

interface SportsEventSchemaProps {
  name: string
  url: string
  eventName: string
  /** Hub page of the parent Grand Prix, used as the superEvent URL. */
  eventUrl?: string
  year: number
  /** ISO 8601 date-time. The F1 API gives track-local times with no offset; that is passed through as is. */
  startDate?: string | null
  endDate?: string | null
  locality?: string
  country?: string
  description: string
  image?: string
}

/** JSON-LD SportsEvent for one session page (app/f1/[year]/[event]/[session]). */
export function generateSportsEventSchema({
  name,
  url,
  eventName,
  eventUrl,
  year,
  startDate,
  endDate,
  locality,
  country,
  description,
  image,
}: SportsEventSchemaProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name,
    url: abs(url),
    sport: 'Formula 1',
    description,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(image && { image: [abs(image)] }),
    ...((locality || country) && {
      location: {
        '@type': 'Place',
        name: [locality, country].filter(Boolean).join(', '),
        address: {
          '@type': 'PostalAddress',
          ...(locality && { addressLocality: locality }),
          ...(country && { addressCountry: country }),
        },
      },
    }),
    superEvent: {
      '@type': 'SportsEvent',
      name: `${eventName} ${year}`,
      ...(eventUrl && { url: abs(eventUrl) }),
    },
  }
}

/** JSON-LD BreadcrumbList. The last crumb is the current page. */
export function generateBreadcrumbSchema(crumbs: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: abs(c.url),
    })),
  }
}

interface CollectionPageSchemaProps {
  name: string
  url: string
  description: string
  items: { name: string; url: string }[]
}

/** JSON-LD CollectionPage whose mainEntity is an ItemList of the linked pages (hubs and the /f1 index). */
export function generateCollectionPageSchema({ name, url, description, items }: CollectionPageSchemaProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: abs(url),
    description,
    isPartOf: { '@type': 'WebSite', name: SITE_CONFIG.name, url: SITE_CONFIG.url },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        url: abs(it.url),
      })),
    },
  }
}

/** JSON-LD ItemList for a session's classification (position -> driver and team). */
export function generateResultsListSchema({ name, items }: { name: string; items: { name: string; team?: string; time: string }[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${it.name}${it.team ? ` (${it.team})` : ''} — ${it.time}`,
    })),
  }
}
