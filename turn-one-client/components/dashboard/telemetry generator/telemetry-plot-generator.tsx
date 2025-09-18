"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Play, Settings, TrendingUp, Zap, Clock, Gauge, CircleGauge, ChevronsUp, MonitorCog, Users, UserRound, ChartSpline } from "lucide-react"
import { fetchTopSpeeds, fetchThrottleAverages, fetchTrackComparison } from "@/lib/dataAcquisition"
import { TopSpeedData, ThrottleAverageData, TrackComparisonData } from "@/types/plot-types"
import { grandPrixCalendar } from "@/lib/constants/grand-prix"
import { TopSpeedGraph } from "./plots/top-speed"
import { GForceGraph } from "./plots/gforce"
import { SpeedTraceGraph } from "./plots/speedtrace"
import { LapTimeAnalysisGraph } from "./plots/lap-time-analysis"
import { TireTempGraph } from "./plots/tire-temp"
import { ThrottleAverageGraph } from "./plots/throttle_average_comparison"
import { TrackComparisonGraph } from "./plots/track-comparison"
import { da } from "date-fns/locale"
import { drivers } from "@/lib/constants/drivers"
import { LoadingPlot } from "./loading_plot"
import { set } from "date-fns"


// TODO Replace with real telemetry data fetching and processing logic
const lapTimeData = [
  { lap: 1, time: 92.5, driver: "VER", sector1: 28.2, sector2: 31.1, sector3: 33.2 },
  { lap: 2, time: 91.8, driver: "VER", sector1: 27.9, sector2: 30.8, sector3: 33.1 },
  { lap: 3, time: 91.2, driver: "VER", sector1: 27.7, sector2: 30.5, sector3: 33.0 },
  { lap: 4, time: 90.9, driver: "VER", sector1: 27.5, sector2: 30.3, sector3: 33.1 },
  { lap: 5, time: 91.1, driver: "VER", sector1: 27.6, sector2: 30.4, sector3: 33.1 },
]

const speedData = [
  { distance: 0, speed: 0, throttle: 0, brake: 0 },
  { distance: 200, speed: 120, throttle: 100, brake: 0 },
  { distance: 400, speed: 180, throttle: 100, brake: 0 },
  { distance: 600, speed: 220, throttle: 100, brake: 0 },
  { distance: 800, speed: 280, throttle: 100, brake: 0 },
  { distance: 1000, speed: 320, throttle: 100, brake: 0 },
  { distance: 1200, speed: 340, throttle: 80, brake: 0 },
  { distance: 1400, speed: 280, throttle: 0, brake: 100 },
  { distance: 1600, speed: 180, throttle: 0, brake: 100 },
  { distance: 1800, speed: 120, throttle: 50, brake: 0 },
]

const tireData = [
  { lap: 1, frontLeft: 85, frontRight: 87, rearLeft: 92, rearRight: 90 },
  { lap: 5, frontLeft: 95, frontRight: 97, rearLeft: 102, rearRight: 100 },
  { lap: 10, frontLeft: 105, frontRight: 107, rearLeft: 112, rearRight: 110 },
  { lap: 15, frontLeft: 115, frontRight: 117, rearLeft: 122, rearRight: 120 },
  { lap: 20, frontLeft: 125, frontRight: 127, rearLeft: 132, rearRight: 130 },
]

const gForceData = [
  { time: 0, lateral: 0, longitudinal: 0 },
  { time: 1, lateral: 2.5, longitudinal: 1.2 },
  { time: 2, lateral: -1.8, longitudinal: 2.1 },
  { time: 3, lateral: 3.2, longitudinal: -2.8 },
  { time: 4, lateral: -2.1, longitudinal: 1.5 },
  { time: 5, lateral: 1.9, longitudinal: -1.2 },
]

