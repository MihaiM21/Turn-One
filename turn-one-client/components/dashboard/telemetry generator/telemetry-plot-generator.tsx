"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertTriangle,
  Code2,
  Coins,
  Download,
  HelpCircle,
  Play,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import type { AdvancedPlotSettings } from "@/types/plot-types"
import {
  PLOT_BY_KEY,
  PLOT_CATALOG,
  isPlotDataEmpty,
  isSessionRestricted,
} from "@/lib/plots/catalog"
import { defaultOptionsFor, type PlotDefinition, type PlotFetchContext } from "@/lib/plots/types"
import { drivers_2025, drivers_2026 } from "@/lib/constants/drivers"
import { LoadingPlot } from "./loading_plot"
import { useTokens } from "@/hooks/use-tokens"
import { usePlotSharing } from "@/hooks/use-plot-sharing"
import { ShareControls } from "./share-controls"
import { logTelemetryRequest } from "@/lib/userService"
import { useAuth } from "@/components/auth/auth-provider"
import { PlotTypePicker, type PlotType } from "./plot-type-picker"
import { GeneratorTour, TOUR_STORAGE_KEY } from "./generator-tour"
import { useGeneratorCore } from "@/components/plot-generator/use-generator-core"
import { RaceSessionPanel } from "@/components/plot-generator/race-session-panel"
import {
  ALL_DRIVERS_VALUE,
  DriverSelectionPanel,
} from "@/components/plot-generator/driver-selection-panel"
import { PlotOptionsPanel } from "@/components/plot-generator/plot-options-panel"
import {
  AdvancedSettingsPanel,
  DEFAULT_CHART_SETTINGS,
  type ChartSettingsState,
} from "@/components/plot-generator/advanced-settings-panel"

let drivers: string[]
const currentYear = new Date().getFullYear()
switch (currentYear) {
  case 2025:
    drivers = drivers_2025
    break
  case 2026:
    drivers = drivers_2026
    break
  default:
    drivers = drivers_2025
}

const LAST_STATE_KEY = "generator:last"

type PersistedState = {
  plotType?: string
  year?: string
  session?: string
}

function readPersisted(): PersistedState {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(LAST_STATE_KEY)
    return raw ? (JSON.parse(raw) as PersistedState) : {}
  } catch {
    return {}
  }
}

const plotTypes: PlotType[] = PLOT_CATALOG.map((p) => ({
  id: p.key,
  name: p.title,
  icon: p.icon,
  description: p.description,
  isPro: Boolean(p.isPro),
  category: p.category,
}))

/** Frees the blob URL held by an image-mode result (track_comparison). */
function releaseImageUrl(data: unknown) {
  const r = data as { mode?: string; url?: string } | null
  if (r && r.mode === "image" && typeof r.url === "string") {
    URL.revokeObjectURL(r.url)
  }
}

type GeneratedPlot = {
  key: string
  data: unknown
  ctx: PlotFetchContext
}

