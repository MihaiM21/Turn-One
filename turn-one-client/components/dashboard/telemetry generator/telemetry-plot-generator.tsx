"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Download, Play, Settings, TrendingUp, Zap, Clock, Gauge, CircleGauge, ChevronsUp, MonitorCog, Users, UserRound, ChartSpline, AlertTriangle, Coins, ChartScatter } from "lucide-react"
import { fetchTopSpeeds, fetchThrottleAverages, fetchTrackComparison, fetchSessionResults, fetchThrottleBrakeComparison, fetchLaptimeData, fetchEventsByYear, fetchSessionsByEvent } from "@/lib/dataAcquisition"
import { TopSpeedData, ThrottleAverageData, TrackComparisonData, ThrottleBrakeComparisonData, LapTimeData, AdvancedPlotSettings } from "@/types/plot-types"
import { grandPrixCalendar } from "@/lib/constants/grand-prix"
import { TopSpeedGraph } from "./plots/top-speed"
import { GForceGraph } from "./plots/gforce"
import { SpeedTraceGraph } from "./plots/speedtrace"
import { LapTimeAnalysisGraph } from "./plots/lap-time-analysis"
import { TireTempGraph } from "./plots/tire-temp"
import { ThrottleAverageGraph } from "./plots/throttle_average_comparison"
import { TrackComparisonGraph } from "./plots/track-comparison"
import { SessionResultsGraph } from "./plots/session-results"
import { ThrottleBrakeComparisonGraph } from "./plots/throttle-brake-comparison"
import { SessionResultsData } from "@/types/plot-types"
import { drivers_2025, drivers_2026 } from "@/lib/constants/drivers"
import { LoadingPlot } from "./loading_plot"
import { useTokens } from "@/hooks/use-tokens"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth/auth-provider"
import { isPageStatic } from "next/dist/build/utils"
import { gForceData, tireData, speedData } from "@/lib/constants/mockup-data"

let drivers: any[];
const currentYear = new Date().getFullYear();
switch (currentYear) {
  case 2025:
    drivers = drivers_2025;
    break;
  case 2026:
    drivers = drivers_2026;
    break;
  default:
    drivers = drivers_2025;
}


