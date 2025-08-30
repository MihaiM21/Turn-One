import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Clock, Gauge, Trophy } from "lucide-react"

export function TelemetryOverview() {
  const stats = [
    {
      title: "Best Lap Time",
      value: "1:23.456",
      change: "-0.234s",
      icon: Clock,
      trend: "improvement",
    },
    {
      title: "Top Speed",
      value: "342 km/h",
      change: "+12 km/h",
      icon: Gauge,
      trend: "improvement",
    },
    {
      title: "Sessions Analyzed",
      value: "47",
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
              className={`text-xs ${
                stat.trend === "improvement"
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
