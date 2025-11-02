'use client';

import { DashboardHeader } from "@/components/dashboard/live dashboard/dashboard-header"
import { TelemetryOverview } from "@/components/dashboard/live dashboard/telemetry-overview"
import { SessionManager } from "@/components/dashboard/live dashboard/session-manager"
import { DailyGiftWidget } from "@/components/dashboard/daily-gift-widget"
import { UserStatsWidget } from "@/components/dashboard/user-stats-widget"
import { DashboardLoadingContainer } from "@/components/dashboard/dashboard-loading-container"
import { useEffect, useState } from "react"
import { getAuthToken } from "@/lib/auth-utils"


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
          
          {/* User stats and daily gift widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-1">
            <UserStatsWidget />
            <DailyGiftWidget 
              onGiftClaimed={() => window.location.reload()}
            />
          </div>
          
          <SessionManager />

          <TelemetryOverview />
          </main>
        </div>
    </DashboardLoadingContainer>
  );
}
