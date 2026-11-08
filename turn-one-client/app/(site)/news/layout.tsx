import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'


export const metadata: Metadata = generateSEO({
  title: 'Latest F1 News & Session Data',
  description: 'Qualifying results, top speeds, standings and race statistics from the most recent Formula 1 session in the Turn One archive.',
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
