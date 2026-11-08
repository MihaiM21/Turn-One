import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';

export const metadata: Metadata = generateSEO({
  title: 'Turn One Link - Sim Racing Telemetry App for ACC, iRacing & F1 25 (Closed Beta)',
  description:
    'Turn One Link streams telemetry from ACC, iRacing, EA SPORTS F1 25-26 and (experimental) Assetto Corsa to Turn One in real time. Live cockpit, lap-by-lap analysis, delta traces, coaching tips and OBS overlays. Closed beta for Windows 10 and 11.',
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
