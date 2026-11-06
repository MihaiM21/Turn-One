import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';

export const metadata: Metadata = generateSEO({
  title: 'Connect Turn One Link',
  description: 'Approve the code shown in Turn One Link to sign it in to your account.',
  url: '/link',
  noIndex: true,
});

export default function LinkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
