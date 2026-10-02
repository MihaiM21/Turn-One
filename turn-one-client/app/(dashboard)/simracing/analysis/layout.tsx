import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';

export const metadata: Metadata = generateSEO({
  title: 'Lap Analysis',
  description: 'Overlay laps on a shared distance axis, see the time delta and a corner-by-corner breakdown.',
  url: '/simracing/analysis',
  noIndex: true,
});

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
