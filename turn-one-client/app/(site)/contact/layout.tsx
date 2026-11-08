import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'


export const metadata: Metadata = generateSEO({
  title: 'Contact Us',
  description: 'Get in touch with Turn One about F1 analysis, sim racing telemetry, Turn One Link, collaborations or feedback.',
  url: '/contact',
  keywords: [
    'F1 support',
    'Formula 1 contact',
    'F1 telemetry support',
    'sim racing telemetry support',
  ],
})

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
