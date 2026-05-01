'use client';

import { usePageMaintenance } from '@/hooks/usePageMaintenance';
import { MaintenanceScreen } from '@/components/dashboard/maintenance-screen';
import { TelemetryPlotGenerator } from '@/components/dashboard/telemetry generator/telemetry-plot-generator';
import { DashboardHeader } from '@/components/dashboard/live dashboard/dashboard-header';
import { ExploreMoreLinks } from '@/components/dashboard/explore-more-links';

export default function GeneratorPage() {
  const { isDisabled, message, loading } = usePageMaintenance('generator');

  if (loading) return null;
  if (isDisabled) return <MaintenanceScreen slug="generator" message={message} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <TelemetryPlotGenerator />
        <ExploreMoreLinks currentPage="/generator" />
      </main>
    </div>
  );
}
