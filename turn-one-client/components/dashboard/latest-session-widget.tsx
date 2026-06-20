"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionDashboardData } from "@/types/news-types";
import { getLatestSessionDataClient } from "@/lib/newsService";
import { Trophy, Gauge, Zap, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";

type LatestSessionWidgetProps = {
  previewData?: SessionDashboardData;
};

export function LatestSessionWidget({ previewData }: LatestSessionWidgetProps = {}) {
  const [sessionData, setSessionData] = useState<SessionDashboardData | null>(previewData ?? null);
  const [loading, setLoading] = useState(!previewData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (previewData) return;
    async function fetchData() {
      try {
        setLoading(true);
        const data = await getLatestSessionDataClient();
        setSessionData(data);
        setError(null);
      } catch (err) {
        setError("Failed to load session data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [previewData]);

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case "qualifying": return "border-yellow-500/40 text-yellow-400";
      case "race": return "border-red-500/40 text-red-400";
      default: return "border-blue-500/40 text-blue-400";
    }
  };

  if (loading) {
    return (
      <div className="border border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-24 bg-zinc-800" />
            <Skeleton className="h-4 w-40 bg-zinc-800" />
          </div>
        </div>
        <div className="divide-y divide-zinc-800/60">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <Skeleton className="h-4 w-4 bg-zinc-800" />
              <Skeleton className="h-3 w-20 bg-zinc-800" />
              <Skeleton className="ml-auto h-3 w-24 bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !sessionData) return null;

  return (
    <div className="h-full border border-zinc-800 bg-zinc-950 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Latest session</p>
          <p className="mt-0.5 font-bold">Performance Highlights</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`rounded-none px-2 py-0.5 text-[10px] uppercase tracking-wider ${getSessionTypeColor(sessionData.session_type)}`}
          >
            {sessionData.session_name}
          </Badge>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Calendar className="h-3 w-3" />
            <span className="font-mono">{sessionData.year}</span>
            <span className="text-zinc-700">·</span>
            <span>R{sessionData.round}</span>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-7 rounded-sm px-2 text-xs text-zinc-400 hover:text-primary">
            <Link href="/news">
              View <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="divide-y divide-zinc-800/60">
        {sessionData.qualifying_results && sessionData.qualifying_results.length > 0 && (
          <div className="flex items-center gap-3 px-5 py-3">
            <Trophy className="h-4 w-4 shrink-0 text-yellow-500/70" />
            <span className="w-24 shrink-0 text-[11px] uppercase tracking-wider text-zinc-500">Top qualifier</span>
            <span className="truncate text-sm font-medium" style={{ color: sessionData.qualifying_results[0].Color }}>
              {sessionData.qualifying_results[0].Driver}
            </span>
            <span className="ml-auto font-mono text-sm tabular-nums text-foreground">
              {sessionData.qualifying_results[0].LapTime}
            </span>
          </div>
        )}

        {sessionData.top_speed && sessionData.top_speed.length > 0 && (
          <div className="flex items-center gap-3 px-5 py-3">
            <Gauge className="h-4 w-4 shrink-0 text-blue-500/70" />
            <span className="w-24 shrink-0 text-[11px] uppercase tracking-wider text-zinc-500">Top speed</span>
            <span className="truncate text-sm font-medium" style={{ color: sessionData.top_speed[0].Color }}>
              {sessionData.top_speed[0].Team}
            </span>
            <span className="ml-auto font-mono text-sm tabular-nums text-foreground">
              {sessionData.top_speed[0]["Top Speed (km/h)"]} km/h
            </span>
          </div>
        )}

        {sessionData.throttle_comparison && sessionData.throttle_comparison.length > 0 && (
          <div className="flex items-center gap-3 px-5 py-3">
            <Zap className="h-4 w-4 shrink-0 text-green-500/70" />
            <span className="w-24 shrink-0 text-[11px] uppercase tracking-wider text-zinc-500">Avg throttle</span>
            <span className="truncate text-sm font-medium" style={{ color: sessionData.throttle_comparison[0].Color }}>
              {sessionData.throttle_comparison[0].Driver}
            </span>
            <span className="ml-auto font-mono text-sm tabular-nums text-foreground">
              {sessionData.throttle_comparison[0]["Average Throttle (%)"].toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
