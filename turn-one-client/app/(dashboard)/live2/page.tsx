'use client';

import { useState, useEffect, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
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
  AlertCircle,
  Flag,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/live dashboard/dashboard-header';
import { ExploreMoreLinks } from '@/components/dashboard/explore-more-links';

export default function LiveDashboardV2() {
  const [liveData, setLiveData] = useState<MappedF1Data | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'error' | 'no-session'
  >('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const f1Url = 'https://livetiming.formula1.com';
  const f1Service = getF1LiveDataService();

  const handleF1Data: F1DataCallback = useCallback((rawData) => {
    try {
      const mapped = F1DataMapper.mapF1Data(rawData);
      setLiveData(mapped);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error mapping F1 data:', err);
    }
  }, []);

  const handleF1Status: F1StatusCallback = useCallback((status) => {
    setConnectionStatus(status);
  }, []);

  useEffect(() => {
    f1Service.onData(handleF1Data);
    f1Service.onStatus(handleF1Status);

    const existing = f1Service.getCurrentData();
    if (Object.keys(existing).length > 0) {
      try {
        const mapped = F1DataMapper.mapF1Data(existing);
        setLiveData(mapped);
        const ts = f1Service.getLastDataTimestamp();
        if (ts) setLastUpdate(new Date(ts));
      } catch {
        /* ignore stale */
      }
    }

    f1Service.connect();

    return () => {
      f1Service.removeDataCallback(handleF1Data);
      f1Service.removeStatusCallback(handleF1Status);
    };
  }, [f1Service, handleF1Data, handleF1Status]);

  const connect = () => f1Service.connect();
  const disconnect = () => {
    f1Service.disconnect();
    setConnectionStatus('disconnected');
  };
  const isConnected = connectionStatus === 'connected';

  const status = liveData?.sessionInfo?.status;
  const isStarted = status === 'Started';
  const flag = liveData?.trackStatus?.flagColor;

  const flagDotClass =
    flag === 'green' ? 'bg-green-500' :
    flag === 'yellow' ? 'bg-yellow-400' :
    flag === 'red' ? 'bg-red-500' :
    flag === 'blue' ? 'bg-blue-500' :
    'bg-zinc-600';

  const flagLabel =
    flag === 'green' ? 'Green Flag' :
    flag === 'yellow' ? 'Yellow Flag' :
    flag === 'red' ? 'Red Flag' :
    flag === 'blue' ? 'Blue Flag' :
    flag || 'Track Clear';

  const hasNoSession = !isConnected && !liveData;

  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader />

      <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-4">
        {/* Hero / status panel */}
        <section
          className={`relative overflow-hidden border border-zinc-800 bg-zinc-950 animate-in fade-in slide-in-from-bottom-2 duration-500 ${
            isStarted ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-primary'
          }`}
        >
          <div className="grid gap-0 lg:grid-cols-[1fr_auto] lg:items-stretch">
            <div className="px-6 py-5 space-y-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em]">
                <Flag className="h-3 w-3 text-primary" />
                {isStarted ? (
                  <span className="text-red-400 font-medium">● Live now</span>
                ) : status === 'Finished' ? (
                  <span className="text-zinc-500">Session ended</span>
                ) : (
                  <span className="text-zinc-500">Live timing</span>
                )}
                <span className="ml-auto inline-flex items-center gap-1.5 px-2 py-0.5 border border-primary/30 text-primary text-[10px] tracking-wider">
                  Experimental
                </span>
              </div>

              <h1 className="text-4xl font-black uppercase tracking-tight leading-none sm:text-5xl">
                {liveData?.sessionInfo?.name || 'Live Timing'}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                {liveData?.sessionInfo?.type && (
                  <span className="border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-300">
                    {liveData.sessionInfo.type}
                  </span>
                )}
                {status && (
                  <span
                    className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                      isStarted
                        ? 'border-green-500/40 text-green-400'
                        : status === 'Finished'
                        ? 'border-red-500/40 text-red-400'
                        : 'border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {status}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-300">
                  <span className={`inline-block h-2 w-2 ${flagDotClass}`} />
                  {flagLabel}
                </span>
                {liveData?.trackStatus?.message && (
                  <span className="text-[11px] text-zinc-500">{liveData.trackStatus.message}</span>
                )}
              </div>
            </div>

            {/* Right rail: lap counter / clock / connection */}
            <div className="border-t border-zinc-800 px-6 py-5 lg:border-l lg:border-t-0 lg:min-w-[360px] space-y-4">
              {liveData?.sessionInfo?.currentLap && liveData?.sessionInfo?.totalLaps ? (
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-zinc-500">Lap</p>
                  <div className="flex items-baseline gap-2 font-mono">
                    <span className="text-5xl font-black tabular-nums leading-none text-foreground">
                      {String(liveData.sessionInfo.currentLap).padStart(2, '0')}
                    </span>
                    <span className="text-2xl text-zinc-600">/ {liveData.sessionInfo.totalLaps}</span>
                  </div>
                  <div className="mt-3 h-1 bg-zinc-900">
                    <div
                      className="h-full bg-primary transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, Math.round((liveData.sessionInfo.currentLap / liveData.sessionInfo.totalLaps) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-zinc-500">Time Remaining</p>
                  <div className="font-mono text-5xl font-black tabular-nums leading-none text-foreground">
                    {liveData?.sessionInfo?.timeRemaining || '—:—'}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  {connectionStatus === 'connected' ? (
                    <Wifi className="h-3.5 w-3.5 text-green-500" />
                  ) : connectionStatus === 'connecting' ? (
                    <Activity className="h-3.5 w-3.5 text-yellow-500 animate-pulse" />
                  ) : connectionStatus === 'error' ? (
                    <WifiOff className="h-3.5 w-3.5 text-red-500" />
                  ) : (
                    <WifiOff className="h-3.5 w-3.5 text-zinc-600" />
                  )}
                  <span className="uppercase tracking-wider text-[10px]">
                    {connectionStatus === 'connected' ? 'Connected' :
                     connectionStatus === 'connecting' ? 'Connecting…' :
                     connectionStatus === 'error' ? 'Error' : 'Disconnected'}
                  </span>
                </div>
                {!isConnected && connectionStatus !== 'connecting' ? (
                  <button
                    onClick={() => connect()}
                    className="inline-flex items-center gap-1.5 border border-primary/40 px-2.5 py-1 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/10 transition"
                  >
                    <PlayCircle className="h-3 w-3" />
                    Connect
                  </button>
                ) : (
                  <button
                    onClick={() => disconnect()}
                    className="inline-flex items-center gap-1.5 border border-red-500/40 px-2.5 py-1 text-[10px] uppercase tracking-wider text-red-400 hover:bg-red-500/10 transition"
                  >
                    <StopCircle className="h-3 w-3" />
                    Disconnect
                  </button>
                )}
              </div>

              {lastUpdate && (
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                  <Clock className="h-3 w-3" />
                  Updated {lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Empty / connecting / error states */}
        {!liveData && connectionStatus === 'connecting' && (
          <section className="border border-zinc-800 bg-zinc-950 px-6 py-16 text-center">
            <div className="inline-block h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-5 text-sm uppercase tracking-[0.2em] text-zinc-400">Connecting to F1 Live Timing</p>
            <p className="mt-1 text-xs text-zinc-600">Establishing connection to telemetry feed</p>
          </section>
        )}

        {hasNoSession && connectionStatus !== 'connecting' && (
          <section className="border border-orange-500/30 bg-orange-500/5 px-6 py-12 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-orange-500" />
            <h2 className="mt-3 text-xl font-bold uppercase tracking-wider">No Live Session</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Live timing broadcasts during Practice, Qualifying, Sprint and Race sessions.
            </p>
            <button
              onClick={() => connect()}
              className="mt-5 inline-flex items-center gap-2 border border-primary/40 px-3 py-1.5 text-xs uppercase tracking-wider text-primary hover:bg-primary/10 transition"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Retry
            </button>
          </section>
        )}

        {connectionStatus === 'error' && (
          <section className="border border-red-500/30 bg-red-500/5 px-6 py-12 text-center">
            <WifiOff className="mx-auto h-10 w-10 text-red-500" />
            <h2 className="mt-3 text-xl font-bold uppercase tracking-wider">Connection Error</h2>
            <p className="mt-1 text-xs text-zinc-500">Failed to connect to F1 Live Timing.</p>
            <button
              onClick={() => connect()}
              className="mt-5 inline-flex items-center gap-2 border border-primary/40 px-3 py-1.5 text-xs uppercase tracking-wider text-primary hover:bg-primary/10 transition"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Retry
            </button>
          </section>
        )}

        {/* Live data layout */}
        {liveData && (
          <div className="grid grid-cols-12 gap-4">
            {/* Timing grid */}
            <section className="col-span-12 xl:col-span-8 border border-zinc-800 bg-zinc-950">
              {liveData.positions ? (
                <LiveTimingGrid positions={liveData.positions} className="border-0 bg-transparent" />
              ) : (
                <div className="px-6 py-16 text-center text-xs text-zinc-600 uppercase tracking-[0.3em]">
                  Awaiting timing data
                </div>
              )}
            </section>

            {/* Side rail */}
            <div className="col-span-12 xl:col-span-4 space-y-4">
              {/* Weather */}
              {liveData.weather && (
                <section className="border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-400">Track Conditions</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 capitalize">
                      {liveData.weather.conditions?.replace(/-/g, ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-zinc-800">
                    <div className="px-4 py-3">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-600">Air</p>
                      <p className="font-mono text-2xl font-black tabular-nums leading-none">
                        {liveData.weather.temperature}°<span className="text-sm text-zinc-500">C</span>
                      </p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-600">Track</p>
                      <p className="font-mono text-2xl font-black tabular-nums leading-none">
                        {liveData.weather.trackTemp}°<span className="text-sm text-zinc-500">C</span>
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-zinc-800 border-t border-zinc-800">
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-600">Humidity</span>
                      <span className="font-mono text-xs tabular-nums">{liveData.weather.humidity}%</span>
                    </div>
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-600">Wind</span>
                      <span className="font-mono text-xs tabular-nums">{liveData.weather.windSpeed} km/h</span>
                    </div>
                  </div>
                </section>
              )}

              {/* Race Control */}
              <section className="border border-zinc-800 bg-zinc-950">
                <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-400">Race Control</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-red-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    Live
                  </span>
                </div>
                <ScrollArea className="h-[260px]">
                  {liveData.raceControlMessages && liveData.raceControlMessages.length > 0 ? (
                    <ul className="divide-y divide-zinc-800">
                      {liveData.raceControlMessages.map((message, index) => {
                        const sev = message.severity;
                        const sevColor =
                          sev === 'critical' ? 'text-red-400 border-l-red-500' :
                          sev === 'warning' ? 'text-yellow-400 border-l-yellow-500' :
                          'text-blue-400 border-l-blue-500';
                        return (
                          <li key={index} className={`border-l-2 ${sevColor} px-3 py-2`}>
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className={`text-[10px] uppercase tracking-wider font-semibold ${sevColor.split(' ')[0]}`}>
                                {message.category}
                              </span>
                              <span className="text-[10px] tabular-nums text-zinc-600">{message.timestamp}</span>
                            </div>
                            <p className="text-[12px] leading-snug text-zinc-300">{message.message}</p>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="flex items-center justify-center py-10 text-[10px] uppercase tracking-[0.3em] text-zinc-700">
                      Awaiting messages
                    </div>
                  )}
                </ScrollArea>
              </section>

              {/* Team Radio */}
              <section className="border border-zinc-800 bg-zinc-950">
                <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Radio className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-400">Team Radio</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-red-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    Live
                  </span>
                </div>
                <ScrollArea className="h-[300px]">
                  {liveData.teamRadio && liveData.teamRadio.length > 0 ? (
                    <ul className="divide-y divide-zinc-800">
                      {liveData.teamRadio.map((radio, index) => {
                        const driver = liveData.positions?.find((p) => p.driverNumber === radio.driverNumber);
                        return (
                          <li key={index} className="px-3 py-2 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-baseline gap-2">
                                <span className="font-mono text-[10px] text-zinc-600">#{radio.driverNumber}</span>
                                <span className="text-xs font-bold uppercase tracking-wide">
                                  {driver?.driverName || `Driver ${radio.driverNumber}`}
                                </span>
                              </div>
                              <span className="text-[10px] tabular-nums text-zinc-600">{radio.timestamp}</span>
                            </div>
                            {radio.path && (
                              <audio
                                controls
                                className="w-full h-7"
                                src={`${f1Url}/static/${liveData.sessionInfo?.path}${radio.path}`}
                              >
                                Your browser does not support the audio element.
                              </audio>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="flex items-center justify-center py-10 text-[10px] uppercase tracking-[0.3em] text-zinc-700">
                      Awaiting radio
                    </div>
                  )}
                </ScrollArea>
              </section>
            </div>
          </div>
        )}

        <div className="pt-2">
          <Link
            href="/live"
            className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-[10px] uppercase tracking-[0.3em] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition"
          >
            ← Classic view
          </Link>
        </div>

        <ExploreMoreLinks currentPage="/live2" />
      </main>
    </div>
  );
}
