import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';
import { HomeHub } from '@/components/site/home-hub';


export const metadata: Metadata = generateSEO({
  title: 'Turn One — F1 Live Timing, Telemetry & Predictions Hub',
  description: 'Turn One is your entry point into Formula 1: jump straight into live timing, the fan dashboard, race predictions, and the F1 Live feed — all from one place.',
  url: '/',
});

export default function RootPage() {
  return (
    <>
      <h1 className="sr-only">Turn One — F1 Live Timing, Telemetry &amp; Predictions Hub</h1>
      <p className="sr-only">
        Turn One brings Formula 1 fans live timing, telemetry analysis, race predictions,
        and a real-time dashboard in one platform. Choose Home, Dashboard, F1 Live, or the Store
        below to get started.
      </p>
      <HomeHub />
    </>
  );
}
