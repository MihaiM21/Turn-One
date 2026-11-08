import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';

export const metadata: Metadata = generateSEO({
  title: 'Sim Racing Beta',
  description: 'Apply for the Turn One sim racing closed beta: telemetry and coaching for ACC, EA SPORTS F1 25-26 and iRacing.',
  url: '/simracing/beta',
  noIndex: true,
});

export default function SimracingBetaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
