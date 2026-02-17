import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: 'Latest F1 News & Session Data',
  description: 'Stay updated with the latest Formula 1 session data, race statistics, qualifying results, and real-time F1 news. Comprehensive coverage of current F1 season events.',
  url: '/news',
  keywords: [
    'F1 news',
    'Formula 1 updates',
    'F1 session data',
    'qualifying results',
    'race statistics',
    'latest F1 data',
  ],
})

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
