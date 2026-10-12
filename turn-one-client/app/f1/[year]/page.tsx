import type { Metadata } from "next"
import { PendingLink as Link } from "@/components/f1/pending-link"
import { notFound } from "next/navigation"
import { cache } from "react"
import { Breadcrumbs } from "@/components/f1/breadcrumbs"
import { JsonLd } from "@/components/seo/json-ld"
import { UpstreamUnavailableError, finalSessions } from "@/lib/f1/catalog"
import { driverName } from "@/lib/f1/driver-names"
import { loadSeason } from "@/lib/f1/pages"
import { eventPath, sessionPath, yearPath } from "@/lib/f1/session-manifest"
import { generateBreadcrumbSchema, generateCollectionPageSchema, generateSEO } from "@/lib/seo"

export const revalidate = 600
export const dynamicParams = true
export function generateStaticParams() {
  return []
}

interface Props {
  params: Promise<{ year: string }>
}

const load = cache(async (yearParam: string) => {
  const cat = await loadSeason(yearParam)
  const events = cat.events.filter((e) => finalSessions(e).length > 0)
  if (events.length === 0) {
    if (cat.events.some((e) => e.sessions.some((s) => s.status === "error"))) throw new UpstreamUnavailableError(`season ${cat.year}`, "results probes failed")
    notFound()
  }
  return { year: cat.year, events }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year } = await params
  const { events } = await load(year)
  return generateSEO({
    title: `F1 ${year} Season Results & Telemetry`,
    description: `Session results and telemetry for the ${events.length} Formula 1 ${year} Grands Prix so far: qualifying and race lap-time classifications, sprints, top speeds and throttle charts. Free, no account.`,
    url: yearPath(year),
    keywords: [`F1 ${year} results`, `Formula 1 ${year} qualifying results`, `F1 ${year} telemetry`],
  })
}

export default async function YearHubPage({ params }: Props) {
  const { year: yearParam } = await params
  const { year, events } = await load(yearParam)
  const crumbs = [
    { name: "F1 Sessions", href: "/f1" },
    { name: `${year} Season`, href: yearPath(year) },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          generateBreadcrumbSchema([{ name: "Turn One", url: "/" }, ...crumbs.map((c) => ({ name: c.name, url: c.href }))]),
          generateCollectionPageSchema({
            name: `F1 ${year} Season Results & Telemetry`,
            url: yearPath(year),
            description: `Session results and telemetry for the ${events.length} Formula 1 ${year} Grands Prix with published data.`,
            items: events.map((e) => ({ name: `${e.event.name} ${year}`, url: eventPath(year, e.event.slug) })),
          }),
        ]}
      />
      <Breadcrumbs crumbs={crumbs} />
      <header className="space-y-2">
        <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">F1 {year} Season Results &amp; Telemetry</h1>
        <p className="text-sm text-zinc-400">
          {events.length} Grands Prix with published session data. Every page has the lap-time classification, top speeds and throttle application for the
          session, free and without an account.
        </p>
      </header>

      <ol className="grid gap-3 sm:grid-cols-2">
        {events.map((entry) => {
          const { event, sessions } = entry
          const quali = sessions.find((s) => s.slug === "qualifying" && s.status === "final")
          const pole = quali?.results?.[0]
          return (
            <li key={event.key} className="border border-zinc-800 bg-zinc-950 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                Round {String(event.round).padStart(2, "0")} · {event.location}, {event.country}
              </p>
              <h2 className="mt-1 text-lg font-black leading-tight">
                <Link href={eventPath(year, event.slug)} className="underline-offset-4 hover:underline">
                  {event.name}
                </Link>
              </h2>
              {pole && (
                <p className="mt-1 text-xs text-zinc-400">
                  Qualifying: {driverName(pole.Driver)} fastest, {pole.LapTime}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {finalSessions(entry).map((s) => (
                  <Link key={s.slug} href={sessionPath(year, event.slug, s.slug)} className="text-red-400 underline-offset-4 hover:underline">
                    {s.name}
                  </Link>
                ))}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
