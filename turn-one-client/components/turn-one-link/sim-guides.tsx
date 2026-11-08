"use client"

import { formatDistanceToNow } from "date-fns"
import { CheckCircle2, CircleDashed, FlaskConical } from "lucide-react"

import { SectionCard } from "@/components/dashboard/simracing/section-card"
import { SIMS, type SimMeta } from "@/lib/simracing/sims"
import type { SimSession } from "@/lib/simracing/api"

/**
 * Per-sim setup guides for Turn One Link (grill 2026-11-08, G10). Values below
 * match the Link source: F1 UDP default port 20777 (`F1UdpTelemetrySource.DefaultPort`,
 * override with F1_UDP_PORT), formats 2025/2026 resolved from the packet header.
 */

interface Guide {
  anchor: string
  title: string
  sims: SimMeta[]
  steps: string[]
  note?: string
}

const bySims = (...ids: string[]) => SIMS.filter((s) => ids.includes(s.id))

const GUIDES: Guide[] = [
  {
    anchor: "acc",
    title: "Assetto Corsa Competizione",
    sims: bySims("acc"),
    steps: [
      "Nothing to switch on in the game: ACC publishes its telemetry for dashboards by default.",
      "Start Turn One Link (before or after ACC) and sign in.",
      "Drive. Every lap is recorded locally and uploaded when the session ends.",
    ],
  },
  {
    anchor: "f1",
    title: "EA SPORTS F1 25 and F1 26",
    sims: bySims("f1_25", "f1_26"),
    steps: [
      "In the game: Settings → Telemetry Settings → UDP Telemetry: On.",
      "UDP Format: 2025 for F1 25, 2026 for F1 26. UDP Port: 20777. Send rate: 20 Hz or higher.",
      "Same PC: UDP IP Address 127.0.0.1. PS5 or Xbox: enter the IP address of the PC running Link, on the same network.",
      "Start Turn One Link. On console, switch on Settings → Telemetry → \"F1 on PlayStation / Xbox\"; Link's log then shows the IP and port to enter in the game.",
    ],
    note: "Console support is new in this beta. If no laps appear, tell us on Discord which console and game you use.",
  },
  {
    anchor: "iracing",
    title: "iRacing",
    sims: bySims("iracing"),
    steps: [
      "Nothing to switch on: Link reads the telemetry iRacing exposes to companion apps.",
      "Start Turn One Link, then join a session. Link opens a new Turn One session whenever iRacing changes session.",
    ],
    note: "iRacing lap timing is new in this beta. Laps rank once the track and car are confirmed in our catalog.",
  },
  {
    anchor: "ac",
    title: "Assetto Corsa (experimental)",
    sims: bySims("ac"),
    steps: ["Start Turn One Link while Assetto Corsa is running."],
    note: "Experimental: lap validity isn't read yet, so AC laps are recorded but never rank on leaderboards.",
  },
]

function latestFor(sims: SimMeta[], sessions: SimSession[] | null): SimSession | null {
  if (!sessions) return null
  const sources = new Set(sims.map((s) => s.source))
  return (
    sessions
      .filter((s) => s.source && sources.has(s.source as SimMeta["source"]))
      .sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt))[0] ?? null
  )
}

function TelemetryCheck({ session }: { session: SimSession | null }) {
  if (!session) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CircleDashed className="size-3.5" aria-hidden />
        No session received yet
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-timing-pb">
      <CheckCircle2 className="size-3.5" aria-hidden />
      Telemetry OK · last session {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
    </span>
  )
}

export function SimGuides({ sessions }: { sessions: SimSession[] | null }) {
  return (
    <section id="guides" className="scroll-mt-20 space-y-4">
      <div>
        <p className="eyebrow">Setup</p>
        <h2 className="font-display mt-1 text-2xl leading-none">Set up your sim</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {GUIDES.map((g) => {
          const experimental = g.sims.every((s) => s.experimental)
          return (
            <div key={g.anchor} id={g.anchor} className="scroll-mt-20">
              <SectionCard
                label={g.sims.map((s) => s.short).join(" · ")}
                title={g.title}
                icon={experimental ? FlaskConical : undefined}
                iconClassName="text-muted-foreground"
                actions={<TelemetryCheck session={latestFor(g.sims, sessions)} />}
                className="h-full"
              >
                <ol className="list-decimal space-y-1.5 pl-4 text-sm text-foreground/85 marker:text-muted-foreground">
                  {g.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                {g.note ? <p className="mt-3 text-xs text-muted-foreground">{g.note}</p> : null}
              </SectionCard>
            </div>
          )
        })}
      </div>
    </section>
  )
}
