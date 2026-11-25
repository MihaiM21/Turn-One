"use client"

import * as React from "react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { ArrowRight, History, ListOrdered } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { SectionCard } from "@/components/dashboard/simracing/section-card"
import { formatLastSeen, useLinkStatus } from "@/components/dashboard/shell/link-status-pill"
import { SETUP_STEPS } from "@/components/turn-one-link/setup-content"
import { useAuth } from "@/components/auth/auth-provider"
import { useBetaStatus } from "@/hooks/use-beta-status"
import { formatLapTime, getMySessions, type SimSession } from "@/lib/simracing/api"
import { getPersonalBests, type PersonalBest } from "@/lib/simracing/leaderboards"
import { useSimFilter } from "@/lib/simracing/sim-filter"
import { matchesSimFilter, simLabel } from "@/lib/simracing/sims"

/**
 * /dashboard — the one Home (PBI-065). It used to share its job with /simracing
 * ("Cockpit"), which now redirects here. Top to bottom: the last session as the
 * lead element, then personal bests and recent sessions, then Link in one line.
 */

const linkClass =
  "inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline"

const primaryButtonClass =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-primary px-5 font-display text-sm text-primary-foreground transition-colors hover:bg-primary/90"

/** The lead element: the session you are driving now, or the last one you drove. */
function LeadSession({ session, live }: { session: SimSession | undefined; live: boolean }) {
  if (!session) {
    return (
      <section className="rounded-lg border border-border bg-card px-5 py-6 sm:px-6">
        <p className="eyebrow text-[10px]">Last session</p>
        <p className="mt-2 text-sm text-muted-foreground">
          No sessions for this sim yet. Pick another sim in the filter, or drive a few laps with Link running.
        </p>
      </section>
    )
  }

  const details = [
    simLabel(session.source),
    session.carModel || "Unknown car",
    `${session.lapCount} lap${session.lapCount === 1 ? "" : "s"}`,
    formatDistanceToNow(new Date(session.startedAt), { addSuffix: true }),
  ]

  return (
    <section className="rounded-lg border border-border bg-card px-5 py-5 sm:px-6 sm:py-6">
      <p className="eyebrow flex items-center gap-2 text-[10px]">
        {live ? <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-timing-pb" /> : null}
        {live ? "On track now" : "Last session"}
      </p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display truncate text-3xl leading-none sm:text-4xl">{session.track}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{details.join(" · ")}</p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="eyebrow text-[10px]">Best lap</p>
          <p className="mt-1 font-mono text-4xl leading-none tabular-nums text-primary">
            {formatLapTime(session.bestLapMs)}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link href={live ? "/simracing/live" : `/simracing/sessions/${session.id}`} className={primaryButtonClass}>
          {live ? "Open live cockpit" : "Open analysis"}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link href="/simracing/sessions" className={linkClass}>
          All sessions
        </Link>
      </div>
    </section>
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
    .slice(0, 5)

  return (
    <SectionCard
      label="Compete"
      title="Your PBs and ranks"
      icon={ListOrdered}
      variant="quiet"
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
                <span className="ml-2 text-xs text-muted-foreground">
                  {simLabel(pb.source)}
                  {pb.carName ? ` · ${pb.carName}` : ""}
                </span>
              </span>
              <span className="flex shrink-0 items-baseline gap-3 font-mono tabular-nums">
                <span>{formatLapTime(pb.lapTimeMs)}</span>
                <span className="text-xs text-muted-foreground">
                  #{pb.rank}/{pb.total}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-4 text-sm text-muted-foreground">
          Valid flying laps rank automatically.{" "}
          <Link href="/simracing/leaderboards" className={linkClass}>
            See the leaderboards
          </Link>
        </p>
      )}
    </SectionCard>
  )
}

