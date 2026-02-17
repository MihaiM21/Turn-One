import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: 'Reset Password',
  description: 'Reset your Turn One account password.',
  url: '/auth/reset-password',
  noIndex: true,
})

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
