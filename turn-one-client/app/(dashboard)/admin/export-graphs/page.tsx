"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import JSZip from "jszip"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Loader2,
  Download,
  Settings,
  AlertTriangle,
  Users,
  Plus,
  Check,
  X,
  Shield,
  ImageIcon,
  Eye,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as adminService from "@/lib/adminService"
import { drivers_2025, drivers_2026 } from "@/lib/constants/drivers"
import { SITE_CONFIG } from "@/lib/seo"
import { DashboardHeader } from "@/components/dashboard/live dashboard/dashboard-header"
import {
  EXPORTABLE_PLOTS,
  PLOT_BY_KEY,
  isPlotDataEmpty,
  isSessionRestricted,
  resolvePlotKey,
} from "@/lib/plots/catalog"
import {
  defaultOptionsFor,
  type PlotDefinition,
  type PlotFetchContext,
} from "@/lib/plots/types"
import { sessionToExportType } from "@/lib/plots/session-utils"
import { OUTPUT_SIZES, FOOTER_HEIGHT } from "@/lib/export/output-sizes"
import {
  exportChartAsBlob,
  sanitizeFilenamePart,
  triggerDownload,
} from "@/lib/export/chart-exporter"
import { createPreset } from "@/lib/export/export-presets"
import type { ExportPreset, OutputSizeKey } from "@/types/export-types"
import type { AdvancedPlotSettings } from "@/types/plot-types"
import { PlotTypePicker, type PlotType } from "@/components/dashboard/telemetry generator/plot-type-picker"
import { OutputSizePicker } from "@/components/admin/export-graphs/output-size-picker"
import { OffscreenRenderer } from "@/components/admin/export-graphs/offscreen-renderer"
import { PresetManagerDialog } from "@/components/admin/export-graphs/preset-manager-dialog"
import { ChartErrorBoundary } from "@/components/admin/export-graphs/chart-error-boundary"
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

const YEAR_OPTIONS = ["2026", "2025", "2024", "2023"]

function driversForYear(year: number): string[] {
  if (year === 2026) return drivers_2026
  return drivers_2025
}

// Per-surface option defaults: the admin export page prefers the legacy
// data-mode track comparison because the image-mode <img> is not export-tuned.
const ADMIN_OPTION_OVERRIDES: Record<string, Record<string, unknown>> = {
  track_comparison: { experimental: true },
}

const plotTypes: PlotType[] = EXPORTABLE_PLOTS.map((p) => ({
  id: p.key,
  name: p.title,
  icon: p.icon,
  description: p.description,
  isPro: false,
  category: p.category,
}))

function adminDefaultOptions(def: PlotDefinition): Record<string, unknown> {
  return { ...defaultOptionsFor(def), ...(ADMIN_OPTION_OVERRIDES[def.key] ?? {}) }
}

