"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight, Clock, RefreshCw, SlidersHorizontal, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DiamondLoader } from "@/components/ui/diamond-loader"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { PublicCard } from "@/components/site/public-card"
import { ChartViewport } from "@/components/plot-viewport/chart-viewport"
import { useGeneratorCore } from "@/components/plot-generator/use-generator-core"
import { RaceSessionPanel } from "@/components/plot-generator/race-session-panel"
import {
  ALL_DRIVERS_VALUE,
  DriverSelectionPanel,
} from "@/components/plot-generator/driver-selection-panel"
import { ExplainerPanel } from "./explainer-panel"
import {
  SIMPLE_MODE_QUESTIONS,
  plotsForQuestion,
  questionsForSession,
  type SimpleModeQuestion,
} from "@/lib/plots/simple-mode"
import { isPlotDataEmpty, isSessionRestricted } from "@/lib/plots/catalog"
import { defaultOptionsFor, type PlotDefinition, type PlotFetchContext } from "@/lib/plots/types"
import { getLatestSessionDataClient } from "@/lib/newsService"
import { drivers_2025, drivers_2026 } from "@/lib/constants/drivers"
import { ExternalApiError } from "@/lib/data-fetcher"
import { isTransientUpstreamStatus, messageForStatus } from "@/lib/api-error-message"

const CURRENT_YEAR = new Date().getFullYear()
const SEASON_DRIVERS = CURRENT_YEAR === 2025 ? drivers_2025 : drivers_2026

/** Chart settings tuned for reading rather than for exporting. */
const SIMPLE_CHART_SETTINGS = {
  showGrid: true,
  showLegend: true,
  animateChart: true,
  chartHeight: 520,
  lineThickness: 2,
  showDataLabels: false,
}

type Result =
  | { status: "idle" }
  | { status: "loading" }
  /**
   * `key` is the plot this data was fetched for. Every plot has its own data
   * shape, so rendering one plot's data through another's render function
   * throws — and switching question renders once with the previous result
   * before the fetch effect can reset it. The key makes that mismatch
   * detectable; see hasMatchingResult.
   */
  | { status: "ready"; key: string; data: unknown; ctx: PlotFetchContext }
  | { status: "empty"; message: string }
  | { status: "not_ready" }
  /** The data service is failing rather than the data being missing. */
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string }

/**
 * Chooses an opening driver selection so a visitor sees a real chart before
 * touching any control. They can change it afterwards via the picker.
 *
 * `pool` is ordered by how likely a driver is to actually have data for the
 * session — see deriveDriverPool.
 */
function pickDefaultDrivers(pool: string[], def: PlotDefinition) {
  const requirement = def.driverRequirement

  switch (requirement.kind) {
    case "pair":
      return { driver1: pool[0], driver2: pool[1] }
    case "single":
      return { driver1: pool[0] }
    case "multi":
      return { multiDrivers: pool.slice(0, requirement.max ?? 3) }
    default:
      return {}
  }
}

