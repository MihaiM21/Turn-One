import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'


export const metadata: Metadata = generateSEO({
  title: 'Sign Up - Create Your Account',
  description: 'Create your free Turn One account to access F1 live timing, telemetry analysis, and comprehensive race data.',
  url: '/auth/signup',
  noIndex: true,
})

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