export default function ExportGraphsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [accessChecked, setAccessChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const core = useGeneratorCore({
    initialYear: YEAR_OPTIONS[0],
    initialSession: "R",
    defaultSessionPick: "last",
  })
  const year = Number(core.selectedYear)

  const allDrivers = useMemo(() => driversForYear(year), [year])
  const [driver1, setDriver1] = useState<string>("VER")
  const [driver2, setDriver2] = useState<string>("HAM")
  const [multiDrivers, setMultiDrivers] = useState<string[]>([])

  // Currently focused chart (for preview)
  const [focusedChartKey, setFocusedChartKey] = useState<string>("session_results")
  const focusedChart: PlotDefinition = useMemo(
    () => PLOT_BY_KEY.get(focusedChartKey) ?? EXPORTABLE_PLOTS[0],
    [focusedChartKey]
  )
  const [optionValues, setOptionValues] = useState<Record<string, unknown>>(() =>
    adminDefaultOptions(PLOT_BY_KEY.get("session_results") ?? EXPORTABLE_PLOTS[0])
  )

  // Charts queued for export
  const [queuedChartKeys, setQueuedChartKeys] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<OutputSizeKey[]>(["ig_square"])
  const [presetDialogOpen, setPresetDialogOpen] = useState(false)

  // Advanced chart settings
  const [chartSettings, setChartSettings] = useState<ChartSettingsState>({
    ...DEFAULT_CHART_SETTINGS,
    showDataLabels: true,
  })
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // Preview data
  const [previewData, setPreviewData] = useState<unknown>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  // false until the user explicitly clicks Preview for the current chart
  const [previewFetched, setPreviewFetched] = useState(false)

  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<{
    phase: "fetching" | "rendering"
    label: string
    current: number
    total: number
  } | null>(null)
  const [renderJob, setRenderJob] = useState<null | {
    chartKey: string
    size: OutputSizeKey
    settings: AdvancedPlotSettings
    data: unknown
    ctx: PlotFetchContext
  }>(null)
  const offscreenRef = useRef<HTMLDivElement | null>(null)

  // ---- Admin guard ----
  useEffect(() => {
    let cancelled = false
    adminService.checkAdminAccess().then((r) => {
      if (cancelled) return
      if (!r.success) {
        router.replace("/dashboard")
        return
      }
      setIsAdmin(true)
      setAccessChecked(true)
    })
    return () => {
      cancelled = true
    }
  }, [router])

  // Keep driver selections valid when the season roster changes.
  useEffect(() => {
    if (!allDrivers.includes(driver1) && driver1 !== ALL_DRIVERS_VALUE) setDriver1(allDrivers[0] ?? "")
    if (!allDrivers.includes(driver2)) setDriver2(allDrivers[1] ?? "")
    setMultiDrivers((prev) => prev.filter((d) => allDrivers.includes(d)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  // Reset per-plot inputs whenever the focused chart changes.
  useEffect(() => {
    const def = PLOT_BY_KEY.get(focusedChartKey)
    if (!def) return
    setMultiDrivers([])
    setOptionValues(adminDefaultOptions(def))
    if (def.driverRequirement.kind === "single-optional") {
      setDriver1(ALL_DRIVERS_VALUE)
    } else {
      setDriver1((prev) => (prev === ALL_DRIVERS_VALUE ? allDrivers[0] ?? "" : prev))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedChartKey])

  const sessionType = useMemo(
    () => sessionToExportType(core.selectedSession),
    [core.selectedSession]
  )

  const scope = focusedChart.scope ?? "session"

  const sessionWarning = useMemo(() => {
    if (scope !== "session") return null
    if (isSessionRestricted(focusedChart, core.selectedSession)) {
      return (
        focusedChart.sessionRestrictionNote ??
        `${focusedChart.title} is not available for the selected session. The preview will likely show no data.`
      )
    }
    if (!focusedChart.sessionTypes.includes(sessionType)) {
      return `${focusedChart.title} is only available for ${focusedChart.sessionTypes
        .join(" / ")
        .toLowerCase()} sessions. The preview will likely show no data.`
    }
    return null
  }, [focusedChart, core.selectedSession, sessionType, scope])

  const optionsForChart = (def: PlotDefinition): Record<string, unknown> =>
    def.key === focusedChartKey ? optionValues : adminDefaultOptions(def)

  const buildCtx = (def: PlotDefinition): PlotFetchContext | null => {
    if (!core.selectedEventName && scope === "session") return null
    return {
      year,
      eventName: core.apiEventName,
      sessionName: core.sessionName,
      sessionCode: core.selectedSession,
      allDrivers,
      driver1: driver1 === ALL_DRIVERS_VALUE ? undefined : driver1,
      driver2,
      multiDrivers,
      options: optionsForChart(def),
      token: typeof window !== "undefined" ? localStorage.getItem("token") || "" : "",
    }
  }

  const ctx: PlotFetchContext | null = useMemo(
    () => buildCtx(focusedChart),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      core.selectedEventName,
      core.apiEventName,
      core.sessionName,
      core.selectedSession,
      year,
      allDrivers,
      driver1,
      driver2,
      multiDrivers,
      optionValues,
      focusedChart,
    ]
  )

  // Reset the preview whenever the user switches chart, event, or session.
  useEffect(() => {
    setPreviewData(null)
    setPreviewError(null)
    setPreviewFetched(false)
  }, [focusedChartKey, core.selectedEventName, core.selectedSession])

  // ---- Manual preview fetch ----
  const handlePreview = async () => {
    if (!ctx || !focusedChart) return
    const validationError = focusedChart.validate?.(ctx)
    if (validationError) {
      setPreviewError(validationError)
      setPreviewFetched(true)
      return
    }
    setPreviewLoading(true)
    setPreviewError(null)
    setPreviewFetched(true)
    try {
      const d = await focusedChart.fetch(ctx)
      setPreviewData(d)
    } catch (e) {
      setPreviewError(String(e))
    } finally {
      setPreviewLoading(false)
    }
  }

  const advancedSettings: AdvancedPlotSettings = useMemo(
    () => ({
      showGrid: chartSettings.showGrid,
      showLegend: chartSettings.showLegend,
      animateChart: chartSettings.animateChart,
      showDataLabels: chartSettings.showDataLabels,
      chartHeight: parseInt(chartSettings.chartHeight) || 700,
      lineThickness: parseInt(chartSettings.lineThickness) || 2,
    }),
    [chartSettings]
  )

  // ---- Queue helpers ----
  const isQueued = (key: string) => queuedChartKeys.includes(key)
  const toggleQueued = (key: string) => {
    setQueuedChartKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleSaveNewPreset = async (name: string) => {
    try {
      await createPreset({
        name,
        sessionType,
        chartKeys: queuedChartKeys,
        outputSizes: selectedSizes,
      })
      toast({ title: "Preset saved", description: name })
    } catch (e) {
      toast({ title: "Save failed", description: String(e), variant: "destructive" })
    }
  }

  const handleApplyPreset = (preset: ExportPreset) => {
    setQueuedChartKeys(
      preset.chartKeys
        .map(resolvePlotKey)
        .filter((k) => {
          const def = PLOT_BY_KEY.get(k)
          return def !== undefined && def.exportable !== false
        })
    )
    setSelectedSizes(preset.outputSizes)
    toast({ title: "Preset applied", description: preset.name })
  }

  // ---- Export pipeline ----
  const exportOne = async (
    chartKey: string,
    size: OutputSizeKey,
    fetchedData: unknown,
    chartCtx: PlotFetchContext
  ): Promise<Blob> => {
    const chart = PLOT_BY_KEY.get(chartKey)!
    const sizeDef = OUTPUT_SIZES[size]
    const exportPlotSettings: AdvancedPlotSettings = {
      ...advancedSettings,
      chartHeight: sizeDef.height - FOOTER_HEIGHT,
      lineThickness: sizeDef.lineThickness,
      showDataLabels: true,
      textScale: sizeDef.textScale,
      animateChart: false,
      isExport: true,
    }

    setRenderJob({ chartKey, size, settings: exportPlotSettings, data: fetchedData, ctx: chartCtx })
    // Three rAFs: (1) React commit, (2) ResizeObserver fires → Recharts re-renders, (3) paint
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    await new Promise((r) => setTimeout(r, 500))
    const node = offscreenRef.current
    if (!node) throw new Error("Offscreen node missing")

    const blob = await exportChartAsBlob({
      node,
      size: sizeDef,
      branding: "footer",
      brandingMeta: {
        eventName: core.apiEventName || "F1",
        year,
        sessionLabel: core.selectedSession,
        siteUrl: SITE_CONFIG.url,
      },
      chartTitle: chart.title,
    })
    setRenderJob(null)
    return blob
  }

  const handleExport = async (chartKeysToExport: string[]) => {
    if (!ctx) {
      toast({ title: "Pick an event first", variant: "destructive" })
      return
    }
    if (!chartKeysToExport.length || !selectedSizes.length) {
      toast({
        title: "Select at least one chart and one output size",
        variant: "destructive",
      })
      return
    }
    setExporting(true)
    const totalCharts = chartKeysToExport.length
    try {
      // Phase 1: fetch data for each selected chart
      const dataByChart = new Map<string, unknown>()
      const ctxByChart = new Map<string, PlotFetchContext>()
      for (let i = 0; i < chartKeysToExport.length; i++) {
        const key = chartKeysToExport[i]
        const chart = PLOT_BY_KEY.get(key)
        if (!chart) continue
        const chartCtx = buildCtx(chart)
        if (!chartCtx) continue
        ctxByChart.set(key, chartCtx)
        setExportProgress({
          phase: "fetching",
          label: chart.shortTitle,
          current: i + 1,
          total: totalCharts,
        })
        try {
          // Reuse preview data for the focused chart so the export matches what the user saw
          if (key === focusedChartKey && previewFetched && previewData !== null) {
            dataByChart.set(key, previewData)
          } else {
            dataByChart.set(key, await chart.fetch(chartCtx))
          }
        } catch (e) {
          console.warn(`Fetch failed for ${key}`, e)
          dataByChart.set(key, null)
        }
      }

      const validKeys = chartKeysToExport.filter((k) => {
        const chart = PLOT_BY_KEY.get(k)
        if (!chart) return false
        return !isPlotDataEmpty(chart, dataByChart.get(k))
      })

      if (!validKeys.length) {
        toast({
          title: "No data available",
          description: "All selected charts returned no data.",
          variant: "destructive",
        })
        return
      }

      // Phase 2: render + capture each chart × size
      const totalJobs = validKeys.length * selectedSizes.length
      const isBulk = totalJobs > 1
      const eventTag = sanitizeFilenamePart(core.selectedEventName || "f1")
      const sessionTag = sanitizeFilenamePart(core.selectedSession)
      let jobsDone = 0

      const buildFilename = (key: string, size: OutputSizeKey) => {
        const chart = PLOT_BY_KEY.get(key)
        const driverTag = chart?.driverRequirement.kind === "pair"
          ? `_${sanitizeFilenamePart(driver1)}_vs_${sanitizeFilenamePart(driver2)}`
          : ""
        return `${eventTag}_${sessionTag}_${sanitizeFilenamePart(key)}${driverTag}_${size}.png`
      }

      if (!isBulk) {
        const key = validKeys[0]
        const size = selectedSizes[0]
        const chart = PLOT_BY_KEY.get(key)!
        setExportProgress({ phase: "rendering", label: chart.shortTitle, current: 1, total: 1 })
        const blob = await exportOne(key, size, dataByChart.get(key), ctxByChart.get(key)!)
        triggerDownload(blob, buildFilename(key, size))
        toast({ title: "Image downloaded" })
      } else {
        const zip = new JSZip()
        for (const key of validKeys) {
          for (const size of selectedSizes) {
            const chart = PLOT_BY_KEY.get(key)!
            jobsDone++
            setExportProgress({
              phase: "rendering",
              label: `${chart.shortTitle} · ${size}`,
              current: jobsDone,
              total: totalJobs,
            })
            const blob = await exportOne(key, size, dataByChart.get(key), ctxByChart.get(key)!)
            zip.file(buildFilename(key, size), blob)
          }
        }
        const zipBlob = await zip.generateAsync({ type: "blob" })
        triggerDownload(zipBlob, `${eventTag}_${sessionTag}_export.zip`)
        toast({
          title: `Exported ${totalJobs} image${totalJobs === 1 ? "" : "s"}`,
          description:
            validKeys.length < chartKeysToExport.length
              ? `${chartKeysToExport.length - validKeys.length} skipped (no data).`
              : "ZIP downloaded",
        })
      }
    } catch (e) {
      toast({
        title: "Export failed",
        description: String(e),
        variant: "destructive",
      })
    } finally {
      setExporting(false)
      setExportProgress(null)
      setRenderJob(null)
    }
  }

  if (!accessChecked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!isAdmin) return null

  const showPlotOptions =
    focusedChart.driverRequirement.kind !== "none" || (focusedChart.options?.length ?? 0) > 0

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-black">
        <DashboardHeader />
        <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="border border-zinc-800 bg-zinc-950 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/70 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Admin · Export</p>
                <h2 className="mt-0.5 text-2xl font-bold tracking-tight">
                  {focusedChart.title}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">{focusedChart.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
                <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px] uppercase tracking-wider">
                  v2 API
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetDialogOpen(true)}
                  className="border-zinc-800 bg-transparent"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Presets
                </Button>
              </div>
            </div>

            <div className="space-y-5 p-5">
              {/* Plot type picker */}
              <PlotTypePicker
                plotTypes={plotTypes}
                value={focusedChartKey}
                onChange={setFocusedChartKey}
              />

              {/* Race & session card */}
              <RaceSessionPanel
                years={YEAR_OPTIONS}
                selectedYear={core.selectedYear}
                onYearChange={core.setSelectedYear}
                events={core.availableEvents}
                selectedEventName={core.selectedEventName}
                onEventChange={core.setSelectedEventName}
                sessions={core.availableSessions}
                selectedSession={core.selectedSession}
                onSessionChange={core.setSelectedSession}
                scope={scope}
                onRefresh={core.handleRefreshSessions}
                isRefreshing={core.isRefreshingSessions}
                onUseLatestRace={core.useLatestRace}
                isResolvingLatestRace={core.isResolvingLatestRace}
              />

              {/* Session compatibility warning */}
              {sessionWarning && (
                <div className="flex items-start gap-2 border border-yellow-500/40 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-400">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{sessionWarning}</span>
                </div>
              )}

              {/* Plot options card */}
              {showPlotOptions && (
                <div className="border border-zinc-800">
                  <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-3">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium leading-none">Plot options</p>
                      <p className="mt-0.5 text-xs text-zinc-500">Configure inputs for this plot.</p>
                    </div>
                  </div>
                  <div className="space-y-4 px-5 py-4">
                    <DriverSelectionPanel
                      requirement={focusedChart.driverRequirement}
                      allDrivers={allDrivers}
                      driver1={driver1}
                      driver2={driver2}
                      multiDrivers={multiDrivers}
                      onDriver1Change={setDriver1}
                      onDriver2Change={setDriver2}
                      onMultiDriversChange={setMultiDrivers}
                    />
                    <PlotOptionsPanel
                      options={focusedChart.options ?? []}
                      values={optionValues}
                      onChange={(id, value) =>
                        setOptionValues((prev) => ({ ...prev, [id]: value }))
                      }
                    />
                  </div>
                </div>
              )}

              {/* Advanced chart settings */}
              <AdvancedSettingsPanel
                open={advancedOpen}
                onOpenChange={setAdvancedOpen}
                settings={chartSettings}
                onChange={(patch) => setChartSettings((prev) => ({ ...prev, ...patch }))}
                appearanceFootnote="On export, chart height & line thickness are auto-tuned per output size."
              />

              {/* Action row — Preview / Add to queue / Export this one now */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handlePreview}
                  disabled={previewLoading || !ctx}
                  className="bg-primary hover:bg-primary/90"
                >
                  {previewLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading preview…</>
                  ) : (
                    <><Eye className="h-4 w-4 mr-2" />Preview</>
                  )}
                </Button>
                <Button
                  onClick={() => toggleQueued(focusedChartKey)}
                  variant={isQueued(focusedChartKey) ? "default" : "outline"}
                  className={isQueued(focusedChartKey) ? "" : "border-zinc-800 bg-transparent"}
                >
                  {isQueued(focusedChartKey) ? (
                    <><Check className="h-4 w-4 mr-2" />In export queue</>
                  ) : (
                    <><Plus className="h-4 w-4 mr-2" />Add to export queue</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="border-zinc-800 bg-transparent"
                  disabled={exporting || !selectedSizes.length}
                  onClick={() => handleExport([focusedChartKey])}
                >
                  {exporting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Exporting…</>
                  ) : (
                    <><Download className="h-4 w-4 mr-2" />Export this chart</>
                  )}
                </Button>
              </div>

              {/* Preview area */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Preview</p>
                  <p className="text-xs text-zinc-500">
                    {core.selectedEventName || "—"} · {core.selectedSession}
                  </p>
                </div>
                <div className="border border-zinc-800 p-4 min-h-[700px] bg-black/40">
                  {previewLoading ? (
                    <div className="flex h-[700px] flex-col items-center justify-center gap-3">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                      <span className="text-sm text-zinc-400">Fetching data…</span>
                    </div>
                  ) : !previewFetched ? (
                    <div className="flex h-[700px] flex-col items-center justify-center gap-3 text-zinc-500">
                      <Eye className="h-8 w-8 opacity-30" />
                      <span className="text-sm">Click <strong className="text-zinc-300">Preview</strong> to load this chart</span>
                    </div>
                  ) : previewError ? (
                    <div className="flex h-[700px] flex-col items-center justify-center gap-2">
                      <span className="text-amber-400 font-medium">No data available</span>
                      <span className="text-xs text-zinc-500">
                        {/404/.test(previewError) ? "Session not recorded yet" : previewError}
                      </span>
                    </div>
                  ) : !previewData || isPlotDataEmpty(focusedChart, previewData) ? (
                    <div className="flex h-[700px] items-center justify-center text-sm text-muted-foreground">
                      No data for this session
                    </div>
                  ) : (
                    <ChartErrorBoundary resetKey={`${focusedChartKey}:${core.selectedSession}:${core.selectedEventName}`}>
                      {focusedChart.render(previewData, advancedSettings, ctx ?? undefined)}
                    </ChartErrorBoundary>
                  )}
                </div>
              </div>

              {/* Output sizes */}
              <div className="border border-zinc-800">
                <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-3">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium leading-none">Output sizes</p>
                    <p className="mt-0.5 text-xs text-zinc-500">Pick one or more formats. Each produces its own PNG.</p>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <OutputSizePicker selected={selectedSizes} onChange={setSelectedSizes} />
                </div>
              </div>

              {/* Export queue */}
              <div className="border border-zinc-800">
                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium leading-none">Export queue</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Charts added here will all be exported together.
                      </p>
                    </div>
                  </div>
                  {queuedChartKeys.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQueuedChartKeys([])}
                      className="text-xs text-zinc-500 hover:text-foreground"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="px-5 py-4 space-y-4">
                  {queuedChartKeys.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-4">
                      Queue is empty. Use &quot;Add to export queue&quot; on a plot to add it here.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {queuedChartKeys.map((k) => {
                        const c = PLOT_BY_KEY.get(k)
                        if (!c) return null
                        const Icon = c.icon
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => toggleQueued(k)}
                            className="group inline-flex items-center gap-2 px-3 py-1.5 border border-primary/50 bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition"
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {c.shortTitle}
                            <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800">
                    <div className="text-sm">
                      <span className="font-semibold">{queuedChartKeys.length}</span> chart
                      {queuedChartKeys.length === 1 ? "" : "s"} ×{" "}
                      <span className="font-semibold">{selectedSizes.length}</span> size
                      {selectedSizes.length === 1 ? "" : "s"} ={" "}
                      <span className="font-semibold text-primary">
                        {queuedChartKeys.length * selectedSizes.length}
                      </span>{" "}
                      image{queuedChartKeys.length * selectedSizes.length === 1 ? "" : "s"}
                    </div>
                    <Button
                      onClick={() => handleExport(queuedChartKeys)}
                      disabled={exporting || !queuedChartKeys.length || !selectedSizes.length}
                      size="lg"
                      className="bg-primary hover:bg-primary/90"
                    >
                      {exporting ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Exporting…</>
                      ) : (
                        <><Download className="h-4 w-4 mr-2" />Export queue</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <PresetManagerDialog
          open={presetDialogOpen}
          onOpenChange={setPresetDialogOpen}
          sessionType={sessionType}
          currentChartKeys={queuedChartKeys}
          currentOutputSizes={selectedSizes}
          onSaveNew={handleSaveNewPreset}
          onApply={handleApplyPreset}
        />

        {/* Export progress overlay */}
        {exportProgress && (
          <div className="fixed bottom-6 right-6 z-50 w-80 border border-zinc-700 bg-zinc-900 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200">
            <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  {exportProgress.phase === "fetching" ? "Fetching data" : "Rendering"}
                </p>
                <p className="truncate text-sm font-medium text-zinc-100">{exportProgress.label}</p>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>{exportProgress.current} of {exportProgress.total}</span>
                <span>{Math.round((exportProgress.current / exportProgress.total) * 100)}%</span>
              </div>
              <div className="h-1 w-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Off-screen render target */}
        {renderJob &&
          (() => {
            const sizeDef = OUTPUT_SIZES[renderJob.size]
            const chart = PLOT_BY_KEY.get(renderJob.chartKey)
            if (!chart) return null
            return (
              <OffscreenRenderer
                ref={offscreenRef}
                width={sizeDef.width}
                height={sizeDef.height - FOOTER_HEIGHT}
              >
                <ChartErrorBoundary resetKey={`${renderJob.chartKey}:${renderJob.size}`} minHeight={sizeDef.height - FOOTER_HEIGHT}>
                  {chart.render(renderJob.data, renderJob.settings, renderJob.ctx)}
                </ChartErrorBoundary>
              </OffscreenRenderer>
            )
          })()}
      </div>
    </TooltipProvider>
  )
}
