'use client';

import { Skeleton } from "@/components/ui/skeleton"
import { Database, CalendarDays, TrendingUp, Activity } from "lucide-react"
import { fetchAPIDailyStats, fetchAPITotalStats } from "@/lib/dataAcquisition"
import { useState, useEffect } from "react"

interface TotalStats { total_sessions: number }
interface DailyStats { date: string; total_sessions: number }

export function TelemetryOverview() {
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [totalStats, setTotalStats] = useState<TotalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [daily, total] = await Promise.all([fetchAPIDailyStats(), fetchAPITotalStats()]);
        setDailyStats(daily);
        setTotalStats(total);
        setOnline(true);
      } catch {
        setOnline(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const todayShare =
    dailyStats && totalStats && totalStats.total_sessions > 0
      ? ((dailyStats.total_sessions / totalStats.total_sessions) * 100).toFixed(1)
      : null;

  return (
    <div className="border border-zinc-800 bg-zinc-950 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 divide-x divide-y divide-zinc-800 lg:grid-cols-4 lg:divide-y-0">

        <div className="flex items-center gap-4 px-5 py-4">
          <Database className="h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Total Sessions</p>
            {loading ? (
              <Skeleton className="mt-0.5 h-7 w-16 bg-zinc-800" />
            ) : (
              <p className="font-mono text-2xl font-black tabular-nums">{totalStats?.total_sessions ?? '—'}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 px-5 py-4">
          <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Sessions Today</p>
            {loading ? (
              <Skeleton className="mt-0.5 h-7 w-10 bg-zinc-800" />
            ) : (
              <p className="font-mono text-2xl font-black tabular-nums">{dailyStats?.total_sessions ?? '—'}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 px-5 py-4">
          <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Today's Share</p>
            {loading ? (
              <Skeleton className="mt-0.5 h-7 w-14 bg-zinc-800" />
            ) : (
              <p className="font-mono text-2xl font-black tabular-nums">
                {todayShare !== null ? `${todayShare}%` : '—'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 px-5 py-4">
          <Activity className={`h-4 w-4 shrink-0 ${!loading && online ? 'text-green-500' : !loading ? 'text-red-500' : 'text-zinc-600'}`} />
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">API Status</p>
            {loading ? (
              <Skeleton className="mt-0.5 h-7 w-16 bg-zinc-800" />
            ) : (
              <p className={`font-mono text-2xl font-black ${online ? 'text-green-400' : 'text-red-400'}`}>
                {online ? 'Online' : 'Offline'}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
