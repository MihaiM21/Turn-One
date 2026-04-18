'use client';

import { DashboardHeader } from "@/components/dashboard/live dashboard/dashboard-header"
import { TelemetryOverview } from "@/components/dashboard/live dashboard/telemetry-overview"
import { SessionManager } from "@/components/dashboard/live dashboard/session-manager"
import { DailyGiftWidget } from "@/components/dashboard/daily-gift-widget"
import { UserStatsWidget } from "@/components/dashboard/user-stats-widget"
import { LatestSessionWidget } from "@/components/dashboard/latest-session-widget"
import { DashboardLoadingContainer } from "@/components/dashboard/dashboard-loading-container"
import { ExploreMoreLinks } from "@/components/dashboard/explore-more-links"
import { useEffect, useState } from "react"
import { getAuthToken } from "@/lib/auth-utils"
import { GeneratorCard } from "@/components/dashboard/live dashboard/generator-card"


export default function DashboardPage() {
  const [isReady, setIsReady] = useState(false);
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = getAuthToken();
    setHasToken(!!token);

    // Set dashboard as ready
    setIsReady(true);
  }, []);

  return (
    <DashboardLoadingContainer
      isReady={isReady}
      loadingMessage={hasToken === false ? "Authentication required..." : "Loading dashboard..."}
    >
      <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black">

        <DashboardHeader />

        <main className="container mx-auto px-4 py-8 space-y-8">

          <GeneratorCard />

          {/* User stats and daily gift widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-1 mt-1">
            <UserStatsWidget />
            <DailyGiftWidget
              onGiftClaimed={() => window.location.reload()}
            />
            <LatestSessionWidget />
          </div>

          <SessionManager />

          <TelemetryOverview />

          <ExploreMoreLinks currentPage="/dashboard" />
        </main>
      </div>
    </DashboardLoadingContainer>
  );
}
