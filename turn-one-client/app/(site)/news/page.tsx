"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SessionDashboardData } from "@/types/news-types";
import { getLatestSessionDataClient } from "@/lib/newsService";
import { QualifyingChart } from "@/components/news/qualifying-chart";
import { TopSpeedChart } from "@/components/news/top-speed-chart";
import { ThrottleChart } from "@/components/news/throttle-chart";
import { Trophy, Gauge, Zap, Calendar, Flag, ArrowLeft, Home } from "lucide-react";
import { MainNav } from "@/components/navigation/main-nav";
import { Loading } from "@/components/ui/loading";
import Link from "next/link";

export default function NewsPage() {
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
        setError("Failed to load session data. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case "qualifying":
        return <Trophy className="w-5 h-5" />;
      case "race":
        return <Flag className="w-5 h-5" />;
      default:
        return <Gauge className="w-5 h-5" />;
    }
  };

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
    return <Loading message="Loading session data..." />;
  }

  if (loading && sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black">
        <MainNav variant="homepage" />
        <div className="container mx-auto px-4 py-24 max-w-7xl">
          <Skeleton className="h-12 w-64 mb-2 bg-muted/20" />
          <Skeleton className="h-6 w-96 mb-8 bg-muted/20" />
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card/30 backdrop-blur-sm border-border/30">
                <CardHeader>
                  <Skeleton className="h-6 w-32 bg-muted/20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[200px] w-full bg-muted/20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black">
        <MainNav variant="homepage" />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="max-w-md bg-card/30 backdrop-blur-sm border-border/30">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
              <CardDescription>{error || "Failed to load data"}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black">
      <MainNav variant="homepage" />
      
      <div className="container mx-auto px-4 py-24 max-w-7xl">
        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 mb-8"
        >
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
          </Button>
        </motion.div>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-baseline gap-4 mb-3">
            <h1 className="text-5xl font-bold tracking-tight gradient-text">Session Analysis</h1>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              Latest
            </Badge>
          </div>
          <p className="text-muted-foreground text-base">
            Performance insights from the latest F1 session
          </p>
        </motion.div>

        {/* Session Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between flex-wrap gap-4 py-4 border-b border-border/30">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className={`${getSessionTypeColor(sessionData.session_type)} px-3 py-1.5 text-xs font-medium border`}>
                {getSessionTypeIcon(sessionData.session_type)}
                <span className="ml-2">{sessionData.session_name}</span>
              </Badge>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-mono">{sessionData.year}</span>
                <span className="text-border">|</span>
                <span>Round {sessionData.round}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Qualifying/Race Results */}
        {sessionData.qualifying_results && sessionData.qualifying_results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-10"
          >
            <QualifyingChart data={sessionData.qualifying_results} sessionName={sessionData.session_name} />
          </motion.div>
        )}

        {/* Charts Grid */}
        <div className="grid gap-8 md:grid-cols-2 mb-10">
          {/* Top Speed Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <TopSpeedChart data={sessionData.top_speed} />
          </motion.div>

          {/* Throttle Comparison Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <ThrottleChart data={sessionData.throttle_comparison} />
          </motion.div>
        </div>

        {/* Analysis Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="bg-card/30 backdrop-blur-sm border-border/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessionData.qualifying_results && sessionData.qualifying_results.length > 0 && (
                <div className="flex items-start gap-3 py-2">
                  <Trophy className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold" style={{ color: sessionData.qualifying_results[0].Color }}>
                        {sessionData.qualifying_results[0].Driver}
                      </span>{" "}
                      <span className="text-muted-foreground">set the fastest lap</span>{" "}
                      <span className="font-mono text-foreground">{sessionData.qualifying_results[0].LapTime}</span>
                    </p>
                  </div>
                </div>
              )}
              
              {sessionData.top_speed && sessionData.top_speed.length > 0 && (
                <div className="flex items-start gap-3 py-2">
                  <Gauge className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold" style={{ color: sessionData.top_speed[0].Color }}>
                        {sessionData.top_speed[0].Team}
                      </span>{" "}
                      <span className="text-muted-foreground">reached</span>{" "}
                      <span className="font-mono text-foreground">{sessionData.top_speed[0]["Top Speed (km/h)"]} km/h</span>
                    </p>
                  </div>
                </div>
              )}

              {sessionData.throttle_comparison && sessionData.throttle_comparison.length > 0 && (
                <div className="flex items-start gap-3 py-2">
                  <Zap className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold" style={{ color: sessionData.throttle_comparison[0].Color }}>
                        {sessionData.throttle_comparison[0].Driver}
                      </span>{" "}
                      <span className="text-muted-foreground">highest throttle at</span>{" "}
                      <span className="font-mono text-foreground">{sessionData.throttle_comparison[0]["Average Throttle (%)"].toFixed(1)}%</span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
