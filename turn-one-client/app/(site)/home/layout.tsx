import { MainFooter } from '@/components/footer/main-footer';
import { Suspense } from "react"
import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: 'Turn One - Formula 1 Live Timing & Analysis',
  description: 'Experience Formula 1 like never before with Turn One - your ultimate F1 gaming hub featuring live race tracking, predictions, trivia games, real-time telemetry, and comprehensive F1 statistics.',
  url: '/home',
  keywords: [
    'F1 dashboard',
    'Formula 1 hub',
    'F1 gaming platform',
  ],
})

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      {children}
    </Suspense>
  );
}