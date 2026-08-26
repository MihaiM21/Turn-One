import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';

export const metadata: Metadata = generateSEO({
  title: 'Download Turn One Link - Free ACC Telemetry App for Windows',
  description:
    'Turn One Link streams your Assetto Corsa Competizione telemetry to Turn One in real time. Live cockpit, lap-by-lap analysis, delta traces, AI coaching and OBS overlays. Free for Windows 10 and 11.',
  url: '/download',
  keywords: [
    'ACC telemetry app',
    'Assetto Corsa Competizione telemetry',
    'sim racing telemetry software',
    'ACC data logger',
    'sim racing lap analysis',
    'Turn One Link download',
  ],
});

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
