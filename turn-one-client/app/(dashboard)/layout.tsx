import { DashboardLayoutClient } from './dashboard-layout-client';
import { generateSEO } from '@/lib/seo';
import { Metadata } from 'next';

// Default metadata for dashboard - can be overridden by page-specific layouts
export const metadata: Metadata = generateSEO({
  title: 'Dashboard - Formula 1 Live Timing Platform',
  description: 'Access your Formula 1 dashboard with live race timing, telemetry analysis, predictions, and comprehensive F1 data. Your central hub for all things Formula 1.',
  url: '/dashboard',
  keywords: [
    'F1 dashboard',
    'Formula 1 user dashboard',
    'F1 live data',
    'personal F1 hub',
  ],
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
