import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: 'Login - Access Your Account',
  description: 'Login to your Turn One account to access F1 live timing and telemetry analysis.',
  url: '/auth/login',
  noIndex: true,
})

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
