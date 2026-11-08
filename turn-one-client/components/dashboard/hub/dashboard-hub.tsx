"use client"

import * as React from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ArrowRight, Flag, Laptop, ListOrdered, PlaySquare, Rocket, Timer } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { SectionCard } from "@/components/dashboard/simracing/section-card"
import { DailyGiftWidget } from "@/components/dashboard/daily-gift-widget"
import { formatLastSeen, useLinkStatus } from "@/components/dashboard/shell/link-status-pill"
import { useAuth } from "@/components/auth/auth-provider"
import { formatLapTime, getMySessions, request, type SimSession } from "@/lib/simracing/api"
import { getPersonalBests, type PersonalBest } from "@/lib/simracing/leaderboards"
import { useSimFilter } from "@/lib/simracing/sim-filter"
import { matchesSimFilter, simLabel } from "@/lib/simracing/sims"
import type { ChannelVideo } from "@/lib/server/youtube-feed"

/**
 * /dashboard — the personal hub (grill 2026-11-08, G5): short cards that each
 * hand off to the page that owns the detail. /simracing stays the full overview.
 */

const linkClass =
  "inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline"

type BetaStatus = "none" | "Pending" | "Accepted" | "Declined" | "unknown"

/** GET api/simracing/beta/me (closed-beta applications). 404 means "not applied yet". */
function useBetaStatus(): BetaStatus | null {
  const [status, setStatus] = React.useState<BetaStatus | null>(null)
  React.useEffect(() => {
    request<{ status?: string } | null>("/api/simracing/beta/me")
      .then((r) => {
        const s = r?.status
        setStatus(s === "Pending" || s === "Accepted" || s === "Declined" ? s : r ? "unknown" : "none")
      })
      .catch((err: { status?: number }) => setStatus(err?.status === 404 ? "none" : "unknown"))
  }, [])
  return status
}

function BetaCard() {
  const status = useBetaStatus()
  if (status === null || status === "Accepted" || status === "unknown") return null

  const copy =
    status === "none"
      ? { title: "Join the closed beta", body: "Tell us which sims you drive and on what. We pick 20–50 drivers for January 2027.", cta: "Apply" }
      : status === "Pending"
        ? { title: "Beta application received", body: "We'll email you when your place is confirmed. You can still change your answers.", cta: "Edit answers" }
        : { title: "Not this round", body: "The first beta round is full. You stay on the list for the next one.", cta: "View application" }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-primary/40 bg-primary/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Rocket className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="font-display text-lg leading-none">{copy.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{copy.body}</p>
        </div>
      </div>
      <Link
        href="/simracing/beta"
        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-4 font-display text-sm text-primary-foreground hover:bg-primary/90"
      >
        {copy.cta}
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </section>
  )
}

function LinkCard() {
  const status = useLinkStatus()
  return (
    <SectionCard label="Turn One Link" title="Your rig" icon={Laptop} loading={status.kind === "loading"}>
      {status.kind === "none" ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">No device paired yet. Link records every lap in ACC, F1 25/26 and iRacing.</p>
          <Link href="/simracing/download" className={linkClass}>
            Set up Turn One Link <ArrowRight className="size-3" />
          </Link>
        </div>
      ) : status.kind === "online" || status.kind === "offline" ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className={`size-2 rounded-full ${status.kind === "online" ? "bg-timing-pb" : "bg-muted-foreground/50"}`}
            />
            {status.device?.name ?? "Your device"} ·{" "}
            <span className="text-muted-foreground">
              {status.kind === "online" ? "online now" : `last seen ${formatLastSeen(status.device?.lastSeenAt)}`}
            </span>
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/link" className={linkClass}>Manage devices</Link>
            <Link href="/simracing/download#guides" className={linkClass}>Setup guides</Link>
          </div>
        </div>
      ) : null}
    </SectionCard>
  )
}

