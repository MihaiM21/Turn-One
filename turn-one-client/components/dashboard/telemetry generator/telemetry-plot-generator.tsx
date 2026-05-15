"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Download,
  Play,
  Settings,
  TrendingUp,
  Zap,
  Clock,
  Gauge,
  CircleGauge,
  ChevronsUp,
  MonitorCog,
  Users,
  UserRound,
  ChartSpline,
  AlertTriangle,
  Coins,
  ChartScatter,
  ChevronDown,
  HelpCircle,
  Info,
  CalendarClock,
} from "lucide-react"
import {
  fetchTopSpeeds,
  fetchThrottleAverages,
  fetchTrackComparison,
  fetchTrackComparisonPlot,
  fetchSessionResults,
  fetchThrottleBrakeComparison,
  fetchLaptimeData,
  fetchEventsByYear,
  fetchSessionsByEvent,
  fetchSpeedDistributionData,
} from "@/lib/dataAcquisition"
import {
  TopSpeedData,
  ThrottleAverageData,
  TrackComparisonData,
  ThrottleBrakeComparisonData,
  LapTimeData,
  AdvancedPlotSettings,
  SpeedDistributionPoint,
  SpeedDistributionRawPoint,
} from "@/types/plot-types"
import { TopSpeedGraph } from "./plots/top-speed"
import { GForceGraph } from "./plots/gforce"
import { SpeedTraceGraph } from "./plots/speedtrace"
import { LapTimeAnalysisGraph } from "./plots/lap-time-analysis"
import { TireTempGraph } from "./plots/tire-temp"
import { ThrottleAverageGraph } from "./plots/throttle_average_comparison"
import { TrackComparisonGraph } from "./plots/track-comparison"
import { SessionResultsGraph } from "./plots/session-results"
import { ThrottleBrakeComparisonGraph } from "./plots/throttle-brake-comparison"
import { SpeedDistributionGraph } from "./plots/speed-distribution"
import { SessionResultsData } from "@/types/plot-types"
import { drivers_2025, drivers_2026 } from "@/lib/constants/drivers"
import { LoadingPlot } from "./loading_plot"
import { useTokens } from "@/hooks/use-tokens"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth/auth-provider"
import { gForceData, tireData, speedData } from "@/lib/constants/mockup-data"
import { PlotTypePicker, type PlotType } from "./plot-type-picker"
import { GeneratorTour, TOUR_STORAGE_KEY } from "./generator-tour"

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
  eventName?: string
  session?: string
  version?: string
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

