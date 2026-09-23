import Link from "next/link";
import { cn } from "@/lib/utils";
import { f1_2026_races } from "@/lib/constants/f1_races";
import { buildManifest, eventSlug, findGrandPrix } from "@/lib/f1/session-manifest";
import { hasResults } from "@/lib/f1/publish";
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

export function seasonStats(now = new Date()): Stat[] {
  const done = RACES.filter((r) => {
    const end = raceEnd(r);
    return end && end < now;
  }).length;
  return [
    { value: `${done}/${RACES.length}`, label: "2026 rounds run" },
    { value: String(buildManifest().length), label: "free session pages" },
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

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/**
 * The four most recent rounds whose race results actually exist — a card is
 * never a link to a page that isn't published yet. Reads the same tagged cache
 * as the session pages, so /api/revalidate/sessions publishing a race updates
 * this list too. Without F1_API_URL (local dev) it falls back to the schedule.
 */
export async function LatestSessions({ now = new Date() }: { now?: Date }) {
  const candidates = RACES.map((r, i) => ({ r, round: i + 1, end: raceEnd(r) }))
    .filter((x): x is typeof x & { end: Date } => !!x.end && x.end < now)
    .reverse()
    .slice(0, 8)
    .map((x) => ({ ...x, slug: eventSlug(x.r.grandPrix), gp: findGrandPrix("2026", eventSlug(x.r.grandPrix)) }))
    .filter((x) => x.gp);

  const apiOn = !!process.env.F1_API_URL;
  const ready = await Promise.all(candidates.map((x) => (apiOn ? hasResults(2026, x.gp!.name, "R") : Promise.resolve(true))));
  const latest = candidates.filter((_, i) => ready[i] === true).slice(0, 4);

  if (!latest.length) return null;

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
          {latest.map(({ r, round, end, slug }) => (
            <li key={slug} className="flex flex-col bg-[#060606] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                Round {String(round).padStart(2, "0")} · <time dateTime={end.toISOString()}>{DATE.format(end)}</time>
              </p>
              <h3 className="mt-2 text-lg font-black leading-tight text-white">{r.grandPrix}</h3>
              <p className="mt-1 text-xs text-zinc-500">{r.circuit}</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
                <Link href={`/f1/2026/${slug}/race`} className="text-red-400 underline-offset-4 hover:underline">
                  Race results &amp; telemetry
                </Link>
                <Link href={`/f1/2026/${slug}/qualifying`} className="text-zinc-300 underline-offset-4 hover:underline">
                  Qualifying
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
