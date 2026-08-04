import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'


export const metadata: Metadata = generateSEO({
  title: 'Turn One API Launch - Coming Q2 2026',
  description: 'Turn One F1 API launching Q2 2026 - Get early access to our comprehensive Formula 1 data API with real-time telemetry, race statistics, and historical F1 data.',
  url: '/api-launch',
  keywords: [
    'F1 API',
    'Formula 1 API',
    'F1 data API',
    'telemetry API',
    'racing data API',
    'F1 developer API',
  ],
})

export default function ApiLaunchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
