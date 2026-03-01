import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Clock, Gauge, Trophy } from "lucide-react"
import { fetchAPIDailyStats, fetchAPITotalStats } from "@/lib/dataAcquisition"
import { useState, useEffect } from "react"

interface TotalStats {
  total_sessions: number;
}
interface DailyStats {
  date: string;
  total_sessions: number;
}
export function TelemetryOverview() {
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [totalStats, setTotalStats] = useState<TotalStats | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");

      try {
        const daily = await fetchAPIDailyStats();
        const total = await fetchAPITotalStats();

        setDailyStats(daily);
        setTotalStats(total);
      } catch (error) {
        console.error("Error fetching API stats:", error);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      title: "Total Sessions Analyzed",
      value: totalStats ? totalStats.total_sessions.toString() : "Loading...",
      change: "+40% this month",
      icon: Clock,
      trend: "improvement",
    },
    {
      title: "Average Response Time",
      value: "542 ms",
      change: "-12 ms",
      icon: Gauge,
      trend: "improvement",
    },
    {
      title: "Sessions Analyzed Today",
      value: dailyStats ? dailyStats.total_sessions.toString() : "Loading...",
      change: "+3 today",
      icon: Activity,
      trend: "neutral",
    },
    {
      title: "Performance Score",
      value: "94.2%",
      change: "+2.1%",
      icon: Trophy,
      trend: "improvement",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-red-800/20 bg-black/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-100">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <p
              className={`text-xs ${stat.trend === "improvement"
                ? "text-green-400"
                : stat.trend === "decline"
                  ? "text-red-400"
                  : "text-yellow-400"
                }`}
            >
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
