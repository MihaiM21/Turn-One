import Link from "next/link";
import { cn } from "@/lib/utils";
import { f1_2026_races } from "@/lib/constants/f1_races";
import { finalSessions, type SeasonCatalog } from "@/lib/f1/catalog";
import { formatSessionDate } from "@/lib/f1/pages";
import { eventPath, sessionPath } from "@/lib/f1/session-manifest";
import { Eyebrow, container, type Stat } from "./sections";
import { REGS_2026 } from "./data";

/**
 * Server-rendered, data-backed sections. Everything here is real text in the
 * HTML: the 2026 rules explained (non-commodity content that answers what
 * people actually search for), and fresh internal links into the indexable
 * /f1 session pages. The page revalidates hourly as a fallback; publishing a
 * session (lib/f1/publish.ts) refreshes it within minutes of the data landing.
 */

type Session = { name: string; startTime: Date; endTime: Date };
type Race = { grandPrix: string; circuit: string; country: string; cancelled: boolean; sessions: Session[] };

const RACES = (f1_2026_races as Race[]).filter((r) => !r.cancelled);
const raceEnd = (r: Race) => r.sessions.find((s) => s.name === "Race")?.endTime;

export function seasonStats(now = new Date(), seasons: SeasonCatalog[] | null = null): Stat[] {
  const done = RACES.filter((r) => {
    const end = raceEnd(r);
    return end && end < now;
  }).length;
  const pages = (seasons ?? []).reduce((n, s) => n + s.events.reduce((m, e) => m + finalSessions(e).length, 0), 0);
  return [
    { value: `${done}/${RACES.length}`, label: "2026 rounds run" },
    ...(pages > 0 ? [{ value: String(pages), label: "free session pages" }] : []),
    { value: "2020→", label: "seasons of telemetry" },
    { value: "$0", label: "to watch live" },
  ];
}

export function Regs2026() {
  return (
    <section aria-labelledby="regs-title" className="border-t border-zinc-800">
      <div className={cn(container, "py-16 md:py-24")}>
        <div className="max-w-2xl">
          <Eyebrow>The 2026 rules</Eyebrow>
          <h2 id="regs-title" className="mt-3 text-balance text-3xl font-black tracking-tight text-white sm:text-4xl">
            What changed in 2026 — and how to spot it in the data.
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-zinc-400">
            New cars, new power units, no DRS. The biggest rule change in a decade, explained in four lines — and what
            each one looks like on a timing screen.
          </p>
        </div>
        <dl className="mt-10 grid gap-px border border-zinc-800 bg-zinc-800 sm:grid-cols-2 lg:grid-cols-4">
          {REGS_2026.map((r, i) => (
            <div key={r.k} className="flex flex-col bg-[#020202] p-5 sm:p-6">
              <dt className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                <span>{r.k}</span>
                <span className="tabular-nums text-zinc-700">{String(i + 1).padStart(2, "0")}</span>
              </dt>
              <dd className="mt-3 flex flex-1 flex-col">
                <span className="font-mono text-2xl font-black tabular-nums text-white">{r.v}</span>
                <span className="mt-3 text-sm leading-relaxed text-zinc-300">{r.body}</span>
                <span className="mt-4 border-t border-zinc-800 pt-3 text-xs leading-relaxed text-zinc-400">
                  <span className="font-semibold uppercase tracking-[0.15em] text-red-400">In the data · </span>
                  {r.where}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/**
 * The four most recent rounds whose race results are published — a card is
 * never a link to a page that isn't there. Reads the same catalog as the /f1
 * pages, so publishing a session (lib/f1/publish.ts) updates this list too.
 * Hidden when the F1 API can't be reached.
 */
export function LatestSessions({ seasons }: { seasons: SeasonCatalog[] | null }) {
  const current = seasons?.find((s) => s.year === 2026);
  const latest = (current?.events ?? [])
    .filter((e) => e.sessions.some((s) => s.slug === "race" && s.status === "final"))
    .slice(-4)
    .reverse();

  if (!latest.length || !current) return null;

  return (
    <section aria-labelledby="latest-title" className="border-t border-zinc-800 bg-[#060606]">
      <div className={cn(container, "py-16 md:py-20")}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Free · No account</Eyebrow>
            <h2 id="latest-title" className="mt-3 text-3xl font-black tracking-tight text-white">
              Latest from the 2026 season
            </h2>
          </div>
          <Link href="/f1" className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 hover:text-white">
            Every session →
          </Link>
        </div>
        <ol className="mt-8 grid gap-px border border-zinc-800 bg-zinc-800 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((entry) => {
            const { event, sessions } = entry;
            const race = sessions.find((s) => s.slug === "race");
            const when = formatSessionDate(race?.start ?? null);
            const others = finalSessions(entry).filter((s) => s.slug !== "race");
            return (
              <li key={event.key} className="flex flex-col bg-[#060606] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                  Round {String(event.round).padStart(2, "0")}
                  {when ? ` · ${when}` : ""}
                </p>
                <h3 className="mt-2 text-lg font-black leading-tight text-white">
                  <Link href={eventPath(2026, event.slug)} className="underline-offset-4 hover:underline">
                    {event.name}
                  </Link>
                </h3>
                <p className="mt-1 text-xs text-zinc-500">{event.location}, {event.country}</p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
                  <Link href={sessionPath(2026, event.slug, "race")} className="text-red-400 underline-offset-4 hover:underline">
                    Race results &amp; telemetry
                  </Link>
                  {others.map((s) => (
                    <Link key={s.slug} href={sessionPath(2026, event.slug, s.slug)} className="text-zinc-300 underline-offset-4 hover:underline">
                      {s.name}
                    </Link>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
