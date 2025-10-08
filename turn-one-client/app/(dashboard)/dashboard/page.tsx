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
import { useDashboardData } from "./use-dashboard-data"
import { DashboardLoadingContainer } from "@/components/dashboard/dashboard-loading-container"


export default function DashboardPage() {
  const { dashboardData, isReady } = useDashboardData();
  
  return (
    <DashboardLoadingContainer isReady={isReady} loadingMessage="Loading dashboard...">
      <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black">
        
        <DashboardHeader />

        <main className="container mx-auto px-4 py-8 space-y-8">
          
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
