import { DashboardLayoutClient } from './dashboard-layout-client';
import { generateSEO } from '@/lib/seo';
import { Metadata } from 'next';


// Default metadata for dashboard - can be overridden by page-specific layouts
export const metadata: Metadata = generateSEO({
  title: 'Dashboard - Sim Racing Telemetry',
  description: 'Your Turn One dashboard: laps recorded by Turn One Link in ACC, EA SPORTS F1 25/26 and iRacing, corner-by-corner analysis, leaderboards and overlays.',
  url: '/dashboard',
  keywords: [
    'sim racing dashboard',
    'sim racing telemetry',
    'lap analysis',
    'sim racing leaderboards',
  ],
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
