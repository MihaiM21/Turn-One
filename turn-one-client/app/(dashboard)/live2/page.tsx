
  'use client';
  
  import { useState, useEffect, useCallback } from 'react';
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
  import { Badge } from '@/components/ui/badge';
  import { ScrollArea } from '@/components/ui/scroll-area';
  
  // LiveTimer Component
  const LiveTimer = ({ initialTime, isRunning }: { initialTime?: string; isRunning: boolean }) => {
    const [timeRemaining, setTimeRemaining] = useState(initialTime);
  
    useEffect(() => {
      setTimeRemaining(initialTime);
    }, [initialTime]);
  
    useEffect(() => {
      if (!isRunning || !timeRemaining) return;
  
      const parseTime = (timeStr: string) => {
        const [minutes, seconds] = timeStr.split(':').map(Number);
        return minutes * 60 + seconds;
      };
  
      const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      };
  
      const totalSeconds = parseTime(timeRemaining);
      
      const timer = setInterval(() => {
        if (totalSeconds <= 0) {
          clearInterval(timer);
          return;
        }
        
        setTimeRemaining(prev => {
          const currentSeconds = parseTime(prev || '0:00');
          if (currentSeconds <= 0) return prev;
          return formatTime(currentSeconds - 1);
        });
      }, 1000);
  
      return () => clearInterval(timer);
    }, [isRunning, timeRemaining]);
  
    return timeRemaining || '0:00';
  };
  import { LiveTimingGrid } from '@/components/dashboard/live-timing-grid';
  import { LiveWeather } from '@/components/dashboard/live-weather';
  import { useF1LiveData } from '@/hooks/use-f1-live-data';
  import { F1DataMapper, type MappedF1Data } from '@/lib/f1DataMapper';
  import { 
    Clock, 
    Activity, 
    Zap, 
    Thermometer, 
    Wind, 
    Car,
    Flag,
    Timer,
    Radio,
    AlertTriangle,
    Trophy,
    MapPin,
    Wifi,
    WifiOff,
    Settings,
    PlayCircle,
    StopCircle,
    AlertCircle
  } from 'lucide-react';
  import { DashboardHeader } from "@/components/dashboard/live dashboard/dashboard-header"
  interface LiveSessionData {
    sessionInfo?: {
      type: string;
      name: string;
      status: string;
      timeRemaining: string;
      lapsRemaining?: number;
      currentLap?: number;
      totalLaps?: number;
    };
    weather?: {
      temperature: number;
      humidity: number;
      trackTemp: number;
      windSpeed: number;
      windDirection: number;
      windGust?: number;
      visibility: number;
      rainfall: boolean;
      rainIntensity?: number;
      pressure: number;
      conditions: 'sunny' | 'cloudy' | 'overcast' | 'light-rain' | 'heavy-rain';
    };
    trackStatus?: {
      status: string;
      message: string;
      flagColor: string;
      sector1?: string;
      sector2?: string;
      sector3?: string;
    };
    positions?: Array<{
      position: number;
      driverNumber: string;
      driverName: string;
      team: string;
      gap: string;
      interval: string;
      lastLapTime: string;
      bestLapTime?: string;
      currentLapTime?: string;
      sector1?: string;
      sector2?: string;
      sector3?: string;
      speed: number;
      drs: boolean;
      positionChange?: number;
      isOnTrack: boolean;
      tires: {
        compound: 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet';
        age: number;
      };
    }>;
    raceControlMessages?: Array<{
      timestamp: string;
      category: string;
      message: string;
      flag?: string;
      severity: 'info' | 'warning' | 'critical';
    }>;//REMAKE
    teamRadio?: Array<{
      timestamp: string;
      driverName: string;
      driverNumber: string;
      message: string;
      team: string;
      path?: string;
    }>;
    fastestLaps?: Array<{
      position: number;
      driverName: string;
      lapTime: string;
      lap: number;
    }>;
  }
  
  
  
  export default function LiveDashboard() {
    const [liveData, setLiveData] = useState<MappedF1Data | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [accumulatedData, setAccumulatedData] = useState<Record<string, any>>({});
  
    const f1Url = "https://livetiming.formula1.com";
  
    // Use the enhanced SignalR hook with auto-connect and all F1 feeds
    const {
      data: signalRData,
      rawData,
      status: connectionStatus,
      isConnected,
      connect,
      disconnect,
      subscribeToFeed,
      getF1ServiceStatus,
      restartF1Service,
      // New persistence-related properties
      currentData,
      lastReceivedData,
      hasSession,
      lastUpdated
    } = useF1LiveData({
      autoConnect: true,
      subscribedFeeds: [
        'CarData', 'Position', 'TimingData', 'SessionInfo', 
        'WeatherData', 'TrackStatus', 'DriverList', 'RaceControlMessages',
        'SessionData', 'LapCount', 'TimingStats', 'TimingAppData', 'TeamRadio'
      ]
    });
  
    // Process SignalR data and accumulate feeds before mapping
    useEffect(() => {
      
      if (signalRData) {
        
        //console.log('🔍 JSON stringified:', JSON.stringify(signalRData, null, 2));
        
        // Try both PascalCase and camelCase property access
        const feedName = signalRData.FeedName || signalRData.feedName || signalRData.feedname;
        const data = signalRData.Data || signalRData.data;
        const timestamp = signalRData.Timestamp || signalRData.timestamp;
        
        // console.log('🔧 Extracted feedName:', feedName);
        // console.log('🔧 Extracted data:', data);
        // console.log('🔧 Extracted timestamp:', timestamp);
  
        if (data && feedName) {
          // Filter out heartbeat and non-essential feeds
          // if (feedName === 'Heartbeat' || feedName === 'SessionData' || feedName === 'LapCount') {
          //   console.log(`📡 Skipping ${feedName} (heartbeat/metadata)`);
          //   return;
          // }
  
          //console.log(`🏎️ Processing F1 feed: ${feedName}`);
          
          try {
            // Accumulate data from all feeds
            setAccumulatedData(prev => {
              const updated = {
                ...prev,
                [feedName]: data  // Each feed overwrites its previous data
              };
              
              // Try to map the accumulated data
              try {
                const mappedData = F1DataMapper.mapF1Data(updated);
                console.log('Mapped Data:', mappedData);
                setLiveData(mappedData);
                setLastUpdate(new Date());
              } catch (mappingError) {
                console.warn('Mapping failed, waiting for more data:', mappingError);
              }
              
              return updated;
            });
          } catch (error) {
            console.error('Error processing F1 data:', error);
          }
        } else {
          console.log('❌ Missing Data or FeedName:', { 
            hasData: !!signalRData.Data, 
            hasFeedName: !!signalRData.FeedName 
          });
        }
      } else {
        console.log('❌ No signalRData received');
      }
    }, [signalRData]);
  
    // Handle connection status changes but keep persisted data
    useEffect(() => {
      if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
        // Instead of resetting everything, let's use the persisted data if available
        if (Object.keys(lastReceivedData).length > 0 && !Object.keys(accumulatedData).length) {
          console.log('Using persisted data while disconnected');
          setAccumulatedData(lastReceivedData);
          
          // Try to map the persisted data
          try {
            const mappedData = F1DataMapper.mapF1Data(lastReceivedData);
            setLiveData(mappedData);
            if (lastUpdated) {
              setLastUpdate(new Date(lastUpdated));
            }
          } catch (mappingError) {
            console.warn('Mapping persisted data failed:', mappingError);
          }
        }
      }
    }, [connectionStatus, lastReceivedData, lastUpdated, accumulatedData]);
  
    const handleManualConnect = () => {
      connect();
    };
  
    const handleDisconnect = () => {
      disconnect();
    };
  
    const handleRestart = async () => {
      try {
        await restartF1Service();
        // Wait a bit then reconnect
        setTimeout(() => connect(), 2000);
      } catch (error) {
        console.error('Failed to restart F1 service:', error);
      }
    };
  
    const getFlagColor = (flagColor: string) => {
      switch (flagColor) {
        case 'green':
          return 'bg-green-500';
        case 'yellow':
          return 'bg-yellow-500';
        case 'red':
          return 'bg-red-500';
        case 'blue':
          return 'bg-blue-500';
        case 'checkered':
          return 'bg-gradient-to-r from-black to-white';
        default:
          return 'bg-gray-500';
      }
    };
  
    const getConnectionStatusColor = () => {
      switch (connectionStatus) {
        case 'connected':
          return 'bg-green-500';
        case 'connecting':
          return 'bg-yellow-500';
        case 'error':
          return 'bg-red-500';
        case 'disconnected':
        default:
          return 'bg-gray-500';
      }
    };
  
    const getConnectionIcon = () => {
      switch (connectionStatus) {
        case 'connected':
          return <Wifi className="w-4 h-4 text-green-500" />;
        case 'connecting':
          return <Activity className="w-4 h-4 text-yellow-500" />;
        case 'error':
          return <WifiOff className="w-4 h-4 text-red-500" />;
        case 'disconnected':
        default:
          return <WifiOff className="w-4 h-4 text-gray-500" />;
      }
    };
  
    const getConnectionLabel = () => {
      switch (connectionStatus) {
        case 'connected':
          return 'Connected';
        case 'connecting':
          return 'Connecting...';
        case 'error':
          return 'Connection Error';
        case 'disconnected':
        default:
          return 'Disconnected';
      }
    };
  
    const isUsingPersistedData = !isConnected && lastUpdated && liveData;
    const hasNoSession = !isConnected && !isUsingPersistedData;
  
    const getMessageSeverityColor = (severity: string) => {
      switch (severity) {
        case 'critical':
          return 'border-red-500 bg-red-500/10';
        case 'warning':
          return 'border-yellow-500 bg-yellow-500/10';
        case 'info':
        default:
          return 'border-blue-500 bg-blue-500/10';
      }
    };
  
    return (
    <div className="flex flex-col min-h-screen mx-4">
      <DashboardHeader />
      <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <Badge variant="outline" 
              className="px-5 py-2 bg-primary/10 backdrop-blur-md border-primary/30 
                       hover:bg-primary/15 transition-all duration-300 shadow-lg shadow-primary/5
                       flex items-center gap-3">
              <Activity className="w-4 h-4 text-primary animate-pulse" />
              <span className="font-medium tracking-wide">Live Timing</span>
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}></div>
            </div>
            <Badge variant={isConnected ? "default" : "secondary"} className="capitalize">
              {getConnectionLabel()}
            </Badge>
            
            {/* Connection Controls */}
            <div className="flex gap-2">
              {!isConnected && connectionStatus !== 'connecting' && (
                <button
                  onClick={handleManualConnect}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                >
                  <PlayCircle className="w-3 h-3" />
                  Connect
                </button>
              )}
              
              {(isConnected || connectionStatus === 'connecting') && (
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                >
                  <StopCircle className="w-3 h-3" />
                  Disconnect
                </button>
              )}
            </div>
            </div>
          </div>
          
          {/* Last Update */}
          {lastUpdate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {!liveData && connectionStatus === 'connecting' && (
        <Card className="card-hover transform transition-all duration-500 hover:scale-[1.01]
                        border-primary/20 bg-gradient-to-br from-background/95 to-background
                        shadow-xl shadow-primary/5">
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/10"></div>
                <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent 
                              rounded-full mx-auto shadow-lg"></div>
              </div>
              <div className="space-y-3">
                <p className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 
                             bg-clip-text text-transparent">
                  Connecting to F1 Live Timing...
                </p>
                <p className="text-sm text-muted-foreground/80">
                  Establishing secure connection to Formula 1 telemetry feed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasNoSession && (
        <Card className="card-hover border-orange-500/20 bg-orange-500/5">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-6">
              <AlertCircle className="w-16 h-16 text-orange-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold mb-2">No Live F1 Session</h2>
                <p className="text-muted-foreground mb-4">
                  There is currently no active Formula 1 session broadcasting live timing data.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Live timing is available during:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Practice Sessions</li>
                    <li>Qualifying Sessions</li>
                    <li>Sprint Sessions</li>
                    <li>Race Sessions</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={handleManualConnect}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                Retry Connection
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {connectionStatus === 'error' && (
        <Card className="card-hover border-red-500/20 bg-red-500/5">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-6">
              <WifiOff className="w-16 h-16 text-red-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
                <p className="text-muted-foreground mb-4">
                  Failed to connect to F1 Live Timing service. This might be due to network issues or CORS restrictions.
                </p>
                <p className="text-sm text-muted-foreground">
                  For development, consider using a CORS proxy or running the app with appropriate CORS configuration.
                </p>
              </div>
              <button
                onClick={handleManualConnect}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                Retry Connection
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {liveData && (
        <div className="space-y-6">
       

          {/* Session Info */}
          <Card className="overflow-hidden border border-primary/10 shadow-2xl 
                          bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md
                          transform transition-all duration-500 hover:shadow-primary/10 hover:border-primary/20">
            <div className="relative">
              {/* Top Section with Session Name and Type */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/10 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`absolute inset-0 ${
                      liveData.sessionInfo?.status === 'Started' 
                        ? 'animate-ping-slow bg-green-400/30' 
                        : liveData.sessionInfo?.status === 'Finished'
                        ? 'bg-red-400/30'
                        : 'bg-primary/30'
                    } rounded-full blur-sm`} />
                    <div className={`w-3 h-3 rounded-full ${
                      liveData.sessionInfo?.status === 'Started' 
                        ? 'bg-green-400 shadow-lg shadow-green-500/30' 
                        : liveData.sessionInfo?.status === 'Finished'
                        ? 'bg-red-400 shadow-lg shadow-red-500/30'
                        : 'bg-primary shadow-lg shadow-primary/30'
                    }`} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm uppercase tracking-wider font-medium text-primary">
                        {liveData.sessionInfo?.type}
                      </span>
                      <div className="h-4 w-px bg-border/20" />
                      <span className="text-base font-semibold text-foreground">
                        {liveData.sessionInfo?.name}
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${
                      liveData.sessionInfo?.status === 'Started'
                        ? 'text-green-400'
                        : liveData.sessionInfo?.status === 'Finished'
                        ? 'text-red-400'
                        : 'text-primary/80'
                    }`}>
                      {liveData.sessionInfo?.status}
                    </span>
                  </div>
                </div>

                {/* Right Side Info */}
                <div className="flex items-center gap-6">
                  {liveData.sessionInfo?.currentLap && liveData.sessionInfo?.totalLaps && (
                    <div className="flex items-center gap-2 bg-background/40 rounded-full px-4 py-1.5 border border-border/10 backdrop-blur-sm">
                      <Flag className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium tabular-nums">
                        Lap {liveData.sessionInfo.currentLap}/{liveData.sessionInfo.totalLaps}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-background/40 rounded-full px-4 py-1.5 border border-border/10 backdrop-blur-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium font-mono tabular-nums">
                      {/* <LiveTimer initialTime={liveData.sessionInfo?.timeRemaining} isRunning={liveData.sessionInfo?.status === 'Started'} /> */}
                      25:00
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Stats Bar */}
              {/* <div className="grid grid-cols-3 divide-x divide-border/10">
                <div className="px-6 py-3 bg-background/30">
                  <div className="flex items-center gap-3">
                    <Timer className="w-4 h-4 text-primary/70" />
                    <div>
                      <span className="text-xs uppercase tracking-wider text-primary/60 block">Session Type</span>
                      <span className="text-sm font-medium text-foreground/90">{liveData.sessionInfo?.type}</span>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 bg-background/30">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-primary/70" />
                    <div>
                      <span className="text-xs uppercase tracking-wider text-primary/60 block">Status</span>
                      <span className={`text-sm font-medium ${
                        liveData.sessionInfo?.status === 'Started'
                          ? 'text-green-400'
                          : liveData.sessionInfo?.status === 'Finished'
                          ? 'text-red-400'
                          : 'text-foreground/90'
                      }`}>
                        {liveData.sessionInfo?.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 bg-background/30">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-primary/70" />
                    <div>
                      <span className="text-xs uppercase tracking-wider text-primary/60 block">Track Status</span>
                      <span className="text-sm font-medium text-foreground/90">Active</span>
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </Card>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Live Timing (7/12) */}
            <div className="col-span-12 xl:col-span-7 ">

              {/* Live Timing Grid */}
              {liveData.positions && (
                <LiveTimingGrid positions={liveData.positions} />
              )}
            </div>

            {/* Right Column - Info & Updates (5/12) */}
            <div className="col-span-12 xl:col-span-5 space-y-6">
              {/* Weather, Race Control, and Team Radio Section */}
              <div className="space-y-3">
                {/* Weather Component */}
                {liveData.weather && (
                  <Card className="overflow-hidden border border-primary/10 shadow-xl py-0 
                                bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md
                                transform transition-all duration-500 hover:shadow-primary/10 hover:border-primary/20">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/10 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <Thermometer className="w-4 h-4 text-primary" />
                        <span className="text-xs uppercase tracking-wider font-medium text-primary/90">Track Conditions</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1">
                          <span className="text-xs font-medium tabular-nums text-primary">
                            {liveData.weather.temperature}°C Air
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1">
                          <span className="text-xs font-medium tabular-nums text-primary">
                            {liveData.weather.trackTemp}°C Track
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex divide-x divide-border/5">
                      <div className="flex-1 px-3 py-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider text-primary/60">Humidity</span>
                          <span className="text-[11px] font-medium text-foreground/80">{liveData.weather.humidity}%</span>
                        </div>
                      </div>
                      <div className="flex-1 px-3 py-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider text-primary/60">Wind</span>
                          <span className="text-[11px] font-medium text-foreground/80">{liveData.weather.windSpeed} km/h</span>
                        </div>
                      </div>
                      <div className="flex-1 px-3 py-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider text-primary/60">Conditions</span>
                          <span className="text-[11px] font-medium text-foreground/80">{liveData.weather.conditions}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Race Control Messages */}
                <Card className="overflow-hidden border border-primary/10 shadow-xl 
                                bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md
                                transform transition-all duration-500 hover:shadow-primary/10 hover:border-primary/20">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/10 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-primary" />
                      <span className="text-xs uppercase tracking-wider font-medium text-primary/90">Race Control</span>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/20" />
                      <span className="text-xs uppercase text-primary font-medium">Live Feed</span>
                    </div>
                  </div>
                  <ScrollArea className="h-[240px] px-1">
                    <div className="divide-y divide-border/10">
                      {liveData.raceControlMessages?.map((message, index) => (
                        <div key={index} className="px-3 py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] uppercase font-medium ${
                              message.severity === 'critical' ? 'text-red-400' :
                              message.severity === 'warning' ? 'text-yellow-400' :
                              'text-blue-400'
                            }`}>
                              {message.category}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{message.timestamp}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-foreground/80">{message.message}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>

                {/* Team Radio */}
                <Card className="overflow-hidden border border-primary/10 shadow-xl 
                                bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md
                                transform transition-all duration-500 hover:shadow-primary/10 hover:border-primary/20">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/10 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Radio className="w-4 h-4 text-primary" />
                      <span className="text-xs uppercase tracking-wider font-medium text-primary/90">Team Radio</span>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/20" />
                      <span className="text-xs uppercase text-primary font-medium">Live Feed</span>
                    </div>
                  </div>
                  <ScrollArea className="h-[300px] px-1">
                    <div className="divide-y divide-border/10">
                      {liveData.teamRadio?.map((radio, index) => (
                        <div key={index} className="px-3 py-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium text-primary/80">#{radio.driverNumber}</span>
                              <span className="text-[11px] font-medium text-foreground/80">{radio.driverNumber}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{radio.timestamp}</span>
                          </div>
                          {radio.path && (
                            <audio
                              controls
                              className="w-full h-[24px] [&::-webkit-media-controls-panel]:bg-primary/5 [&::-webkit-media-controls-current-time-display]:text-[11px] [&::-webkit-media-controls-time-remaining-display]:text-[11px] [&::-webkit-media-controls-timeline]:accent-primary [&::-webkit-media-controls-timeline]:h-[3px] rounded focus:outline-none"
                              src={`${f1Url}/static/${liveData.sessionInfo?.path}${radio.path}`}
                            >
                              Your browser does not support the audio element.
                            </audio>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              </div>
            </div>
          </div>
        </div>

  )}
  </div>
  )}
  