function RecentSessions({ sessions }: { sessions: SimSession[] }) {
  return (
    <SectionCard
      label="Recent"
      title="Earlier sessions"
      icon={History}
      variant="quiet"
      actions={
        <Link href="/simracing/sessions" className={linkClass}>
          View all
        </Link>
      }
      flush
    >
      {sessions.length ? (
        <ul className="divide-y divide-border">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/simracing/sessions/${s.id}`}
                className="flex items-center gap-3 px-5 py-2.5 text-sm transition-colors hover:bg-secondary/60"
              >
                <span className="w-24 shrink-0 text-xs text-muted-foreground">
                  {format(new Date(s.startedAt), "MMM d, HH:mm")}
                </span>
                <span className="min-w-0 truncate">{s.track}</span>
                <span className="ml-auto shrink-0 font-mono tabular-nums">
                  {s.bestLapMs > 0 ? formatLapTime(s.bestLapMs) : `${s.lapCount} laps`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-4 text-sm text-muted-foreground">Your earlier sessions show up here.</p>
      )}
    </SectionCard>
  )
}

/** Link status in one line; the sidebar pill carries the same state on every page. */
function LinkLine() {
  const status = useLinkStatus()
  if (status.kind === "loading") return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border px-5 pt-4 text-sm">
      {status.kind === "none" ? (
        <>
          <span className="text-muted-foreground">Turn One Link · no device paired yet</span>
          <Link href="/simracing/download" className={linkClass}>
            Set up Turn One Link <ArrowRight className="size-3" aria-hidden />
          </Link>
        </>
      ) : (
        <>
          <span className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden
              className={`size-2 shrink-0 rounded-full ${status.kind === "online" ? "bg-timing-pb" : "bg-muted-foreground/50"}`}
            />
            <span className="truncate">
              {status.device?.name ?? "Your device"}{" "}
              <span className="text-muted-foreground">
                · {status.kind === "online" ? "online now" : `last seen ${formatLastSeen(status.device?.lastSeenAt)}`}
              </span>
            </span>
          </span>
          <span className="flex gap-4">
            <Link href="/link" className={linkClass}>
              Manage devices
            </Link>
            <Link href="/simracing/download#guides" className={linkClass}>
              Setup guides
            </Link>
          </span>
        </>
      )}
    </div>
  )
}

/** Only a pending application is worth a line here; the sidebar keeps the way in until you are accepted. */
function BetaPendingLine() {
  const status = useBetaStatus()
  if (status !== "pending") return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-primary/40 bg-primary/5 px-5 py-3 text-sm">
      <span>
        Beta application received.{" "}
        <span className="text-muted-foreground">The decision shows up here and on your beta page.</span>
      </span>
      <Link href="/simracing/beta" className={linkClass}>
        Edit answers <ArrowRight className="size-3" aria-hidden />
      </Link>
    </div>
  )
}

/** A driver with no laps sees how to get the first one, and nothing else. */
function FirstLapSteps() {
  return (
    <section className="rounded-lg border border-border bg-card px-5 py-5 sm:px-6 sm:py-6">
      <p className="eyebrow text-[10px]">Get started</p>
      <h2 className="font-display mt-2 text-3xl leading-none">Four steps to your first lap</h2>
      <ol className="mt-5 divide-y divide-border">
        {SETUP_STEPS.map((step, i) => {
          const StepIcon = step.icon
          return (
            <li key={step.title} className="flex gap-4 py-3 first:pt-0 last:pb-0">
              <span className="flex size-6 shrink-0 items-center justify-center rounded border border-primary/40 font-mono text-[10px] font-bold text-primary">
                {i + 1}
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <StepIcon className="size-3.5 text-primary" aria-hidden />
                  {step.title}
                </p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </li>
          )
        })}
      </ol>
      <Link href="/simracing/download" className={`${primaryButtonClass} mt-6`}>
        Get Turn One Link
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  )
}

export function DashboardHub() {
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
  const live = sessions.find((s) => s.isActive)
  const lead = live ?? recent[0]

  return (
    <main className="w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      <PageHeader
        label="Home"
        title={user?.username ? `Welcome back, ${user.username}` : "Welcome back"}
        description="Your last session, your personal bests and your rig."
      />

      {loading ? (
        <SectionCard loading />
      ) : sessions.length === 0 ? (
        <FirstLapSteps />
      ) : (
        <>
          <LeadSession session={lead} live={!!live} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PbsCard username={user?.username} />
            <RecentSessions sessions={recent.filter((s) => s.id !== lead?.id).slice(0, 5)} />
          </div>

          <LinkLine />
          <BetaPendingLine />
        </>
      )}
    </main>
  )
}
