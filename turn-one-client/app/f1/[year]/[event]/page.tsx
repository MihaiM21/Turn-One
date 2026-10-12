import type { Metadata } from "next"
import { PendingLink as Link } from "@/components/f1/pending-link"
import { notFound } from "next/navigation"
import { cache } from "react"
import { Breadcrumbs } from "@/components/f1/breadcrumbs"
import { JsonLd } from "@/components/seo/json-ld"
import { assertPublished, finalSessions } from "@/lib/f1/catalog"
import { driverName } from "@/lib/f1/driver-names"
import { formatSessionDate, loadSeason, resolveEvent, shortName } from "@/lib/f1/pages"
import { eventPath, sessionPath, yearPath } from "@/lib/f1/session-manifest"
import { generateBreadcrumbSchema, generateCollectionPageSchema, generateSEO } from "@/lib/seo"

export const revalidate = 600
export const dynamicParams = true
export function generateStaticParams() {
  return []
}

interface Props {
  params: Promise<{ year: string; event: string }>
}

const load = cache(async (yearParam: string, eventParam: string) => {
  const cat = await loadSeason(yearParam)
  const entry = resolveEvent(cat, eventParam, (slug) => eventPath(yearParam, slug))
  if (!assertPublished(entry)) notFound()
  return entry
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year, event } = await params
  const entry = await load(year, event)
  const { event: ev } = entry
  const names = finalSessions(entry).map((s) => s.name)
  return generateSEO({
    title: `${shortName(ev.name)} ${year} Results & Telemetry`,
    description: `${ev.name} ${year} at ${ev.location}, ${ev.country}: ${names.join(", ")} results with lap-time classification, top speeds and throttle telemetry. Free, no account.`,
    url: eventPath(year, ev.slug),
    keywords: [`${ev.name} ${year}`, `${shortName(ev.name)} ${year} results`, `${ev.name} ${year} qualifying`, ev.location],
  })
}

export default async function EventHubPage({ params }: Props) {
  const { year, event: eventParam } = await params
  const entry = await load(year, eventParam)
  const { event: ev, sessions } = entry
  const crumbs = [
    { name: "F1 Sessions", href: "/f1" },
    { name: `${year} Season`, href: yearPath(year) },
    { name: ev.name, href: eventPath(year, ev.slug) },
  ]
  const raceDate = formatSessionDate(sessions.find((s) => s.slug === "race")?.start ?? sessions[sessions.length - 1]?.start ?? null)

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          generateBreadcrumbSchema([{ name: "Turn One", url: "/" }, ...crumbs.map((c) => ({ name: c.name, url: c.href }))]),
          generateCollectionPageSchema({
            name: `${ev.name} ${year} Results & Telemetry`,
            url: eventPath(year, ev.slug),
            description: `Session results and telemetry for the ${ev.name} ${year}.`,
            items: finalSessions(entry).map((s) => ({ name: `${ev.name} ${year} ${s.name}`, url: sessionPath(year, ev.slug, s.slug) })),
          }),
        ]}
      />
      <Breadcrumbs crumbs={crumbs} />
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
          Round {ev.round} · {ev.location}, {ev.country}
          {raceDate ? ` · ${raceDate}` : ""}
        </p>
        <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">
          {ev.name} {year} — Results &amp; Telemetry
        </h1>
        {ev.note && <p className="text-sm text-zinc-400">{ev.note}</p>}
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {sessions.map((s) => {
          const top = s.results?.[0]
          return (
            <li key={s.slug} className="border border-zinc-800 bg-zinc-950 p-4">
              {s.status === "final" ? (
                <>
                  <h2 className="text-lg font-black">
                    <Link href={sessionPath(year, ev.slug, s.slug)} className="underline-offset-4 hover:underline">
                      {ev.name} {year} {s.name}
                    </Link>
                  </h2>
                  {top && (
                    <p className="mt-1 text-sm text-zinc-400">
                      Fastest lap: {driverName(top.Driver)}, {top.LapTime}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-red-400">Results, top speeds &amp; throttle →</p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-black text-zinc-500">{s.name}</h2>
                  <p className="mt-1 text-sm text-zinc-600">Results are published once the session is finished and its data is available.</p>
                </>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
