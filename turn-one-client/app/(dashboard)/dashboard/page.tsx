'use client';

import { DashboardHeader } from "@/components/dashboard/live dashboard/dashboard-header"
import { TelemetryOverview } from "@/components/dashboard/live dashboard/telemetry-overview"
import { DailyGiftWidget } from "@/components/dashboard/daily-gift-widget"
import { LatestSessionWidget } from "@/components/dashboard/latest-session-widget"
import { DashboardLoadingContainer } from "@/components/dashboard/dashboard-loading-container"
import { ExploreMoreLinks } from "@/components/dashboard/explore-more-links"
import { WelcomeBanner } from "@/components/dashboard/live dashboard/welcome-banner"
import { NextRaceHero } from "@/components/dashboard/live dashboard/next-race-hero"
import { GeneratorCard } from "@/components/dashboard/live dashboard/generator-card"
import { useEffect, useState } from "react"
import { getAuthToken } from "@/lib/auth-utils"

export default function DashboardPage() {
  const [isReady, setIsReady] = useState(false);
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    setHasToken(!!token);
    setIsReady(true);
  }, []);

  return (
    <DashboardLoadingContainer
      isReady={isReady}
      loadingMessage={hasToken === false ? "Authentication required..." : "Loading dashboard..."}
    >
      <div className="min-h-screen bg-black">
        <DashboardHeader />

        <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-4">
          <WelcomeBanner />

          <NextRaceHero />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
            <LatestSessionWidget />
            <DailyGiftWidget onGiftClaimed={() => window.location.reload()} />
          </div>

          <GeneratorCard />

          <TelemetryOverview />

          <ExploreMoreLinks currentPage="/dashboard" />
        </main>
      </div>
    </DashboardLoadingContainer>
  );
}
