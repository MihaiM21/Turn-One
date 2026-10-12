import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cache } from "react"
import { ArrowRight } from "lucide-react"
import { Breadcrumbs } from "@/components/f1/breadcrumbs"
import { ResultsTable, ThrottleTable, TopSpeedTable } from "@/components/f1/session-tables"
import { LazyStaticPlot } from "@/components/plot/lazy-static-plot"
import { JsonLd } from "@/components/seo/json-ld"
import { UpstreamUnavailableError, eventRef } from "@/lib/f1/catalog"
import { ttlSeconds } from "@/lib/f1/cache-policy"
import { formatSessionDate, loadSeason, resolveEvent, shortName } from "@/lib/f1/pages"
import { dataOrNull } from "@/lib/f1/outcome"
import { eventPath, findSession, sessionPath, yearPath } from "@/lib/f1/session-manifest"
import { buildSessionSummaryFacts, resultsCaption, resultsHeading, summaryToDescription, summaryToSentences } from "@/lib/f1/session-summary"
import { buildGeneratorPrefillUrl } from "@/lib/plots/plot-share"
import { fetchThrottleAverages, fetchTopSpeeds } from "@/lib/plots/server-fetch"
import type { PlotFetchContext } from "@/lib/plots/types"
import { generateBreadcrumbSchema, generateResultsListSchema, generateSEO, generateSportsEventSchema } from "@/lib/seo"

// Rendered on the first request, then served from ISR. Nothing is prerendered
// at build, so a build never depends on (or bakes in the state of) the F1 API.
export const revalidate = 3600
export const dynamicParams = true
export function generateStaticParams() {
  return []
}

interface SessionPageProps {
  params: Promise<{ year: string; event: string; session: string }>
}

/**
 * Everything the page needs, or a 404. A session only exists here when the
 * catalog says it is `final` (results present, not a copy of another event's).
 * If the F1 API is merely unavailable this throws instead — ISR then keeps the
 * last good page rather than caching a 404 for the failure.
 */
const load = cache(async (yearParam: string, eventParam: string, sessionParam: string) => {
  const sessionDef = findSession(sessionParam)
  if (!sessionDef) notFound()

  const cat = await loadSeason(yearParam)
  const entry = resolveEvent(cat, eventParam, (slug) => sessionPath(yearParam, slug, sessionParam))
  const session = entry.sessions.find((s) => s.slug === sessionParam)
  if (!session) notFound()
  if (session.status === "error") throw new UpstreamUnavailableError(`${entry.event.name} ${session.name}`, "results probe failed")
  if (session.status !== "final" || !session.results) notFound()

  const ref = eventRef(entry.event)
  const ttl = { ttl: ttlSeconds(session.end) }
  const [topSpeedsOutcome, throttleOutcome] = await Promise.all([
    fetchTopSpeeds(ref, session.code, ttl),
    fetchThrottleAverages(ref, session.code, ttl),
  ])
  return {
    entry,
    session,
    results: session.results,
    topSpeeds: dataOrNull(topSpeedsOutcome, "top speeds") ?? [],
    throttle: dataOrNull(throttleOutcome, "throttle") ?? [],
  }
})

