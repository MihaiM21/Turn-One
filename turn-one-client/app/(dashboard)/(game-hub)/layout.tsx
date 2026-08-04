import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';

export const metadata: Metadata = generateSEO({
  title: 'Game Hub',
  description: 'Turn One game hub and store.',
  url: '/hub',
  noIndex: true,
});

export default function GameHubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