export function TelemetryPlotGenerator() {
  const persisted = typeof window !== "undefined" ? readPersisted() : {}

  const [selectedPlotType, setSelectedPlotType] = useState(persisted.plotType ?? "topspeeds")
  const [selectedDriver, setSelectedDriver] = useState("VER")
  const [selectedDriver1, setSelectedDriver1] = useState("VER")
  const [selectedDriver2, setSelectedDriver2] = useState("HAM")
  const [selectedSpeedDriver1, setSelectedSpeedDriver1] = useState("VER")
  const [selectedSpeedDriver2, setSelectedSpeedDriver2] = useState("none")
  const [selectedSpeedDriver3, setSelectedSpeedDriver3] = useState("none")
  const [selectedSession, setSelectedSession] = useState(persisted.session ?? "FP1")
  const [selectedYear, setSelectedYear] = useState(persisted.year ?? "2026")
  const [selectedGp, setSelectedGp] = useState("1")
  const [selectedEventName, setSelectedEventName] = useState(
    persisted.eventName ?? "Australian Grand Prix"
  )
  const [selectedVersion, setSelectedVersion] = useState(persisted.version ?? "v1")
  const [selectedTopSpeedType, setSelectedTopSpeedType] = useState("telemetry")
  const [availableEvents, setAvailableEvents] = useState<any[]>([])
  const [availableSessions, setAvailableSessions] = useState<any[]>([])

  const v2SupportedPlots = ["topspeeds", "throttle_average", "speed_distribution"]

  const [isGenerating, setIsGenerating] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [useExperimentalTrackComparison, setUseExperimentalTrackComparison] = useState(false)
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
        year: selectedYear,
        eventName: selectedEventName,
        session: selectedSession,
        version: selectedVersion,
      }
      localStorage.setItem(LAST_STATE_KEY, JSON.stringify(payload))
    } catch {
      /* ignore */
    }
  }, [selectedPlotType, selectedYear, selectedEventName, selectedSession, selectedVersion])

  // Pick the most recent past event by date when available, fall back to first event
  const pickDefaultEvent = (events: any[]) => {
    if (!events.length) return null
    const now = Date.now()
    const withDates = events
      .map((e) => {
        const raw = e.start_date || e.date || e.event_date || e.session_date
        const t = raw ? new Date(raw).getTime() : NaN
        return { e, t }
      })
      .filter((x) => Number.isFinite(x.t)) as { e: any; t: number }[]
    const past = withDates.filter((x) => x.t <= now)
    if (past.length) {
      past.sort((a, b) => b.t - a.t)
      return past[0].e
    }
    if (withDates.length) {
      withDates.sort((a, b) => a.t - b.t)
      return withDates[0].e
    }
    return events.find((e: any) => e.name?.includes("Australia")) || events[0]
  }

  useEffect(() => {
    if (selectedYear) {
      fetchEventsByYear(Number(selectedYear))
        .then((data) => {
          const events = data.events || []
          setAvailableEvents(events)

          if (events.length > 0) {
            const currentValid = events.find(
              (e: any) => (e.official_name || e.name) === selectedEventName
            )
            if (!currentValid) {
              const defaultEvent = pickDefaultEvent(events)
              if (defaultEvent) {
                setSelectedEventName(defaultEvent.official_name || defaultEvent.name)
                setSelectedGp(defaultEvent.key ? defaultEvent.key.toString() : "1")
              }
            } else {
              setSelectedGp(currentValid.key ? currentValid.key.toString() : "1")
            }
          }
        })
        .catch(console.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear])

  const useLatestRace = () => {
    if (!availableEvents.length) return
    const defaultEvent = pickDefaultEvent(availableEvents)
    if (defaultEvent) {
      setSelectedEventName(defaultEvent.official_name || defaultEvent.name)
      setSelectedGp(defaultEvent.key ? defaultEvent.key.toString() : "1")
    }
  }

  const getSessionCode = (name: string, type: string, number: number | null) => {
    const normalizedName = name.toLowerCase()
    const normalizedType = type.toLowerCase()

    if (normalizedName.includes("sprint shootout") || normalizedName.includes("sprint qualifying")) return "SQ"
    if (normalizedName === "sprint") return "S"
    if (normalizedName === "qualifying") return "Q"
    if (normalizedName === "race") return "R"

    if (normalizedType === "practice") return `FP${number}`
    if (normalizedType === "sprint shootout" || normalizedType === "sprint qualifying") return "SQ"
    if (normalizedType === "sprint") return "S"
    if (normalizedType === "qualifying") return "Q"
    if (normalizedType === "race") return "R"
    if (normalizedType === "day 1") return "D1"
    if (normalizedType === "day 2") return "D2"
    if (normalizedType === "day 3") return "D3"
    return name
  }

  const defaultSessions = [
    { name: "Practice 1", type: "Practice", number: 1 },
    { name: "Practice 2", type: "Practice", number: 2 },
    { name: "Practice 3", type: "Practice", number: 3 },
    { name: "Qualifying", type: "Qualifying", number: null },
    { name: "Race", type: "Race", number: null },
  ]

  useEffect(() => {
    if (selectedYear && selectedEventName) {
      const event = availableEvents.find((e) => (e.official_name || e.name) === selectedEventName)
      const apiEventName = event ? event.name : selectedEventName

      fetchSessionsByEvent(Number(selectedYear), apiEventName)
        .then((data) => {
          const sessions = data.sessions || []
          const resolved = sessions.length > 0 ? sessions : defaultSessions
          setAvailableSessions(resolved)

          if (resolved.length > 0) {
            const currentValid = resolved.find(
              (s: any) => getSessionCode(s.name, s.type, s.number) === selectedSession
            )
            if (!currentValid) {
              const defaultSession =
                resolved.find((s: any) => s.type === "Practice" && s.number === 1) || resolved[0]
              setSelectedSession(getSessionCode(defaultSession.name, defaultSession.type, defaultSession.number))
            }
          }
        })
        .catch(() => {
          setAvailableSessions(defaultSessions)
          const currentValid = defaultSessions.find(
            (s) => getSessionCode(s.name, s.type, s.number) === selectedSession
          )
          if (!currentValid) {
            setSelectedSession("FP1")
          }
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedEventName])

  // Advanced settings state
  const [showGrid, setShowGrid] = useState(true)
  const [showLegend, setShowLegend] = useState(true)
  const [animateChart, setAnimateChart] = useState(true)
  const [chartHeight, setChartHeight] = useState("700")
  const [lineThickness, setLineThickness] = useState("2")
  const [showDataLabels, setShowDataLabels] = useState(false)

  // Token management
  const { isAuthenticated } = useAuth()
  const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const { userProfile, hasTokens, getTokenCount, deductToken, error: tokenError } = useTokens(authToken)

  const handlePlotTypeChange = (val: string) => {
    setSelectedPlotType(val)
    if (!v2SupportedPlots.includes(val)) {
      setSelectedVersion("v1")
    }
  }

  const plotTypes: PlotType[] = [
    { id: "topspeeds", name: "Top Speeds", icon: Gauge, description: "Compare top speeds across teams", isPro: false },
    { id: "throttle_average", name: "Throttle Average", icon: CircleGauge, description: "Compare average throttle across drivers", isPro: false },
    { id: "laptime", name: "Lap Time Analysis", icon: Clock, description: "Compare lap times and sector performance", isPro: false },
    { id: "track_comparison", name: "H2H Track Comparison", icon: Users, description: "Head-to-head track comparison visualization", isPro: false },
    { id: "throttle_brake", name: "H2H Throttle & Brake", icon: ChartSpline, description: "Compare throttle and brake inputs across drivers on their fastest laps", isPro: false },
    { id: "speed_distribution", name: "Speed Trace", icon: Gauge, description: "Overlay up to 3 drivers by speed over time", isPro: false },
    { id: "session_results", name: "Optimal Qualifying Time", icon: MonitorCog, description: "Visualize session results and lap time deltas", isPro: false },
    { id: "driver_analysis", name: "Driver Analysis", icon: UserRound, description: "Driver performance analysis", isPro: true },
    { id: "chevronsup", name: "Chevrons Up", icon: ChevronsUp, description: "Just a test icon", isPro: true },
    { id: "tire", name: "Tire Temperature", icon: TrendingUp, description: "Tire temperature evolution", isPro: true },
    { id: "gforce", name: "G-Force Analysis", icon: Zap, description: "Lateral and longitudinal forces", isPro: true },
    { id: "drag_downforce", name: "Drag & Downforce", icon: ChartScatter, description: "Drag and downforce analysis", isPro: true },
  ]

  const years = ["2025", "2026"]
  const selectedPlot = plotTypes.find((p) => p.id === selectedPlotType) ?? plotTypes[0]
  const usesTwoDrivers = selectedPlotType === "track_comparison" || selectedPlotType === "throttle_brake"
  const usesOneDriver = selectedPlotType === "laptime"
  const usesSpeedDrivers = selectedPlotType === "speed_distribution"
  const usesTopSpeedType = selectedPlotType === "topspeeds" && selectedVersion === "v2"
  const showPlotOptions = usesTwoDrivers || usesOneDriver || usesSpeedDrivers || usesTopSpeedType

  const [topSpeedsData, setTopSpeedsData] = useState<TopSpeedData[]>([])
  const [speedDomain, setSpeedDomain] = useState<[number, number]>([320, 335])
  const [throttleAverageData, setThrottleAverageData] = useState<ThrottleAverageData[]>([])
  const [throttleDomain, setThrottleDomain] = useState<[number, number]>([85, 100])
  const [trackComparisonPlotUrl, setTrackComparisonPlotUrl] = useState<string | null>(null)
  const [trackComparisonData, setTrackComparisonData] = useState<TrackComparisonData | null>(null)
  const [sessionResultsData, setSessionResultsData] = useState<SessionResultsData[]>([])
  const [sessionResultsDomain, setSessionResultsDomain] = useState<[number, number]>([0, 3])
  const [throttleBrakeData, setThrottleBrakeData] = useState<ThrottleBrakeComparisonData | null>(null)
  const [lapTimeData, setLapTimeData] = useState<LapTimeData[]>([])
  const [speedDistributionData, setSpeedDistributionData] = useState<SpeedDistributionPoint[]>([])

  useEffect(() => {
    return () => {
      if (trackComparisonPlotUrl) {
        URL.revokeObjectURL(trackComparisonPlotUrl)
      }
    }
  }, [trackComparisonPlotUrl])

  const selectedSpeedDrivers = Array.from(
    new Set(
      [selectedSpeedDriver1, selectedSpeedDriver2, selectedSpeedDriver3].filter(
        (driver) => driver !== "none"
      )
    )
  )

  const handleGeneratePlot = async () => {
    if (!isAuthenticated || !authToken) {
      alert("Please log in to generate plots")
      return
    }

    if (!hasTokens()) {
      alert("You need tokens to generate plots. Please purchase more tokens or wait for your monthly refill.")
      return
    }

    let apiGpVal: number | string = Number(selectedGp)
    const event = availableEvents.find((e) => (e.official_name || e.name) === selectedEventName)
    if (event) {
      if (selectedVersion === "v1") {
        const match = event.code ? event.code.match(/F1\d{4}(T?)(\d{2})/) : null
        const isTesting = match ? match[1] === "T" : event.name.toLowerCase().includes("test")
        if (isTesting) {
          alert(
            "Version 1 API does not support pre-season testing. Please select a normal Grand Prix or switch to version 2."
          )
          return
        }
        const index = availableEvents.indexOf(event)
        const roundNum = match ? parseInt(match[2], 10) : index + 1
        apiGpVal = roundNum
      } else if (selectedVersion === "v2") {
        apiGpVal = event.official_name || event.name
      }
    }

    let apiSessionVal = selectedSession
    if (selectedVersion === "v2") {
      const sessionObj = availableSessions.find(
        (s) => getSessionCode(s.name, s.type, s.number) === selectedSession
      )
      if (sessionObj) {
        apiSessionVal = sessionObj.name
      }
    }

    setIsGenerating(true)
    let plotGeneratedSuccessfully = false

    try {
      if (selectedPlotType === "topspeeds") {
        const data = await fetchTopSpeeds(
          authToken,
          Number(selectedYear),
          apiGpVal,
          apiSessionVal,
          selectedVersion,
          selectedTopSpeedType
        )

        let processedData: { team: string; speed: number; color: string }[] = []

        if (data && typeof data === "object" && "Color" in data && "Team" in data && "Top Speed (km/h)" in data) {
          const colors = data.Color as Record<string, string>
          const teams = data.Team as Record<string, string>
          const speeds = data["Top Speed (km/h)"] as Record<string, number>

          processedData = Object.keys(teams).map((key) => ({
            team: teams[key],
            speed: speeds[key],
            color: colors[key],
          }))
        } else {
          processedData = Object.values(
            data as Record<string, { Team: string; "Top Speed (km/h)": number; Color: string }>
          ).map((item) => ({
            team: item.Team,
            speed: item["Top Speed (km/h)"],
            color: item.Color,
          }))
        }

        processedData.sort((a, b) => b.speed - a.speed)

        const minSpeed = Math.min(...processedData.map((d) => d.speed))
        const maxSpeed = Math.max(...processedData.map((d) => d.speed))
        const margin = 5
        const domain: [number, number] = [Math.floor(minSpeed - margin), Math.ceil(maxSpeed + margin)]

        setTopSpeedsData(processedData)
        setSpeedDomain(domain)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "throttle_average") {
        const data = await fetchThrottleAverages(
          authToken,
          Number(selectedYear),
          apiGpVal,
          apiSessionVal,
          selectedVersion
        )

        const processedData = Object.values(
          data as Record<string, { Driver: string; "Average Throttle (%)": number; Color: string }>
        )
          .map((item) => ({
            driver: item.Driver,
            throttle: item["Average Throttle (%)"],
            color: item.Color,
          }))
          .sort((a, b) => b.throttle - a.throttle)

        const minThrottle = Math.min(...processedData.map((d) => d.throttle))
        const maxThrottle = Math.max(...processedData.map((d) => d.throttle))
        const margin = 5
        const domain: [number, number] = [Math.floor(minThrottle - margin), Math.ceil(maxThrottle + margin)]

        setThrottleAverageData(processedData)
        setThrottleDomain(domain)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "track_comparison") {
        if (selectedDriver1 && selectedDriver2 && selectedDriver1 !== selectedDriver2) {
          if (useExperimentalTrackComparison) {
            setTrackComparisonPlotUrl((previousUrl) => {
              if (previousUrl) {
                URL.revokeObjectURL(previousUrl)
              }
              return null
            })
            setTrackComparisonData(null)

            const data = await fetchTrackComparison(
              authToken,
              Number(selectedYear),
              apiGpVal,
              apiSessionVal,
              selectedDriver1,
              selectedDriver2,
              selectedVersion
            )
            setTrackComparisonData(data as TrackComparisonData)
          } else {
            setTrackComparisonData(null)
            setTrackComparisonPlotUrl((previousUrl) => {
              if (previousUrl) {
                URL.revokeObjectURL(previousUrl)
              }
              return null
            })

            const plotUrl = await fetchTrackComparisonPlot(
              authToken,
              Number(selectedYear),
              apiGpVal,
              apiSessionVal,
              selectedDriver1,
              selectedDriver2,
              selectedVersion
            )
            setTrackComparisonPlotUrl(plotUrl)
          }
          plotGeneratedSuccessfully = true
        } else {
          throw new Error("Please select two different drivers for track comparison")
        }
      } else if (selectedPlotType === "session_results") {
        const data = await fetchSessionResults(
          authToken,
          Number(selectedYear),
          apiGpVal,
          apiSessionVal,
          selectedVersion
        )

        const processedData = data as SessionResultsData[]
        const maxDelta = Math.max(...processedData.map((d) => d.LapTimeDelta))
        const domain: [number, number] = [0, Math.ceil(maxDelta + 0.5)]

        setSessionResultsData(processedData)
        setSessionResultsDomain(domain)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "throttle_brake") {
        if (selectedDriver1 && selectedDriver2 && selectedDriver1 !== selectedDriver2) {
          setThrottleBrakeData(null)

          const data = await fetchThrottleBrakeComparison(
            authToken,
            Number(selectedYear),
            apiGpVal,
            apiSessionVal,
            selectedDriver1,
            selectedDriver2,
            selectedVersion
          )
          setThrottleBrakeData(data as ThrottleBrakeComparisonData)
          plotGeneratedSuccessfully = true
        } else {
          throw new Error("Please select two different drivers for throttle & brake comparison")
        }
      } else if (selectedPlotType === "laptime") {
        const data = await fetchLaptimeData(
          authToken,
          Number(selectedYear),
          apiGpVal,
          apiSessionVal,
          selectedDriver,
          selectedVersion
        )
        setLapTimeData(data)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "speed_distribution") {
        if (selectedSpeedDrivers.length === 0) {
          throw new Error("Select at least one driver for Speed vs Time")
        }

        const rawResponses = await Promise.all(
          selectedSpeedDrivers.map((driverCode) =>
            fetchSpeedDistributionData(
              authToken,
              Number(selectedYear),
              apiGpVal,
              apiSessionVal,
              driverCode,
              selectedVersion
            )
          )
        )

        const mergedRows = rawResponses.flatMap((rawData) =>
          Array.isArray(rawData) ? rawData : Object.values(rawData || {})
        )

        const normalized = mergedRows
          .map((item) => {
            const row = item as SpeedDistributionRawPoint & Partial<SpeedDistributionPoint>
            return {
              time: Number(row["Time (s)"] ?? row.time),
              speed: Number(row["Speed (km/h)"] ?? row.speed),
              driver: String(row.Driver ?? row.driver ?? ""),
              color: String(row.Color ?? row.color ?? "#F9FAFB"),
            }
          })
          .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.speed) && point.driver)

        const filtered = normalized.filter((point) => selectedSpeedDrivers.includes(point.driver))

        if (filtered.length === 0) {
          throw new Error("No Speed vs Time data available for selected driver(s)")
        }

        setSpeedDistributionData(filtered)
        plotGeneratedSuccessfully = true
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        plotGeneratedSuccessfully = true
      }

      if (plotGeneratedSuccessfully) {
        const tokenDeducted = await deductToken()
        if (tokenDeducted) {
          console.log("Token deducted successfully for plot generation")
        } else {
          console.warn("Failed to deduct token after successful plot generation")
        }
      }
    } catch (error) {
      console.error("Error generating plot:", error)
      alert("Error generating plot: " + (error as Error).message)
    } finally {
      setIsGenerating(false)
    }
  }

  const renderPlot = () => {
    const advancedSettings: AdvancedPlotSettings = {
      showGrid,
      showLegend,
      animateChart,
      chartHeight: parseInt(chartHeight),
      lineThickness: parseInt(lineThickness),
      showDataLabels,
    }

    switch (selectedPlotType) {
      case "laptime":
        return <LapTimeAnalysisGraph lapTimeData={lapTimeData} advancedSettings={advancedSettings} />
      case "speed":
        return <SpeedTraceGraph speedData={speedData} advancedSettings={advancedSettings} />
      case "tire":
        return <TireTempGraph tireTempData={tireData} advancedSettings={advancedSettings} />
      case "gforce":
        return <GForceGraph gForceData={gForceData} advancedSettings={advancedSettings} />
      case "topspeeds":
        return <TopSpeedGraph data={topSpeedsData} speedDomain={speedDomain} advancedSettings={advancedSettings} />
      case "throttle_average":
        return (
          <ThrottleAverageGraph
            data={throttleAverageData}
            throttleDomain={throttleDomain}
            advancedSettings={advancedSettings}
          />
        )
      case "track_comparison":
        return useExperimentalTrackComparison ? (
          trackComparisonData ? (
            <div className="space-y-4">
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Experimental mode enabled.
                  <br />
                  <span className="text-sm text-muted-foreground">
                    Using the legacy custom telemetry visual. Data quality and behavior may vary.
                  </span>
                </AlertDescription>
              </Alert>
              <TrackComparisonGraph data={trackComparisonData} advancedSettings={advancedSettings} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[700px] text-muted-foreground space-y-4">
              {isGenerating ? <LoadingPlot /> : "No track comparison data available"}
            </div>
          )
        ) : trackComparisonPlotUrl ? (
          <div className="space-y-4">
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The custom H2H Track Comparison visual is currently under maintenance.
                <br />
                <span className="text-sm text-muted-foreground">
                  Showing the official plot image from the external API endpoint.
                </span>
              </AlertDescription>
            </Alert>
            <div className="flex items-center justify-center min-h-[700px] rounded-lg border border-border/50 bg-background/40 p-4">
              <img
                src={trackComparisonPlotUrl}
                alt={`H2H Track Comparison Plot (${selectedDriver1} vs ${selectedDriver2})`}
                className="max-h-[700px] w-auto max-w-full rounded-md object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[700px] text-muted-foreground space-y-4">
            {isGenerating ? <LoadingPlot /> : "No track comparison data available"}
          </div>
        )
      case "session_results":
        return (
          <SessionResultsGraph
            data={sessionResultsData}
            deltaDomain={sessionResultsDomain}
            advancedSettings={advancedSettings}
          />
        )
      case "throttle_brake":
        return throttleBrakeData ? (
          <ThrottleBrakeComparisonGraph data={throttleBrakeData} advancedSettings={advancedSettings} />
        ) : (
          <div className="flex flex-col items-center justify-center h-[700px] text-muted-foreground space-y-4">
            {isGenerating ? <LoadingPlot /> : "No throttle & brake comparison data available"}
          </div>
        )
      case "speed_distribution":
        return (
          <SpeedDistributionGraph
            data={speedDistributionData}
            selectedDrivers={selectedSpeedDrivers}
            advancedSettings={advancedSettings}
          />
        )
      default:
        return null
    }
  }

  const renderStats = () => {
    if (selectedPlotType === "topspeeds") {
      return (
        <>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">{topSpeedsData[0]?.speed || "-"} km/h</div>
            <div className="text-muted-foreground">Fastest Team</div>
            <div className="text-xs text-muted-foreground">{topSpeedsData[0]?.team || "-"}</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">{topSpeedsData[9]?.speed || "-"} km/h</div>
            <div className="text-muted-foreground">Slowest Team</div>
            <div className="text-xs text-muted-foreground">{topSpeedsData[9]?.team || "-"}</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">
              {topSpeedsData.length > 0
                ? (topSpeedsData.reduce((acc, curr) => acc + curr.speed, 0) / topSpeedsData.length).toFixed(1)
                : "-"}{" "}
              km/h
            </div>
            <div className="text-muted-foreground">Average Speed</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">
              {topSpeedsData.length > 0
                ? (topSpeedsData[0].speed - topSpeedsData[topSpeedsData.length - 1].speed).toFixed(1)
                : "-"}{" "}
              km/h
            </div>
            <div className="text-muted-foreground">Speed Delta</div>
          </div>
        </>
      )
    }
    if (selectedPlotType === "throttle_average") {
      return (
        <>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">{throttleAverageData[0]?.throttle?.toFixed(1) || "-"}%</div>
            <div className="text-muted-foreground">Highest Throttle</div>
            <div className="text-xs text-muted-foreground">{throttleAverageData[0]?.driver || "-"}</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">
              {throttleAverageData[throttleAverageData.length - 1]?.throttle?.toFixed(1) || "-"}%
            </div>
            <div className="text-muted-foreground">Lowest Throttle</div>
            <div className="text-xs text-muted-foreground">
              {throttleAverageData[throttleAverageData.length - 1]?.driver || "-"}
            </div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">
              {throttleAverageData.length > 0
                ? (throttleAverageData.reduce((acc, curr) => acc + (curr.throttle || 0), 0) / throttleAverageData.length).toFixed(1)
                : "-"}
              %
            </div>
            <div className="text-muted-foreground">Average Throttle</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">
              {throttleAverageData.length > 0 &&
              throttleAverageData[0]?.throttle &&
              throttleAverageData[throttleAverageData.length - 1]?.throttle
                ? (
                    throttleAverageData[0].throttle -
                    throttleAverageData[throttleAverageData.length - 1].throttle
                  ).toFixed(1)
                : "-"}
              %
            </div>
            <div className="text-muted-foreground">Throttle Delta</div>
          </div>
        </>
      )
    }
    if (selectedPlotType === "session_results") {
      return (
        <>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">{sessionResultsData[0]?.LapTime || "-"}</div>
            <div className="text-muted-foreground">Fastest Lap</div>
            <div className="text-xs text-muted-foreground">{sessionResultsData[0]?.Driver || "-"}</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">
              +{sessionResultsData[sessionResultsData.length - 1]?.LapTimeDelta?.toFixed(3) || "-"}s
            </div>
            <div className="text-muted-foreground">Largest Gap</div>
            <div className="text-xs text-muted-foreground">
              {sessionResultsData[sessionResultsData.length - 1]?.Driver || "-"}
            </div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">
              {sessionResultsData.length > 0
                ? (sessionResultsData.reduce((acc, curr) => acc + (curr.LapTimeDelta || 0), 0) / sessionResultsData.length).toFixed(3)
                : "-"}
              s
            </div>
            <div className="text-muted-foreground">Avg. Gap</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">{sessionResultsData.length || 0}</div>
            <div className="text-muted-foreground">Total Drivers</div>
          </div>
        </>
      )
    }
    if (selectedPlotType === "throttle_brake") {
      return (
        <>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">
              {throttleBrakeData?.driver1 || "-"} vs {throttleBrakeData?.driver2 || "-"}
            </div>
            <div className="text-muted-foreground">Head to Head</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">{throttleBrakeData?.telemetry?.length || 0}</div>
            <div className="text-muted-foreground">Data Points</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">{throttleBrakeData?.session_info?.event_name || "-"}</div>
            <div className="text-muted-foreground">Event</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">{throttleBrakeData?.session_info?.session_name || "-"}</div>
            <div className="text-muted-foreground">Session</div>
          </div>
        </>
      )
    }
    if (selectedPlotType === "speed_distribution") {
      return (
        <>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">{selectedSpeedDrivers.length || 0}</div>
            <div className="text-muted-foreground">Selected Drivers</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">
              {speedDistributionData.length > 0
                ? `${Math.max(...speedDistributionData.map((point) => point.speed)).toFixed(1)} km/h`
                : "-"}
            </div>
            <div className="text-muted-foreground">Peak Speed</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">
              {speedDistributionData.length > 0
                ? `${(speedDistributionData.reduce((acc, point) => acc + point.speed, 0) / speedDistributionData.length).toFixed(1)} km/h`
                : "-"}
            </div>
            <div className="text-muted-foreground">Average Speed</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">{speedDistributionData.length || 0}</div>
            <div className="text-muted-foreground">Data Points</div>
          </div>
        </>
      )
    }
    return null
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

  return (
    <TooltipProvider delayDuration={150}>
      <Card
        className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-4"
      >
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg glow-effect">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold gradient-text">Telemetry Plot Generator</CardTitle>
                <CardDescription>Generate custom F1 telemetry visualizations</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isAuthenticated && userProfile && (
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10">
                  <Coins className="h-3 w-3 mr-1" />
                  {tokenCount} tokens
                </Badge>
              )}
              <Badge variant="secondary" className="accent-glow">
                AI Powered
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
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
            <Alert className="border-red-500/50 bg-red-500/10 mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{tokenError}</AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Plot type picker */}
          <PlotTypePicker
            plotTypes={plotTypes}
            value={selectedPlotType}
            onChange={handlePlotTypeChange}
          />

          {/* Selected plot subtitle */}
          <div>
            <h3 className="text-lg font-semibold text-foreground">{selectedPlot.name}</h3>
            <p className="text-sm text-muted-foreground">{selectedPlot.description}</p>
          </div>

          {/* Race & session card */}
          <Card data-tour="raceSession" className="bg-background/30 border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                Race &amp; session
              </CardTitle>
              <CardDescription>Pick the season, Grand Prix, and session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-full bg-background/50 border-border/50">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="round">Round</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {/* <button
                          type="button"
                          onClick={useLatestRace}
                          className="text-[10px] text-primary hover:underline disabled:opacity-50"
                          disabled={!availableEvents.length}
                        >
                          Use latest race
                        </button> */}
                      </TooltipTrigger>
                      <TooltipContent side="top">Jump to the most recent past event</TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={selectedEventName}
                    onValueChange={(val) => {
                      setSelectedEventName(val)
                      const event = availableEvents.find(
                        (e) => (e.official_name || e.name) === val
                      )
                      if (event) {
                        setSelectedGp(event.key ? event.key.toString() : "1")
                      }
                    }}
                  >
                    <SelectTrigger className="w-full bg-background/50 border-border/50">
                      <SelectValue placeholder="Select round" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEvents.length > 0 ? (
                        availableEvents.map((event, index) => {
                          const match = event.code.match(/F1\d{4}(T?)(\d{2})/)
                          const isTesting = match && match[1] === "T"
                          const roundNum = match ? parseInt(match[2], 10) : index + 1
                          const prefix = isTesting ? "Test" : `${roundNum}.`
                          const isDuplicate = availableEvents.filter((e) => e.name === event.name).length > 1
                          const displayName = isDuplicate ? event.official_name : event.name
                          const identifier = event.official_name || event.name
                          return (
                            <SelectItem key={event.key || index} value={identifier}>
                              {`${prefix} ${displayName}`}
                            </SelectItem>
                          )
                        })
                      ) : (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session">Session</Label>
                  <Select value={selectedSession} onValueChange={setSelectedSession}>
                    <SelectTrigger className="w-full bg-background/50 border-border/50">
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSessions.length > 0 ? (
                        availableSessions.map((session) => {
                          const code = getSessionCode(session.name, session.type, session.number)
                          return (
                            <SelectItem key={session.key || code} value={code}>
                              {session.name}
                            </SelectItem>
                          )
                        })
                      ) : (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="version">API Version</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px]">
                        v1 is the stable backend. v2 is experimental and supports Top Speeds, Throttle Average and Speed Trace.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                    <SelectTrigger className="w-full bg-background/50 border-border/50">
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="v1">Version 1</SelectItem>
                      <SelectItem
                        value="v2"
                        disabled={!v2SupportedPlots.includes(selectedPlotType)}
                      >
                        Version 2 (Experimental)
                        {!v2SupportedPlots.includes(selectedPlotType) ? " - not supported" : ""}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* {selectedVersion === "v2" && (
                <Alert className="border-yellow-500/50 bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    API Version 2 is experimental and may return incomplete data or change without notice.
                    <br />
                    <span className="text-sm text-muted-foreground">
                      v2 is supported for Top Speeds, Throttle Average, and Speed Trace.
                    </span>
                  </AlertDescription>
                </Alert>
              )} */}
            </CardContent>
          </Card>

          {/* Plot options card */}
          {showPlotOptions && (
            <Card data-tour="drivers" className="bg-background/30 border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Plot options
                </CardTitle>
                <CardDescription>Configure the inputs for this plot type.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {usesOneDriver && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="driver">Driver</Label>
                      <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                        <SelectTrigger className="w-full bg-background/50 border-border/50">
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem key={driver} value={driver}>
                              {driver}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {usesTwoDrivers && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="driver1">Driver 1</Label>
                      <Select value={selectedDriver1} onValueChange={setSelectedDriver1}>
                        <SelectTrigger className="w-full bg-background/50 border-border/50">
                          <SelectValue placeholder="Select driver 1" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem key={driver} value={driver}>
                              {driver}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driver2">Driver 2</Label>
                      <Select value={selectedDriver2} onValueChange={setSelectedDriver2}>
                        <SelectTrigger className="w-full bg-background/50 border-border/50">
                          <SelectValue placeholder="Select driver 2" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem key={driver} value={driver}>
                              {driver}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {usesSpeedDrivers && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="speed-driver-1">Driver 1</Label>
                      <Select value={selectedSpeedDriver1} onValueChange={setSelectedSpeedDriver1}>
                        <SelectTrigger className="w-full bg-background/50 border-border/50">
                          <SelectValue placeholder="Select driver 1" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem key={`sd1-${driver}`} value={driver}>
                              {driver}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="speed-driver-2">Driver 2</Label>
                      <Select value={selectedSpeedDriver2} onValueChange={setSelectedSpeedDriver2}>
                        <SelectTrigger className="w-full bg-background/50 border-border/50">
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {drivers.map((driver) => (
                            <SelectItem key={`sd2-${driver}`} value={driver}>
                              {driver}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="speed-driver-3">Driver 3</Label>
                      <Select value={selectedSpeedDriver3} onValueChange={setSelectedSpeedDriver3}>
                        <SelectTrigger className="w-full bg-background/50 border-border/50">
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {drivers.map((driver) => (
                            <SelectItem key={`sd3-${driver}`} value={driver}>
                              {driver}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {usesTopSpeedType && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="topSpeedType">Speed Source</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px]">
                            Track Telemetry uses per-lap car telemetry. Speed Trap uses sector speed-trap readings.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select value={selectedTopSpeedType} onValueChange={setSelectedTopSpeedType}>
                        <SelectTrigger className="w-full bg-background/50 border-border/50">
                          <SelectValue placeholder="Select data source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="telemetry">Track Telemetry</SelectItem>
                          <SelectItem value="st">Speed Trap</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {selectedPlotType === "track_comparison" && (
                  <Alert className="border-blue-500/40 bg-blue-500/10 py-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <AlertDescription className="text-xs leading-5">
                      <span>Default mode uses the external plot image endpoint for stability.</span>
                      <span className="text-xs text-muted-foreground block mt-1">
                        Enable experimental mode to use the legacy custom telemetry rendering.
                      </span>
                      <div className="flex items-center gap-2 whitespace-nowrap py-2">
                        <Label htmlFor="experimental-track-comparison" className="text-xs font-medium">
                          Experimental
                        </Label>
                        <Switch
                          id="experimental-track-comparison"
                          checked={useExperimentalTrackComparison}
                          onCheckedChange={setUseExperimentalTrackComparison}
                        />
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Advanced settings collapsible */}
          <Collapsible
            open={advancedOpen}
            onOpenChange={setAdvancedOpen}
            data-tour="advanced"
            className="rounded-md border border-border/40 bg-background/30"
          >
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
                <h4 className="text-sm font-semibold text-foreground">Display Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-grid">Show Grid Lines</Label>
                      <p className="text-xs text-muted-foreground">Display grid lines on the chart</p>
                    </div>
                    <Switch id="show-grid" checked={showGrid} onCheckedChange={setShowGrid} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-legend">Show Legend</Label>
                      <p className="text-xs text-muted-foreground">Display chart legend</p>
                    </div>
                    <Switch id="show-legend" checked={showLegend} onCheckedChange={setShowLegend} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-labels">Show Data Labels</Label>
                      <p className="text-xs text-muted-foreground">Display values on data points</p>
                    </div>
                    <Switch id="show-labels" checked={showDataLabels} onCheckedChange={setShowDataLabels} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="animate">Animate Chart</Label>
                      <p className="text-xs text-muted-foreground">Enable chart animations</p>
                    </div>
                    <Switch id="animate" checked={animateChart} onCheckedChange={setAnimateChart} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Appearance</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="chart-height">Chart Height (px)</Label>
                    <Input
                      id="chart-height"
                      type="number"
                      min="400"
                      max="1000"
                      value={chartHeight}
                      onChange={(e) => setChartHeight(e.target.value)}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="line-thickness">Line Thickness</Label>
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
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Quick Presets</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowGrid(true)
                      setShowLegend(true)
                      setAnimateChart(true)
                      setChartHeight("700")
                      setLineThickness("2")
                      setShowDataLabels(true)
                    }}
                    className="bg-background/50"
                  >
                    Default
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowGrid(false)
                      setShowLegend(true)
                      setAnimateChart(false)
                      setChartHeight("700")
                      setLineThickness("3")
                      setShowDataLabels(false)
                    }}
                    className="bg-background/50"
                  >
                    Minimal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowGrid(true)
                      setShowLegend(true)
                      setAnimateChart(true)
                      setChartHeight("900")
                      setLineThickness("2")
                      setShowDataLabels(true)
                    }}
                    className="bg-background/50"
                  >
                    Detailed
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowGrid(false)
                      setShowLegend(false)
                      setAnimateChart(false)
                      setChartHeight("600")
                      setLineThickness("2")
                      setShowDataLabels(false)
                    }}
                    className="bg-background/50"
                  >
                    Clean
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Generate row */}
          <div data-tour="generate" className="flex flex-wrap items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={handleGeneratePlot}
                    disabled={isGenerating || !tokensAvailable}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground glow-effect hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        Need 1 token
                      </>
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {!tokensAvailable && (
                <TooltipContent side="bottom" className="max-w-[240px]">
                  {isAuthenticated
                    ? "You're out of tokens. They refill monthly, or you can buy more from your account settings."
                    : "Log in to generate plots."}
                </TooltipContent>
              )}
            </Tooltip>

            <Button
              variant="outline"
              className="bg-transparent hover:bg-muted/20 transition-all duration-300"
              onClick={() => alert("Coming soon!")}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Token warning under the button */}
          {isAuthenticated && !hasTokens() && (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don&apos;t have enough tokens to generate plots. Each plot costs 1 token.
                <br />
                <span className="text-sm text-muted-foreground">
                  Tokens refill monthly or you can purchase more in your account settings.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Results */}
          <div className="space-y-4 pt-2">
            <div className="bg-background/30 rounded-lg p-4 border border-border/50">{renderPlot()}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">{renderStats()}</div>
          </div>
        </CardContent>
      </Card>
      <GeneratorTour open={tourOpen} onClose={() => setTourOpen(false)} />
    </TooltipProvider>
  )
}