function LastSessionCard({ sessions, loading }: { sessions: SimSession[]; loading: boolean }) {
  const latest = sessions[0]
  return (
    <SectionCard
      label="Last session"
      title={latest ? `${latest.track} · ${simLabel(latest.source)}` : "No laps yet"}
      icon={Timer}
      loading={loading}
    >
      {latest ? (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <span className="truncate text-sm text-muted-foreground">{latest.carModel || "Unknown car"}</span>
            <span className="font-mono text-xl tabular-nums">{formatLapTime(latest.bestLapMs)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {latest.lapCount} laps · {formatDistanceToNow(new Date(latest.startedAt), { addSuffix: true })}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={`/simracing/sessions/${latest.id}`} className={linkClass}>
              Open session <ArrowRight className="size-3" />
            </Link>
            <Link href="/simracing/analysis" className={linkClass}>Compare laps</Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Drive a few laps with Turn One Link running and they show up here.</p>
      )}
    </SectionCard>
  )
}

function PbsCard({ username }: { username: string | undefined }) {
  const { filter } = useSimFilter()
  const [pbs, setPbs] = React.useState<PersonalBest[] | null>(null)

  React.useEffect(() => {
    if (!username) return
    getPersonalBests(username)
      .then(setPbs)
      .catch(() => setPbs([]))
  }, [username])

  const shown = (pbs ?? [])
    .filter((pb) => matchesSimFilter(pb.source, filter))
    .sort((a, b) => a.rank / a.total - b.rank / b.total)
    .slice(0, 4)

  return (
    <SectionCard
      label="Compete"
      title="Your PBs and ranks"
      icon={ListOrdered}
      loading={pbs === null && !!username}
      actions={
        username ? (
          <Link href={`/simracing/drivers/${encodeURIComponent(username)}`} className={linkClass}>
            Driver page
          </Link>
        ) : null
      }
      flush
    >
      {shown.length ? (
        <ul className="divide-y divide-border">
          {shown.map((pb) => (
            <li key={pb.lapId} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
              <span className="min-w-0 truncate">
                {pb.trackName}
                <span className="ml-2 text-xs text-muted-foreground">{simLabel(pb.source)}{pb.carName ? ` · ${pb.carName}` : ""}</span>
              </span>
              <span className="flex shrink-0 items-baseline gap-3 font-mono tabular-nums">
                <span>{formatLapTime(pb.lapTimeMs)}</span>
                <span className="text-xs text-muted-foreground">#{pb.rank}/{pb.total}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-4 text-sm text-muted-foreground">
          Valid flying laps rank automatically. <Link href="/simracing/leaderboards" className={linkClass}>See the leaderboards</Link>
        </p>
      )}
    </SectionCard>
  )
}

function ChannelCard({ videos }: { videos: ChannelVideo[] }) {
  if (!videos.length) return null
  return (
    <SectionCard label="From the channel" title="Latest on Turn One" icon={PlaySquare} flush>
      <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-3">
        {videos.map((v) => (
          <a key={v.id} href={v.url} target="_blank" rel="noreferrer" className="group bg-card p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail, no next/image config needed */}
            <img src={v.thumbnail} alt="" loading="lazy" className="aspect-video w-full rounded object-cover" />
            <p className="mt-2 line-clamp-2 text-sm group-hover:text-primary">{v.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(v.publishedAt), { addSuffix: true })}
            </p>
          </a>
        ))}
      </div>
    </SectionCard>
  )
}

export function DashboardHub({ videos }: { videos: ChannelVideo[] }) {
  const { user } = useAuth()
  const { filter } = useSimFilter()
  const [sessions, setSessions] = React.useState<SimSession[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    getMySessions()
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [])

  const recent = React.useMemo(
    () =>
      sessions
        .filter((s) => matchesSimFilter(s.source, filter))
        .sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt)),
    [sessions, filter],
  )

  return (
    <main className="w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      <PageHeader
        label="Home"
        title={user?.username ? `Welcome back, ${user.username}` : "Welcome back"}
        description="Your rig, your last laps and where you rank."
      />

      <BetaCard />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LinkCard />
        <LastSessionCard sessions={recent} loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <PbsCard username={user?.username} />
        <DailyGiftWidget onGiftClaimed={() => window.location.reload()} />
      </div>

      <ChannelCard videos={videos} />

      <Link
        href="/f1"
        className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-3 text-sm text-muted-foreground hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <Flag className="size-4" aria-hidden />
          F1 Archive: browse past Grand Prix sessions
        </span>
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </main>
  )
}
