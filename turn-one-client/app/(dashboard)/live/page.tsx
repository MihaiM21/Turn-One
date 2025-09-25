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
  }>;
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

  const f1Service = getF1LiveDataService();

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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Live F1 Dashboard</h1>
          <p className="text-muted-foreground">Real-time Formula 1 telemetry and timing data</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Left Column - Session & Weather (1/4) */}
            <div className="space-y-6">
              {/* Session Info */}
              <Card className="card-hover glow-effect">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Session Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="secondary">{liveData.sessionInfo?.type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Session:</span>
                      <span className="font-medium text-sm">{liveData.sessionInfo?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="default">{liveData.sessionInfo?.status}</Badge>
                    </div>
                    {liveData.sessionInfo?.currentLap && liveData.sessionInfo?.totalLaps && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Progress:</span>
                        <span className="font-medium">
                          Lap {liveData.sessionInfo.currentLap}/{liveData.sessionInfo.totalLaps}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Weather Component */}
              {liveData.weather && (
                <LiveWeather weather={liveData.weather} />
              )}

              {/* Fastest Laps */}
              {liveData.fastestLaps && liveData.fastestLaps.length > 0 && (
                <Card className="card-hover">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Fastest Laps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {liveData.fastestLaps.slice(0, 3).map((fastestLap, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/20">
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
            </div>

            {/* Center Columns - Live Timing (2/4) */}
            <div className="xl:col-span-2">
              {liveData.positions && (
                <LiveTimingGrid positions={liveData.positions} />
              )}
            </div>

            {/* Right Column - Messages & Radio (1/4) */}
            <div className="space-y-6">
              {/* Race Control Messages */}
              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    Race Control
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[350px]">
                    <div className="space-y-3">
                      {liveData.raceControlMessages?.map((message, index) => (
                        <div 
                          key={index} 
                          className={`p-3 rounded-lg border ${getMessageSeverityColor(message.severity)}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                message.severity === 'critical' ? 'border-red-400 text-red-400' :
                                message.severity === 'warning' ? 'border-yellow-400 text-yellow-400' :
                                'border-blue-400 text-blue-400'
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
              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-primary" />
                    Team Radio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[350px]">
                    <div className="space-y-3">
                      {liveData.teamRadio?.map((radio, index) => (
                        <div key={index} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs px-1 h-5">
                                {radio.driverNumber}
                              </Badge>
                              <p className="font-medium text-sm truncate">{radio.driverName}</p>
                            </div>
                            <span className="text-xs font-mono text-muted-foreground">
                              {radio.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{radio.team}</p>
                          <p className="text-sm italic leading-relaxed">&ldquo;{radio.message}&rdquo;</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}