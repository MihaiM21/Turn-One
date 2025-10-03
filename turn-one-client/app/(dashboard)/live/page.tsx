'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LiveTimingGrid } from '@/components/dashboard/live-timing-grid';
import { LiveWeather } from '@/components/dashboard/live-weather';
import { getF1LiveDataService, type F1DataCallback, type F1StatusCallback } from '@/lib/f1LiveDataService';
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
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error' | 'no-session'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isManuallyConnected, setIsManuallyConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const f1Service = getF1LiveDataService();
  const f1Url = "https://livetiming.formula1.com";

  // Data callback
  const handleF1Data: F1DataCallback = useCallback((rawData) => {
    try {
      const mappedData = F1DataMapper.mapF1Data(rawData);
      setLiveData(mappedData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error mapping F1 data:', error);
    }
  }, []);

  // Status callback
  const handleF1Status: F1StatusCallback = useCallback((status) => {
    setConnectionStatus(status);
    
    if (status === 'no-session' || status === 'disconnected') {
      setLiveData(null);
      setLastUpdate(null);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    f1Service.onData(handleF1Data);
    f1Service.onStatus(handleF1Status);

    // Auto-connect to check for live sessions
    f1Service.connect();

    // Cleanup
    return () => {
      f1Service.removeDataCallback(handleF1Data);
      f1Service.removeStatusCallback(handleF1Status);
    };
  }, [f1Service, handleF1Data, handleF1Status]);

  const handleManualConnect = () => {
    setIsManuallyConnected(true);
    f1Service.connect();
  };

  const handleDisconnect = () => {
    setIsManuallyConnected(false);
    f1Service.disconnect();
    setConnectionStatus('disconnected');
    setLiveData(null);
    setLastUpdate(null);
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
      case 'no-session':
        return 'bg-orange-500';
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
      case 'no-session':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
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
      case 'no-session':
        return 'No Live Session';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };

  const isConnected = connectionStatus === 'connected';
  const hasNoSession = connectionStatus === 'no-session';

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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background/98 to-background">
      <DashboardHeader />
      <div className="flex-1 container mx-auto px-4 py-6 lg:px-6 lg:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-4 py-1.5 bg-primary/5 backdrop-blur-sm border-primary/20 hover:bg-primary/10 transition-colors">
              <Activity className="w-4 h-4 mr-2 text-primary" />
              Live Timing
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
        <Card className="card-hover">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="animate-spin w-12 h-12 border-3 border-primary border-t-transparent rounded-full mx-auto"></div>
              <div>
                <p className="text-lg font-medium">Connecting to F1 Live Timing...</p>
                <p className="text-sm text-muted-foreground">Establishing connection to Formula 1 telemetry feed</p>
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
          {/* Quick Stats Bar */}
          {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="card-hover glow-effect">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Session</p>
                  <p className="font-bold text-primary">{liveData.sessionInfo?.name}</p>
                </div>
                <Timer className="w-8 h-8 text-primary/50" />
              </CardContent>
            </Card>
            
            <Card className="card-hover glow-effect">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Time Left</p>
                  <p className="font-bold font-mono text-primary">{liveData.sessionInfo?.timeRemaining}</p>
                </div>
                <Clock className="w-8 h-8 text-primary/50" />
              </CardContent>
            </Card>
            
            <Card className="card-hover glow-effect">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Track Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getFlagColor(liveData.trackStatus?.flagColor || 'gray')}`}></div>
                    <p className="font-bold">{liveData.trackStatus?.status}</p>
                  </div>
                </div>
                <Flag className="w-8 h-8 text-primary/50" />
              </CardContent>
            </Card>
            
            <Card className="card-hover glow-effect">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Track Temp</p>
                  <p className="font-bold text-primary">{liveData.weather?.trackTemp}°C</p>
                </div>
                <Thermometer className="w-8 h-8 text-primary/50" />
              </CardContent>
            </Card>
          </div> */}

          {/* Session Info */}
          <Card className="overflow-hidden border-none shadow-lg shadow-primary/5 backdrop-blur-sm py-0">
            <div className="bg-gradient-to-br from-primary/10 via-background/50 to-background">
              <CardHeader className="border-b border-border/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 transition-colors border-none text-primary">
                      {liveData.sessionInfo?.type}
                    </Badge>
                    <span className="font-medium text-sm text-foreground/90">
                      {liveData.sessionInfo?.name}
                    </span>
                  </div>
                  {liveData.sessionInfo?.currentLap && liveData.sessionInfo?.totalLaps && (
                    <div className="flex items-center gap-1">
                      <Badge variant="default" className="px-3 py-1.5 bg-primary/10 text-primary border-none">
                        {liveData.sessionInfo?.status}
                      </Badge>
                      <span className="font-medium text-sm flex items-center gap-2 text-foreground/90">
                        <Flag className="w-4 h-4 text-primary" />
                        Lap {liveData.sessionInfo.currentLap}/{liveData.sessionInfo.totalLaps}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="py-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-primary/80 uppercase tracking-wider">Details</span>
                    <div className="flex items-center gap-2 group">
                      <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Timer className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground/90">{liveData.sessionInfo?.type}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-primary/80 uppercase tracking-wider">Status</span>
                    <div className="flex items-center gap-2 group">
                      <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Activity className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground/90">{liveData.sessionInfo?.status}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-primary/80 uppercase tracking-wider">Remaining</span>
                    <div className="flex items-center gap-2 group">
                      <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium font-mono text-foreground/90">{liveData.sessionInfo?.timeRemaining}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Live Timing (7/12) */}
            <div className="col-span-12 xl:col-span-7">

              {/* Live Timing Grid */}
              {liveData.positions && (
                <LiveTimingGrid positions={liveData.positions} />
              )}
            </div>

            {/* Right Column - Info & Updates (5/12) */}
            <div className="col-span-12 xl:col-span-5 space-y-6">
              {/* Weather Component */}
              {liveData.weather && (
                <LiveWeather weather={liveData.weather} />
              )}

              {/* Fastest Laps */}
              {liveData.fastestLaps && liveData.fastestLaps.length > 0 && (
                <Card className="card-hover bg-gradient-to-br from-background to-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Fastest Laps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {liveData.fastestLaps.slice(0, 3).map((fastestLap, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/10 border border-border/50">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="w-6 h-6 text-xs p-0 flex items-center justify-center">
                              {fastestLap.position}
                            </Badge>
                            <span className="text-sm font-medium">{fastestLap.driverName}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono text-green-400">{fastestLap.lapTime}</p>
                            <p className="text-xs text-muted-foreground">Lap {fastestLap.lap}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Updates Column */}
              <div className="space-y-6">
              {/* Race Control Messages */}
              <Card className="overflow-hidden border-none shadow-lg shadow-primary/5 py-0">
                <div className="bg-gradient-to-br from-primary/10 via-background/50 to-background border-b border-primary/10">
                  <CardHeader className="pb-3 pt-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <AlertTriangle className="w-5 h-5 text-primary" />
                        </div>
                        Race Control
                      </CardTitle>
                      <Badge variant="outline" className="text-xs px-2.5 py-0.5 bg-primary/5 border-primary/20 text-primary">Messages</Badge>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="p-5">
                  <ScrollArea className="h-[280px] pr-4">
                    <div className="space-y-3">
                      {liveData.raceControlMessages?.map((message, index) => (
                        <div 
                          key={index} 
                          className={`p-4 rounded-md border backdrop-blur-sm transition-colors ${getMessageSeverityColor(message.severity)}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs px-2.5 py-0.5 ${
                                message.severity === 'critical' ? 'border-red-400 text-red-400 bg-red-500/5' :
                                message.severity === 'warning' ? 'border-yellow-400 text-yellow-400 bg-yellow-500/5' :
                                'border-blue-400 text-blue-400 bg-blue-500/5'
                              }`}
                            >
                              {message.category}
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground">
                              {message.timestamp}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{message.message}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Team Radio */}
              <Card className="overflow-hidden border-none shadow-lg shadow-primary/5 py-0">
                <div className="bg-gradient-to-br from-primary/10 via-background/50 to-background border-b border-primary/10">
                  <CardHeader className="pb-3 pt-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <Radio className="w-5 h-5 text-primary" />
                        </div>
                        Team Radio
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/30" />
                        <Badge variant="outline" className="text-xs px-2.5 py-0.5 bg-primary/5 border-primary/20 text-primary">Live</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                <CardContent className="p-4">
                  <ScrollArea className="h-[320px] pr-4">
                    <div className="space-y-3">
                      {liveData.teamRadio?.map((radio, index) => (
                        <div
                          key={index}
                          className="group p-4 rounded-md bg-gradient-to-br from-muted/10 to-background/80 border border-border/50 hover:border-border hover:from-muted/20 transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge variant="default" className="px-2.5 py-1 font-semibold tracking-wide bg-primary/20 text-primary border-none">
                                {radio.driverNumber}
                              </Badge>
                              <span className="font-medium text-sm truncate max-w-[150px] text-foreground/90">
                                {`Driver ${radio.driverNumber}`}
                              </span>
                            </div>
                            <span className="text-xs font-mono text-muted-foreground">
                              {radio.timestamp}
                            </span>
                          </div>
                          {/* Minimalist audio player */}
                          {radio.path && (
                            <div className="flex items-center gap-2">
                              <audio
                                controls
                                className="w-full h-8 [&::-webkit-media-controls-panel]:bg-muted/80 [&::-webkit-media-controls-current-time-display]:text-foreground [&::-webkit-media-controls-time-remaining-display]:text-foreground [&::-webkit-media-controls-timeline]:accent-primary [&::-webkit-media-controls-play-button]:text-foreground [&::-webkit-media-controls-timeline]:hover:accent-primary/80 rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 group-hover:[&::-webkit-media-controls-panel]:bg-muted transition-all"
                                src={`${f1Url}/static/${liveData.sessionInfo?.path}${radio.path}`}
                                style={{ minHeight: 32 }}
                              >
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
    </div>
  )}
  </div>
  )}