export async function generateMetadata({ params }: SessionPageProps): Promise<Metadata> {
  const { year, event, session: sessionParam } = await params
  const { entry, session, results, topSpeeds } = await load(year, event, sessionParam)
  const ev = entry.event
  const url = sessionPath(year, ev.slug, session.slug)
  const label = `${ev.name} ${year} ${session.name}`
  return generateSEO({
    title: `${shortName(ev.name)} ${year} ${session.name} Results & Telemetry`,
    description: summaryToDescription(buildSessionSummaryFacts(results, topSpeeds), label),
    url,
    image: `/f1/og/${year}/${ev.slug}/${session.slug}`,
    imageType: "image/png",
    keywords: [ev.name, `${ev.name} ${session.name}`, `${shortName(ev.name)} ${year} ${session.name.toLowerCase()} results`, "F1 telemetry", ev.location],
  })
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { year, event: eventParam, session: sessionParam } = await params
  const { entry, session, results, topSpeeds, throttle } = await load(year, eventParam, sessionParam)
  const ev = entry.event
  const label = `${ev.name} ${year} ${session.name}`
  const url = sessionPath(year, ev.slug, session.slug)

  const facts = buildSessionSummaryFacts(results, topSpeeds)
  const sentences = summaryToSentences(facts, label)

  const ctx: PlotFetchContext = {
    year: ev.year,
    eventName: ev.apiName,
    sessionName: session.name,
    sessionCode: session.code,
    allDrivers: [],
    options: {},
    token: "",
  }

  const yearEvents = (await loadSeason(year)).events
  const idx = yearEvents.findIndex((e) => e.event.key === ev.key)
  const hasSession = (e: (typeof yearEvents)[number] | undefined) => e?.sessions.find((s) => s.slug === session.slug)?.status === "final"
  const prevEvent = yearEvents.slice(0, idx).reverse().find(hasSession)
  const nextEvent = yearEvents.slice(idx + 1).find(hasSession)
  const siblings = entry.sessions.filter((s) => s.slug !== session.slug && s.status === "final")

  const crumbs = [
    { name: "F1 Sessions", href: "/f1" },
    { name: `${year} Season`, href: yearPath(year) },
    { name: ev.name, href: eventPath(year, ev.slug) },
    { name: session.name, href: url },
  ]
  const date = formatSessionDate(session.start)
  const heading = resultsHeading(session.code)

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          generateSportsEventSchema({
            name: label,
            url,
            eventName: ev.name,
            eventUrl: eventPath(year, ev.slug),
            year: ev.year,
            startDate: session.start,
            endDate: session.end,
            locality: ev.location,
            country: ev.country,
            description: `${label}: lap-time classification, top speeds and throttle telemetry on Turn One.`,
            image: `/f1/og/${year}/${ev.slug}/${session.slug}`,
          }),
          generateBreadcrumbSchema([{ name: "Turn One", url: "/" }, ...crumbs.map((c) => ({ name: c.name, url: c.href }))]),
          generateResultsListSchema({
            name: `${label} — ${heading}`,
            items: results.map((r) => ({ name: r.Driver, team: r.Team, time: r.LapTime })),
          }),
        ]}
      />

      <Breadcrumbs crumbs={crumbs} />

      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
          Round {ev.round} · {ev.location}, {ev.country}
          {date ? ` · ${date}` : ""}
        </p>
        <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">
          {ev.name} {year} — {session.name}
        </h1>
        {sentences.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-zinc-400">
            {sentences.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
        {ev.note && <p className="text-sm text-zinc-500">{ev.note}</p>}
      </header>

      <section className="space-y-4 border border-zinc-800 p-4" aria-labelledby="classification">
        <div>
          <h2 id="classification" className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            {heading}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">{resultsCaption(session.code)}</p>
        </div>
        <ResultsTable rows={results} caption={`${label}: ${heading.toLowerCase()}`} />
        <LazyStaticPlot plotKey="session_results" data={results} ctx={ctx} />
      </section>

      {topSpeeds.length > 0 && (
        <section className="space-y-4 border border-zinc-800 p-4" aria-labelledby="top-speeds">
          <h2 id="top-speeds" className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            Top Speeds
          </h2>
          <TopSpeedTable rows={topSpeeds} />
          <LazyStaticPlot plotKey="topspeeds" data={topSpeeds} ctx={ctx} />
        </section>
      )}

      {throttle.length > 0 && (
        <section className="space-y-4 border border-zinc-800 p-4" aria-labelledby="throttle">
          <h2 id="throttle" className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            Average Throttle
          </h2>
          <ThrottleTable rows={throttle} />
          <LazyStaticPlot plotKey="throttle_average" data={throttle} ctx={ctx} />
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

      <nav aria-label="Related sessions" className="flex flex-wrap gap-x-6 gap-y-2 border-t border-zinc-800 pt-6 text-sm">
        {siblings.map((s) => (
          <Link key={s.slug} href={sessionPath(year, ev.slug, s.slug)} className="text-red-400 underline-offset-4 hover:underline">
            {ev.name} {year} {s.name}
          </Link>
        ))}
        {prevEvent && (
          <Link href={sessionPath(year, prevEvent.event.slug, session.slug)} className="text-zinc-400 underline-offset-4 hover:underline">
            ← {prevEvent.event.name} {session.name}
          </Link>
        )}
        {nextEvent && (
          <Link href={sessionPath(year, nextEvent.event.slug, session.slug)} className="text-zinc-400 underline-offset-4 hover:underline">
            {nextEvent.event.name} {session.name} →
          </Link>
        )}
        <Link href={eventPath(year, ev.slug)} className="text-zinc-400 underline-offset-4 hover:underline">
          All {ev.name} sessions
        </Link>
        <Link href={yearPath(year)} className="text-zinc-400 underline-offset-4 hover:underline">
          {year} season
        </Link>
      </nav>
    </div>
  )
}
