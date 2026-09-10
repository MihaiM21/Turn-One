import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: 'Explore F1 Data — Simple Telemetry Analysis for Everyone',
  description:
    'Understand Formula 1 race data without needing an engineering degree. Pick a question, get a chart, and read a plain-English explanation of what it means. Free, no signup.',
  url: '/explore',
  keywords: [
    'F1 data for beginners',
    'understand F1 telemetry',
    'simple F1 analysis',
    'F1 charts explained',
    'Formula 1 data visualisation',
    'how to read F1 telemetry',
  ],
})

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children
}
