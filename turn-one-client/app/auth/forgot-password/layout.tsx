import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: 'Forgot Password',
  description: 'Reset your Turn One account password.',
  url: '/auth/forgot-password',
  noIndex: true,
})

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
