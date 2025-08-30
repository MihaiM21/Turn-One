import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { TelemetryOverview } from "@/components/dashboard/telemetry-overview"
import { LapTimeAnalysis } from "@/components/dashboard/lap-time-analysis"
import { SectorComparison } from "@/components/dashboard/sector-comparison"
import { SpeedTraceChart } from "@/components/dashboard/speed-trace-chart"
import { TrackMap } from "@/components/dashboard/track-map"
import { TireAnalysis } from "@/components/dashboard/tire-analysis"
import { FuelConsumption } from "@/components/dashboard/fuel-consumption"
import { WeatherImpact } from "@/components/dashboard/weather-impact"
import { DriverComparison } from "@/components/dashboard/driver-comparison"
import { SessionManager } from "@/components/dashboard/session-manager"
import { PerformanceTrends } from "@/components/dashboard/performance-trends"
import { TelemetryPlotGenerator } from "@/components/dashboard/telemetry-plot-generator"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <SessionManager />

        <TelemetryOverview />

        <TelemetryPlotGenerator />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
        </div>
      </main>
    </div>
  )
}
