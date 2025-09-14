"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Fuel, TrendingDown } from "lucide-react"

export function FuelConsumption() {
  const fuelData = {
    currentLoad: 45.2,
    consumptionRate: 2.8,
    estimatedLaps: 16,
    efficiency: 92,
    trend: "improving",
  }

  const lapData = [
    { lap: 8, consumption: 2.9, remaining: 52.1 },
    { lap: 9, consumption: 2.8, remaining: 49.3 },
    { lap: 10, consumption: 2.7, remaining: 46.6 },
    { lap: 11, consumption: 2.8, remaining: 43.8 },
    { lap: 12, consumption: 2.9, remaining: 40.9 },
  ]

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5 text-primary" />
          Fuel Analysis
        </CardTitle>
        <CardDescription>Fuel consumption and strategy optimization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded bg-muted/20">
            <div className="text-2xl font-bold gradient-text">{fuelData.currentLoad}</div>
            <div className="text-xs text-muted-foreground">kg Remaining</div>
          </div>
          <div className="text-center p-3 rounded bg-muted/20">
            <div className="text-2xl font-bold text-primary">{fuelData.consumptionRate}</div>
            <div className="text-xs text-muted-foreground">kg/lap</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded bg-muted/20">
          <span className="text-sm">Estimated Laps Remaining</span>
          <span className="font-bold text-lg">{fuelData.estimatedLaps}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded bg-muted/20">
          <span className="text-sm">Fuel Efficiency</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-green-400">{fuelData.efficiency}%</span>
            <TrendingDown className="h-4 w-4 text-green-400" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Recent Consumption</div>
          {lapData.slice(-3).map((data, index) => (
            <div key={index} className="flex items-center justify-between text-sm p-2 rounded bg-muted/10">
              <span>Lap {data.lap}</span>
              <span>{data.consumption} kg</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
