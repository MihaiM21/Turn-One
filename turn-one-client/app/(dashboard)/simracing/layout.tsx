import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';


export const metadata: Metadata = generateSEO({
  title: 'Simracing Live Cockpit',
  description: 'Real-time telemetry and dashboard for Assetto Corsa Competizione.',
  url: '/simracing',
  noIndex: true,
});

export default function SimracingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
