'use client';

import { DashboardHeader } from "@/components/dashboard/live dashboard/dashboard-header"
import { TelemetryOverview } from "@/components/dashboard/live dashboard/telemetry-overview"
import { LapTimeAnalysis } from "@/components/dashboard/live dashboard/lap-time-analysis"
import { SectorComparison } from "@/components/dashboard/live dashboard/sector-comparison"
import { SpeedTraceChart } from "@/components/dashboard/live dashboard/speed-trace-chart"
import { TrackMap } from "@/components/dashboard/live dashboard/track-map"
import { TireAnalysis } from "@/components/dashboard/live dashboard/tire-analysis"
import { FuelConsumption } from "@/components/dashboard/live dashboard/fuel-consumption"
import { WeatherImpact } from "@/components/dashboard/live dashboard/weather-impact"
import { DriverComparison } from "@/components/dashboard/live dashboard/driver-comparison"
import { SessionManager } from "@/components/dashboard/live dashboard/session-manager"
import { PerformanceTrends } from "@/components/dashboard/live dashboard/performance-trends"
import { F1ConnectionStatus } from "@/components/dashboard/live dashboard/f1-connection-status"
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
            
            {/* <F1ConnectionStatus /> */}
        
            <TelemetryOverview />

            

            {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <LapTimeAnalysis />
              <SectorComparison />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <DriverComparison />
              <PerformanceTrends />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2">
                <SpeedTraceChart />
              </div>
              <div className="xl:col-span-1">
                <TrackMap />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <TireAnalysis />
              <FuelConsumption />
              <WeatherImpact />
            </div> */}
          </main>
        </div>
    </DashboardLoadingContainer>
  );
}
