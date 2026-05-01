'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardHeader } from "@/components/dashboard/live dashboard/dashboard-header";
import { ExploreMoreLinks } from "@/components/dashboard/explore-more-links";
import { Trophy, ArrowRight } from 'lucide-react';
import { usePageMaintenance } from '@/hooks/usePageMaintenance';
import { MaintenanceScreen } from '@/components/dashboard/maintenance-screen';

export default function PredictionsPage() {
  const router = useRouter();
  const { isDisabled, message, loading: maintenanceLoading } = usePageMaintenance('predictions');

  useEffect(() => {
    if (maintenanceLoading || isDisabled) return; // don't redirect if in maintenance
    const timer = setTimeout(() => {
      router.push('/games?tab=my-predictions');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router, maintenanceLoading, isDisabled]);

  if (maintenanceLoading) return null;
  if (isDisabled) return <MaintenanceScreen slug="predictions" message={message} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background/95 via-background to-background/98">
      <DashboardHeader />
      <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-10">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background/50 backdrop-blur-md max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-full bg-primary/10 mb-6 animate-pulse">
              <Trophy className="w-16 h-16 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-3">Redirecting to Game Hub</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              The predictions page has been integrated into the Game Hub for a better experience.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary">
              <span>Taking you to your predictions</span>
              <ArrowRight className="w-4 h-4 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <ExploreMoreLinks currentPage="/predictions" />
      </div>
    </div>
  );
}