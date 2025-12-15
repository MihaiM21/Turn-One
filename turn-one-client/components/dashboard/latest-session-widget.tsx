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
      <Card className="bg-card/30 backdrop-blur-sm border-border/30">
        <CardHeader>
          <Skeleton className="h-6 w-40 bg-muted/20" />
          <Skeleton className="h-4 w-56 bg-muted/20" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full bg-muted/20" />
            <Skeleton className="h-4 w-full bg-muted/20" />
            <Skeleton className="h-4 w-3/4 bg-muted/20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !sessionData) {
    return null; // Don't show widget if there's an error
  }

  return (
    <Card className="bg-card/30 backdrop-blur-sm border-border/30 hover:border-border/50 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold mb-1">Latest Session</CardTitle>
            <CardDescription className="text-xs">Performance highlights</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            New
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Info */}
        <div className="flex items-center gap-3 pb-3 border-b border-border/30">
          <Badge variant="outline" className={`${getSessionTypeColor(sessionData.session_type)} px-2.5 py-1 text-xs font-medium`}>
            {sessionData.session_name}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span className="font-mono">{sessionData.year}</span>
            <span>•</span>
            <span>R{sessionData.round}</span>
          </div>
        </div>

        {/* Key Stats */}
        <div className="space-y-2.5">
          {sessionData.qualifying_results && sessionData.qualifying_results.length > 0 && (
            <div className="flex items-center gap-2.5 text-sm">
              <Trophy className="w-4 h-4 text-yellow-500/70 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold" style={{ color: sessionData.qualifying_results[0].Color }}>
                  {sessionData.qualifying_results[0].Driver}
                </span>
                <span className="text-muted-foreground mx-1.5">•</span>
                <span className="font-mono text-xs text-foreground">
                  {sessionData.qualifying_results[0].LapTime}
                </span>
              </div>
            </div>
          )}

          {sessionData.top_speed && sessionData.top_speed.length > 0 && (
            <div className="flex items-center gap-2.5 text-sm">
              <Gauge className="w-4 h-4 text-blue-500/70 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold truncate" style={{ color: sessionData.top_speed[0].Color }}>
                  {sessionData.top_speed[0].Team}
                </span>
                <span className="text-muted-foreground mx-1.5">•</span>
                <span className="font-mono text-xs text-foreground">
                  {sessionData.top_speed[0]["Top Speed (km/h)"]} km/h
                </span>
              </div>
            </div>
          )}

          {sessionData.throttle_comparison && sessionData.throttle_comparison.length > 0 && (
            <div className="flex items-center gap-2.5 text-sm">
              <Zap className="w-4 h-4 text-green-500/70 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold" style={{ color: sessionData.throttle_comparison[0].Color }}>
                  {sessionData.throttle_comparison[0].Driver}
                </span>
                <span className="text-muted-foreground mx-1.5">•</span>
                <span className="font-mono text-xs text-foreground">
                  {sessionData.throttle_comparison[0]["Average Throttle (%)"].toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* View Full Analysis Button */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full mt-4 hover:bg-primary/10 hover:border-primary/30 transition-all"
        >
          <Link href="/news">
            View Full Analysis
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
