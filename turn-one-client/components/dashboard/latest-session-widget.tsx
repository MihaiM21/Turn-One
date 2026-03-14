"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionDashboardData } from "@/types/news-types";
import { getLatestSessionDataClient } from "@/lib/newsService";
import { Trophy, Gauge, Zap, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";

export function LatestSessionWidget() {
  const [sessionData, setSessionData] = useState<SessionDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case "qualifying":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "race":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  if (loading) {
    return (
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardHeader className="pb-1.5 pt-4">
          <Skeleton className="h-4 w-28 bg-muted/20" />
          <Skeleton className="h-3 w-48 bg-muted/20" />
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-full bg-muted/20" />
            <Skeleton className="h-3.5 w-full bg-muted/20" />
            <Skeleton className="h-3.5 w-3/4 bg-muted/20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !sessionData) {
    return null; // Don't show widget if there's an error
  }

  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-sm transition-all duration-300 hover:border-primary/30">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="mb-0.5 text-base font-semibold">Latest Session</CardTitle>
            <CardDescription className="text-xs">Performance highlights</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 px-2 py-0 text-[10px] uppercase text-primary">
              New
            </Badge>
            <Button asChild variant="outline" size="sm" className="h-7 px-2.5 text-xs hover:border-primary/30 hover:bg-primary/10">
              <Link href="/news">
                View
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {/* Session Info */}
        <div className="flex items-center gap-2 border-b border-border/30 pb-1">
          <Badge variant="outline" className={`${getSessionTypeColor(sessionData.session_type)} px-2 py-0.5 text-[11px] font-medium`}>
            {sessionData.session_name}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-2.5 w-2.5" />
            <span className="font-mono">{sessionData.year}</span>
            <span>•</span>
            <span>R{sessionData.round}</span>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {sessionData.qualifying_results && sessionData.qualifying_results.length > 0 && (
            <div className="rounded-md border border-border/40 bg-background/40 px-2 py-1.5 text-sm">
              <div className="flex items-center gap-1.5 min-w-0">
                <Trophy className="h-3.5 w-3.5 flex-shrink-0 text-yellow-500/70" />
                <span className="truncate font-medium" style={{ color: sessionData.qualifying_results[0].Color }}>
                  {sessionData.qualifying_results[0].Driver}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Lap
                <span className="ml-1 font-mono text-foreground">
                  {sessionData.qualifying_results[0].LapTime}
                </span>
              </div>
            </div>
          )}

          {sessionData.top_speed && sessionData.top_speed.length > 0 && (
            <div className="rounded-md border border-border/40 bg-background/40 px-2 py-1.5 text-sm">
              <div className="flex items-center gap-1.5 min-w-0">
                <Gauge className="h-3.5 w-3.5 flex-shrink-0 text-blue-500/70" />
                <span className="truncate font-medium" style={{ color: sessionData.top_speed[0].Color }}>
                  {sessionData.top_speed[0].Team}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Top speed
                <span className="ml-1 font-mono text-foreground">
                  {sessionData.top_speed[0]["Top Speed (km/h)"]} km/h
                </span>
              </div>
            </div>
          )}

          {sessionData.throttle_comparison && sessionData.throttle_comparison.length > 0 && (
            <div className="rounded-md border border-border/40 bg-background/40 px-2 py-1.5 text-sm sm:col-span-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Zap className="h-3.5 w-3.5 flex-shrink-0 text-green-500/70" />
                <span className="truncate font-medium" style={{ color: sessionData.throttle_comparison[0].Color }}>
                  {sessionData.throttle_comparison[0].Driver}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Avg throttle
                <span className="ml-1 font-mono text-foreground">
                  {sessionData.throttle_comparison[0]["Average Throttle (%)"].toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
