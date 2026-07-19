"use client"

import { useState, useEffect, useMemo } from "react"
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
  TrendingDown,
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
  Code2,
  Disc,
  Activity,
  BarChart2,
  RefreshCw,
  ArrowUpDown,
  GitCompareArrows,
  Wrench,
  CloudRain,
  Grid3x3,
  Thermometer,
  Sigma,
  BookOpen,
  Swords,
  ChartLine,
  Radar as RadarIcon,
  History,
  Target,
  MapPin,
  Crosshair,
} from "lucide-react"
import { toast } from "sonner"
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
  fetchTyreStintData,
  fetchLapDistributionData,
  fetchStaticDrivers,
  fetchPositionChanges,
  fetchRaceGaps,
  fetchTyreDegradation,
  fetchPitStrategy,
  fetchSessionWeather,
  fetchRacePaceHeatmap,
  fetchTrackEvolution,
  fetchTheoreticalBest,
  fetchRaceStory,
  fetchTeammateBattle,
  fetchFormGuide,
  fetchSeasonDriverRadar,
  fetchCareerDriverRadar,
  fetchTrackMap,
  fetchCornerDuel,
  fetchSessionDriverRadar,
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
import {
  PositionChangesData,
  RaceGapsData,
  TyreDegradationData,
  PitStrategyData,
  SessionWeatherData,
  RacePaceHeatmapData,
  TrackEvolutionData,
  TheoreticalBestData,
  RaceStoryData,
  TeammateBattleData,
  FormGuideData,
  DriverRadarData,
  TrackMapData,
  CornerDuelData,
} from "@/types/plot-types-v2"
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
import { TyreStintGraph } from "./plots/tyre-stint"
import { LapDistributionGraph } from "./plots/lap-distribution"
import { LapTimeCandlestickGraph } from "./plots/lap-time-candlestick"
import { PositionChangesGraph } from "./plots/position-changes"
import { RaceGapsGraph } from "./plots/race-gaps"
import { TyreDegradationGraph } from "./plots/tyre-degradation"
import { PitStrategyGraph } from "./plots/pit-strategy"
import { SessionWeatherGraph } from "./plots/session-weather"
import { RacePaceHeatmapGraph } from "./plots/race-pace-heatmap"
import { TrackEvolutionGraph } from "./plots/track-evolution"
import { TheoreticalBestGraph } from "./plots/theoretical-best"
import { RaceStoryGraph } from "./plots/race-story"
import { TeammateBattleGraph } from "./plots/teammate-battle"
import { FormGuideGraph } from "./plots/form-guide"
import { DriverRadarGraph } from "./plots/driver-radar"
import { TrackMapGraph } from "./plots/track-map"
import { CornerDuelGraph } from "./plots/corner-duel"
import { SessionResultsData } from "@/types/plot-types"
import { TyreStintEntry, LapTimeDistributionPoint } from "@/types/news-types"
import { drivers_2025, drivers_2026 } from "@/lib/constants/drivers"
import { LoadingPlot } from "./loading_plot"
import { useTokens } from "@/hooks/use-tokens"
import { logTelemetryRequest } from "@/lib/userService"
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

