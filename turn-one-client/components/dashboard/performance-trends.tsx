"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export function PerformanceTrends() {
  const trends = [
    { metric: "Lap Times", trend: "improving", value: "-0.234s", icon: TrendingUp, color: "text-green-400" },
    { metric: "Sector 1", trend: "declining", value: "+0.123s", icon: TrendingDown, color: "text-red-400" },
    { metric: "Top Speed", trend: "stable", value: "±0 km/h", icon: Minus, color: "text-yellow-400" },
    { metric: "Tire Deg", trend: "improving", value: "-12%", icon: TrendingUp, color: "text-green-400" },
    { metric: "Fuel Usage", trend: "declining", value: "+0.2 kg/lap", icon: TrendingDown, color: "text-red-400" },
    { metric: "Consistency", trend: "improving", value: "+15%", icon: TrendingUp, color: "text-green-400" },
  ]

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Performance Trends
        </CardTitle>
        <CardDescription>Session-over-session performance analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {trends.map((trend, index) => {
            const IconComponent = trend.icon
            return (
              <div key={index} className="flex items-center gap-3 p-3 rounded bg-muted/20">
                <IconComponent className={`h-4 w-4 ${trend.color}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{trend.metric}</div>
                  <div className={`text-xs ${trend.color}`}>{trend.value}</div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
