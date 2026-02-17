import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: 'F1 Blog & Insights',
  description: 'Read the latest Formula 1 insights, race analysis, technical deep-dives, and expert commentary on F1 telemetry and racing strategy from Turn One experts.',
  url: '/blog',
  keywords: [
    'F1 blog',
    'Formula 1 insights',
    'race analysis',
    'F1 commentary',
    'telemetry insights',
    'racing strategy',
  ],
})

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
