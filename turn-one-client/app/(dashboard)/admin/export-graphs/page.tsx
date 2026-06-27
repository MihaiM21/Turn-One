"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import JSZip from "jszip"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  Loader2,
  Download,
  Settings,
  AlertTriangle,
  CalendarClock,
  Users,
  ChevronDown,
  Plus,
  Check,
  X,
  Shield,
  ImageIcon,
  Eye,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as adminService from "@/lib/adminService"
import { fetchEventsByYear, fetchSessionsByEvent } from "@/lib/dataAcquisition"
import { drivers_2025, drivers_2026 } from "@/lib/constants/drivers"
import { SITE_CONFIG } from "@/lib/seo"
import { DashboardHeader } from "@/components/dashboard/live dashboard/dashboard-header"
import {
  CHART_BY_KEY,
  CHART_CATALOG,
  isChartDataEmpty,
  type ChartDefinition,
  type ChartFetchContext,
} from "@/lib/export/chart-catalog"
import { OUTPUT_SIZES, FOOTER_HEIGHT } from "@/lib/export/output-sizes"
import {
  exportChartAsBlob,
  sanitizeFilenamePart,
  triggerDownload,
} from "@/lib/export/chart-exporter"
import { createPreset } from "@/lib/export/export-presets"
import type {
  ExportPreset,
  ExportSessionType,
  OutputSizeKey,
} from "@/types/export-types"
import type { AdvancedPlotSettings } from "@/types/plot-types"
import { PlotTypePicker, type PlotType } from "@/components/dashboard/telemetry generator/plot-type-picker"
import { OutputSizePicker } from "@/components/admin/export-graphs/output-size-picker"
import { OffscreenRenderer } from "@/components/admin/export-graphs/offscreen-renderer"
import { PresetManagerDialog } from "@/components/admin/export-graphs/preset-manager-dialog"
import { ChartErrorBoundary } from "@/components/admin/export-graphs/chart-error-boundary"

interface F1Event {
  name: string
  official_name?: string
  key?: number
}
interface F1Session {
  name: string
  type: string
  number: number | null
}

const YEAR_OPTIONS = ["2026", "2025", "2024", "2023"]

function driversForYear(year: number): string[] {
  if (year === 2026) return drivers_2026
  return drivers_2025
}

function getSessionCode(name: string, type: string, number: number | null) {
  const n = name.toLowerCase()
  const t = type.toLowerCase()
  if (n.includes("sprint qualifying") || n.includes("sprint shootout")) return "SQ"
  if (n === "sprint") return "S"
  if (n === "qualifying") return "Q"
  if (n === "race") return "R"
  if (t === "practice") return `FP${number ?? 1}`
  if (t === "sprint") return "S"
  if (t === "qualifying") return "Q"
  if (t === "race") return "R"
  return name
}

function sessionToExportType(code: string): ExportSessionType {
  if (code.startsWith("FP")) return "PRACTICE"
  if (code === "Q" || code === "SQ") return "QUALIFYING"
  return "RACE"
}

const DEFAULT_SESSIONS: F1Session[] = [
  { name: "Practice 1", type: "Practice", number: 1 },
  { name: "Practice 2", type: "Practice", number: 2 },
  { name: "Practice 3", type: "Practice", number: 3 },
  { name: "Qualifying", type: "Qualifying", number: null },
  { name: "Race", type: "Race", number: null },
]