export function TelemetryPlotGenerator() {
  const persisted = typeof window !== "undefined" ? readPersisted() : {}
  const searchParams = useSearchParams()
  const plotFromUrl = searchParams.get("plot")

  const [selectedPlotType, setSelectedPlotType] = useState(
    plotFromUrl && PLOT_BY_KEY.has(plotFromUrl)
      ? plotFromUrl
      : persisted.plotType && PLOT_BY_KEY.has(persisted.plotType)
        ? persisted.plotType
        : "topspeeds"
  )
  const selectedPlot: PlotDefinition = PLOT_BY_KEY.get(selectedPlotType) ?? PLOT_CATALOG[0]

  const core = useGeneratorCore({
    initialYear: persisted.year ?? "2026",
    initialSession: persisted.session ?? "FP1",
    defaultSessionPick: "first",
    notify: { success: (m) => toast.success(m), error: (m) => toast.error(m) },
  })

  const [driver1, setDriver1] = useState("VER")
  const [driver2, setDriver2] = useState("HAM")
  const [multiDrivers, setMultiDrivers] = useState<string[]>([])
  const [optionValues, setOptionValues] = useState<Record<string, unknown>>(() =>
    defaultOptionsFor(selectedPlot)
  )

  const [isGenerating, setIsGenerating] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [chartSettings, setChartSettings] = useState<ChartSettingsState>(DEFAULT_CHART_SETTINGS)
  const [generated, setGenerated] = useState<GeneratedPlot | null>(null)
  const [tourOpen, setTourOpen] = useState(false)

  // Trigger tour on first visit (after mount, client only)
  useEffect(() => {
    try {
      const seen = localStorage.getItem(TOUR_STORAGE_KEY)
      if (!seen) {
        const id = window.setTimeout(() => setTourOpen(true), 600)
        return () => window.clearTimeout(id)
      }
    } catch {
      /* ignore */
    }
  }, [])

  // Persist key selections
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const payload: PersistedState = {
        plotType: selectedPlotType,
        year: core.selectedYear,
        session: core.selectedSession,
      }
      localStorage.setItem(LAST_STATE_KEY, JSON.stringify(payload))
    } catch {
      /* ignore */
    }
  }, [selectedPlotType, core.selectedYear, core.selectedSession])

  // Reset per-plot inputs whenever the plot type changes, so a selection made
  // for one plot type never silently carries over into an unrelated one.
  useEffect(() => {
    const def = PLOT_BY_KEY.get(selectedPlotType)
    if (!def) return
    setMultiDrivers([])
    setOptionValues(defaultOptionsFor(def))
    if (def.driverRequirement.kind === "single-optional") {
      setDriver1(ALL_DRIVERS_VALUE)
    } else {
      setDriver1((prev) => (prev === ALL_DRIVERS_VALUE ? drivers[0] : prev))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlotType])

  // Release the track-comparison blob URL when the result is replaced/unmounted.
  useEffect(() => {
    const data = generated?.data
    return () => releaseImageUrl(data)
  }, [generated])

  // Token management
  const { isAuthenticated } = useAuth()
  const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const { userProfile, hasTokens, getTokenCount, deductToken, error: tokenError } = useTokens(authToken)

  const buildCtx = (): PlotFetchContext => ({
    year: Number(core.selectedYear),
    eventName: core.apiEventName,
    sessionName: core.sessionName,
    sessionCode: core.selectedSession,
    allDrivers: drivers,
    driver1: driver1 === ALL_DRIVERS_VALUE ? undefined : driver1,
    driver2,
    multiDrivers,
    options: optionValues,
    token: authToken ?? "",
  })

  const advancedSettings: AdvancedPlotSettings = {
    showGrid: chartSettings.showGrid,
    showLegend: chartSettings.showLegend,
    animateChart: chartSettings.animateChart,
    chartHeight: parseInt(chartSettings.chartHeight) || 700,
    lineThickness: parseInt(chartSettings.lineThickness) || 2,
    showDataLabels: chartSettings.showDataLabels,
  }

  const { captureAt, captureNode } = usePlotSharing()

  // Resolves the driver code(s) relevant to the currently selected plot type,
  // as a comma-separated string, for the usage log.
  const driversForCurrentPlot = (): string | undefined => {
    const req = selectedPlot.driverRequirement
    let list: string[] = []
    if (req.kind === "single") list = [driver1]
    else if (req.kind === "single-optional") list = driver1 !== ALL_DRIVERS_VALUE ? [driver1] : []
    else if (req.kind === "pair") list = [driver1, driver2]
    else if (req.kind === "multi") list = multiDrivers
    const cleaned = list.filter((d) => d && d !== "none")
    return cleaned.length > 0 ? cleaned.join(", ") : undefined
  }

  const handleGeneratePlot = async () => {
    const def = selectedPlot

    if (!isAuthenticated) {
      toast.error("Sign in required", {
        description: "You need to be logged in to generate telemetry plots.",
      })
      return
    }

    if (!hasTokens()) {
      toast.warning("No tokens available", {
        description: "Each plot costs 1 token. Tokens refill monthly — or purchase more in your account settings.",
        duration: 6000,
      })
      return
    }

    const ctx = buildCtx()

    setIsGenerating(true)
    let plotGeneratedSuccessfully = false
    let generationError: string | undefined
    const generationStart = performance.now()

    try {
      const validationError = def.validate?.(ctx)
      if (validationError) throw new Error(validationError)

      if (isSessionRestricted(def, ctx.sessionCode)) {
        throw new Error(
          def.sessionRestrictionNote ?? `${def.title} is not available for the selected session.`
        )
      }

      const data = await def.fetch(ctx)
      if (isPlotDataEmpty(def, data)) {
        throw new Error(def.emptyMessage ?? "No data returned for the selected session")
      }

      setGenerated({ key: def.key, data, ctx })
      plotGeneratedSuccessfully = true

      if (isAuthenticated) {
        const tokenDeducted = await deductToken()
        if (tokenDeducted) {
          console.log("Token deducted successfully for plot generation")
        } else {
          console.warn("Failed to deduct token after successful plot generation")
        }
      }
    } catch (error) {
      console.error("Error generating plot:", error)
      const message = (error as Error).message || "An unexpected error occurred."
      generationError = message
      toast.error("Plot generation failed", {
        description: message,
        duration: 8000,
      })
    } finally {
      setIsGenerating(false)

      // Record the attempt (success or failure) for admin usage analytics — fire-and-forget.
      if (authToken) {
        const durationMs = Math.round(performance.now() - generationStart)
        void logTelemetryRequest(authToken, {
          plotType: selectedPlotType,
          year: Number(core.selectedYear),
          eventName: core.selectedEventName,
          session: core.selectedSession,
          drivers: driversForCurrentPlot(),
          durationMs,
          success: plotGeneratedSuccessfully,
          tokensUsed: plotGeneratedSuccessfully ? 1 : 0,
          errorMessage: generationError,
        })
      }
    }
  }

  const hasResult = generated !== null && generated.key === selectedPlot.key

  const renderPlot = () => {
    if (!hasResult || !generated) {
      return (
        <div className="flex flex-col items-center justify-center h-[700px] text-muted-foreground space-y-4">
          {isGenerating ? (
            <LoadingPlot />
          ) : (
            `No ${selectedPlot.title.toLowerCase()} data available — press Generate plot`
          )}
        </div>
      )
    }
    return selectedPlot.render(generated.data, advancedSettings, generated.ctx)
  }

  const renderStats = () => {
    if (!hasResult || !generated || !selectedPlot.stats) return null
    const stats = selectedPlot.stats(generated.data, generated.ctx)
    if (!stats) return null
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-zinc-800 border border-zinc-800">
        {stats.map((s) => (
          <div key={s.label} className="px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">{s.label}</p>
            <p className="mt-1 font-mono text-lg font-black tabular-nums">{s.value}</p>
            {s.sub && <p className="mt-0.5 text-xs text-zinc-500 truncate">{s.sub}</p>}
          </div>
        ))}
      </div>
    )
  }

  const restartTour = () => {
    try {
      localStorage.removeItem(TOUR_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setTourOpen(true)
  }

  const tokenCount = getTokenCount()
  const tokensAvailable = isAuthenticated && hasTokens()
  const canGenerate = tokensAvailable

  const sessionIsRestricted = isSessionRestricted(selectedPlot, core.selectedSession)
  const showPlotOptions =
    selectedPlot.driverRequirement.kind !== "none" || (selectedPlot.options?.length ?? 0) > 0

  const quickPresets = [
    { label: "Default", patch: { ...DEFAULT_CHART_SETTINGS, showDataLabels: true } },
    { label: "Minimal", patch: { showGrid: false, showLegend: true, animateChart: false, chartHeight: "700", lineThickness: "3", showDataLabels: false } },
    { label: "Detailed", patch: { showGrid: true, showLegend: true, animateChart: true, chartHeight: "900", lineThickness: "2", showDataLabels: true } },
    { label: "Clean", patch: { showGrid: false, showLegend: false, animateChart: false, chartHeight: "600", lineThickness: "2", showDataLabels: false } },
  ]

  return (
    <TooltipProvider delayDuration={150}>
      <div className="border border-zinc-800 bg-zinc-950 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/70 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Telemetry</p>
            <h2 className="mt-0.5 text-2xl font-bold tracking-tight">
              {selectedPlot.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">{selectedPlot.description}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isAuthenticated && userProfile && (
              <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10">
                <Coins className="h-3 w-3 mr-1" />
                {tokenCount} tokens
              </Badge>
            )}
            <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px] uppercase tracking-wider">
              v2 API
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-zinc-500 hover:text-foreground"
                  onClick={restartTour}
                  aria-label="Show tour"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Replay the quick tour</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {tokenError && (
          <div className="mx-5 mt-4 flex items-center gap-2 border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{tokenError}</span>
          </div>
        )}

        <div className="space-y-5 p-5">
          {/* Plot type picker */}
          <PlotTypePicker
            plotTypes={plotTypes}
            value={selectedPlotType}
            onChange={setSelectedPlotType}
          />

          {/* Race & session card */}
          <RaceSessionPanel
            dataTour="raceSession"
            years={["2025", "2026"]}
            selectedYear={core.selectedYear}
            onYearChange={core.setSelectedYear}
            events={core.availableEvents}
            selectedEventName={core.selectedEventName}
            onEventChange={core.setSelectedEventName}
            sessions={core.availableSessions}
            selectedSession={core.selectedSession}
            onSessionChange={core.setSelectedSession}
            scope={selectedPlot.scope ?? "session"}
            filterToFinished
            onRefresh={core.handleRefreshSessions}
            isRefreshing={core.isRefreshingSessions}
            onUseLatestRace={core.useLatestRace}
            isResolvingLatestRace={core.isResolvingLatestRace}
          />

          {/* Session restriction warning */}
          {sessionIsRestricted && (
            <div className="flex items-start gap-2 border border-yellow-500/40 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                {selectedPlot.sessionRestrictionNote ??
                  `${selectedPlot.title} is not available for the selected session.`}
              </span>
            </div>
          )}

          {/* Plot options card */}
          {showPlotOptions && (
            <div data-tour="drivers" className="border border-zinc-800">
              <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-3">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium leading-none">Plot options</p>
                  <p className="mt-0.5 text-xs text-zinc-500">Configure the inputs for this plot type.</p>
                </div>
              </div>
              <div className="space-y-4 px-5 py-4">
                <DriverSelectionPanel
                  requirement={selectedPlot.driverRequirement}
                  allDrivers={drivers}
                  driver1={driver1}
                  driver2={driver2}
                  multiDrivers={multiDrivers}
                  onDriver1Change={setDriver1}
                  onDriver2Change={setDriver2}
                  onMultiDriversChange={setMultiDrivers}
                />
                <PlotOptionsPanel
                  options={selectedPlot.options ?? []}
                  values={optionValues}
                  onChange={(id, value) => setOptionValues((prev) => ({ ...prev, [id]: value }))}
                />
              </div>
            </div>
          )}

          {/* Advanced settings collapsible */}
          <AdvancedSettingsPanel
            dataTour="advanced"
            open={advancedOpen}
            onOpenChange={setAdvancedOpen}
            settings={chartSettings}
            onChange={(patch) => setChartSettings((prev) => ({ ...prev, ...patch }))}
          >
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Quick Presets</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {quickPresets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setChartSettings((prev) => ({ ...prev, ...preset.patch }))}
                    className="bg-background/50"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </AdvancedSettingsPanel>

          {/* Generate row */}
          <div data-tour="generate" className="flex flex-wrap items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={handleGeneratePlot}
                    disabled={isGenerating || !canGenerate}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                        Generating...
                      </>
                    ) : tokensAvailable ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Generate plot
                        <span className="ml-2 text-xs bg-yellow-500/20 px-2 py-0.5 rounded text-yellow-300">
                          1 token
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        {isAuthenticated ? "Need 1 token" : "Sign in required"}
                      </>
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {!canGenerate && (
                <TooltipContent side="bottom" className="max-w-[240px]">
                  {isAuthenticated
                    ? "You're out of tokens. They refill monthly, or you can buy more from your account settings."
                    : "Log in to generate telemetry plots."}
                </TooltipContent>
              )}
            </Tooltip>

            {selectedPlot.shareable && hasResult && generated ? (
              <ShareControls
                def={selectedPlot}
                ctx={generated.ctx}
                settings={advancedSettings}
                captureAt={captureAt}
                data={generated.data}
              />
            ) : (
              <Button
                variant="outline"
                className="border-zinc-800 bg-transparent hover:bg-zinc-900 transition-colors"
                onClick={() => toast.info("Export coming soon", { description: "Plot export will be available in a future update." })}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
          {captureNode}

          {/* Token warning under the button */}
          {isAuthenticated && !hasTokens() && (
            <div className="flex items-start gap-2 border border-yellow-500/40 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                You don&apos;t have enough tokens to generate plots. Each plot costs 1 token.{" "}
                <span className="text-zinc-500">Tokens refill monthly or you can purchase more in your account settings.</span>
              </span>
            </div>
          )}

          {/* Results */}
          <div className="space-y-4 pt-2">
            <div className="border border-zinc-800 p-4">{renderPlot()}</div>
            <div className="text-sm">{renderStats()}</div>
          </div>

          {/* Developer mode coming soon */}
          <div className="mx-5 mt-4 flex items-start gap-3 border border-blue-500/20 bg-blue-950/10 px-4 py-3">
            <Code2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-300">Developer Mode — coming soon</p>
              <p className="mt-0.5 text-xs text-zinc-400 leading-relaxed">
                Bring your own API key and unlock unlimited plot generation, direct endpoint access, and programmatic usage — built for analysts, teams, and developers integrating F1 telemetry into their own tools.
              </p>
            </div>
          </div>
        </div>
      </div>
      <GeneratorTour open={tourOpen} onClose={() => setTourOpen(false)} />
    </TooltipProvider>
  )
}
