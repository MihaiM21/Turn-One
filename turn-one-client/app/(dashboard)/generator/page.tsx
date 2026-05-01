import { TelemetryPlotGenerator } from "@/components/dashboard/telemetry generator/telemetry-plot-generator"
import { DashboardHeader } from "@/components/dashboard/live dashboard/dashboard-header"
import { ExploreMoreLinks } from "@/components/dashboard/explore-more-links"
import { getPageStatus } from "@/lib/pageStatusService"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default async function GeneratorPage() {
  const pageStatus = await getPageStatus('/generator');

  if (pageStatus?.isClosed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black flex flex-col">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center flex-1">
          <Card className="max-w-md w-full border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-12 gap-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Page Temporarily Closed</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {pageStatus.maintenanceMessage || 'This page is currently under maintenance. Please check back later.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
