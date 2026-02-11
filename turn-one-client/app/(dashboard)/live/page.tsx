'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LiveTimingGrid } from '@/components/dashboard/live-timing-grid';
import { LiveWeather } from '@/components/dashboard/live-weather';
import { LiveSessionHeader } from '@/components/dashboard/live/live-session-header';
import { LiveRaceControl } from '@/components/dashboard/live/live-race-control';
import { LiveTeamRadio } from '@/components/dashboard/live/live-team-radio';
import { useF1LiveData } from '@/hooks/useF1LiveData';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Activity,
  Wifi,
  WifiOff,
  PlayCircle,
  StopCircle,
  AlertCircle,
  Construction
} from 'lucide-react';
import { DashboardHeader } from "@/components/dashboard/live dashboard/dashboard-header";

export default function LiveDashboard() {
  const { data: liveData, status: connectionStatus, connect, disconnect } = useF1LiveData();

  const isConnected = connectionStatus === 'connected';
  const hasNoSession = connectionStatus === 'no-session';
  const isConnecting = connectionStatus === 'connecting';
  const isError = connectionStatus === 'error';

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'no-session': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting': return <Activity className="w-4 h-4 text-yellow-500" />;
      case 'error': return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'no-session': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default: return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getConnectionLabel = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      case 'no-session': return 'No Live Session';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="flex flex-col min-h-screen mx-4">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-10">

        <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
          <Construction className="h-4 w-4" />
          <AlertTitle>Work in Progress</AlertTitle>
          <AlertDescription>
            This live dashboard is currently under active development. Data connection stability and features are still being improved.
          </AlertDescription>
        </Alert>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Badge variant="outline"
              className="px-5 py-2 bg-primary/10 backdrop-blur-md border-primary/30 
                       hover:bg-primary/15 transition-all duration-300 shadow-lg shadow-primary/5
                       flex items-center gap-3">
              <Activity className="w-4 h-4 text-primary animate-pulse" />
              <span className="font-medium tracking-wide">Live Timing</span>
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 p-2 rounded-lg bg-muted/20 border border-border/10">
            {/* Connection Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getConnectionIcon()}
                <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()} shadow-lg`}></div>
              </div>
              <Badge variant={isConnected ? "default" : "secondary"} className="capitalize">
                {getConnectionLabel()}
              </Badge>
            </div>

            {/* Connection Controls */}
            <div className="flex gap-2">
              {!isConnected && !isConnecting && (
                <button
                  onClick={connect}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors border border-primary/10"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  Connect Feed
                </button>
              )}

              {(isConnected || isConnecting) && (
                <button
                  onClick={disconnect}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/10"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading / No Session State */}
        {!liveData && (
          <div className="max-w-md mx-auto mt-20">
            {isConnecting && (
              <Card className="border-primary/20 bg-gradient-to-br from-background/95 to-background shadow-2xl relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer" />
                <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
                    <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full shadow-lg"></div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      Connecting to Live Feed...
                    </p>
                    <p className="text-sm text-muted-foreground/80 max-w-[200px] mx-auto">
                      Establishing secure connection to Formula 1 telemetry
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {hasNoSession && (
              <Card className="border-orange-500/20 bg-orange-500/5 shadow-2xl">
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
                  <div className="p-4 rounded-full bg-orange-500/10">
                    <AlertCircle className="w-12 h-12 text-orange-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold">No Live Session</h2>
                    <p className="text-muted-foreground text-sm max-w-[260px] mx-auto">
                      There is currently no active Formula 1 session broadcasting live timing data.
                    </p>
                  </div>
                  <button
                    onClick={connect}
                    className="flex items-center gap-2 px-5 py-2.5 bg-background border border-border hover:bg-muted/50 text-foreground rounded-lg transition-all shadow-sm"
                  >
                    <PlayCircle className="w-4 h-4 text-orange-500" />
                    Retry Connection
                  </button>
                </CardContent>
              </Card>
            )}

            {isError && (
              <Card className="border-red-500/20 bg-red-500/5 shadow-2xl">
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
                  <div className="p-4 rounded-full bg-red-500/10">
                    <WifiOff className="w-12 h-12 text-red-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold">Connection Error</h2>
                    <p className="text-muted-foreground text-sm max-w-[260px] mx-auto">
                      Failed to connect to F1 Live Timing. Check your network connection.
                    </p>
                  </div>
                  <button
                    onClick={connect}
                    className="flex items-center gap-2 px-5 py-2.5 bg-background border border-border hover:bg-muted/50 text-foreground rounded-lg transition-all shadow-sm"
                  >
                    <PlayCircle className="w-4 h-4 text-red-500" />
                    Retry Connection
                  </button>
                </CardContent>
              </Card>
            )}

            {/* Default State (Disconnected) */}
            {!isConnecting && !hasNoSession && !isError && (
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Click &quot;Connect Feed&quot; to start live timing.</p>
                <button
                  onClick={connect}
                  className="flex items-center gap-2 mx-auto px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20"
                >
                  <PlayCircle className="w-5 h-5" />
                  Start Live Dashboard
                </button>
              </div>
            )}
          </div>
        )}

        {/* Live Dashboard Grid */}
        {liveData && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Session Header */}
            {liveData.sessionInfo && (
              <LiveSessionHeader sessionInfo={liveData.sessionInfo} />
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-6">

              {/* Left Column: Timing Grid (7/12) */}
              <div className="col-span-12 xl:col-span-7 space-y-4">
                {liveData.positions && (
                  <LiveTimingGrid positions={liveData.positions} />
                )}
              </div>

              {/* Right Column: Widgets (5/12) */}
              <div className="col-span-12 xl:col-span-5 space-y-6">

                {/* Weather Widget */}
                {liveData.weather && (
                  <LiveWeather weather={liveData.weather} />
                )}

                {/* Race Control & Messages */}
                <div className="grid gap-6">
                  <LiveRaceControl messages={liveData.raceControlMessages} />
                  <LiveTeamRadio
                    radioMessages={liveData.teamRadio}
                    sessionPath={liveData.sessionInfo?.path}
                  />
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
