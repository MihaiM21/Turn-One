import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { MainNav } from "@/components/navigation/main-nav"
import { SectionHeader } from "@/components/site/section-header"
import { Button } from "@/components/ui/button"
import { SimpleExplorer } from "@/components/explore/simple-explorer"

// The shell is static; the explorer loads its data on the client through the
// cached proxy. Keeping the page itself static means the headings, intro and
// explanatory copy — the part search engines and first-time readers actually
// need — are served immediately, without duplicating all 26 plot fetchers
// server-side (the duplication lib/plots/server-fetch.ts exists to contain).
export const revalidate = 3600

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-black">
      <MainNav />

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-24 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Explore"
          title="F1 data, explained"
          subtitle="Pick a question and get the chart that answers it — plus a plain-English guide to reading it. No jargon, no signup, no setup."
        />

        <SimpleExplorer />

        <section className="border-t border-zinc-800 pt-8">
          <h2 className="text-sm font-bold uppercase tracking-tight">Want to go deeper?</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            The full generator gives you 26 chart types across every session since 2025 — tyre
            degradation, pit strategy, race pace heatmaps, driver radars and more, with the raw
            telemetry behind them.
          </p>
          <Button asChild variant="outline" className="mt-4 rounded-none">
            <Link href="/generator">
              Open the full generator
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>
    </div>
  )
}
