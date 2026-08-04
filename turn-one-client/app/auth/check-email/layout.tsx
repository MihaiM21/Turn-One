import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'


export const metadata: Metadata = generateSEO({
  title: 'Check Your Email',
  description: 'Check your email to complete the verification process.',
  url: '/auth/check-email',
  noIndex: true,
})

export default function CheckEmailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
