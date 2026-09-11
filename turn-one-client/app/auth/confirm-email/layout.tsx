import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'


export const metadata: Metadata = generateSEO({
  title: 'Confirm Email',
  description: 'Confirm your Turn One account email address.',
  url: '/auth/confirm-email',
  noIndex: true,
})

export default function ConfirmEmailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