export function TelemetryPlotGenerator() {
  const [selectedPlotType, setSelectedPlotType] = useState("topspeeds")
  const [selectedDriver, setSelectedDriver] = useState("VER")
  const [selectedDriver1, setSelectedDriver1] = useState("VER")
  const [selectedDriver2, setSelectedDriver2] = useState("HAM")
  const [selectedSession, setSelectedSession] = useState("FP1")
  const [selectedYear, setSelectedYear] = useState("2026")
  const [selectedGp, setSelectedGp] = useState("1")
  const [selectedEventName, setSelectedEventName] = useState("Australian Grand Prix")
  const [selectedVersion, setSelectedVersion] = useState("v1")
  const [selectedTopSpeedType, setSelectedTopSpeedType] = useState("telemetry")
  const [availableEvents, setAvailableEvents] = useState<any[]>([])
  const [availableSessions, setAvailableSessions] = useState<any[]>([])

  const [isGenerating, setIsGenerating] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  useEffect(() => {
    if (selectedYear) {
      fetchEventsByYear(Number(selectedYear)).then(data => {
        const events = data.events || [];
        setAvailableEvents(events);

        if (events.length > 0) {
          const currentValid = events.find((e: any) => (e.official_name || e.name) === selectedEventName);
          if (!currentValid) {
            const defaultEvent = events.find((e: any) => e.name.includes("Australia")) || events[0];
            setSelectedEventName(defaultEvent.official_name || defaultEvent.name);
            setSelectedGp(defaultEvent.key ? defaultEvent.key.toString() : "1");
          } else {
            setSelectedGp(currentValid.key ? currentValid.key.toString() : "1");
          }
        }
      }).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const getSessionCode = (name: string, type: string, number: number | null) => {
    if (type === "Practice") return `FP${number}`;
    if (type === "Qualifying") return "Q";
    if (type === "Race") return "R";
    if (type === "Sprint") return "S";
    if (type === "Sprint Shootout" || type === "Sprint Qualifying") return "SQ";
    if (type === "Day 1") return "D1";
    if (type === "Day 2") return "D2";
    if (type === "Day 3") return "D3";
    return name;
  }

  useEffect(() => {
    if (selectedYear && selectedEventName) {
      const event = availableEvents.find(e => (e.official_name || e.name) === selectedEventName);
      const apiEventName = event ? event.name : selectedEventName;

      fetchSessionsByEvent(Number(selectedYear), apiEventName).then(data => {
        const sessions = data.sessions || [];
        setAvailableSessions(sessions);

        if (sessions.length > 0) {
          const currentValid = sessions.find((s: any) => getSessionCode(s.name, s.type, s.number) === selectedSession);
          if (!currentValid) {
            const defaultSession = sessions.find((s: any) => s.type === "Practice" && s.number === 1) || sessions[0];
            setSelectedSession(getSessionCode(defaultSession.name, defaultSession.type, defaultSession.number));
          }
        }
      }).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedEventName]);

  // Advanced settings state
  const [showGrid, setShowGrid] = useState(true)
  const [showLegend, setShowLegend] = useState(true)
  const [animateChart, setAnimateChart] = useState(true)
  const [chartHeight, setChartHeight] = useState("700")
  const [lineThickness, setLineThickness] = useState("2")
  const [showDataLabels, setShowDataLabels] = useState(false)

  // Token management
  const { isAuthenticated } = useAuth()
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const { userProfile, hasTokens, getTokenCount, deductToken, error: tokenError } = useTokens(authToken)

  const plotTypes = [
    { id: "topspeeds", name: "Top Speeds", icon: Gauge, description: "Compare top speeds across teams", isPro: false },
    { id: "throttle_average", name: "Throttle Average", icon: CircleGauge, description: "Compare average throttle across drivers", isPro: false },
    { id: "laptime", name: "Lap Time Analysis", icon: Clock, description: "Compare lap times and sector performance", isPro: false },
    { id: "track_comparison", name: "H2H Track Comparison", icon: Users, description: "Head-to-head track comparison visualization", isPro: false },
    { id: "throttle_brake", name: "H2H Throttle & Brake", icon: ChartSpline, description: "Compare throttle and brake inputs across drivers on their fastest laps", isPro: false },
    { id: "session_results", name: "Optimal Qualifying Time", icon: MonitorCog, description: "Visualize session results and lap time deltas", isPro: false },
    //Premium features
    { id: "driver_analysis", name: "Driver Analysis", icon: UserRound, description: "Driver performance analysis", isPro: true },
    { id: "chevronsup", name: "Chevrons Up", icon: ChevronsUp, description: "Just a test icon", isPro: true },
    { id: "speed", name: "Speed Trace", icon: Gauge, description: "Speed, throttle, and brake analysis", isPro: true },
    { id: "tire", name: "Tire Temperature", icon: TrendingUp, description: "Tire temperature evolution", isPro: true },
    { id: "gforce", name: "G-Force Analysis", icon: Zap, description: "Lateral and longitudinal forces", isPro: true },
    { id: "drag_downforce", name: "Drag & Downforce", icon: ChartScatter, description: "Drag and downforce analysis", isPro: true },

  ]

  const years = ["2025", "2026"]


  const [topSpeedsData, setTopSpeedsData] = useState<TopSpeedData[]>([])
  const [speedDomain, setSpeedDomain] = useState<[number, number]>([320, 335])
  const [throttleAverageData, setThrottleAverageData] = useState<ThrottleAverageData[]>([])
  const [throttleDomain, setThrottleDomain] = useState<[number, number]>([85, 100])
  const [trackComparisonData, setTrackComparisonData] = useState<TrackComparisonData | null>(null)
  const [sessionResultsData, setSessionResultsData] = useState<SessionResultsData[]>([])
  const [sessionResultsDomain, setSessionResultsDomain] = useState<[number, number]>([0, 3])
  const [throttleBrakeData, setThrottleBrakeData] = useState<ThrottleBrakeComparisonData | null>(null)
  const [lapTimeData, setLapTimeData] = useState<LapTimeData[]>([])

  const handleGeneratePlot = async () => {
    // Check if user is authenticated
    if (!isAuthenticated || !authToken) {
      alert('Please log in to generate plots')
      return
    }

    // Check if user has tokens
    if (!hasTokens()) {
      alert('You need tokens to generate plots. Please purchase more tokens or wait for your monthly refill.')
      return
    }

    let apiGpVal: number | string = Number(selectedGp);
    const event = availableEvents.find(e => (e.official_name || e.name) === selectedEventName);
    if (event) {
      if (selectedVersion === 'v1') {
        const match = event.code ? event.code.match(/F1\d{4}(T?)(\d{2})/) : null;
        const isTesting = match ? match[1] === 'T' : event.name.toLowerCase().includes('test');
        if (isTesting) {
          alert('Version 1 API does not support pre-season testing. Please select a normal Grand Prix or switch to version 2.');
          return;
        }
        const index = availableEvents.indexOf(event);
        const roundNum = match ? parseInt(match[2], 10) : index + 1;
        apiGpVal = roundNum;
      } else if (selectedVersion === 'v2') {
        // v2 uses the official name (or falling back to standard name) instead of numeric key/round
        apiGpVal = event.official_name || event.name;
      }
    }

    let apiSessionVal = selectedSession;
    if (selectedVersion === 'v2') {
      const sessionObj = availableSessions.find(s => getSessionCode(s.name, s.type, s.number) === selectedSession);
      if (sessionObj) {
        apiSessionVal = sessionObj.name;
      }
    }

    setIsGenerating(true)
    let plotGeneratedSuccessfully = false

    try {
      if (selectedPlotType === "topspeeds") {
        const data = await fetchTopSpeeds(authToken, Number(selectedYear), apiGpVal, apiSessionVal, selectedVersion, selectedTopSpeedType)

        let processedData: { team: string; speed: number; color: string }[] = []

        // Check if data is in grouped format (FP2 GP1 2025 format)
        if (data && typeof data === 'object' && 'Color' in data && 'Team' in data && 'Top Speed (km/h)' in data) {
          // Handle grouped format: {Color: {0: '#color1', 1: '#color2'}, Team: {0: 'Team1', 1: 'Team2'}, 'Top Speed (km/h)': {0: 329, 1: 327}}
          const colors = data.Color as Record<string, string>
          const teams = data.Team as Record<string, string>
          const speeds = data['Top Speed (km/h)'] as Record<string, number>

          // Convert to array format
          processedData = Object.keys(teams).map(key => ({
            team: teams[key],
            speed: speeds[key],
            color: colors[key]
          }))
        } else {
          // Handle array format: [{Team: 'Team1', 'Top Speed (km/h)': 329, Color: '#color1'}, ...]
          processedData = Object.values(data as Record<string, { Team: string; 'Top Speed (km/h)': number; Color: string }>)
            .map(item => ({
              team: item.Team,
              speed: item['Top Speed (km/h)'],
              color: item.Color
            }))
        }

        // Sort the data by top speed
        processedData.sort((a, b) => b.speed - a.speed)

        // Calculate domain with margins
        const minSpeed = Math.min(...processedData.map(d => d.speed))
        const maxSpeed = Math.max(...processedData.map(d => d.speed))
        const margin = 5 // 5 km/h margin on each side
        const domain: [number, number] = [Math.floor(minSpeed - margin), Math.ceil(maxSpeed + margin)]

        setTopSpeedsData(processedData)
        setSpeedDomain(domain)
        plotGeneratedSuccessfully = true

      } else if (selectedPlotType === "throttle_average") {
        const data = await fetchThrottleAverages(authToken, Number(selectedYear), apiGpVal, apiSessionVal, selectedVersion)

        // Process and sort the data by throttle average
        const processedData = Object.values(data as Record<string, { Driver: string; 'Average Throttle (%)': number; Color: string }>)
          .map(item => ({
            driver: item.Driver,
            throttle: item['Average Throttle (%)'],
            color: item.Color
          }))
          .sort((a, b) => b.throttle - a.throttle)

        // Calculate domain with margins
        const minThrottle = Math.min(...processedData.map(d => d.throttle))
        const maxThrottle = Math.max(...processedData.map(d => d.throttle))
        const margin = 5 // 5% margin on each side
        const domain: [number, number] = [Math.floor(minThrottle - margin), Math.ceil(maxThrottle + margin)]

        setThrottleAverageData(processedData)
        setThrottleDomain(domain)
        plotGeneratedSuccessfully = true

      } else if (selectedPlotType === "track_comparison") {
        if (selectedDriver1 && selectedDriver2 && selectedDriver1 !== selectedDriver2) {
          setTrackComparisonData(null)

          const data = await fetchTrackComparison(authToken, Number(selectedYear), apiGpVal, apiSessionVal, selectedDriver1, selectedDriver2, selectedVersion)
          setTrackComparisonData(data)
          plotGeneratedSuccessfully = true
        } else {
          throw new Error('Please select two different drivers for track comparison')
        }

      } else if (selectedPlotType === "session_results") {
        const data = await fetchSessionResults(authToken, Number(selectedYear), apiGpVal, apiSessionVal, selectedVersion)

        // Process the data
        const processedData = data as SessionResultsData[]
        const maxDelta = Math.max(...processedData.map(d => d.LapTimeDelta))
        const domain: [number, number] = [0, Math.ceil(maxDelta + 0.5)]

        setSessionResultsData(processedData)
        setSessionResultsDomain(domain)
        plotGeneratedSuccessfully = true

      } else if (selectedPlotType === "throttle_brake") {
        if (selectedDriver1 && selectedDriver2 && selectedDriver1 !== selectedDriver2) {
          setThrottleBrakeData(null)

          const data = await fetchThrottleBrakeComparison(authToken, Number(selectedYear), apiGpVal, apiSessionVal, selectedDriver1, selectedDriver2, selectedVersion)
          setThrottleBrakeData(data as ThrottleBrakeComparisonData)
          plotGeneratedSuccessfully = true
        } else {
          throw new Error('Please select two different drivers for throttle & brake comparison')
        }

      } else if (selectedPlotType === "laptime") {
        const data = await fetchLaptimeData(authToken, Number(selectedYear), apiGpVal, apiSessionVal, selectedDriver, selectedVersion)
        setLapTimeData(data)
        plotGeneratedSuccessfully = true
      } else {
        // Default case for other plot types
        await new Promise(resolve => setTimeout(resolve, 2000))
        plotGeneratedSuccessfully = true
      }

      // If plot generation was successful, deduct a token
      if (plotGeneratedSuccessfully) {
        const tokenDeducted = await deductToken()
        if (tokenDeducted) {
          console.log('Token deducted successfully for plot generation')
        } else {
          console.warn('Failed to deduct token after successful plot generation')
        }
      }

    } catch (error) {
      console.error('Error generating plot:', error)
      alert('Error generating plot: ' + (error as Error).message)
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
      showDataLabels
    }

    switch (selectedPlotType) {
      case "laptime":
        return (
          <LapTimeAnalysisGraph lapTimeData={lapTimeData} advancedSettings={advancedSettings} />
        )
      case "speed":
        return (
          <SpeedTraceGraph speedData={speedData} advancedSettings={advancedSettings} />
        )
      case "tire":
        return (
          <TireTempGraph tireTempData={tireData} advancedSettings={advancedSettings} />
        )
      case "gforce":
        return (
          <GForceGraph gForceData={gForceData} advancedSettings={advancedSettings} />
        )
      case "topspeeds":
        return (
          <TopSpeedGraph data={topSpeedsData} speedDomain={speedDomain} advancedSettings={advancedSettings} />
        )
      case "throttle_average":
        return (
          <ThrottleAverageGraph data={throttleAverageData} throttleDomain={throttleDomain} advancedSettings={advancedSettings} />
        )
      case "track_comparison":
        return trackComparisonData ? (
          <TrackComparisonGraph data={trackComparisonData} advancedSettings={advancedSettings} />
        ) : (
          <div className="flex flex-col items-center justify-center h-[700px] text-muted-foreground space-y-4">
            {isGenerating ? (
              <>
                <LoadingPlot />
              </>
            ) : "No track comparison data available"}
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
            {isGenerating ? (
              <>
                <LoadingPlot />
              </>
            ) : "No throttle & brake comparison data available"}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg glow-effect">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold gradient-text">Telemetry Plot Generator</CardTitle>
              <CardDescription>Generate custom F1 telemetry visualizations</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isAuthenticated && userProfile && (
              <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10">
                <Coins className="h-3 w-3 mr-1" />
                {getTokenCount()} tokens
              </Badge>
            )}
            <Badge variant="secondary" className="accent-glow">
              AI Powered
            </Badge>
          </div>
        </div>

        {/* Token warning */}
        {isAuthenticated && !hasTokens() && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10 mt-4">
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

        {/* Token error */}
        {tokenError && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {tokenError}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={selectedPlotType} onValueChange={setSelectedPlotType} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-muted/20 h-full">
            {plotTypes.map((type) => {
              const IconComponent = type.icon
              return (
                <TabsTrigger
                  key={type.id}
                  value={type.id}
                  className="flex flex-col items-center space-y-1 p-3 m-1 data-[state=active]:bg-primary data-[state=active]:text-muted transition-all duration-200 hover:bg-primary/30 relative"
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="text-xs font-medium">{type.name}</span>
                  {type.isPro && (
                    <Badge variant="secondary" className="absolute -top-1 -right-1 text-[8px] px-1 py-0 h-4 bg-primary/90 text-primary-foreground font-bold accent-glow border border-primary/50">
                      Coming Soon
                    </Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full bg-background/50 border-border/50">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year.charAt(0).toUpperCase() + year.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session">Round</Label>
                <Select value={selectedEventName} onValueChange={(val) => {
                  setSelectedEventName(val)
                  const event = availableEvents.find(e => (e.official_name || e.name) === val)
                  if (event) {
                    setSelectedGp(event.key ? event.key.toString() : "1")
                  }
                }}>
                  <SelectTrigger className="w-full bg-background/50 border-border/50">
                    <SelectValue placeholder="Select round" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEvents.length > 0 ? availableEvents.map((event, index) => {
                      const match = event.code.match(/F1\d{4}(T?)(\d{2})/)
                      const isTesting = match && match[1] === 'T'
                      const roundNum = match ? parseInt(match[2], 10) : index + 1
                      const prefix = isTesting ? 'Test' : `${roundNum}.`
                      const isDuplicate = availableEvents.filter(e => e.name === event.name).length > 1;
                      const displayName = isDuplicate ? event.official_name : event.name;
                      const identifier = event.official_name || event.name;
                      return (
                        <SelectItem key={event.key || index} value={identifier}>
                          {`${prefix} ${displayName}`}
                        </SelectItem>
                      )
                    }) : (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
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
                    {availableSessions.length > 0 ? availableSessions.map((session) => {
                      const code = getSessionCode(session.name, session.type, session.number)
                      return (
                        <SelectItem key={session.key || code} value={code}>
                          {session.name}
                        </SelectItem>
                      )
                    }) : (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">API Version</Label>
                <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                  <SelectTrigger className="w-full bg-background/50 border-border/50">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="v1">Version 1</SelectItem>
                    <SelectItem value="v2">Version 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedPlotType === "topspeeds" && selectedVersion === "v2" && (
                <div className="space-y-2">
                  <Label htmlFor="topSpeedType">Speed Source</Label>
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
              )}
            </div>
            {(selectedPlotType === "speed" || selectedPlotType === "laptime") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Driver 1 */}
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
                {selectedPlotType === "speed" && (
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
                  </div>)}
              </div>)}

            {(selectedPlotType === "track_comparison" || selectedPlotType === "throttle_brake") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Driver 1 */}
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
                {/* Driver 2 */}
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
              </div>)}


            {/* <div className="space-y-2">
              <Label htmlFor="laps">Lap Range</Label>
              <Input id="laps" placeholder="1-20" className="bg-background/50 border-border/50" />
            </div> */}

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleGeneratePlot}
                disabled={isGenerating || !hasTokens() || !isAuthenticated}
                className="bg-primary hover:bg-primary/90 text-primary-foreground glow-effect hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generate Plot
                    <span className="ml-2 text-xs bg-yellow-500/20 px-2 py-1 rounded text-yellow-300">
                      1 token
                    </span>
                  </>
                )}
              </Button>

              <Dialog open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-transparent hover:bg-muted/20 transition-all duration-300">
                    <Settings className="h-4 w-4 mr-2" />
                    Advanced
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="gradient-text">Advanced Plot Settings</DialogTitle>
                    <DialogDescription>
                      Customize your telemetry plot visualization options
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    {/* Chart Display Options */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-foreground">Display Options</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="show-grid">Show Grid Lines</Label>
                            <p className="text-xs text-muted-foreground">Display grid lines on the chart</p>
                          </div>
                          <Switch
                            id="show-grid"
                            checked={showGrid}
                            onCheckedChange={setShowGrid}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="show-legend">Show Legend</Label>
                            <p className="text-xs text-muted-foreground">Display chart legend</p>
                          </div>
                          <Switch
                            id="show-legend"
                            checked={showLegend}
                            onCheckedChange={setShowLegend}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="show-labels">Show Data Labels</Label>
                            <p className="text-xs text-muted-foreground">Display values on data points</p>
                          </div>
                          <Switch
                            id="show-labels"
                            checked={showDataLabels}
                            onCheckedChange={setShowDataLabels}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="animate">Animate Chart</Label>
                            <p className="text-xs text-muted-foreground">Enable chart animations</p>
                          </div>
                          <Switch
                            id="animate"
                            checked={animateChart}
                            onCheckedChange={setAnimateChart}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Chart Appearance */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-foreground">Appearance</h4>
                      <div className="space-y-3">
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

                    {/* Quick Presets */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-foreground">Quick Presets</h4>
                      <div className="grid grid-cols-2 gap-2">
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
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setAdvancedOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setAdvancedOpen(false)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Apply Settings
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" className="bg-transparent hover:bg-muted/20 transition-all duration-300" onClick={() => alert('Coming soon!')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {plotTypes.map((type) => (
            <TabsContent key={type.id} value={type.id} className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{type.name}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                  {/* <Badge variant="outline" className="accent-glow">
                    {selectedDriver} • {selectedSession}
                  </Badge> */}
                </div>

                <div className="bg-background/30 rounded-lg p-4 border border-border/50">{renderPlot()}</div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {selectedPlotType === "topspeeds" ? (
                    <>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">
                          {topSpeedsData[0]?.speed || '-'} km/h
                        </div>
                        <div className="text-muted-foreground">Fastest Team</div>
                        <div className="text-xs text-muted-foreground">{topSpeedsData[0]?.team || '-'}</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">
                          {topSpeedsData[9]?.speed || '-'} km/h
                        </div>
                        <div className="text-muted-foreground">Slowest Team</div>
                        <div className="text-xs text-muted-foreground">{topSpeedsData[9]?.team || '-'}</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">
                          {topSpeedsData.length > 0
                            ? (topSpeedsData.reduce((acc, curr) => acc + curr.speed, 0) / topSpeedsData.length).toFixed(1)
                            : '-'} km/h
                        </div>
                        <div className="text-muted-foreground">Average Speed</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">
                          {topSpeedsData.length > 0
                            ? (topSpeedsData[0].speed - topSpeedsData[topSpeedsData.length - 1].speed).toFixed(1)
                            : '-'} km/h
                        </div>
                        <div className="text-muted-foreground">Speed Delta</div>
                      </div>
                    </>
                  ) : selectedPlotType === "throttle_average" ? (
                    <>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">
                          {throttleAverageData[0]?.throttle?.toFixed(1) || '-'}%
                        </div>
                        <div className="text-muted-foreground">Highest Throttle</div>
                        <div className="text-xs text-muted-foreground">{throttleAverageData[0]?.driver || '-'}</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">
                          {throttleAverageData[throttleAverageData.length - 1]?.throttle?.toFixed(1) || '-'}%
                        </div>
                        <div className="text-muted-foreground">Lowest Throttle</div>
                        <div className="text-xs text-muted-foreground">{throttleAverageData[throttleAverageData.length - 1]?.driver || '-'}</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">
                          {throttleAverageData.length > 0
                            ? (throttleAverageData.reduce((acc, curr) => acc + (curr.throttle || 0), 0) / throttleAverageData.length).toFixed(1)
                            : '-'}%
                        </div>
                        <div className="text-muted-foreground">Average Throttle</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">
                          {throttleAverageData.length > 0 && throttleAverageData[0]?.throttle && throttleAverageData[throttleAverageData.length - 1]?.throttle
                            ? (throttleAverageData[0].throttle - throttleAverageData[throttleAverageData.length - 1].throttle).toFixed(1)
                            : '-'}%
                        </div>
                        <div className="text-muted-foreground">Throttle Delta</div>
                      </div>
                    </>
                  ) : selectedPlotType === "session_results" ? (
                    <>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">
                          {sessionResultsData[0]?.LapTime || '-'}
                        </div>
                        <div className="text-muted-foreground">Fastest Lap</div>
                        <div className="text-xs text-muted-foreground">{sessionResultsData[0]?.Driver || '-'}</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">
                          +{sessionResultsData[sessionResultsData.length - 1]?.LapTimeDelta?.toFixed(3) || '-'}s
                        </div>
                        <div className="text-muted-foreground">Largest Gap</div>
                        <div className="text-xs text-muted-foreground">{sessionResultsData[sessionResultsData.length - 1]?.Driver || '-'}</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">
                          {sessionResultsData.length > 0
                            ? (sessionResultsData.reduce((acc, curr) => acc + (curr.LapTimeDelta || 0), 0) / sessionResultsData.length).toFixed(3)
                            : '-'}s
                        </div>
                        <div className="text-muted-foreground">Avg. Gap</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">
                          {sessionResultsData.length || 0}
                        </div>
                        <div className="text-muted-foreground">Total Drivers</div>
                      </div>
                    </>
                  ) : selectedPlotType === "throttle_brake" ? (
                    <>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">
                          {throttleBrakeData?.driver1 || '-'} vs {throttleBrakeData?.driver2 || '-'}
                        </div>
                        <div className="text-muted-foreground">Head to Head</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">
                          {throttleBrakeData?.telemetry?.length || 0}
                        </div>
                        <div className="text-muted-foreground">Data Points</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">
                          {throttleBrakeData?.session_info?.event_name || '-'}
                        </div>
                        <div className="text-muted-foreground">Event</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">
                          {throttleBrakeData?.session_info?.session_name || '-'}
                        </div>
                        <div className="text-muted-foreground">Session</div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">1:28.456</div>
                        <div className="text-muted-foreground">Best Lap</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">342 km/h</div>
                        <div className="text-muted-foreground">Top Speed</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">3.2G</div>
                        <div className="text-muted-foreground">Max G-Force</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">125°C</div>
                        <div className="text-muted-foreground">Peak Tire Temp</div>
                      </div> */}
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