export function SimpleExplorer() {
  const core = useGeneratorCore({
    initialYear: String(CURRENT_YEAR),
    initialSession: "R",
    // Simple Mode opens on the most interesting session of the weekend.
    defaultSessionPick: "last",
  })

  const [questionId, setQuestionId] = useState(SIMPLE_MODE_QUESTIONS[0].id)
  const [plotKey, setPlotKey] = useState<string | null>(null)
  const [driverPool, setDriverPool] = useState<string[]>(SEASON_DRIVERS)
  const [driver1, setDriver1] = useState("")
  const [driver2, setDriver2] = useState("")
  const [multiDrivers, setMultiDrivers] = useState<string[]>([])
  const [result, setResult] = useState<Result>({ status: "idle" })
  /** Bumped by the retry button to re-run the fetch effect. */
  const [retryCount, setRetryCount] = useState(0)
  const [customiseOpen, setCustomiseOpen] = useState(false)

  // Build the driver list from whoever actually appears in the latest session,
  // so the opening selection is drivers the data service has data for. The
  // hardcoded season list is a last resort: its order is arbitrary, and picking
  // its first two blindly can land on a driver with no telemetry for the
  // session, which fails with a confusing "no position data" error.
  useEffect(() => {
    let cancelled = false
    getLatestSessionDataClient()
      .then((session) => {
        if (cancelled || !session) return
        const fromResults = (session.qualifying_results ?? session.race_results ?? [])
          .map((row) => row.Driver)
          .filter(Boolean)
        // The dashboard does not always include a results array, but its
        // throttle comparison is per-driver and covers everyone who ran.
        const fromThrottle = (session.throttle_comparison ?? [])
          .map((row) => row.Driver)
          .filter(Boolean)
        const pool = [...new Set([...fromResults, ...fromThrottle])]
        if (pool.length > 0) setDriverPool(pool)
      })
      .catch(() => {
        /* keep the season driver list */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const availableQuestions = useMemo(
    () => questionsForSession(core.selectedSession),
    [core.selectedSession],
  )

  const question: SimpleModeQuestion | undefined =
    availableQuestions.find((q) => q.id === questionId) ?? availableQuestions[0]

  const answers = useMemo(() => {
    if (!question) return []
    return plotsForQuestion(question).filter(
      (def) => !isSessionRestricted(def, core.selectedSession),
    )
  }, [question, core.selectedSession])

  const plot = answers.find((def) => def.key === plotKey) ?? answers[0]
  const requirement = plot?.driverRequirement
  const needsDrivers = requirement != null && requirement.kind !== "none"

  // Seed a sensible opening selection. Runs again when the real driver pool
  // arrives, replacing the season-list guess.
  const plotKeyForDrivers = plot?.key
  useEffect(() => {
    if (!plot) return
    const defaults = pickDefaultDrivers(driverPool, plot)
    setDriver1(defaults.driver1 ?? "")
    setDriver2(defaults.driver2 ?? "")
    setMultiDrivers(defaults.multiDrivers ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plotKeyForDrivers, driverPool])

  const eventName = core.apiEventName
  const sessionName = core.sessionName
  const sessionCode = core.selectedSession
  const year = core.selectedYear

  // Fetch as soon as everything needed is known, so a first-time visitor gets a
  // real chart without pressing anything. Unlike the expert generator this
  // costs no token: the page is public and only uses free plots.
  useEffect(() => {
    if (!plot || !eventName) return

    let cancelled = false
    const ctx: PlotFetchContext = {
      year: Number(year),
      eventName,
      sessionName,
      sessionCode,
      allDrivers: driverPool,
      options: defaultOptionsFor(plot),
      token: "",
      driver1: driver1 && driver1 !== ALL_DRIVERS_VALUE ? driver1 : undefined,
      driver2: driver2 || undefined,
      multiDrivers,
    }

    setResult({ status: "loading" })
    plot
      .fetch(ctx)
      .then((data) => {
        if (cancelled) return
        if (isPlotDataEmpty(plot, data)) {
          setResult({
            status: "empty",
            message: plot.emptyMessage ?? "No data for this session yet.",
          })
          return
        }
        setResult({ status: "ready", key: plot.key, data, ctx })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        // A session that just finished is a wait, not a failure.
        const notReady =
          error instanceof ExternalApiError &&
          (error.code === "data_not_available" || error.status === 404 || error.status === 503)
        if (notReady) {
          setResult({ status: "not_ready" })
          return
        }
        // A gateway error means the service is struggling; worth retrying.
        if (error instanceof ExternalApiError && isTransientUpstreamStatus(error.status)) {
          setResult({ status: "unavailable", message: messageForStatus(error.status) })
          return
        }
        setResult({
          status: "error",
          message: error instanceof Error ? error.message : String(error),
        })
      })

    return () => {
      cancelled = true
    }
  }, [plot, eventName, sessionName, sessionCode, year, driverPool, driver1, driver2, multiDrivers, retryCount])

  /** Carries the current selection into the expert generator. */
  const openInGenerator = useCallback(() => {
    if (!plot) return
    try {
      localStorage.setItem(
        "generator:last",
        JSON.stringify({ plotType: plot.key, year, session: sessionCode }),
      )
    } catch {
      /* the query parameter below still carries the plot type */
    }
  }, [plot, year, sessionCode])

  /** True only when the loaded data belongs to the plot now on screen. */
  const hasMatchingResult = result.status === "ready" && plot != null && result.key === plot.key

  const headline = useMemo(() => {
    if (result.status !== "ready" || !plot?.stats || result.key !== plot.key) return null
    const stats = plot.stats(result.data, result.ctx)
    const top = stats?.[0]
    if (!top) return null
    return top.sub ? `${top.label}: ${top.sub} — ${top.value}` : `${top.label}: ${top.value}`
  }, [result, plot])

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-8">
        {/* Question picker */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
            Pick a question
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableQuestions.map((item) => {
              const Icon = item.icon
              const active = item.id === question?.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setQuestionId(item.id)
                    setPlotKey(null)
                  }}
                  aria-pressed={active}
                  className={`border p-4 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-zinc-500"}`} />
                    <span className="text-sm font-semibold">{item.question}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{item.blurb}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Session context + customise */}
        <PublicCard className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline" className="border-primary/40 text-primary">
                {year}
              </Badge>
              <span className="font-medium">{core.selectedEventName || "Loading…"}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400">{sessionName}</span>
            </div>
            <Collapsible open={customiseOpen} onOpenChange={setCustomiseOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-zinc-400">
                  <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
                  {customiseOpen ? "Hide options" : "Change race or session"}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
          <Collapsible open={customiseOpen} onOpenChange={setCustomiseOpen}>
            <CollapsibleContent className="pt-4">
              <RaceSessionPanel
                years={["2025", "2026"]}
                selectedYear={year}
                onYearChange={core.setSelectedYear}
                events={core.availableEvents}
                selectedEventName={core.selectedEventName}
                onEventChange={core.setSelectedEventName}
                sessions={core.availableSessions}
                selectedSession={sessionCode}
                onSessionChange={core.setSelectedSession}
                scope="session"
                filterToFinished
                onRefresh={core.handleRefreshSessions}
                isRefreshing={core.isRefreshingSessions}
                onUseLatestRace={core.useLatestRace}
                isResolvingLatestRace={core.isResolvingLatestRace}
              />
            </CollapsibleContent>
          </Collapsible>
        </PublicCard>

        {/* Drivers. Shown outright rather than tucked behind "options": a
            question like "how do two drivers compare?" is meaningless until you
            can say which two. */}
        {plot && needsDrivers && requirement && (
          <PublicCard className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                Drivers
              </p>
            </div>
            <div className="mt-3">
              <DriverSelectionPanel
                requirement={requirement}
                allDrivers={driverPool}
                driver1={driver1}
                driver2={driver2}
                multiDrivers={multiDrivers}
                onDriver1Change={setDriver1}
                onDriver2Change={setDriver2}
                onMultiDriversChange={setMultiDrivers}
              />
            </div>
          </PublicCard>
        )}

        {/* Answer */}
        {plot && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              {answers.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {answers.map((def) => (
                    <Button
                      key={def.key}
                      variant={def.key === plot.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPlotKey(def.key)}
                      className="rounded-none"
                    >
                      {def.shortTitle}
                    </Button>
                  ))}
                </div>
              )}

              {headline && (
                <PublicCard accent className="px-5 py-3">
                  <p className="font-mono text-sm font-bold tabular-nums">{headline}</p>
                </PublicCard>
              )}

              <PublicCard className="p-4">
                {hasMatchingResult && result.status === "ready" ? (
                  <ChartViewport title={plot.title} domainZoomable={plot.domainZoomable}>
                    {({ isExpanded }) =>
                      plot.render(
                        result.data,
                        {
                          ...SIMPLE_CHART_SETTINGS,
                          chartHeight: isExpanded
                            ? Math.max(400, Math.round(window.innerHeight * 0.92) - 110)
                            : SIMPLE_CHART_SETTINGS.chartHeight,
                        },
                        result.ctx,
                      )
                    }
                  </ChartViewport>
                ) : (
                  <StatusPanel
                    // A ready-but-mismatched result means the next fetch has
                    // not started yet; show it as loading rather than as data.
                    result={result.status === "ready" ? { status: "loading" } : result}
                    onRetry={() => setRetryCount((count) => count + 1)}
                    driverHint={needsDrivers}
                  />
                )}
              </PublicCard>

              <div className="flex flex-wrap items-center gap-3">
                <Button asChild variant="outline" className="rounded-none">
                  <Link href={`/generator?plot=${plot.key}`} onClick={openInGenerator}>
                    Open in the full generator
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-xs text-zinc-500">
                  25 more chart types, every session back to 2025.
                </p>
              </div>
            </div>

            {plot.explainer && <ExplainerPanel explainer={plot.explainer} />}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

/** Everything the chart area shows when there is no chart to show. */
function StatusPanel({
  result,
  onRetry,
  driverHint,
}: {
  result: Exclude<Result, { status: "ready" }>
  onRetry: () => void
  /** Suggest changing drivers — some pairings genuinely have no data. */
  driverHint?: boolean
}) {
  const base = "flex h-[520px] flex-col items-center justify-center gap-3 text-center"

  if (result.status === "loading" || result.status === "idle") {
    return (
      <div className={`${base} text-zinc-500`}>
        <DiamondLoader size={36} label="Loading the data…" />
      </div>
    )
  }

  if (result.status === "not_ready") {
    return (
      <div className={`${base} text-zinc-400`}>
        <Clock className="h-5 w-5 text-primary" />
        <p className="text-sm font-medium">Data on the way</p>
        <p className="max-w-sm text-xs text-zinc-500">
          This session finished recently and the timing data is still being processed. It usually
          takes a few minutes.
        </p>
        <RetryButton onRetry={onRetry} />
      </div>
    )
  }

  if (result.status === "unavailable") {
    return (
      <div className={`${base} text-zinc-400`}>
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
        <p className="text-sm font-medium">Service temporarily unavailable</p>
        <p className="max-w-sm text-xs text-zinc-500">{result.message}</p>
        <RetryButton onRetry={onRetry} />
      </div>
    )
  }

  return (
    <div className={`${base} text-zinc-400`}>
      <AlertTriangle className="h-5 w-5 text-yellow-500" />
      <p className="text-sm font-medium">
        {result.status === "empty" ? "Nothing to show here" : "Could not load this chart"}
      </p>
      <p className="max-w-sm text-xs text-zinc-500">{result.message}</p>
      {driverHint && (
        <p className="max-w-sm text-xs text-zinc-600">
          Not every driver has data for every session — try a different driver above.
        </p>
      )}
      <RetryButton onRetry={onRetry} />
    </div>
  )
}

function RetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <Button variant="outline" size="sm" className="mt-1 rounded-none" onClick={onRetry}>
      <RefreshCw className="mr-2 h-3.5 w-3.5" />
      Try again
    </Button>
  )
}
