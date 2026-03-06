'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LiveTimingGrid } from '@/components/dashboard/live-timing-grid';
import { getF1LiveDataService, type F1DataCallback, type F1StatusCallback } from '@/lib/f1LiveDataService';
import { F1DataMapper, type MappedF1Data } from '@/lib/f1DataMapper';
import { 
  Clock, 
  Activity, 
  Thermometer, 
  Radio,
  AlertTriangle,
  Wifi,
  WifiOff,
  PlayCircle,
  StopCircle,
  AlertCircle
} from 'lucide-react';
import { DashboardHeader } from "@/components/dashboard/live dashboard/dashboard-header"
import { ExploreMoreLinks } from "@/components/dashboard/explore-more-links"
import { TrackMap } from '@/components/dashboard/track-map';
import { DashboardModuleGrid } from '@/components/dashboard/dashboard-module-grid';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';

const TEAM_COLORS: Record<string, string> = {
  'Mercedes':         '#00D2BE',
  'Red Bull Racing':  '#3671C6',
  'Red Bull':         '#3671C6',
  'Ferrari':          '#E8002D',
  'McLaren':          '#FF8000',
  'Alpine':           '#FF87BC',
  'AlphaTauri':       '#64C4FF',
  'RB':               '#6692FF',
  'Aston Martin':     '#229971',
  'Williams':         '#64ACFF',
  'Alfa Romeo':       '#B12039',
  'Haas':             '#B6BABD',
  'Kick Sauber':      '#52E252',
  'Sauber':           '#52E252',
};

