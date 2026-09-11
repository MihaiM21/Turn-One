import type { Metadata } from "next"
import Link from "next/link"
import { generateSEO } from "@/lib/seo"
import { grandPrixCalendar } from "@/lib/constants/grand-prix"
import { eventSlug, SEO_SESSIONS } from "@/lib/f1/session-manifest"

export const revalidate = 86400

export const metadata: Metadata = generateSEO({
  title: "F1 Session Results & Telemetry",
  description: "Free, no-account F1 session results, top speeds, and throttle telemetry for every Grand Prix.",
  url: "/f1",
})

export default function F1IndexPage() {
  const years = Object.keys(grandPrixCalendar).sort((a, b) => Number(b) - Number(a))

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">F1 Session Results & Telemetry</h1>
        <p className="text-sm text-zinc-400">Free, no-account results and charts for every session.</p>
      </div>

      {years.map((year) => (
        <section key={year} className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">{year} Season</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {grandPrixCalendar[year].races.map((gp) => (
              <div key={gp.id} className="border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-sm font-medium">{gp.name}</p>
                <div className="mt-1 flex gap-3 text-xs">
                  {SEO_SESSIONS.map((s) => (
                    <Link
                      key={s.slug}
                      href={`/f1/${year}/${eventSlug(gp.name)}/${s.slug}`}
                      className="text-red-400 underline-offset-4 hover:underline"
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
