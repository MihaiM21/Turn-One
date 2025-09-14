import { TelemetryPlotGenerator } from "@/components/dashboard/telemetry generator/telemetry-plot-generator"
import {TopSpeed} from "@/components/dashboard/telemetry generator/plots/top-speed"
export default function GeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black">
      <main className="container mx-auto px-4 py-8 space-y-8">
        <TelemetryPlotGenerator />
        {/* <TopSpeed /> */}
      </main>

    </div>
  );
}
