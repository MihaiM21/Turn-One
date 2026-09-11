import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';

export const metadata: Metadata = generateSEO({
  title: 'Turn One Link',
  description: 'Install and connect the Turn One Link desktop app to stream your sim racing telemetry.',
  url: '/simracing/download',
  noIndex: true,
});

export default function SimracingDownloadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
