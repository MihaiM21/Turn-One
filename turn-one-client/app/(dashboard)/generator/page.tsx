'use client';

import { Suspense } from 'react';
import { usePageMaintenance } from '@/hooks/usePageMaintenance';
import { MaintenanceScreen } from '@/components/dashboard/maintenance-screen';
import { TelemetryPlotGenerator } from '@/components/dashboard/telemetry generator/telemetry-plot-generator';
import { ExploreMoreLinks } from '@/components/dashboard/explore-more-links';

export default function GeneratorPage() {
  const { isDisabled, message, loading } = usePageMaintenance('generator');

  if (loading) return null;
  if (isDisabled) return <MaintenanceScreen slug="generator" message={message} />;

  return (
    <div>
      <main className="container mx-auto px-4 py-8 space-y-8">
        <Suspense fallback={null}>
          <TelemetryPlotGenerator />
        </Suspense>
        <ExploreMoreLinks currentPage="/generator" />
      </main>
    </div>
  );
}