export default function ExportGraphsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [accessChecked, setAccessChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [selectedYear, setSelectedYear] = useState<string>(YEAR_OPTIONS[0])
  const year = Number(selectedYear)
  const [events, setEvents] = useState<F1Event[]>([])
  const [eventName, setEventName] = useState<string>("")
  const [sessions, setSessions] = useState<F1Session[]>(DEFAULT_SESSIONS)
  const [sessionCode, setSessionCode] = useState<string>("R")

  const allDrivers = useMemo(() => driversForYear(year), [year])
  const [driver1, setDriver1] = useState<string>("VER")
  const [driver2, setDriver2] = useState<string>("HAM")
  const [multiDrivers, setMultiDrivers] = useState<string[]>([])

  // Currently focused chart (for preview)
  const [focusedChartKey, setFocusedChartKey] = useState<string>("session_results")
  // Charts queued for export
  const [queuedChartKeys, setQueuedChartKeys] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<OutputSizeKey[]>(["ig_square"])
  const [presetDialogOpen, setPresetDialogOpen] = useState(false)

  // Advanced chart settings
  const [showGrid, setShowGrid] = useState(true)
  const [showLegend, setShowLegend] = useState(true)
  const [animateChart, setAnimateChart] = useState(true)
  const [showDataLabels, setShowDataLabels] = useState(true)
  const [chartHeight, setChartHeight] = useState("700")
  const [lineThickness, setLineThickness] = useState("2")
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

  // ---- Events ----
  useEffect(() => {
    fetchEventsByYear(year)
      .then((d: { events?: F1Event[] }) => {
        const list = d?.events ?? []
        setEvents(list)
        if (list.length && !list.find((e) => (e.official_name || e.name) === eventName)) {
          setEventName(list[0].official_name || list[0].name)
        }
      })
      .catch(() => setEvents([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  useEffect(() => {
    if (!allDrivers.includes(driver1)) setDriver1(allDrivers[0] ?? "")
    if (!allDrivers.includes(driver2)) setDriver2(allDrivers[1] ?? "")
    setMultiDrivers((prev) => prev.filter((d) => allDrivers.includes(d)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  // ---- Sessions ----
  useEffect(() => {
    if (!eventName) return
    const evt = events.find((e) => (e.official_name || e.name) === eventName)
    const apiName = evt ? evt.name : eventName
    fetchSessionsByEvent(year, apiName)
      .then((d: { sessions?: F1Session[] }) => {
        const list = d?.sessions && d.sessions.length ? d.sessions : DEFAULT_SESSIONS
        setSessions(list)
        const codes = list.map((s) => getSessionCode(s.name, s.type, s.number))
        if (!codes.includes(sessionCode)) setSessionCode(codes[codes.length - 1] || "R")
      })
      .catch(() => setSessions(DEFAULT_SESSIONS))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, year])

  const sessionType = useMemo(() => sessionToExportType(sessionCode), [sessionCode])

  const focusedChart = useMemo(
    () => CHART_BY_KEY.get(focusedChartKey) ?? CHART_CATALOG[0],
    [focusedChartKey]
  )

  const focusedSessionCompatible = focusedChart.sessionTypes.includes(sessionType)

  const ctx: ChartFetchContext | null = useMemo(() => {
    if (!eventName) return null
    const evt = events.find((e) => (e.official_name || e.name) === eventName)
    const apiGp = evt ? evt.official_name || evt.name : eventName
    const sessionObj = sessions.find(
      (s) => getSessionCode(s.name, s.type, s.number) === sessionCode
    )
    const sessionName = sessionObj ? sessionObj.name : sessionCode
    return {
      year,
      eventName: apiGp,
      sessionName,
      sessionCode,
      allDrivers,
      driver1,
      driver2,
      multiDrivers,
      token: typeof window !== "undefined" ? localStorage.getItem("token") || "" : "",
    }
  }, [events, eventName, year, sessionCode, sessions, allDrivers, driver1, driver2, multiDrivers])

  // Reset the preview whenever the user switches chart, event, or session.
  useEffect(() => {
    setPreviewData(null)
    setPreviewError(null)
    setPreviewFetched(false)
  }, [focusedChartKey, eventName, sessionCode])

  // ---- Manual preview fetch ----
  const handlePreview = async () => {
    if (!ctx || !focusedChart) return
    if (focusedChart.driverRequirement === "pair" && (!driver1 || !driver2 || driver1 === driver2)) {
      setPreviewError("Pick two different drivers")
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
      showGrid,
      showLegend,
      animateChart,
      showDataLabels,
      chartHeight: parseInt(chartHeight) || 700,
      lineThickness: parseInt(lineThickness) || 2,
    }),
    [showGrid, showLegend, animateChart, showDataLabels, chartHeight, lineThickness]
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
    setQueuedChartKeys(preset.chartKeys.filter((k) => CHART_BY_KEY.has(k)))
    setSelectedSizes(preset.outputSizes)
    toast({ title: "Preset applied", description: preset.name })
  }

  // ---- Export pipeline ----
  const exportOne = async (
    chartKey: string,
    size: OutputSizeKey,
    fetchedData: unknown
  ): Promise<Blob> => {
    const chart = CHART_BY_KEY.get(chartKey)!
    const sizeDef = OUTPUT_SIZES[size]
    const exportPlotSettings: AdvancedPlotSettings = {
      ...advancedSettings,
      chartHeight: sizeDef.height - FOOTER_HEIGHT,
      lineThickness: sizeDef.lineThickness,
      showDataLabels: true,
      textScale: sizeDef.textScale,
      animateChart: false,
    }

    setRenderJob({ chartKey, size, settings: exportPlotSettings, data: fetchedData })
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
      branding: {
        eventName:
          events.find((e) => (e.official_name || e.name) === eventName)?.official_name ||
          eventName ||
          "F1",
        year,
        sessionLabel: sessionCode,
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
      for (let i = 0; i < chartKeysToExport.length; i++) {
        const key = chartKeysToExport[i]
        const chart = CHART_BY_KEY.get(key)
        if (!chart) continue
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
            dataByChart.set(key, await chart.fetch(ctx))
          }
        } catch (e) {
          console.warn(`Fetch failed for ${key}`, e)
          dataByChart.set(key, null)
        }
      }

      const validKeys = chartKeysToExport.filter((k) => {
        const chart = CHART_BY_KEY.get(k)
        if (!chart) return false
        return !isChartDataEmpty(chart, dataByChart.get(k))
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
      const eventTag = sanitizeFilenamePart(eventName || "f1")
      const sessionTag = sanitizeFilenamePart(sessionCode)
      let jobsDone = 0

      const buildFilename = (key: string, size: OutputSizeKey) => {
        const chart = CHART_BY_KEY.get(key)
        const driverTag = chart?.driverRequirement === "pair"
          ? `_${sanitizeFilenamePart(driver1)}_vs_${sanitizeFilenamePart(driver2)}`
          : ""
        return `${eventTag}_${sessionTag}_${sanitizeFilenamePart(key)}${driverTag}_${size}.png`
      }

      if (!isBulk) {
        const key = validKeys[0]
        const size = selectedSizes[0]
        const chart = CHART_BY_KEY.get(key)!
        setExportProgress({ phase: "rendering", label: chart.shortTitle, current: 1, total: 1 })
        const blob = await exportOne(key, size, dataByChart.get(key))
        triggerDownload(blob, buildFilename(key, size))
        toast({ title: "Image downloaded" })
      } else {
        const zip = new JSZip()
        for (const key of validKeys) {
          for (const size of selectedSizes) {
            const chart = CHART_BY_KEY.get(key)!
            jobsDone++
            setExportProgress({
              phase: "rendering",
              label: `${chart.shortTitle} · ${size}`,
              current: jobsDone,
              total: totalJobs,
            })
            const blob = await exportOne(key, size, dataByChart.get(key))
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

  const plotTypes: PlotType[] = CHART_CATALOG.map((c) => ({
    id: c.key,
    name: c.title,
    icon: c.icon,
    description: c.description,
    isPro: false,
  }))

  const focusedFocusedChart: ChartDefinition = focusedChart
  const needSingle = focusedFocusedChart.driverRequirement === "single"
  const needPair = focusedFocusedChart.driverRequirement === "pair"
  const needMulti = focusedFocusedChart.driverRequirement === "multi"

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
                  {focusedFocusedChart.title}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">{focusedFocusedChart.description}</p>
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
              <div className="border border-zinc-800">
                <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-3">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium leading-none">Race &amp; session</p>
                    <p className="mt-0.5 text-xs text-zinc-500">Pick the season, Grand Prix, and session.</p>
                  </div>
                </div>
                <div className="space-y-4 px-5 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {YEAR_OPTIONS.map((y) => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="round">Round</Label>
                      <Select value={eventName} onValueChange={setEventName} disabled={!events.length}>
                        <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
                          <SelectValue placeholder="Select round" />
                        </SelectTrigger>
                        <SelectContent>
                          {events.length > 0 ? (
                            events.map((e, i) => {
                              const v = e.official_name || e.name
                              return <SelectItem key={e.key ?? i} value={v}>{v}</SelectItem>
                            })
                          ) : (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session">Session</Label>
                      <Select value={sessionCode} onValueChange={setSessionCode}>
                        <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
                          <SelectValue placeholder="Select session" />
                        </SelectTrigger>
                        <SelectContent>
                          {sessions.map((s) => {
                            const code = getSessionCode(s.name, s.type, s.number)
                            return <SelectItem key={code} value={code}>{s.name}</SelectItem>
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session compatibility warning */}
              {!focusedSessionCompatible && (
                <div className="flex items-start gap-2 border border-yellow-500/40 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-400">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    <strong>{focusedChart.title}</strong> is only available for{" "}
                    <strong>{focusedChart.sessionTypes.join(" / ").toLowerCase()}</strong> sessions.
                    The preview will likely show no data.
                  </span>
                </div>
              )}

              {/* Plot options card */}
              {(needSingle || needPair || needMulti) && (
                <div className="border border-zinc-800">
                  <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-3">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium leading-none">Plot options</p>
                      <p className="mt-0.5 text-xs text-zinc-500">Configure inputs for this plot.</p>
                    </div>
                  </div>
                  <div className="space-y-4 px-5 py-4">
                    {needSingle && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Driver</Label>
                          <Select value={driver1} onValueChange={setDriver1}>
                            <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {allDrivers.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    {needPair && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Driver 1</Label>
                          <Select value={driver1} onValueChange={setDriver1}>
                            <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {allDrivers.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Driver 2</Label>
                          <Select value={driver2} onValueChange={setDriver2}>
                            <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {allDrivers.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    {needMulti && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Drivers ({multiDrivers.length || "all"})</Label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setMultiDrivers([...allDrivers])}
                              className="text-[10px] uppercase tracking-wider text-primary hover:underline"
                            >
                              Select all
                            </button>
                            <span className="text-zinc-700">·</span>
                            <button
                              type="button"
                              onClick={() => setMultiDrivers([])}
                              className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-foreground hover:underline"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                          {allDrivers.map((d) => {
                            const checked = multiDrivers.includes(d)
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() =>
                                  setMultiDrivers((prev) =>
                                    checked ? prev.filter((x) => x !== d) : [...prev, d]
                                  )
                                }
                                className={`px-2 py-1.5 text-xs font-mono font-semibold border transition-colors ${
                                  checked
                                    ? "border-primary/60 bg-primary/10 text-primary"
                                    : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                                }`}
                              >
                                {d}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Advanced chart settings */}
              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="border border-zinc-800">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/10 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary" />
                      Advanced chart settings
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${advancedOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 pt-2 space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Display Options</h4>
                    <div className="space-y-3">
                      {[
                        { id: "show-grid", label: "Show Grid Lines", help: "Display grid lines on the chart", val: showGrid, set: setShowGrid },
                        { id: "show-legend", label: "Show Legend", help: "Display chart legend", val: showLegend, set: setShowLegend },
                        { id: "show-labels", label: "Show Data Labels", help: "Display values on data points", val: showDataLabels, set: setShowDataLabels },
                        { id: "animate", label: "Animate Chart", help: "Enable chart animations", val: animateChart, set: setAnimateChart },
                      ].map((row) => (
                        <div key={row.id} className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor={row.id}>{row.label}</Label>
                            <p className="text-xs text-muted-foreground">{row.help}</p>
                          </div>
                          <Switch id={row.id} checked={row.val} onCheckedChange={row.set} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Appearance</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="chart-height">Chart Height (px) — preview only</Label>
                        <Input
                          id="chart-height"
                          type="number"
                          min="400"
                          max="1200"
                          value={chartHeight}
                          onChange={(e) => setChartHeight(e.target.value)}
                          className="bg-background/50 border-border/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="line-thickness">Line Thickness — preview only</Label>
                        <Input
                          id="line-thickness"
                          type="number"
                          min="1"
                          max="5"
                          value={lineThickness}
                          onChange={(e) => setLineThickness(e.target.value)}
                          className="bg-background/50 border-border/50"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500">
                      On export, chart height &amp; line thickness are auto-tuned per output size.
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>

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
                    {eventName || "—"} · {sessionCode}
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
                  ) : !previewData || isChartDataEmpty(focusedFocusedChart, previewData) ? (
                    <div className="flex h-[700px] items-center justify-center text-sm text-muted-foreground">
                      No data for this session
                    </div>
                  ) : (
                    <ChartErrorBoundary resetKey={`${focusedChartKey}:${sessionCode}:${eventName}`}>
                      {focusedFocusedChart.render(previewData, advancedSettings, ctx ?? undefined)}
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
                        const c = CHART_BY_KEY.get(k)
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
            const chart = CHART_BY_KEY.get(renderJob.chartKey)
            if (!chart) return null
            return (
              <OffscreenRenderer
                ref={offscreenRef}
                width={sizeDef.width}
                height={sizeDef.height - FOOTER_HEIGHT}
              >
                <ChartErrorBoundary resetKey={`${renderJob.chartKey}:${renderJob.size}`} minHeight={sizeDef.height - FOOTER_HEIGHT}>
                  {chart.render(renderJob.data, renderJob.settings, ctx ?? undefined)}
                </ChartErrorBoundary>
              </OffscreenRenderer>
            )
          })()}
      </div>
    </TooltipProvider>
  )
}
