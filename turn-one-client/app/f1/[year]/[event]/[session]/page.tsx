import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { generateSEO, generateSportsEventSchema } from "@/lib/seo"
import { JsonLd } from "@/components/seo/json-ld"
import { StaticPlot } from "@/components/plot/static-plot"
import { buildSessionSummaryFacts, summaryToSentences } from "@/lib/f1/session-summary"
import { serverFetchSessionResults, serverFetchThrottleAverages, serverFetchTopSpeeds } from "@/lib/plots/server-fetch"
import { SEO_SESSIONS, buildManifest, eventSlug, eventsForYear, findGrandPrix, findSession, type SeoSessionSlug } from "@/lib/f1/session-manifest"
import { buildGeneratorPrefillUrl } from "@/lib/plots/plot-share"
import type { PlotFetchContext } from "@/lib/plots/types"

export const revalidate = 86400

interface SessionPageProps {
  params: Promise<{ year: string; event: string; session: string }>
}

export function generateStaticParams() {
  return buildManifest()
}

async function loadSession(year: string, eventParam: string, sessionParam: string) {
  const gp = findGrandPrix(year, eventParam)
  const session = findSession(sessionParam)
  if (!gp || !session) return null

  try {
    const [topSpeeds, throttle, results] = await Promise.all([
      serverFetchTopSpeeds(Number(year), gp.name, session.code),
      serverFetchThrottleAverages(Number(year), gp.name, session.code),
      serverFetchSessionResults(Number(year), gp.name, session.code),
    ])

    // Never publish a page without charts: all three must return real data.
    if (topSpeeds.length === 0 && throttle.length === 0 && results.length === 0) {
      return null
    }

    return { gp, session, topSpeeds, throttle, results }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: SessionPageProps): Promise<Metadata> {
  const { year, event, session: sessionParam } = await params
  const loaded = await loadSession(year, event, sessionParam)
  if (!loaded) return generateSEO({ title: "Session not found", noIndex: true })

  const { gp, session } = loaded
  const title = `${gp.name} ${year} ${session.name} Results & Telemetry`
  return generateSEO({
    title,
    description: `${gp.name} ${year} ${session.name}: results, top speeds, and throttle telemetry — free, no account required.`,
    url: `/f1/${year}/${event}/${sessionParam}`,
    keywords: [gp.name, `${gp.name} ${session.name}`, "F1 telemetry", gp.circuit],
  })
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { year, event, session: sessionParam } = await params
  const loaded = await loadSession(year, event, sessionParam)
  if (!loaded) notFound()

  const { gp, session, topSpeeds, throttle, results } = loaded
  const facts = buildSessionSummaryFacts(results, topSpeeds)
  const sentences = summaryToSentences(facts, `${gp.name} ${year} ${session.name}`)

  const ctx: PlotFetchContext = {
    year: Number(year),
    eventName: gp.name,
    sessionName: session.name,
    sessionCode: session.code,
    allDrivers: [],
    options: {},
    token: "",
  }

  const otherSession = SEO_SESSIONS.find((s) => s.slug !== sessionParam)
  const yearNum = Number(year)
  const prevYearGp = findGrandPrix(String(yearNum - 1), event)
  const nextYearGp = findGrandPrix(String(yearNum + 1), event)
  const yearEvents = eventsForYear(year)
  const eventIndex = yearEvents.findIndex((e) => eventSlug(e.name) === event)
  const prevEvent = eventIndex > 0 ? yearEvents[eventIndex - 1] : undefined
  const nextEvent = eventIndex >= 0 && eventIndex < yearEvents.length - 1 ? yearEvents[eventIndex + 1] : undefined

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={generateSportsEventSchema({
          name: `${gp.name} ${year} ${session.name}`,
          url: `/f1/${year}/${event}/${sessionParam}`,
          eventName: gp.name,
          sessionName: session.name,
          year: yearNum,
          circuit: gp.circuit,
          country: gp.country,
        })}
      />

      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
          {gp.country} · {gp.circuit}
        </p>
        <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">
          {gp.name} {year} — {session.name}
        </h1>
        {sentences.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-zinc-400">
            {sentences.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
      </div>

      {results.length > 0 && (
        <section className="border border-zinc-800 p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-300">Session Results</h2>
          <StaticPlot plotKey="session_results" data={results} ctx={ctx} />
        </section>
      )}

      {topSpeeds.length > 0 && (
        <section className="border border-zinc-800 p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-300">Top Speeds</h2>
          <StaticPlot plotKey="topspeeds" data={topSpeeds} ctx={ctx} />
        </section>
      )}

      {throttle.length > 0 && (
        <section className="border border-zinc-800 p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-300">Throttle Average</h2>
          <StaticPlot plotKey="throttle_average" data={throttle} ctx={ctx} />
        </section>
      )}

      <div className="border border-zinc-800 bg-zinc-950 px-6 py-6 text-center">
        <p className="text-sm text-zinc-400">Want to explore this session yourself?</p>
        <Link
          href={buildGeneratorPrefillUrl("session_results")}
          className="mt-3 inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-medium uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Open the generator
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Internal links */}
      <nav className="flex flex-wrap gap-x-6 gap-y-2 border-t border-zinc-800 pt-6 text-sm">
        {otherSession && (
          <Link href={`/f1/${year}/${event}/${otherSession.slug}`} className="text-red-400 underline-offset-4 hover:underline">
            {gp.name} {year} {otherSession.name}
          </Link>
        )}
        {prevYearGp && (
          <Link href={`/f1/${yearNum - 1}/${event}/${sessionParam}`} className="text-zinc-400 underline-offset-4 hover:underline">
            {gp.name} {yearNum - 1}
          </Link>
        )}
        {nextYearGp && (
          <Link href={`/f1/${yearNum + 1}/${event}/${sessionParam}`} className="text-zinc-400 underline-offset-4 hover:underline">
            {gp.name} {yearNum + 1}
          </Link>
        )}
        {prevEvent && (
          <Link href={`/f1/${year}/${eventSlug(prevEvent.name)}/${sessionParam}`} className="text-zinc-400 underline-offset-4 hover:underline">
            ← {prevEvent.name} {year}
          </Link>
        )}
        {nextEvent && (
          <Link href={`/f1/${year}/${eventSlug(nextEvent.name)}/${sessionParam}`} className="text-zinc-400 underline-offset-4 hover:underline">
            {nextEvent.name} {year} →
          </Link>
        )}
        <Link href="/f1" className="text-zinc-400 underline-offset-4 hover:underline">
          All sessions
        </Link>
      </nav>
    </div>
  )
}
