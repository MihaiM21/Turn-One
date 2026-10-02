import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';

export const metadata: Metadata = generateSEO({
  title: 'Download Turn One Link - Free Sim Racing Telemetry App for ACC, iRacing & F1 25',
  description:
    'Turn One Link streams telemetry from ACC, Assetto Corsa, iRacing and EA SPORTS F1 25-26 to Turn One in real time. Live cockpit, lap-by-lap analysis, delta traces, AI coaching and OBS overlays. Free for Windows 10 and 11.',
  url: '/download',
  keywords: [
    'sim racing telemetry app',
    'ACC telemetry app',
    'iRacing telemetry',
    'F1 25 telemetry',
    'Assetto Corsa telemetry',
    'sim racing data logger',
    'sim racing lap analysis',
    'Turn One Link download',
  ],
});

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
