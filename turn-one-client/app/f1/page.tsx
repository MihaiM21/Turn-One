import type { Metadata } from "next"
import Link from "next/link"
import { JsonLd } from "@/components/seo/json-ld"
import { f1_2026_races } from "@/lib/constants/f1_races"
import { finalSessions } from "@/lib/f1/catalog"
import { eventPath, sessionPath, yearPath } from "@/lib/f1/session-manifest"
import { loadSeasonsForStaticPage } from "@/lib/f1/pages"
import { generateBreadcrumbSchema, generateCollectionPageSchema, generateSEO } from "@/lib/seo"

// Rendered on the first request and then served from ISR; the publish sweep
// (lib/f1/publish.ts) revalidates it the moment a new session lands.
export const revalidate = 600

export const metadata: Metadata = generateSEO({
  title: "F1 Session Results & Telemetry",
  description:
    "Free F1 session results for every Grand Prix, Sprint and Qualifying: lap-time classification, top speeds and throttle telemetry. No account needed.",
  url: "/f1",
})

const SHORT_DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })

type UpcomingRace = { grandPrix: string; cancelled: boolean; sessions: { name: string; endTime: Date }[] }

/** Rounds on the schedule that the F1 API doesn't list yet (it adds a weekend when it begins). */
function upcomingRounds(known: Set<string>, now = new Date()) {
  return (f1_2026_races as unknown as UpcomingRace[])
    .filter((r) => !r.cancelled)
    .map((r) => ({ name: r.grandPrix, end: r.sessions.find((s) => s.name === "Race")?.endTime }))
    .filter((r): r is { name: string; end: Date } => !!r.end && r.end > now && !known.has(r.name))
}

export default async function F1IndexPage() {
  const seasons = (await loadSeasonsForStaticPage())
    .map((cat) => ({ ...cat, events: cat.events.filter((e) => finalSessions(e).length > 0) }))
    .filter((cat) => cat.events.length > 0)

  const knownNames = new Set(seasons.flatMap((s) => (s.year === 2026 ? s.events.map((e) => e.event.apiName) : [])))
  const upcoming = upcomingRounds(knownNames)

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          generateBreadcrumbSchema([
            { name: "Turn One", url: "/" },
            { name: "F1 Sessions", url: "/f1" },
          ]),
          generateCollectionPageSchema({
            name: "F1 Session Results & Telemetry",
            url: "/f1",
            description: "Free F1 session results, top speeds and throttle telemetry for every Grand Prix.",
            items: seasons.map((s) => ({ name: `F1 ${s.year} Season Results & Telemetry`, url: yearPath(s.year) })),
          }),
        ]}
      />

      <header className="space-y-2">
        <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">F1 Session Results &amp; Telemetry</h1>
        <p className="text-sm text-zinc-400">
          Free, no-account results and charts for every Grand Prix weekend: qualifying and race lap-time classifications, sprint sessions, top speeds and throttle
          application.
        </p>
      </header>

      {seasons.map((season) => (
        <section key={season.year} aria-labelledby={`season-${season.year}`} className="space-y-3">
          <h2 id={`season-${season.year}`} className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            <Link href={yearPath(season.year)} className="underline-offset-4 hover:underline">
              {season.year} Season
            </Link>
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {season.events.map(({ event, sessions }) => (
              <div key={event.key} className="border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-sm font-medium">
                  <Link href={eventPath(season.year, event.slug)} className="underline-offset-4 hover:underline">
                    {event.name}
                  </Link>
                </p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {sessions
                    .filter((s) => s.status === "final")
                    .map((s) => (
                      <Link key={s.slug} href={sessionPath(season.year, event.slug, s.slug)} className="text-red-400 underline-offset-4 hover:underline">
                        {s.name}
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {upcoming.length > 0 && (
        <section aria-labelledby="upcoming" className="space-y-3">
          <h2 id="upcoming" className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            Coming up in 2026
          </h2>
          <p className="text-xs text-zinc-500">Results appear here as soon as each session is finished and its data is published.</p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((r) => (
              <li key={r.name} className="border border-zinc-900 p-3 text-sm text-zinc-500">
                {r.name} <span className="text-xs">· {SHORT_DATE.format(r.end)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