const getTeamColor = (team?: string): string =>
  (team && TEAM_COLORS[team]) || '#6b7280';
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

  const {
    modules,
    editMode,
    setEditMode,
    toggleVisible,
    moveToColumn,
    moveUp,
    moveDown,
    reset,
  } = useDashboardLayout();

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
    
    // Don't clear liveData on transient disconnects/no-session —
    // keep showing last data until new data arrives.
    // Only clear on explicit manual disconnect (handled in handleDisconnect).
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    f1Service.onData(handleF1Data);
    f1Service.onStatus(handleF1Status);

    // Hydrate from existing data (localStorage / prior connection) so UI isn't blank
    const existingData = f1Service.getCurrentData();
    if (Object.keys(existingData).length > 0) {
      try {
        const mapped = F1DataMapper.mapF1Data(existingData);
        setLiveData(mapped);
        const ts = f1Service.getLastDataTimestamp();
        if (ts) setLastUpdate(new Date(ts));
      } catch { /* ignore stale data errors */ }
    }

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
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
      <div className="container mx-auto px-4 py-8 lg:px-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* F1 red accent stripe */}
            <div className="flex flex-col gap-0.5 mt-1 shrink-0">
              <div className="w-1 h-3.5 rounded-full bg-red-600" />
              <div className="w-1 h-3.5 rounded-full bg-red-500" />
              <div className="w-1 h-3.5 rounded-full bg-red-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-red-500">Formula 1</span>
                {liveData?.sessionInfo?.type && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border border-border/40 bg-muted/50 text-muted-foreground tracking-wider">
                    {liveData.sessionInfo.type}
                  </span>
                )}
                {isConnected && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                    LIVE
                  </span>
                )}
                {liveData?.trackStatus?.flagColor && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`inline-block w-3 h-3 rounded-sm ${
                      liveData.trackStatus.flagColor === 'green' ? 'bg-green-500' :
                      liveData.trackStatus.flagColor === 'yellow' ? 'bg-yellow-400' :
                      liveData.trackStatus.flagColor === 'red' ? 'bg-red-500' : 'bg-gray-500'
                    }`} />
                    {liveData.trackStatus.message || liveData.trackStatus.flagColor}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black tracking-tight leading-none">
                {liveData?.sessionInfo?.name || 'Live Timing'}
              </h1>
              {liveData?.sessionInfo && (
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm">
                  <span className={`font-semibold ${
                    liveData.sessionInfo.status === 'Started' ? 'text-green-400' :
                    liveData.sessionInfo.status === 'Finished' ? 'text-red-400' :
                    'text-muted-foreground'
                  }`}>
                    {liveData.sessionInfo.status}
                  </span>
                  {liveData.sessionInfo.currentLap && liveData.sessionInfo.totalLaps && (
                    <>
                      <span className="text-border/60">·</span>
                      <span className="font-mono text-muted-foreground">
                        Lap <span className="text-foreground font-bold tabular-nums">{liveData.sessionInfo.currentLap}</span>
                        <span className="text-muted-foreground">/{liveData.sessionInfo.totalLaps}</span>
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/40 bg-muted/30 text-sm">
              {getConnectionIcon()}
              <span className="font-medium">{getConnectionLabel()}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${getConnectionStatusColor()}`} />
            </div>
            {!isConnected && connectionStatus !== 'connecting' && (
              <button
                onClick={handleManualConnect}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                Connect
              </button>
            )}
            {(isConnected || connectionStatus === 'connecting') && (
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
              >
                <StopCircle className="w-4 h-4" />
                Disconnect
              </button>
            )}
            {lastUpdate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Updated {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

      {!liveData && connectionStatus === 'connecting' && (
        <Card className="border border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
              <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">Connecting to F1 Live Timing...</p>
              <p className="text-sm text-muted-foreground">Establishing connection to Formula 1 telemetry feed</p>
            </div>
          </CardContent>
        </Card>
      )}

      {hasNoSession && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">No Live F1 Session</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                There is currently no active Formula 1 session broadcasting live timing data.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['Practice', 'Qualifying', 'Sprint', 'Race'].map(type => (
                <div key={type} className="px-4 py-2 rounded-lg border border-border/40 bg-muted/30 text-sm text-center text-muted-foreground">
                  {type}
                </div>
              ))}
            </div>
            <button
              onClick={handleManualConnect}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <PlayCircle className="w-4 h-4" />
              Retry Connection
            </button>
          </CardContent>
        </Card>
      )}

      {connectionStatus === 'error' && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <WifiOff className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Connection Error</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Failed to connect to F1 Live Timing. This may be due to network issues or CORS restrictions.
              </p>
            </div>
            <button
              onClick={handleManualConnect}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <PlayCircle className="w-4 h-4" />
              Retry Connection
            </button>
          </CardContent>
        </Card>
      )}

      {liveData && (
        <div className="space-y-6">
       

          {/* Race Status Bar */}
          {(liveData.trackStatus || liveData.sessionInfo?.currentLap) && (
            <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 rounded-xl border ${
              liveData.trackStatus?.flagColor === 'red'    ? 'border-red-500/30 bg-red-500/5' :
              liveData.trackStatus?.flagColor === 'yellow' ? 'border-yellow-400/30 bg-yellow-400/5' :
              'border-border/40 bg-card/60'
            }`}>
              {/* Flag indicator */}
              {liveData.trackStatus?.flagColor && (
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-sm ${
                    liveData.trackStatus.flagColor === 'green'  ? 'bg-green-500' :
                    liveData.trackStatus.flagColor === 'yellow' ? 'bg-yellow-400' :
                    liveData.trackStatus.flagColor === 'red'    ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-sm font-bold uppercase tracking-wide">
                    {liveData.trackStatus.flagColor === 'green'  ? 'Green Flag' :
                     liveData.trackStatus.flagColor === 'yellow' ? 'Yellow Flag' :
                     liveData.trackStatus.flagColor === 'red'    ? 'Red Flag' :
                     liveData.trackStatus.flagColor}
                  </span>
                </div>
              )}
              {/* Lap counter + progress bar */}
              {liveData.sessionInfo?.currentLap && liveData.sessionInfo?.totalLaps && (
                <>
                  {liveData.trackStatus?.flagColor && <div className="w-px h-5 bg-border/40 hidden sm:block" />}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Lap</span>
                    <span className="text-xl font-black tabular-nums">{liveData.sessionInfo.currentLap}</span>
                    <span className="text-sm text-muted-foreground">/ {liveData.sessionInfo.totalLaps}</span>
                  </div>
                  <div className="flex-1 min-w-[100px] h-1.5 bg-muted/50 rounded-full overflow-hidden hidden sm:block">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${Math.round((liveData.sessionInfo.currentLap / liveData.sessionInfo.totalLaps) * 100)}%` }}
                    />
                  </div>
                </>
              )}
              {/* Track status message */}
              {liveData.trackStatus?.message && (
                <>
                  <div className="w-px h-5 bg-border/40 hidden sm:block" />
                  <span className="text-sm text-muted-foreground">{liveData.trackStatus.message}</span>
                </>
              )}
            </div>
          )}

          {/* Modular Dashboard Grid */}
          <DashboardModuleGrid
            modules={modules}
            editMode={editMode}
            setEditMode={setEditMode}
            toggleVisible={toggleVisible}
            moveToColumn={moveToColumn}
            moveUp={moveUp}
            moveDown={moveDown}
            reset={reset}
            slots={[
              {
                id: 'timing-grid',
                content: liveData.positions ? (
                  <LiveTimingGrid positions={liveData.positions} />
                ) : null,
              },
              {
                id: 'track-map',
                content: liveData.positions ? (
                  <TrackMap
                    drivers={liveData.positions}
                    sessionLocation={liveData.sessionInfo?.location}
                    sessionYear={liveData.sessionInfo?.year}
                  />
                ) : null,
              },
              {
                id: 'weather',
                content: liveData.weather ? (
                  <Card className="overflow-hidden border border-border/40">
                    <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">Track Conditions</span>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Air Temp</p>
                        <p className="text-2xl font-bold tabular-nums">{liveData.weather.temperature}°C</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Track Temp</p>
                        <p className="text-2xl font-bold tabular-nums">{liveData.weather.trackTemp}°C</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Humidity</p>
                        <p className="text-lg font-semibold tabular-nums">{liveData.weather.humidity}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Wind</p>
                        <p className="text-lg font-semibold tabular-nums">{liveData.weather.windSpeed} km/h</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Conditions</p>
                        <p className="text-sm font-semibold capitalize">{liveData.weather.conditions?.replace(/-/g, ' ')}</p>
                      </div>
                    </div>
                  </Card>
                ) : null,
              },
              {
                id: 'race-control',
                content: (
                  <Card className="overflow-hidden border border-border/40">
                    <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">Race Control</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs text-muted-foreground">Live</span>
                      </div>
                    </div>
                    <ScrollArea className="h-[280px]">
                      {liveData.raceControlMessages && liveData.raceControlMessages.length > 0 ? (
                        <div className="divide-y divide-border/20">
                          {liveData.raceControlMessages.map((message, index) => {
                            const severityColor =
                              message.severity === 'critical' ? '#ef4444' :
                              message.severity === 'warning'  ? '#eab308' : '#3b82f6';
                            const severityBg =
                              message.severity === 'critical' ? 'rgba(239,68,68,0.05)' :
                              message.severity === 'warning'  ? 'rgba(234,179,8,0.05)' : 'transparent';
                            const flagLabel = (message as any).flag as string | undefined;
                            const flagColor =
                              flagLabel === 'RED'    ? '#ef4444' :
                              flagLabel === 'YELLOW' ? '#eab308' :
                              flagLabel === 'GREEN'  ? '#22c55e' :
                              flagLabel === 'BLUE'   ? '#3b82f6' : null;
                            return (
                              <div key={index} className="flex gap-0" style={{ backgroundColor: severityBg }}>
                                <div className="w-0.5 shrink-0 rounded-l" style={{ backgroundColor: severityColor }} />
                                <div className="flex-1 px-3 py-2.5">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-1.5">
                                      {flagLabel && flagColor && (
                                        <span
                                          className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                                          style={{ backgroundColor: flagColor, color: flagColor === '#eab308' ? '#000' : '#fff' }}
                                        >
                                          {flagLabel}
                                        </span>
                                      )}
                                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: severityColor }}>
                                        {message.category}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{message.timestamp}</span>
                                  </div>
                                  <p className="text-sm text-foreground/85 leading-relaxed">{message.message}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                          No messages yet
                        </div>
                      )}
                    </ScrollArea>
                  </Card>
                ),
              },
              {
                id: 'team-radio',
                content: (
                  <Card className="overflow-hidden border border-border/40">
                    <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">Team Radio</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs text-muted-foreground">Live</span>
                      </div>
                    </div>
                    <ScrollArea className="h-[320px]">
                      {liveData.teamRadio && liveData.teamRadio.length > 0 ? (
                        <div className="divide-y divide-border/20">
                          {liveData.teamRadio.map((radio, index) => {
                            const radioDriver = liveData.positions?.find(p => p.driverNumber === radio.driverNumber);
                            const radioTeamColor = getTeamColor(radioDriver?.team);
                            return (
                              <div key={index} className="flex gap-0">
                                <div className="w-1 shrink-0 rounded-l" style={{ backgroundColor: radioTeamColor }} />
                                <div className="flex-1 px-3 py-2.5 space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <span className="text-sm font-bold">
                                        {radioDriver?.driverName || `#${radio.driverNumber}`}
                                      </span>
                                      {radioDriver?.team && (
                                        <span className="ml-2 text-xs font-medium" style={{ color: radioTeamColor }}>
                                          {radioDriver.team}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{radio.timestamp}</span>
                                  </div>
                                  {radio.path && (
                                    <audio
                                      controls
                                      className="w-full h-8 rounded-lg"
                                      src={`${f1Url}/static/${liveData.sessionInfo?.path}${radio.path}`}
                                    >
                                      Your browser does not support the audio element.
                                    </audio>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                          No radio messages yet
                        </div>
                      )}
                    </ScrollArea>
                  </Card>
                ),
              },
            ]}
          />
        </div>
      )}

        <ExploreMoreLinks currentPage="/live" />
      </div>
    </div>
  )}