export function TelemetryPlotGenerator() {
  const [selectedPlotType, setSelectedPlotType] = useState("laptime")
  const [selectedDriver, setSelectedDriver] = useState("VER")
  const [selectedDriver1, setSelectedDriver1] = useState("VER")
  const [selectedDriver2, setSelectedDriver2] = useState("HAM")
  const [selectedSession, setSelectedSession] = useState("FP1")
  const [selectedYear, setSelectedYear] = useState("2025")
  const [selectedGp, setSelectedGp] = useState("1")
  const [isGenerating, setIsGenerating] = useState(false)

  const plotTypes = [
    { id: "topspeeds", name: "Top Speeds", icon: Gauge, description: "Compare top speeds across teams" },
    { id: "throttle_average", name: "Throttle Average", icon: CircleGauge, description: "Compare average throttle across drivers" },
    { id: "driver_analysis", name: "Driver Analysis", icon: UserRound, description: "Driver performance analysis" },
    { id: "track_comparison", name: "H2H Track Comparison", icon: Users, description: "Head-to-head track comparison visualization" },
    { id: "chevronsup", name: "Chevrons Up", icon: ChevronsUp, description: "Just a test icon" },
    { id: "throttle_brake", name: "H2H Throttle & Brake", icon: ChartSpline, description: "Compare throttle and brake inputs across drivers on their fastest laps" },
    //Premium features
    { id: "laptime", name: "Lap Time Analysis", icon: Clock, description: "Compare lap times and sector performance" },
    { id: "speed", name: "Speed Trace", icon: Gauge, description: "Speed, throttle, and brake analysis" },
    { id: "tire", name: "Tire Temperature", icon: TrendingUp, description: "Tire temperature evolution" },
    { id: "gforce", name: "G-Force Analysis", icon: Zap, description: "Lateral and longitudinal forces" },
    
  ]

  const sessions = ["FP1", "FP2", "FP3", "Q", "R", "S", "SQ"]
  const years = ["2025", "2026"]
  const gp = grandPrixCalendar[selectedYear]?.races || []


  const [topSpeedsData, setTopSpeedsData] = useState<TopSpeedData[]>([])
  const [speedDomain, setSpeedDomain] = useState<[number, number]>([320, 335])
  const [throttleAverageData, setThrottleAverageData] = useState<ThrottleAverageData[]>([])
  const [throttleDomain, setThrottleDomain] = useState<[number, number]>([85, 100])
  const [trackComparisonData, setTrackComparisonData] = useState<TrackComparisonData | null>(null)
  const [throttleBrakeData, setThrottleBrakeData] = useState<any>(null)

  const handleGeneratePlot = () => {
    setIsGenerating(true)
    if (selectedPlotType === "topspeeds") {

      fetchTopSpeeds('dummy-token', Number(selectedYear), Number(selectedGp), selectedSession) //
        .then((data) => {
          // Process and sort the data by top speed
          const processedData = Object.values(data as Record<string, { Team: string; 'Top Speed (km/h)': number; Color: string }>)
            .map(item => ({
              team: item.Team,
              speed: item['Top Speed (km/h)'],
              color: item.Color
            }))
            .sort((a, b) => b.speed - a.speed)
            
          // Calculate domain with margins
          const minSpeed = Math.min(...processedData.map(d => d.speed))
          const maxSpeed = Math.max(...processedData.map(d => d.speed))
          const margin = 5 // 5 km/h margin on each side
          const domain: [number, number] = [Math.floor(minSpeed - margin), Math.ceil(maxSpeed + margin)]
          
          setTopSpeedsData(processedData)
          setSpeedDomain(domain)
        })
        .catch((error) => {
          console.error('Error fetching top speeds:', error)
        })
        .finally(() => {
          setIsGenerating(false)
        })
    } else if (selectedPlotType === "throttle_average") {

      fetchThrottleAverages('dummy-token', Number(selectedYear), Number(selectedGp), selectedSession) //
        .then((data) => {
          // Process and sort the data by throttle average
          const processedData = Object.values(data as Record<string, { Driver: string; 'Average Throttle (%)': number; Color: string }>)
            .map(item => ({
              driver: item.Driver,
              throttle: item['Average Throttle (%)'], // Fixed: was 'Throttle Average (%)' but API returns 'Average Throttle (%)'
              color: item.Color
            }))
            .sort((a, b) => b.throttle - a.throttle)
          
          console.log('Processed Throttle Data:', processedData)
          
          // Calculate domain with margins
          const minThrottle = Math.min(...processedData.map(d => d.throttle))
          const maxThrottle = Math.max(...processedData.map(d => d.throttle))
          const margin = 5 // 5% margin on each side
          const domain: [number, number] = [Math.floor(minThrottle - margin), Math.ceil(maxThrottle + margin)]

          setThrottleAverageData(processedData)
          setThrottleDomain(domain)
        })
        .catch((error) => {
          console.error('Error fetching throttle average:', error)
        })
        .finally(() => {
          setIsGenerating(false)
        })
    } else if (selectedPlotType === "track_comparison") {
      if (selectedDriver1 && selectedDriver2 && selectedDriver1 !== selectedDriver2) {
        // Clear previous data and start fresh
        setTrackComparisonData(null)
        
        // Set up a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.error('Track comparison request timed out')
          setIsGenerating(false)
        }, 30000) // 30 second timeout
        
        fetchTrackComparison('dummy-token', Number(selectedYear), Number(selectedGp), selectedSession, selectedDriver1, selectedDriver2)
          .then((data) => {
            clearTimeout(timeoutId)
            setTrackComparisonData(data)
          })
          .catch((error) => {
            clearTimeout(timeoutId)
            console.error('Error fetching track comparison:', error)
          })
          .finally(() => {
            clearTimeout(timeoutId)
            setIsGenerating(false)
          })
      }else {
        console.error('Please select two different drivers for track comparison')
        setIsGenerating(false)
      }
    }else if(selectedPlotType === "throttle_brake"){ 
      if (selectedDriver1 && selectedDriver2 && selectedDriver1 !== selectedDriver2) {
        // Clear previous data and start fresh
        setThrottleBrakeData(null)
        // Set up a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.error('Throttle & Brake comparison request timed out')
          setIsGenerating(false)
        }, 30000) // 30 second timeout
      }
    }else {
      // Default case for other plot types or unsupported types
      setTimeout(() => {
        setIsGenerating(false)
      }, 2000)
    }
  }

  const renderPlot = () => {
    switch (selectedPlotType) {
      case "laptime":
        return (
          <LapTimeAnalysisGraph lapTimeData={lapTimeData} />
        )
      case "speed":
        return (
          <SpeedTraceGraph speedData={speedData} />
        )
      case "tire":
        return (
          <TireTempGraph tireTempData={tireData} />
        )
      case "gforce":
        return (
          <GForceGraph gForceData={gForceData} />
        )
      case "topspeeds":
        return (
          <TopSpeedGraph data={topSpeedsData} speedDomain={speedDomain} />
        )
      case "throttle_average":
        return (
          <ThrottleAverageGraph data={throttleAverageData} throttleDomain={throttleDomain} />
        )
      case "track_comparison":
        return trackComparisonData ? (
          <TrackComparisonGraph data={trackComparisonData} />
        ) : (
          <div className="flex flex-col items-center justify-center h-[700px] text-muted-foreground space-y-4">
            {isGenerating ? (
              <>
                <LoadingPlot />
              </>
            ) : "No track comparison data available"}
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
          <Badge variant="secondary" className="accent-glow">
            AI Powered
          </Badge>
        </div>
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
                  className="flex flex-col items-center space-y-1 p-3 data-[state=active]:bg-primary data-[state=active]:text-muted transition-all duration-200 hover:bg-primary/30"
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="text-xs font-medium">{type.name}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Select value={selectedGp} onValueChange={setSelectedGp}>
                  <SelectTrigger className="w-full bg-background/50 border-border/50">
                    <SelectValue placeholder="Select round" />
                  </SelectTrigger>
                  <SelectContent>
                    {gp.map((round) => (
                      <SelectItem key={round.id} value={round.id}>
                        {`${round.id}. ${round.name}`}
                      </SelectItem>
                    ))}
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
                    {sessions.map((session) => (
                      <SelectItem key={session} value={session}>
                        {session.charAt(0).toUpperCase() + session.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedPlotType === "speed" && (
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
              {/* Driver 2 */}
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
            </div>)}
            
            {selectedPlotType === "track_comparison" && (
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
            
            {/* Token */}
            <div className="space-y-2">
              <Label htmlFor="token">Tokens left: </Label>
              <Input id="token" placeholder="TODO show number of tokens" className="bg-background/50 border-border/50" />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="laps">Lap Range</Label>
              <Input id="laps" placeholder="1-20" className="bg-background/50 border-border/50" />
            </div> */}

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleGeneratePlot}
                disabled={isGenerating}
                className="bg-primary hover:bg-primary/90 text-primary-foreground glow-effect hover:scale-105 transition-all duration-300"
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
                  </>
                )}
              </Button>

              <Button variant="outline" className="bg-transparent hover:bg-muted/20 transition-all duration-300" onClick={() => alert('Advanced settings coming soon!')}>
                <Settings className="h-4 w-4 mr-2" />
                Advanced
              </Button>

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
                  <Badge variant="outline" className="accent-glow">
                    {selectedDriver} • {selectedSession}
                  </Badge>
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
                  ) : (
                    <>
                      <div className="bg-muted/20 rounded-lg p-3 text-center">
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
                      </div>
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
