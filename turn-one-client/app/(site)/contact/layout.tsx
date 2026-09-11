import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'


export const metadata: Metadata = generateSEO({
  title: 'Contact Us',
  description: 'Get in touch with Turn One for F1 analysis support, custom integrations, and enterprise solutions. Contact our motorsport intelligence experts for live timing and telemetry services.',
  url: '/contact',
  keywords: [
    'F1 support',
    'Formula 1 contact',
    'F1 telemetry support',
    'motorsport intelligence contact',
    'F1 enterprise solutions',
  ],
})

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
