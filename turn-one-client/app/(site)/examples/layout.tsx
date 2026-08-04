import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';


export const metadata: Metadata = generateSEO({
  title: 'Examples - F1 Telemetry & Data Visualization Showcase',
  description: 'See Turn One in action: live telemetry charts, lap time analysis, throttle/brake comparisons, track comparisons, and real-time timing grids built from real Formula 1 data.',
  url: '/examples',
  keywords: [
    'F1 telemetry examples',
    'F1 data visualization',
    'F1 chart examples',
    'F1 live timing demo',
  ],
});

export default function ExamplesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
