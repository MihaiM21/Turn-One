import { FlaskConical, MonitorPlay } from "lucide-react"

import { cn } from "@/lib/utils"
import { SIMS } from "@/lib/simracing/sims"
import { simApiBase } from "@/lib/simracing/api"
import type { Board } from "@/lib/simracing/leaderboards"
import type { ChannelVideo } from "@/lib/server/youtube-feed"
import { HOW_IT_WORKS } from "./data"
import { Eyebrow, container } from "./sections"
import { formatLap } from "./sample-lap"

function SectionHead({ eyebrow, title, id, body }: { eyebrow: string; title: string; id: string; body?: string }) {
  return (
    <div className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={id} className="font-display mt-3 text-balance text-4xl leading-[0.95] text-foreground sm:text-5xl">
        {title}
      </h2>
      {body ? <p className="mt-4 text-pretty text-base leading-relaxed text-foreground/80">{body}</p> : null}
    </div>
  )
}

/* ── How it works ────────────────────────────────────────────────────────── */

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className={cn(container, "scroll-mt-20 py-16 md:py-24")}>
      <SectionHead eyebrow="How it works" title="Three steps, then just drive." id="how-title" />
      <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
        {HOW_IT_WORKS.map((s) => (
          <li key={s.step} className="bg-card p-6">
            <span className="font-mono text-sm tabular-nums text-primary">{s.step}</span>
            <h3 className="font-display mt-3 text-2xl leading-none">{s.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ── Supported sims ──────────────────────────────────────────────────────── */

/** One card per game (F1 25 and F1 26 share one), straight from lib/simracing/sims.ts. */
const SIM_CARDS = [
  { title: "Assetto Corsa Competizione", sims: SIMS.filter((s) => s.id === "acc") },
  { title: "EA SPORTS F1 25 · F1 26", sims: SIMS.filter((s) => s.id === "f1_25" || s.id === "f1_26") },
  { title: "iRacing", sims: SIMS.filter((s) => s.id === "iracing") },
  { title: "Assetto Corsa", sims: SIMS.filter((s) => s.id === "ac") },
]

export function SupportedSims() {
  return (
    <section aria-labelledby="sims-title" className="border-y border-border bg-card">
      <div className={cn(container, "py-16 md:py-24")}>
        <SectionHead
          eyebrow="Supported sims"
          title="The sims you already drive."
          id="sims-title"
          body="Turn One Link reads the telemetry each sim publishes for dashboards. No mods, nothing to install inside the game."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SIM_CARDS.map(({ title, sims }) => {
            const meta = sims[0]
            const platforms = [...new Set(sims.flatMap((s) => s.platforms))]
            return (
              <li key={title} className={cn("flex flex-col rounded-lg border border-border bg-background p-5", meta.experimental && "opacity-80")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-xl leading-none">{sims.map((s) => s.short).join(" · ")}</span>
                  {meta.experimental ? (
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      <FlaskConical className="size-3" aria-hidden /> Experimental
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-2 text-sm text-foreground/85">{title}</h3>
                <p className="mt-3 flex-1 text-xs leading-relaxed text-muted-foreground">Reads {meta.reads}.</p>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{platforms.join(" · ")}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/* ── Live leaderboard teaser ─────────────────────────────────────────────── */

/**
 * Boards worth showing on the landing, in order; the first one with laps wins.
 * Narrow rollout: widen by adding a row here.
 */
export const FEATURED_BOARDS: { source: string; track: string }[] = [
  { source: "acc", track: "spa" },
  { source: "acc", track: "paul_ricard" },
  { source: "acc", track: "monza" },
  { source: "f1_25", track: "spa" },
]

async function firstNonEmptyBoard(): Promise<{ board: Board; source: string } | null> {
  for (const { source, track } of FEATURED_BOARDS) {
    try {
      const res = await fetch(`${simApiBase()}/api/simracing/leaderboards?source=${source}&track=${track}&period=all&size=5`, {
        next: { revalidate: 300 },
      })
      if (!res.ok) continue
      const board = (await res.json()) as Board
      if (board.entries?.length) return { board, source }
    } catch {
      // Backend unreachable: the section simply doesn't render.
      return null
    }
  }
  return null
}

/** Real top 5 from the API. Hidden while every featured board is empty (no invented rows). */
export async function LeaderboardTeaser() {
  const hit = await firstNonEmptyBoard()
  if (!hit) return null
  const { board, source } = hit
  const sim = SIMS.find((s) => s.id === source)?.short ?? source
  return (
    <section id="leaderboard" aria-labelledby="lb-title" className={cn(container, "scroll-mt-20 py-16 md:py-24")}>
      <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-center">
        <SectionHead
          eyebrow="Leaderboards"
          title="Verified laps only."
          id="lb-title"
          body="Every lap is checked on the server before it ranks: valid in the sim, flying lap, sectors add up, full track length, plausible speed."
        />
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-display text-lg leading-none">{board.trackName}</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {sim}
              {board.carName ? ` · ${board.carName}` : ""} · live
            </span>
          </div>
          <ol className="divide-y divide-border">
            {board.entries.slice(0, 5).map((e) => (
              <li key={e.lapId} className="flex items-center gap-4 px-4 py-2.5 text-sm">
                <span className="w-5 font-mono tabular-nums text-muted-foreground">{e.rank}</span>
                <span className="flex-1 truncate">{e.driver}</span>
                <span className="font-mono tabular-nums">{formatLap(e.lapTimeMs)}</span>
                <span className="w-16 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {e.rank === 1 ? "" : `+${(e.gapMs / 1000).toFixed(3)}`}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/* ── Broadcast ───────────────────────────────────────────────────────────── */

const OVERLAYS = [
  { name: "Cockpit", body: "Speed, gear, RPM and pedal inputs." },
  { name: "Lap timer", body: "Current lap, last lap and delta to your best." },
  { name: "Leaderboard", body: "Where your best lap ranks on this track." },
]

export function Broadcast() {
  return (
    <section id="broadcast" aria-labelledby="broadcast-title" className="scroll-mt-20 border-y border-border bg-card">
      <div className={cn(container, "grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-24")}>
        <SectionHead
          eyebrow="Broadcast"
          title="Your telemetry, on stream."
          id="broadcast-title"
          body="Add a browser source in OBS and your viewers see what you see, fed live from Turn One Link. Spectators can also follow a public session on the website."
        />
        <ul className="grid gap-3">
          {OVERLAYS.map((o) => (
            <li key={o.name} className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
              <MonitorPlay className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="font-display text-lg leading-none">{o.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{o.body}</p>
              </div>
            </li>
          ))}
          <li className="text-xs text-muted-foreground">Overlays and spectating are part of the paid plans.</li>
        </ul>
      </div>
    </section>
  )
}

/* ── From the channel ────────────────────────────────────────────────────── */

export function ChannelSection({ videos, channelUrl }: { videos: ChannelVideo[]; channelUrl: string | null }) {
  if (!videos.length) return null
  return (
    <section aria-labelledby="channel-title" className={cn(container, "py-16 md:py-24")}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead eyebrow="From the channel" title="Turn One on YouTube." id="channel-title" />
        {channelUrl ? (
          <a
            href={channelUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center px-5 font-display text-sm tracking-[0.08em] text-foreground/85 ring-1 ring-border hover:text-foreground hover:ring-muted-foreground/50"
          >
            Open the channel
          </a>
        ) : null}
      </div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-3">
        {videos.map((v) => (
          <li key={v.id}>
            <a href={v.url} target="_blank" rel="noreferrer" className="group block">
              {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail */}
              <img src={v.thumbnail} alt="" loading="lazy" className="aspect-video w-full rounded-lg border border-border object-cover" />
              <p className="mt-3 line-clamp-2 text-sm text-foreground/90 group-hover:text-primary">{v.title}</p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}