export function TelemetryPlotGenerator() {
  const persisted = typeof window !== "undefined" ? readPersisted() : {}

  const [selectedPlotType, setSelectedPlotType] = useState(persisted.plotType ?? "topspeeds")
  const [lapDistSelectedDrivers, setLapDistSelectedDrivers] = useState<string[]>(["VER"])
  const [selectedDriver, setSelectedDriver] = useState("VER")
  const [selectedDriver1, setSelectedDriver1] = useState("VER")
  const [selectedDriver2, setSelectedDriver2] = useState("HAM")
  const [selectedSpeedDriver1, setSelectedSpeedDriver1] = useState("VER")
  const [selectedSpeedDriver2, setSelectedSpeedDriver2] = useState("none")
  const [selectedSpeedDriver3, setSelectedSpeedDriver3] = useState("none")
  const [selectedSession, setSelectedSession] = useState(persisted.session ?? "FP1")
  const [selectedYear, setSelectedYear] = useState(persisted.year ?? "2026")
  const [selectedGp, setSelectedGp] = useState("1")
  const [selectedEventName, setSelectedEventName] = useState("Australian Grand Prix")
  const [selectedTopSpeedType, setSelectedTopSpeedType] = useState("telemetry")
  const [availableEvents, setAvailableEvents] = useState<any[]>([])
  const [availableSessions, setAvailableSessions] = useState<any[]>([])

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
        session: selectedSession,
      }
      localStorage.setItem(LAST_STATE_KEY, JSON.stringify(payload))
    } catch {
      /* ignore */
    }
  }, [selectedPlotType, selectedYear, selectedEventName, selectedSession])

  // The events list has no date fields of its own (pre-season testing and
  // Grands Prix are indistinguishable by date), so "most recent" has to be
  // resolved from each event's own sessions, which do carry start_date.
  const isTestingEvent = (e: any) =>
    `${e.name ?? ""} ${e.official_name ?? ""}`.toLowerCase().includes("test")

  // Fallback used only if session lookups fail entirely (e.g. offline):
  // skip testing events and just take the first remaining event.
  const pickDefaultEvent = (events: any[]) => {
    if (!events.length) return null
    const races = events.filter((e) => !isTestingEvent(e))
    return (races.length ? races : events)[0]
  }

  const resolveLatestEvent = async (events: any[], year: string) => {
    if (!events.length) return null
    const races = events.filter((e) => !isTestingEvent(e))
    if (!races.length) return pickDefaultEvent(events)

    const now = Date.now()
    const results = await Promise.allSettled(
      races.map((e) => fetchSessionsByEvent(Number(year), e.name))
    )

    const withDates = races
      .map((e, i) => {
        const result = results[i]
        if (result.status !== "fulfilled") return null
        const sessions = result.value?.sessions || []
        const times = sessions
          .map((s: any) => {
            const raw = s.start_date || s.date || s.session_date
            return raw ? new Date(raw).getTime() : NaN
          })
          .filter((t: number) => Number.isFinite(t))
        if (times.length === 0) return null
        return { e, start: Math.min(...times) }
      })
      .filter((x): x is { e: any; start: number } => x !== null)

    if (withDates.length === 0) return pickDefaultEvent(events)

    const past = withDates.filter((x) => x.start <= now)
    if (past.length) {
      past.sort((a, b) => b.start - a.start)
      return past[0].e
    }
    withDates.sort((a, b) => a.start - b.start)
    return withDates[0].e
  }

  const loadEvents = async (year: string, preserveSelection = true) => {
    const data = await fetchEventsByYear(Number(year))
    const events = data.events || []
    setAvailableEvents(events)

    if (events.length > 0) {
      const stillValid =
        preserveSelection &&
        events.some((e: any) => (e.official_name || e.name) === selectedEventName)
      if (!stillValid) {
        const defaultEvent = await resolveLatestEvent(events, year)
        if (defaultEvent) {
          setSelectedEventName(defaultEvent.official_name || defaultEvent.name)
          setSelectedGp(defaultEvent.key ? defaultEvent.key.toString() : "1")
        }
      }
    }
    return events
  }

  useEffect(() => {
    if (selectedYear) {
      loadEvents(selectedYear, false).catch(console.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear])

  const [isResolvingLatestRace, setIsResolvingLatestRace] = useState(false)

  const useLatestRace = async () => {
    if (!availableEvents.length) return
    setIsResolvingLatestRace(true)
    try {
      const defaultEvent = await resolveLatestEvent(availableEvents, selectedYear)
      if (defaultEvent) {
        setSelectedEventName(defaultEvent.official_name || defaultEvent.name)
        setSelectedGp(defaultEvent.key ? defaultEvent.key.toString() : "1")
      }
    } catch (error) {
      console.error("Error resolving latest race:", error)
      toast.error("Failed to find the latest race")
    } finally {
      setIsResolvingLatestRace(false)
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

  const loadSessions = async (year: string, eventName: string, events: any[]) => {
    const event = events.find((e) => (e.official_name || e.name) === eventName)
    const apiEventName = event ? event.name : eventName

    try {
      const data = await fetchSessionsByEvent(Number(year), apiEventName)
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
    } catch {
      setAvailableSessions(defaultSessions)
      const currentValid = defaultSessions.find(
        (s) => getSessionCode(s.name, s.type, s.number) === selectedSession
      )
      if (!currentValid) {
        setSelectedSession("FP1")
      }
    }
  }

  useEffect(() => {
    if (selectedYear && selectedEventName) {
      loadSessions(selectedYear, selectedEventName, availableEvents)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedEventName, availableEvents])

  const [isRefreshingSessions, setIsRefreshingSessions] = useState(false)

  const handleRefreshSessions = async () => {
    setIsRefreshingSessions(true)
    try {
      const events = await loadEvents(selectedYear, true)
      await loadSessions(selectedYear, selectedEventName, events)
      toast.success("Sessions refreshed")
    } catch (error) {
      console.error("Error refreshing sessions:", error)
      toast.error("Failed to refresh sessions")
    } finally {
      setIsRefreshingSessions(false)
    }
  }

  // Advanced settings state
  const [showGrid, setShowGrid] = useState(true)
  const [showLegend, setShowLegend] = useState(true)
  const [animateChart, setAnimateChart] = useState(true)
  const [chartHeight, setChartHeight] = useState("700")
  const [lineThickness, setLineThickness] = useState("2")
  const [showDataLabels, setShowDataLabels] = useState(false)
  const [speedTraceDistinctColors, setSpeedTraceDistinctColors] = useState(false)

  // Token management
  const { isAuthenticated } = useAuth()
  const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const { userProfile, hasTokens, getTokenCount, deductToken, error: tokenError } = useTokens(authToken)

  const handlePlotTypeChange = (val: string) => {
    setSelectedPlotType(val)
  }

  const plotTypes: PlotType[] = [
    { id: "topspeeds", name: "Top Speeds", icon: Gauge, description: "Compare top speeds across teams", isPro: false, category: "Speed & Pace" },
    { id: "throttle_average", name: "Throttle Average", icon: CircleGauge, description: "Compare average throttle across drivers", isPro: false, category: "Speed & Pace" },
    { id: "speed_distribution", name: "Speed Trace", icon: Gauge, description: "Overlay up to 3 drivers by speed over time", isPro: false, category: "Speed & Pace" },
    { id: "laptime", name: "Lap Time Analysis", icon: Clock, description: "Compare lap times and sector performance", isPro: false, category: "Lap Analysis" },
    { id: "lap_distribution", name: "Lap Distribution", icon: Activity, description: "Lap-by-lap time evolution for up to 3 drivers", isPro: false, category: "Lap Analysis" },
    { id: "lap_distribution_candlestick", name: "Lap Time Box Plot", icon: BarChart2, description: "Box-and-whisker distribution of lap times per driver", isPro: false, category: "Lap Analysis" },
    { id: "theoretical_best", name: "Theoretical Best", icon: Sigma, description: "Best sectors combined vs actual best lap", isPro: false, category: "Lap Analysis" },
    { id: "track_evolution", name: "Track Evolution", icon: Thermometer, description: "Running best lap time vs track temperature", isPro: false, category: "Lap Analysis" },
    { id: "track_comparison", name: "H2H Track Comparison", icon: Users, description: "Head-to-head track comparison visualization", isPro: false, category: "Comparisons" },
    { id: "throttle_brake", name: "H2H Throttle & Brake", icon: ChartSpline, description: "Compare throttle and brake inputs across drivers on their fastest laps", isPro: false, category: "Comparisons" },
    { id: "corner_duel", name: "Corner Duel", icon: Crosshair, description: "Corner-by-corner telemetry comparison between two drivers", isPro: false, category: "Comparisons" },
    { id: "teammate_battle", name: "Teammate Battle", icon: Swords, description: "Head-to-head quali/race records per team", isPro: false, category: "Comparisons" },
    // { id: "driver_analysis", name: "Driver Analysis", icon: UserRound, description: "Driver performance analysis", isPro: true },
    // { id: "chevronsup", name: "Chevrons Up", icon: ChevronsUp, description: "Just a test icon", isPro: true },
    // { id: "tire", name: "Tire Temperature", icon: TrendingUp, description: "Tire temperature evolution", isPro: true },
    // { id: "gforce", name: "G-Force Analysis", icon: Zap, description: "Lateral and longitudinal forces", isPro: true },
    // { id: "drag_downforce", name: "Drag & Downforce", icon: ChartScatter, description: "Drag and downforce analysis", isPro: true },
    { id: "session_results", name: "Optimal Qualifying Time", icon: MonitorCog, description: "Visualize session results and lap time deltas", isPro: false, category: "Session Info" },
    { id: "session_weather", name: "Session Weather", icon: CloudRain, description: "Weather timeline, track status, and race control messages", isPro: false, category: "Session Info" },
    { id: "track_map", name: "Track Map", icon: MapPin, description: "Fastest-lap telemetry with speed/gear overlay and braking zones", isPro: false, category: "Session Info" },
    { id: "tyre_stint", name: "Tyre Stint Strategy", icon: Disc, description: "Visualize tyre compounds and pit stop strategy for every driver (Race & Sprint only)", isPro: false, category: "Race Strategy" },
    { id: "position_changes", name: "Position Changes", icon: ArrowUpDown, description: "Lap-by-lap driver position throughout the race", isPro: false, category: "Race Strategy" },
    { id: "race_gaps", name: "Race Gaps", icon: GitCompareArrows, description: "Per-driver gap to leader or vs average race pace", isPro: false, category: "Race Strategy" },
    { id: "tyre_degradation", name: "Tyre Degradation", icon: TrendingDown, description: "Per-compound tyre performance and degradation rate", isPro: false, category: "Race Strategy" },
    { id: "pit_strategy", name: "Pit Strategy", icon: Wrench, description: "Pit stops, undercuts, and free tyre changes", isPro: false, category: "Race Strategy" },
    { id: "race_pace_heatmap", name: "Race Pace Heatmap", icon: Grid3x3, description: "Driver x lap grid of delta to field median lap time", isPro: false, category: "Race Strategy" },
    { id: "race_story", name: "Race Story", icon: BookOpen, description: "Gap-to-leader series, pit stops, and key moments", isPro: false, category: "Race Strategy" },
    { id: "form_guide", name: "Season Form Guide", icon: ChartLine, description: "Rolling-average race/quali finish positions across the season", isPro: false, category: "Season & Career" },
    { id: "driver_radar_season", name: "Season Driver Radar", icon: RadarIcon, description: "Multi-dimension performance radar for a full season", isPro: false, category: "Season & Career" },
    { id: "driver_radar_career", name: "Career Driver Radar", icon: History, description: "Multi-season career performance radar", isPro: false, category: "Season & Career" },
    { id: "driver_radar_session", name: "Session Driver Radar", icon: Target, description: "Single-session performance radar", isPro: false, category: "Season & Career" },
  ]

  const years = ["2025", "2026"]
  const selectedPlot = plotTypes.find((p) => p.id === selectedPlotType) ?? plotTypes[0]
  const usesTwoDrivers = selectedPlotType === "track_comparison" || selectedPlotType === "throttle_brake" || selectedPlotType === "corner_duel"
  const usesOneDriver = selectedPlotType === "laptime" || selectedPlotType === "track_map"
  const usesSpeedDrivers = selectedPlotType === "speed_distribution"
  const usesTopSpeedType = selectedPlotType === "topspeeds"
  const usesLapDistDrivers = selectedPlotType === "lap_distribution" || selectedPlotType === "lap_distribution_candlestick"
  const usesOneDriverOptional = selectedPlotType === "tyre_degradation"
  const usesNDriversOptional = selectedPlotType === "race_gaps" || selectedPlotType === "track_evolution" || selectedPlotType === "form_guide"
  const usesNDriversMax3 = selectedPlotType === "driver_radar_season" || selectedPlotType === "driver_radar_career" || selectedPlotType === "driver_radar_session"
  const isSeasonalPlot = selectedPlotType === "teammate_battle" || selectedPlotType === "form_guide" || selectedPlotType === "driver_radar_season"
  const isCareerPlot = selectedPlotType === "driver_radar_career"
  const showPlotOptions =
    usesTwoDrivers ||
    usesOneDriver ||
    usesSpeedDrivers ||
    usesTopSpeedType ||
    usesLapDistDrivers ||
    usesOneDriverOptional ||
    usesNDriversOptional ||
    usesNDriversMax3 ||
    selectedPlotType === "race_gaps" ||
    selectedPlotType === "track_map" ||
    isCareerPlot

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
  const [tyreStintData, setTyreStintData] = useState<TyreStintEntry[]>([])
  const [lapDistAllData, setLapDistAllData] = useState<LapTimeDistributionPoint[]>([])

  // New V2 endpoint data state
  const [positionChangesData, setPositionChangesData] = useState<PositionChangesData>([])
  const [raceGapsData, setRaceGapsData] = useState<RaceGapsData>([])
  const [raceGapsReference, setRaceGapsReference] = useState<"leader" | "average">("leader")
  const [tyreDegradationData, setTyreDegradationData] = useState<TyreDegradationData | null>(null)
  const [tyreDegDriver, setTyreDegDriver] = useState("all")
  const [tyreDegFuelCorrected, setTyreDegFuelCorrected] = useState(false)
  const [pitStrategyData, setPitStrategyData] = useState<PitStrategyData | null>(null)
  const [sessionWeatherData, setSessionWeatherData] = useState<SessionWeatherData | null>(null)
  const [racePaceHeatmapData, setRacePaceHeatmapData] = useState<RacePaceHeatmapData | null>(null)
  const [trackEvolutionData, setTrackEvolutionData] = useState<TrackEvolutionData | null>(null)
  const [theoreticalBestData, setTheoreticalBestData] = useState<TheoreticalBestData>([])
  const [raceStoryData, setRaceStoryData] = useState<RaceStoryData | null>(null)
  const [teammateBattleData, setTeammateBattleData] = useState<TeammateBattleData | null>(null)
  const [formGuideData, setFormGuideData] = useState<FormGuideData | null>(null)
  const [formGuideWindow, setFormGuideWindow] = useState("3")
  const [seasonRadarData, setSeasonRadarData] = useState<DriverRadarData | null>(null)
  const [careerRadarData, setCareerRadarData] = useState<DriverRadarData | null>(null)
  const [sessionRadarData, setSessionRadarData] = useState<DriverRadarData | null>(null)
  const [trackMapData, setTrackMapData] = useState<TrackMapData | null>(null)
  const [trackMapColorBy, setTrackMapColorBy] = useState<"speed" | "gear">("speed")
  const [cornerDuelData, setCornerDuelData] = useState<CornerDuelData | null>(null)

  const [careerYearsMode, setCareerYearsMode] = useState<"span" | "list">("span")
  const [careerYearStart, setCareerYearStart] = useState("2022")
  const [careerYearEnd, setCareerYearEnd] = useState("2025")
  const [careerYearsList, setCareerYearsList] = useState<string[]>(["2023", "2024", "2025"])

  // Shared N-driver-selection state, reused across plot types that need an
  // optional (no-max) or capped (max 3) driver filter — see usesNDriversOptional
  // and usesNDriversMax3 above.
  const [nDriversSelected, setNDriversSelected] = useState<string[]>([])
  const [radarSelectedDrivers, setRadarSelectedDrivers] = useState<string[]>([])

  // Clear the shared driver-filter selections whenever the plot type changes,
  // so a selection made for one plot type never silently carries over into an
  // unrelated one that happens to reuse the same state.
  useEffect(() => {
    setNDriversSelected([])
    setRadarSelectedDrivers([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlotType])

  const lapDistributionData = useMemo(
    () => lapDistAllData.filter((p) => lapDistSelectedDrivers.includes(p.driver)),
    [lapDistAllData, lapDistSelectedDrivers]
  )

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

  // Resolves the driver code(s) relevant to the currently selected plot type,
  // as a comma-separated string, for the usage log.
  const driversForCurrentPlot = (): string | undefined => {
    let list: string[] = []
    if (usesOneDriver) list = [selectedDriver]
    else if (usesTwoDrivers) list = [selectedDriver1, selectedDriver2]
    else if (usesSpeedDrivers) list = selectedSpeedDrivers
    else if (usesLapDistDrivers) list = lapDistSelectedDrivers
    else if (usesOneDriverOptional) list = tyreDegDriver !== "all" ? [tyreDegDriver] : []
    else if (usesNDriversOptional) list = nDriversSelected
    else if (usesNDriversMax3) list = radarSelectedDrivers
    const cleaned = list.filter((d) => d && d !== "none")
    return cleaned.length > 0 ? cleaned.join(", ") : undefined
  }

  const handleGeneratePlot = async () => {
    if (!isAuthenticated || !authToken) {
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

    let apiGpVal: number | string = selectedEventName
    const event = availableEvents.find((e) => (e.official_name || e.name) === selectedEventName)
    if (event) {
      apiGpVal = event.official_name || event.name
    }

    let apiSessionVal = selectedSession
    const sessionObj = availableSessions.find(
      (s) => getSessionCode(s.name, s.type, s.number) === selectedSession
    )
    if (sessionObj) {
      apiSessionVal = sessionObj.name
    }

    setIsGenerating(true)
    let plotGeneratedSuccessfully = false
    let generationError: string | undefined
    const generationStart = performance.now()

    try {
      if (selectedPlotType === "topspeeds") {
        const data = await fetchTopSpeeds(
          authToken,
          Number(selectedYear),
          apiGpVal,
          apiSessionVal,
          "v2",
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
          "v2"
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
              "v2"
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
              "v2"
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
          "v2"
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
            "v2"
          )
          setThrottleBrakeData(data as ThrottleBrakeComparisonData)
          plotGeneratedSuccessfully = true
        } else {
          throw new Error("Please select two different drivers for throttle & brake comparison")
        }
      } else if (selectedPlotType === "laptime") {
        const raw = await fetchLaptimeData(
          authToken,
          Number(selectedYear),
          apiGpVal,
          apiSessionVal,
          selectedDriver,
          "v2"
        )

        // Normalize API response to LapTimeData shape.
        // The API may return an array of objects or a pandas-style columnar dict.
        let rows: any[] = []
        if (Array.isArray(raw)) {
          rows = raw
        } else if (raw && typeof raw === "object") {
          // Columnar dict: { LapNumber: {"0": 1, "1": 2}, LapTime: {"0": 83.4}, ... }
          const keys = Object.keys(raw as object)
          if (keys.length > 0) {
            const firstKey = keys[0]
            const indices = Object.keys((raw as any)[firstKey])
            rows = indices.map((i) => {
              const obj: any = {}
              keys.forEach((k) => { obj[k] = (raw as any)[k][i] })
              return obj
            })
          }
        }

        const formatSecs = (secs: number) => {
          const m = Math.floor(secs / 60)
          const s = (secs % 60).toFixed(3)
          return `${m}:${s.padStart(6, "0")}`
        }

        const normalized: LapTimeData[] = rows.map((row) => {
          const lapNum = Number(row.LapNumber ?? row.lap_number ?? row.lap_numbers ?? 0)
          const rawTime = Number(row.LapTime ?? row.lap_time ?? row.lap_times_seconds ?? 0)
          // FastF1 may return timedelta as nanoseconds; convert to seconds
          const secs = rawTime > 1_000_000 ? rawTime / 1_000_000_000 : rawTime
          return {
            driver: String(row.Driver ?? row.driver ?? selectedDriver),
            lap_numbers: lapNum,
            lap_times_seconds: secs,
            lap_times_formatted: row.lap_times_formatted ?? formatSecs(secs),
            compound: String(row.Compound ?? row.compound ?? "UNKNOWN").toUpperCase(),
          }
        }).filter((d) => d.lap_numbers > 0 && d.lap_times_seconds > 0)

        if (normalized.length === 0) {
          throw new Error("No lap time data returned for the selected driver/session")
        }

        setLapTimeData(normalized)
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
              "v2"
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
      } else if (selectedPlotType === "tyre_stint") {
        if (selectedSession !== "R" && selectedSession !== "S") {
          throw new Error("Tyre stint analysis is only available for Race (R) and Sprint (S) sessions. Please select a Race or Sprint session.")
        }
        const raw = await fetchTyreStintData(authToken, Number(selectedYear), apiGpVal, apiSessionVal, "v2")
        const stints = Array.isArray(raw) ? (raw as TyreStintEntry[]) : []
        if (stints.length === 0) {
          throw new Error("No tyre stint data returned for the selected session")
        }
        setTyreStintData(stints)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "lap_distribution" || selectedPlotType === "lap_distribution_candlestick") {
        if (lapDistSelectedDrivers.length === 0) {
          throw new Error("Select at least one driver for lap distribution")
        }
        const [colorResult, ...driverResults] = await Promise.allSettled([
          fetchStaticDrivers(),
          ...drivers.map((code) =>
            fetchLapDistributionData(authToken ?? "", Number(selectedYear), apiGpVal, selectedSession, code, "v2")
          ),
        ])
        const colorMap: Map<string, string> =
          colorResult.status === "fulfilled" ? (colorResult.value as Map<string, string>) : new Map()
        const allData: LapTimeDistributionPoint[] = driverResults.flatMap((r) =>
          r.status === "fulfilled" ? (r.value as LapTimeDistributionPoint[]) : []
        ).map((r) => ({ ...r, color: colorMap.get(r.driver) || r.color }))
        if (allData.length === 0) {
          throw new Error("No lap distribution data returned for this session")
        }
        setLapDistAllData(allData)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "position_changes") {
        if (selectedSession !== "R" && selectedSession !== "S") {
          throw new Error("Position Changes is only available for Race (R) and Sprint (S) sessions. Please select a Race or Sprint session.")
        }
        const data = (await fetchPositionChanges(Number(selectedYear), apiGpVal, apiSessionVal)) as PositionChangesData
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No position changes data returned for the selected session")
        }
        setPositionChangesData(data)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "race_gaps") {
        if (selectedSession !== "R" && selectedSession !== "S") {
          throw new Error("Race Gaps is only available for Race (R) and Sprint (S) sessions. Please select a Race or Sprint session.")
        }
        const data = (await fetchRaceGaps(
          Number(selectedYear),
          apiGpVal,
          apiSessionVal,
          raceGapsReference,
          nDriversSelected.length > 0 ? nDriversSelected : undefined
        )) as RaceGapsData
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No race gaps data returned for the selected session")
        }
        setRaceGapsData(data)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "tyre_degradation") {
        if (selectedSession !== "R" && selectedSession !== "S") {
          throw new Error("Tyre Degradation is only available for Race (R) and Sprint (S) sessions. Please select a Race or Sprint session.")
        }
        const data = (await fetchTyreDegradation(
          Number(selectedYear),
          apiGpVal,
          apiSessionVal,
          tyreDegDriver !== "all" ? tyreDegDriver : undefined,
          tyreDegFuelCorrected
        )) as TyreDegradationData
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No tyre degradation data returned for the selected session")
        }
        setTyreDegradationData(data)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "pit_strategy") {
        if (selectedSession !== "R" && selectedSession !== "S") {
          throw new Error("Pit Strategy is only available for Race (R) and Sprint (S) sessions. Please select a Race or Sprint session.")
        }
        const data = (await fetchPitStrategy(Number(selectedYear), apiGpVal, apiSessionVal)) as PitStrategyData
        if (!data || !data.stops || data.stops.length === 0) {
          throw new Error("No pit strategy data returned for the selected session")
        }
        setPitStrategyData(data)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "session_weather") {
        const data = (await fetchSessionWeather(Number(selectedYear), apiGpVal, apiSessionVal)) as SessionWeatherData
        if (!data || !data.weather || data.weather.length === 0) {
          throw new Error("No session weather data returned for the selected session")
        }
        setSessionWeatherData(data)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "race_pace_heatmap") {
        if (selectedSession !== "R" && selectedSession !== "S") {
          throw new Error("Race Pace Heatmap is only available for Race (R) and Sprint (S) sessions. Please select a Race or Sprint session.")
        }
        const data = (await fetchRacePaceHeatmap(Number(selectedYear), apiGpVal, apiSessionVal)) as RacePaceHeatmapData
        if (!data || !data.grid || Object.keys(data.grid).length === 0) {
          throw new Error("No race pace heatmap data returned for the selected session")
        }
        setRacePaceHeatmapData(data)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "track_evolution") {
        if (!["P1", "P2", "P3", "Q"].includes(selectedSession)) {
          throw new Error("Track Evolution is only available for Practice (P1-P3) and Qualifying sessions. Please select a Practice or Qualifying session.")
        }
        const data = (await fetchTrackEvolution(
          Number(selectedYear),
          apiGpVal,
          apiSessionVal,
          nDriversSelected.length > 0 ? nDriversSelected : undefined
        )) as TrackEvolutionData
        if (!data || !data.drivers || Object.keys(data.drivers).length === 0) {
          throw new Error("No track evolution data returned for the selected session")
        }
        setTrackEvolutionData(data)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "theoretical_best") {
        if (selectedSession !== "Q") {
          throw new Error("Theoretical Best is only available for Qualifying sessions. Please select a Qualifying session.")
        }
        const data = (await fetchTheoreticalBest(Number(selectedYear), apiGpVal, apiSessionVal)) as TheoreticalBestData
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No theoretical best data returned for the selected session")
        }
        setTheoreticalBestData(data)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "race_story") {
        if (selectedSession !== "R" && selectedSession !== "S") {
          throw new Error("Race Story is only available for Race (R) and Sprint (S) sessions. Please select a Race or Sprint session.")
        }
        const data = (await fetchRaceStory(Number(selectedYear), apiGpVal, apiSessionVal)) as RaceStoryData
        if (!data || !data.drivers || data.drivers.length === 0) {
          throw new Error("No race story data returned for the selected session")
        }
        setRaceStoryData(data)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "teammate_battle") {
        const data = (await fetchTeammateBattle(Number(selectedYear))) as TeammateBattleData
        if (!data || !data.teams || data.teams.length === 0) {
          throw new Error("No teammate battle data returned for the selected season")
        }
        setTeammateBattleData(data)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "form_guide") {
        const data = (await fetchFormGuide(
          Number(selectedYear),
          Number(formGuideWindow),
          nDriversSelected.length > 0 ? nDriversSelected : undefined
        )) as FormGuideData
        if (!data || !data.drivers || data.drivers.length === 0) {
          throw new Error("No form guide data returned for the selected season")
        }
        setFormGuideData(data)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "driver_radar_season") {
        const data = (await fetchSeasonDriverRadar(
          Number(selectedYear),
          radarSelectedDrivers.length > 0 ? radarSelectedDrivers : undefined
        )) as DriverRadarData
        if (!data || !data.drivers || data.drivers.length === 0) {
          throw new Error("No season driver radar data returned")
        }
        setSeasonRadarData(data)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "driver_radar_career") {
        const yearsParam = careerYearsMode === "span"
          ? `${careerYearStart}-${careerYearEnd}`
          : careerYearsList.join(",")
        if (careerYearsMode === "list" && careerYearsList.length === 0) {
          throw new Error("Select at least one year for the career radar")
        }
        const data = (await fetchCareerDriverRadar(
          yearsParam,
          radarSelectedDrivers.length > 0 ? radarSelectedDrivers : undefined
        )) as DriverRadarData
        if (!data || !data.drivers || data.drivers.length === 0) {
          throw new Error("No career driver radar data returned")
        }
        setCareerRadarData(data)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "track_map") {
        const data = (await fetchTrackMap(
          Number(selectedYear),
          apiGpVal,
          apiSessionVal,
          selectedDriver,
          trackMapColorBy
        )) as TrackMapData
        if (!data || !data.points || data.points.length === 0) {
          throw new Error("No track map data returned for the selected driver/session")
        }
        setTrackMapData(data)
        plotGeneratedSuccessfully = true
      } else if (selectedPlotType === "corner_duel") {
        if (selectedDriver1 && selectedDriver2 && selectedDriver1 !== selectedDriver2) {
          const data = (await fetchCornerDuel(
            Number(selectedYear),
            apiGpVal,
            apiSessionVal,
            selectedDriver1,
            selectedDriver2
          )) as CornerDuelData
          if (!data || !data.corners || data.corners.length === 0) {
            throw new Error("No corner duel data returned for the selected drivers/session")
          }
          setCornerDuelData(data)
          plotGeneratedSuccessfully = true
        } else {
          throw new Error("Please select two different drivers for corner duel")
        }
      } else if (selectedPlotType === "driver_radar_session") {
        const data = (await fetchSessionDriverRadar(
          Number(selectedYear),
          apiGpVal,
          apiSessionVal,
          radarSelectedDrivers.length > 0 ? radarSelectedDrivers : undefined
        )) as DriverRadarData
        if (!data || !data.drivers || data.drivers.length === 0) {
          throw new Error("No session driver radar data returned")
        }
        setSessionRadarData(data)
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
          year: Number(selectedYear),
          eventName: selectedEventName,
          session: selectedSession,
          drivers: driversForCurrentPlot(),
          durationMs,
          success: plotGeneratedSuccessfully,
          tokensUsed: plotGeneratedSuccessfully ? 1 : 0,
          errorMessage: generationError,
        })
      }
    }
  }

  const EmptyState = ({ label }: { label: string }) => (
    <div className="flex flex-col items-center justify-center h-[700px] text-muted-foreground space-y-4">
      {isGenerating ? <LoadingPlot /> : label}
    </div>
  )

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
              <div className="flex items-start gap-2 border border-yellow-500/40 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-400">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Experimental mode — using the legacy custom telemetry visual. Data quality may vary.</span>
              </div>
              <TrackComparisonGraph data={trackComparisonData} advancedSettings={advancedSettings} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[700px] text-muted-foreground space-y-4">
              {isGenerating ? <LoadingPlot /> : "No track comparison data available"}
            </div>
          )
        ) : trackComparisonPlotUrl ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 border border-zinc-700/50 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-400">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Showing the official plot image from the external API endpoint.</span>
            </div>
            <div className="flex items-center justify-center min-h-[700px] border border-zinc-800 bg-zinc-950/50 p-4">
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
            useDistinctColors={speedTraceDistinctColors}
          />
        )
      case "tyre_stint":
        return <TyreStintGraph data={tyreStintData} advancedSettings={advancedSettings} />
      case "lap_distribution":
        return <LapDistributionGraph data={lapDistributionData} advancedSettings={advancedSettings} />
      case "lap_distribution_candlestick":
        return <LapTimeCandlestickGraph data={lapDistributionData} advancedSettings={advancedSettings} />
      case "position_changes":
        return positionChangesData.length > 0
          ? <PositionChangesGraph data={positionChangesData} advancedSettings={advancedSettings} />
          : <EmptyState label="No position changes data available" />
      case "race_gaps":
        return raceGapsData.length > 0
          ? <RaceGapsGraph data={raceGapsData} reference={raceGapsReference} advancedSettings={advancedSettings} />
          : <EmptyState label="No race gaps data available" />
      case "tyre_degradation":
        return tyreDegradationData
          ? <TyreDegradationGraph data={tyreDegradationData} advancedSettings={advancedSettings} />
          : <EmptyState label="No tyre degradation data available" />
      case "pit_strategy":
        return pitStrategyData
          ? <PitStrategyGraph data={pitStrategyData} advancedSettings={advancedSettings} />
          : <EmptyState label="No pit strategy data available" />
      case "session_weather":
        return sessionWeatherData
          ? <SessionWeatherGraph data={sessionWeatherData} advancedSettings={advancedSettings} />
          : <EmptyState label="No session weather data available" />
      case "race_pace_heatmap":
        return racePaceHeatmapData
          ? <RacePaceHeatmapGraph data={racePaceHeatmapData} advancedSettings={advancedSettings} />
          : <EmptyState label="No race pace heatmap data available" />
      case "track_evolution":
        return trackEvolutionData
          ? <TrackEvolutionGraph data={trackEvolutionData} advancedSettings={advancedSettings} />
          : <EmptyState label="No track evolution data available" />
      case "theoretical_best":
        return theoreticalBestData.length > 0
          ? <TheoreticalBestGraph data={theoreticalBestData} advancedSettings={advancedSettings} />
          : <EmptyState label="No theoretical best data available" />
      case "race_story":
        return raceStoryData
          ? <RaceStoryGraph data={raceStoryData} advancedSettings={advancedSettings} />
          : <EmptyState label="No race story data available" />
      case "teammate_battle":
        return teammateBattleData
          ? <TeammateBattleGraph data={teammateBattleData} advancedSettings={advancedSettings} />
          : <EmptyState label="No teammate battle data available" />
      case "form_guide":
        return formGuideData
          ? <FormGuideGraph data={formGuideData} advancedSettings={advancedSettings} />
          : <EmptyState label="No form guide data available" />
      case "driver_radar_season":
        return seasonRadarData
          ? <DriverRadarGraph data={seasonRadarData} title="Season Driver Radar" subtitle={selectedYear} advancedSettings={advancedSettings} />
          : <EmptyState label="No season driver radar data available" />
      case "driver_radar_career":
        return careerRadarData
          ? (
            <DriverRadarGraph
              data={careerRadarData}
              title="Career Driver Radar"
              subtitle={careerRadarData.years ? careerRadarData.years.join(", ") : undefined}
              advancedSettings={advancedSettings}
            />
          )
          : <EmptyState label="No career driver radar data available" />
      case "driver_radar_session":
        return sessionRadarData
          ? (
            <DriverRadarGraph
              data={sessionRadarData}
              title="Session Driver Radar"
              subtitle={`${selectedEventName} — ${selectedSession}`}
              advancedSettings={advancedSettings}
            />
          )
          : <EmptyState label="No session driver radar data available" />
      case "track_map":
        return trackMapData
          ? <TrackMapGraph data={trackMapData} advancedSettings={advancedSettings} />
          : <EmptyState label="No track map data available" />
      case "corner_duel":
        return cornerDuelData
          ? <CornerDuelGraph data={cornerDuelData} advancedSettings={advancedSettings} />
          : <EmptyState label="No corner duel data available" />
      default:
        return null
    }
  }

  const renderStats = () => {
    type StatItem = { label: string; value: string | number; sub?: string }
    let stats: StatItem[] | null = null

    if (selectedPlotType === "topspeeds") {
      stats = [
        { label: "Fastest Team", value: topSpeedsData[0]?.speed ? `${topSpeedsData[0].speed} km/h` : "-", sub: topSpeedsData[0]?.team || "-" },
        { label: "Slowest Team", value: topSpeedsData[topSpeedsData.length - 1]?.speed ? `${topSpeedsData[topSpeedsData.length - 1].speed} km/h` : "-", sub: topSpeedsData[topSpeedsData.length - 1]?.team || "-" },
        { label: "Average Speed", value: topSpeedsData.length > 0 ? `${(topSpeedsData.reduce((a, c) => a + c.speed, 0) / topSpeedsData.length).toFixed(1)} km/h` : "-" },
        { label: "Speed Delta", value: topSpeedsData.length > 0 ? `${(topSpeedsData[0].speed - topSpeedsData[topSpeedsData.length - 1].speed).toFixed(1)} km/h` : "-" },
      ]
    } else if (selectedPlotType === "throttle_average") {
      stats = [
        { label: "Highest Throttle", value: throttleAverageData[0]?.throttle != null ? `${throttleAverageData[0].throttle.toFixed(1)}%` : "-", sub: throttleAverageData[0]?.driver || "-" },
        { label: "Lowest Throttle", value: throttleAverageData[throttleAverageData.length - 1]?.throttle != null ? `${throttleAverageData[throttleAverageData.length - 1].throttle.toFixed(1)}%` : "-", sub: throttleAverageData[throttleAverageData.length - 1]?.driver || "-" },
        { label: "Average Throttle", value: throttleAverageData.length > 0 ? `${(throttleAverageData.reduce((a, c) => a + (c.throttle || 0), 0) / throttleAverageData.length).toFixed(1)}%` : "-" },
        { label: "Throttle Delta", value: throttleAverageData.length > 0 && throttleAverageData[0]?.throttle && throttleAverageData[throttleAverageData.length - 1]?.throttle ? `${(throttleAverageData[0].throttle - throttleAverageData[throttleAverageData.length - 1].throttle).toFixed(1)}%` : "-" },
      ]
    } else if (selectedPlotType === "session_results") {
      stats = [
        { label: "Fastest Lap", value: sessionResultsData[0]?.LapTime || "-", sub: sessionResultsData[0]?.Driver || "-" },
        { label: "Largest Gap", value: sessionResultsData[sessionResultsData.length - 1]?.LapTimeDelta != null ? `+${sessionResultsData[sessionResultsData.length - 1].LapTimeDelta.toFixed(3)}s` : "-", sub: sessionResultsData[sessionResultsData.length - 1]?.Driver || "-" },
        { label: "Avg. Gap", value: sessionResultsData.length > 0 ? `${(sessionResultsData.reduce((a, c) => a + (c.LapTimeDelta || 0), 0) / sessionResultsData.length).toFixed(3)}s` : "-" },
        { label: "Total Drivers", value: sessionResultsData.length || 0 },
      ]
    } else if (selectedPlotType === "throttle_brake") {
      stats = [
        { label: "Head to Head", value: throttleBrakeData ? `${throttleBrakeData.driver1} vs ${throttleBrakeData.driver2}` : "-" },
        { label: "Data Points", value: throttleBrakeData?.telemetry?.length || 0 },
        { label: "Event", value: throttleBrakeData?.session_info?.event_name || "-" },
        { label: "Session", value: throttleBrakeData?.session_info?.session_name || "-" },
      ]
    } else if (selectedPlotType === "speed_distribution") {
      stats = [
        { label: "Selected Drivers", value: selectedSpeedDrivers.length || 0 },
        { label: "Peak Speed", value: speedDistributionData.length > 0 ? `${Math.max(...speedDistributionData.map((p) => p.speed)).toFixed(1)} km/h` : "-" },
        { label: "Average Speed", value: speedDistributionData.length > 0 ? `${(speedDistributionData.reduce((a, p) => a + p.speed, 0) / speedDistributionData.length).toFixed(1)} km/h` : "-" },
        { label: "Data Points", value: speedDistributionData.length || 0 },
      ]
    } else if (selectedPlotType === "tyre_stint" && tyreStintData.length > 0) {
      const drivers = [...new Set(tyreStintData.map((s) => s.driver))].length
      const totalLaps = Math.max(...tyreStintData.map((s) => s.end_lap))
      const compounds = [...new Set(tyreStintData.map((s) => s.compound.toUpperCase()))]
      const avgStops = tyreStintData.length > 0
        ? (tyreStintData.reduce((acc, s) => acc + s.stint_number, 0) / drivers / drivers).toFixed(1)
        : "-"
      stats = [
        { label: "Drivers", value: drivers },
        { label: "Total Laps", value: totalLaps },
        { label: "Compounds Used", value: compounds.join(", ") },
        { label: "Avg Pit Stops", value: avgStops },
      ]
    } else if (
      (selectedPlotType === "lap_distribution" || selectedPlotType === "lap_distribution_candlestick") &&
      lapDistributionData.length > 0
    ) {
      const lapDrivers = [...new Set(lapDistributionData.map((p) => p.driver))]
      const allTimes = lapDistributionData.map((p) => p.lapTime)
      const sortedTimes = [...allTimes].sort((a, b) => a - b)
      const fastestTime = sortedTimes[0]
      const medianTime = sortedTimes[Math.floor(sortedTimes.length / 2)]
      const fastestDriver = lapDistributionData.find((p) => p.lapTime === fastestTime)?.driver ?? "-"
      const totalLaps = [...new Set(lapDistributionData.map((p) => p.lap))].length
      const fmtStat = (secs: number) => {
        const m = Math.floor(secs / 60)
        const s = (secs % 60).toFixed(3)
        return `${m}:${s.padStart(6, "0")}`
      }
      stats = [
        { label: "Drivers", value: lapDrivers.length },
        { label: "Fastest Lap", value: fmtStat(fastestTime), sub: fastestDriver },
        { label: "Median Lap", value: fmtStat(medianTime) },
        { label: "Total Laps", value: totalLaps },
      ]
    } else if (selectedPlotType === "position_changes" && positionChangesData.length > 0) {
      const biggestMover = [...positionChangesData].sort(
        (a, b) => (b.start_pos - b.end_pos) - (a.start_pos - a.end_pos)
      )[0]
      const podium = [...positionChangesData].sort((a, b) => a.end_pos - b.end_pos).slice(0, 3).map((d) => d.driver)
      stats = [
        { label: "Biggest Mover", value: `${biggestMover.start_pos - biggestMover.end_pos >= 0 ? "+" : ""}${biggestMover.start_pos - biggestMover.end_pos}`, sub: biggestMover.driver },
        { label: "Podium", value: podium.join(", ") },
        { label: "Drivers", value: positionChangesData.length },
        { label: "Starting P1", value: positionChangesData.find((d) => d.start_pos === 1)?.driver || "-" },
      ]
    } else if (selectedPlotType === "race_gaps" && raceGapsData.length > 0) {
      const finalGaps = raceGapsData.map((d) => {
        const laps = d.laps.filter((l) => l.gap_s !== null)
        return { driver: d.driver, gap: laps.length > 0 ? laps[laps.length - 1].gap_s! : 0 }
      })
      const largest = [...finalGaps].sort((a, b) => b.gap - a.gap)[0]
      const avg = finalGaps.reduce((a, c) => a + c.gap, 0) / (finalGaps.length || 1)
      stats = [
        { label: "Winner", value: raceGapsData[0]?.driver || "-" },
        { label: "Largest Gap", value: largest ? `+${largest.gap.toFixed(3)}s` : "-", sub: largest?.driver },
        { label: "Average Gap", value: `${avg.toFixed(3)}s` },
        { label: "Drivers", value: raceGapsData.length },
      ]
    } else if (selectedPlotType === "pit_strategy" && pitStrategyData) {
      const undercuts = pitStrategyData.undercuts ?? []
      const bestUndercut = [...undercuts].sort((a, b) => (b.gain_s ?? -Infinity) - (a.gain_s ?? -Infinity))[0]
      const fastest = pitStrategyData.summary?.fastest_stop
      stats = [
        { label: "Fastest Stop", value: fastest ? `${fastest.pit_lane_time_s.toFixed(3)}s` : "-", sub: fastest?.driver || "-" },
        { label: "Total Stops", value: pitStrategyData.stops.length },
        { label: "Best Undercut", value: bestUndercut && typeof bestUndercut.gain_s === "number" ? `+${bestUndercut.gain_s.toFixed(3)}s` : "-", sub: bestUndercut ? `${bestUndercut.attacker ?? "-"} vs ${bestUndercut.attacked ?? "-"}` : "-" },
        { label: "Undercuts Tried", value: undercuts.length },
      ]
    } else if (selectedPlotType === "theoretical_best" && theoreticalBestData.length > 0) {
      const sorted = [...theoreticalBestData].sort((a, b) => a.delta_s - b.delta_s)
      const avgDelta = theoreticalBestData.reduce((a, c) => a + c.delta_s, 0) / theoreticalBestData.length
      stats = [
        { label: "Smallest Delta", value: `+${sorted[0].delta_s.toFixed(3)}s`, sub: sorted[0].driver },
        { label: "Largest Delta", value: `+${sorted[sorted.length - 1].delta_s.toFixed(3)}s`, sub: sorted[sorted.length - 1].driver },
        { label: "Average Delta", value: `+${avgDelta.toFixed(3)}s` },
        { label: "Drivers", value: theoreticalBestData.length },
      ]
    } else if (selectedPlotType === "teammate_battle" && teammateBattleData) {
      const withDiff = teammateBattleData.teams.map((t) => ({
        ...t,
        raceDiff: Math.abs(t.race_h2h[0] - t.race_h2h[1]),
      }))
      const mostDominant = [...withDiff].sort((a, b) => b.raceDiff - a.raceDiff)[0]
      const closest = [...withDiff].sort((a, b) => a.raceDiff - b.raceDiff)[0]
      stats = [
        { label: "Most Dominant", value: mostDominant ? `${mostDominant.race_h2h[0]}-${mostDominant.race_h2h[1]}` : "-", sub: mostDominant?.team },
        { label: "Closest Battle", value: closest ? `${closest.race_h2h[0]}-${closest.race_h2h[1]}` : "-", sub: closest?.team },
        { label: "Teams", value: teammateBattleData.teams.length },
        { label: "Season", value: selectedYear },
      ]
    }

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

  return (
    <TooltipProvider delayDuration={150}>
      <div className="border border-zinc-800 bg-zinc-950 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/70 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Telemetry</p>
            <h2 className="mt-0.5 text-2xl font-bold tracking-tight">
              {selectedPlot.name}
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
            onChange={handlePlotTypeChange}
          />

          {/* Race & session card */}
          <div data-tour="raceSession" className="border border-zinc-800">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-5 py-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium leading-none">Race &amp; session</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {isCareerPlot
                      ? "This plot spans multiple seasons — configure the year range in Plot options below."
                      : isSeasonalPlot
                      ? "This plot aggregates a full season — Grand Prix and session do not apply."
                      : "Pick the season, Grand Prix, and session."}
                  </p>
                </div>
              </div>
              {!isSeasonalPlot && !isCareerPlot && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-zinc-500 hover:text-foreground"
                      onClick={handleRefreshSessions}
                      disabled={isRefreshingSessions}
                      aria-label="Refresh sessions"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshingSessions ? "animate-spin" : ""}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Refresh available Grands Prix &amp; sessions</TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="space-y-4 px-5 py-4">
              {(() => {
                const now = Date.now()
                const datedEvents = availableEvents.filter((e) => {
                  const raw = e.start_date || e.date || e.event_date || e.session_date
                  const t = raw ? new Date(raw).getTime() : NaN
                  return Number.isFinite(t) && t <= now
                })
                const finishedEvents = datedEvents.length > 0 ? datedEvents : availableEvents
                const finishedSessions = (() => {
                  const filtered = availableSessions.filter((s) => {
                    const raw = s.end_date || s.start_date || s.date || s.session_date
                    if (!raw) return true
                    return new Date(raw).getTime() <= now
                  })
                  return filtered.length > 0 ? filtered : availableSessions
                })()
                return (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {!isCareerPlot && (
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
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
                )}

                {!isSeasonalPlot && !isCareerPlot && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="round">Round</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={useLatestRace}
                          className="text-[10px] text-primary hover:underline disabled:opacity-50"
                          disabled={!finishedEvents.length || isResolvingLatestRace}
                        >
                          {isResolvingLatestRace ? "Finding latest race..." : "Use latest race"}
                        </button>
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
                    <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
                      <SelectValue placeholder="Select round" />
                    </SelectTrigger>
                    <SelectContent>
                      {finishedEvents.length > 0 ? (
                        finishedEvents.map((event, index) => {
                          const isDuplicate = finishedEvents.filter((e) => e.name === event.name).length > 1
                          const displayName = isDuplicate ? event.official_name : event.name
                          const identifier = event.official_name || event.name
                          return (
                            <SelectItem key={event.key || index} value={identifier}>
                              {`${displayName}`}
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
                )}

                {!isSeasonalPlot && !isCareerPlot && (
                <div className="space-y-2">
                  <Label htmlFor="session">Session</Label>
                  <Select value={selectedSession} onValueChange={setSelectedSession}>
                    <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      {finishedSessions.length > 0 ? (
                        finishedSessions.map((session) => {
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
                )}

              </div>
                )
              })()}
            </div>
          </div>

          {/* Tyre stint session restriction warning */}
          {selectedPlotType === "tyre_stint" && selectedSession !== "R" && selectedSession !== "S" && (
            <div className="flex items-start gap-2 border border-yellow-500/40 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Tyre stint analysis is only available for <strong>Race</strong> and <strong>Sprint</strong> sessions. Please select Race or Sprint above.
              </span>
            </div>
          )}

          {/* Session-scope restriction warnings for new V2 plot types */}
          {["position_changes", "race_gaps", "tyre_degradation", "pit_strategy", "race_pace_heatmap", "race_story"].includes(selectedPlotType) &&
            selectedSession !== "R" && selectedSession !== "S" && (
              <div className="flex items-start gap-2 border border-yellow-500/40 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-400">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  {selectedPlot.name} is only available for <strong>Race</strong> and <strong>Sprint</strong> sessions. Please select Race or Sprint above.
                </span>
              </div>
          )}
          {selectedPlotType === "track_evolution" && !["P1", "P2", "P3", "Q"].includes(selectedSession) && (
            <div className="flex items-start gap-2 border border-yellow-500/40 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Track Evolution is only available for <strong>Practice (P1-P3)</strong> and <strong>Qualifying</strong> sessions. Please select one above.
              </span>
            </div>
          )}
          {selectedPlotType === "theoretical_best" && selectedSession !== "Q" && (
            <div className="flex items-start gap-2 border border-yellow-500/40 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Theoretical Best is only available for <strong>Qualifying</strong> sessions. Please select Qualifying above.
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
                {usesOneDriver && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="driver">Driver</Label>
                      <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                        <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
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
                        <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
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
                        <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
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
                        <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
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
                        <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
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
                        <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
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
                    <div className="flex items-center justify-between rounded-md border border-zinc-800 px-3 py-2 sm:col-span-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="speed-distinct-colors">Distinct Line Colors</Label>
                        <p className="text-xs text-muted-foreground">
                          Use easily distinguishable colors instead of team colors
                        </p>
                      </div>
                      <Switch
                        id="speed-distinct-colors"
                        checked={speedTraceDistinctColors}
                        onCheckedChange={setSpeedTraceDistinctColors}
                      />
                    </div>
                  </div>
                )}

                {usesLapDistDrivers && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Drivers ({lapDistSelectedDrivers.length} selected)</Label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setLapDistSelectedDrivers([...drivers])}
                          className="text-[10px] uppercase tracking-wider text-primary hover:underline"
                        >
                          Select all
                        </button>
                        <span className="text-zinc-700">·</span>
                        <button
                          type="button"
                          onClick={() => setLapDistSelectedDrivers([])}
                          className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-foreground hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                      {drivers.map((driver) => {
                        const checked = lapDistSelectedDrivers.includes(driver)
                        return (
                          <button
                            key={driver}
                            type="button"
                            onClick={() =>
                              setLapDistSelectedDrivers((prev) =>
                                checked ? prev.filter((d) => d !== driver) : [...prev, driver]
                              )
                            }
                            className={`px-2 py-1.5 text-xs font-mono font-semibold border transition-colors ${
                              checked
                                ? "border-primary/60 bg-primary/10 text-primary"
                                : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                            }`}
                          >
                            {driver}
                          </button>
                        )
                      })}
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
                        <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
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
                  <div className="border border-zinc-700/50 bg-zinc-900/40 px-4 py-3 text-xs text-zinc-400 space-y-2">
                    <p>Default mode uses the external plot image endpoint for stability.</p>
                    <p className="text-zinc-500">Enable experimental mode to use the legacy custom telemetry rendering.</p>
                    <div className="flex items-center gap-2 pt-1">
                      <Label htmlFor="experimental-track-comparison" className="text-xs font-medium text-zinc-300">
                        Experimental
                      </Label>
                      <Switch
                        id="experimental-track-comparison"
                        checked={useExperimentalTrackComparison}
                        onCheckedChange={setUseExperimentalTrackComparison}
                      />
                    </div>
                  </div>
                )}

                {usesOneDriverOptional && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tyre-deg-driver">Driver</Label>
                      <Select value={tyreDegDriver} onValueChange={setTyreDegDriver}>
                        <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All drivers</SelectItem>
                          {drivers.map((driver) => (
                            <SelectItem key={driver} value={driver}>
                              {driver}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        id="fuel-corrected"
                        checked={tyreDegFuelCorrected}
                        onCheckedChange={setTyreDegFuelCorrected}
                      />
                      <Label htmlFor="fuel-corrected" className="text-sm">Fuel-corrected lap times</Label>
                    </div>
                  </div>
                )}

                {selectedPlotType === "race_gaps" && (
                  <div className="space-y-2">
                    <Label htmlFor="race-gaps-reference">Reference</Label>
                    <Select value={raceGapsReference} onValueChange={(v) => setRaceGapsReference(v as "leader" | "average")}>
                      <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800 sm:max-w-xs">
                        <SelectValue placeholder="Select reference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leader">Gap to leader</SelectItem>
                        <SelectItem value="average">Vs average race pace</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedPlotType === "track_map" && (
                  <div className="space-y-2">
                    <Label htmlFor="track-map-color-by">Color by</Label>
                    <Select value={trackMapColorBy} onValueChange={(v) => setTrackMapColorBy(v as "speed" | "gear")}>
                      <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800 sm:max-w-xs">
                        <SelectValue placeholder="Select coloring" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="speed">Speed</SelectItem>
                        <SelectItem value="gear">Gear</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedPlotType === "form_guide" && (
                  <div className="space-y-2 max-w-[200px]">
                    <Label htmlFor="form-guide-window">Rolling window (races)</Label>
                    <Input
                      id="form-guide-window"
                      type="number"
                      min="2"
                      max="10"
                      value={formGuideWindow}
                      onChange={(e) => setFormGuideWindow(e.target.value)}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                )}

                {(usesNDriversOptional || usesNDriversMax3) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">
                        Drivers ({(usesNDriversMax3 ? radarSelectedDrivers : nDriversSelected).length} selected)
                        {usesNDriversMax3 && <span className="text-zinc-500 font-normal"> (max 3)</span>}
                      </Label>
                      <div className="flex gap-2">
                        {usesNDriversOptional && (
                          <button
                            type="button"
                            onClick={() => setNDriversSelected([...drivers])}
                            className="text-[10px] uppercase tracking-wider text-primary hover:underline"
                          >
                            Select all
                          </button>
                        )}
                        <span className="text-zinc-700">·</span>
                        <button
                          type="button"
                          onClick={() => (usesNDriversMax3 ? setRadarSelectedDrivers([]) : setNDriversSelected([]))}
                          className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-foreground hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                      {drivers.map((driver) => {
                        const selected = usesNDriversMax3 ? radarSelectedDrivers : nDriversSelected
                        const setSelected = usesNDriversMax3 ? setRadarSelectedDrivers : setNDriversSelected
                        const checked = selected.includes(driver)
                        const disabled = usesNDriversMax3 && !checked && selected.length >= 3
                        return (
                          <button
                            key={driver}
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                              setSelected((prev) =>
                                checked ? prev.filter((d) => d !== driver) : [...prev, driver]
                              )
                            }
                            className={`px-2 py-1.5 text-xs font-mono font-semibold border transition-colors ${
                              checked
                                ? "border-primary/60 bg-primary/10 text-primary"
                                : disabled
                                ? "border-zinc-900 bg-zinc-900/30 text-zinc-700 cursor-not-allowed"
                                : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                            }`}
                          >
                            {driver}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {usesNDriversMax3
                        ? "Leave empty to let the API pick the best 3 by race pace."
                        : "Leave empty to include all drivers."}
                    </p>
                  </div>
                )}

                {isCareerPlot && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Years</Label>
                      <div className="flex gap-2 text-[10px] uppercase tracking-wider">
                        <button
                          type="button"
                          onClick={() => setCareerYearsMode("span")}
                          className={careerYearsMode === "span" ? "text-primary underline" : "text-zinc-500 hover:underline"}
                        >
                          Span
                        </button>
                        <span className="text-zinc-700">·</span>
                        <button
                          type="button"
                          onClick={() => setCareerYearsMode("list")}
                          className={careerYearsMode === "list" ? "text-primary underline" : "text-zinc-500 hover:underline"}
                        >
                          List
                        </button>
                      </div>
                    </div>
                    {careerYearsMode === "span" ? (
                      <div className="grid grid-cols-2 gap-4 max-w-md">
                        <div className="space-y-2">
                          <Label htmlFor="career-year-start" className="text-xs">Start year</Label>
                          <Select value={careerYearStart} onValueChange={setCareerYearStart}>
                            <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
                              <SelectValue placeholder="Start" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 13 }, (_, i) => 2018 + i).map((y) => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="career-year-end" className="text-xs">End year</Label>
                          <Select value={careerYearEnd} onValueChange={setCareerYearEnd}>
                            <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
                              <SelectValue placeholder="End" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 13 }, (_, i) => 2018 + i).map((y) => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                        {Array.from({ length: 13 }, (_, i) => String(2018 + i)).map((year) => {
                          const checked = careerYearsList.includes(year)
                          return (
                            <button
                              key={year}
                              type="button"
                              onClick={() =>
                                setCareerYearsList((prev) =>
                                  checked ? prev.filter((y) => y !== year) : [...prev, year]
                                )
                              }
                              className={`px-2 py-1.5 text-xs font-mono font-semibold border transition-colors ${
                                checked
                                  ? "border-primary/60 bg-primary/10 text-primary"
                                  : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                              }`}
                            >
                              {year}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Advanced settings collapsible */}
          <Collapsible
            open={advancedOpen}
            onOpenChange={setAdvancedOpen}
            data-tour="advanced"
            className="border border-zinc-800"
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
              className="border-zinc-800 bg-transparent hover:bg-zinc-900 transition-colors"
              onClick={() => toast.info("Export coming soon", { description: "Plot export will be available in a future update." })}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

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
