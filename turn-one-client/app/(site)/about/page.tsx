import type { Metadata } from "next"
import Link from "next/link"
import { Target, Zap, Trophy, BarChart3 } from "lucide-react"
import { MainNav } from "@/components/navigation/main-nav"
import { SectionHeader } from "@/components/site/section-header"
import { PublicCard } from "@/components/site/public-card"
import { LegalDisclaimer } from "@/components/footer/legal-disclaimer"
import { generateSEO } from "@/lib/seo"

export const metadata: Metadata = generateSEO({
  title: "About Turn One",
  description:
    "Turn One is an independent, fan-built Formula 1 telemetry and live timing platform — not affiliated with or endorsed by Formula 1.",
  url: "/about",
  keywords: ["about turn one", "f1 telemetry platform", "independent f1 fan project"],
})

const timeline = [
  { year: "2023", title: "The beginning", description: "Started as a side project by F1 fans frustrated with the lack of accessible telemetry tools." },
  { year: "2024", title: "First platform launch", description: "Shipped to a 1,000+ enthusiast community with live timing and lap-by-lap analysis." },
  { year: "2025", title: "AI integration", description: "Added predictive models and automated insights, processing 10M+ data points per race weekend." },
  { year: "2026", title: "Next generation", description: "Real-time SignalR telemetry, gamified predictions, daily rewards and a refreshed dashboard.", highlight: true },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black">
      <MainNav variant="homepage" />

      <main className="mx-auto max-w-5xl space-y-16 px-4 py-16 sm:px-6 lg:px-8">
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Our story"
            title="Motorsport intelligence specialists"
            subtitle="Turn One combines deep Formula One expertise with modern engineering to give fans, content creators and analysts the same kind of tools the paddock uses."
          />

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <PublicCard accent className="p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Mission</p>
              <p className="mt-3 text-base text-zinc-300">
                Democratize access to professional-grade telemetry. Turn the millions of raw data points
                from every session into something anyone can understand and explore.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Data-driven", "Professional grade", "Innovation first", "Community owned"].map((b) => (
                  <span
                    key={b}
                    className="border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-300"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </PublicCard>

            <PublicCard className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {[Target, Zap, Trophy, BarChart3].map((Icon, i) => (
                  <div key={i} className="flex aspect-square items-center justify-center border border-zinc-800 bg-zinc-900">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                ))}
              </div>
            </PublicCard>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {timeline.map((t) => (
              <PublicCard key={t.year} accent={t.highlight} className="p-5">
                <p className="font-mono text-2xl font-black tabular-nums text-primary">{t.year}</p>
                <p className="mt-2 text-sm font-bold">{t.title}</p>
                <p className="mt-1 text-xs text-zinc-400">{t.description}</p>
              </PublicCard>
            ))}
          </div>
        </section>

        <section className="border border-zinc-800 bg-zinc-950 px-6 py-8 sm:px-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Independence</p>
          <h2 className="mt-3 text-xl font-black uppercase tracking-tight sm:text-2xl">
            Not an official F1 product
          </h2>
          <LegalDisclaimer variant="full" className="mt-4 max-w-3xl text-zinc-300" />
          <p className="mt-4 text-sm text-zinc-400">
            Read our full{" "}
            <Link href="/terms" className="text-red-400 underline-offset-4 hover:underline">
              Terms of Service
            </Link>{" "}
            for the complete trademark and intellectual property notice.
          </p>
        </section>
      </main>
    </div>
  )
}
