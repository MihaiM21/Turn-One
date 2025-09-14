"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Circle, AlertTriangle } from "lucide-react"

export function TireAnalysis() {
  const tireData = [
    { position: "Front Left", compound: "Medium", age: 12, wear: 65, temp: 98, pressure: 23.2 },
    { position: "Front Right", compound: "Medium", age: 12, wear: 68, temp: 102, pressure: 23.1 },
    { position: "Rear Left", compound: "Medium", age: 12, wear: 72, temp: 95, pressure: 21.8 },
    { position: "Rear Right", compound: "Medium", age: 12, wear: 75, temp: 97, pressure: 21.9 },
  ]

  const getCompoundColor = (compound: string) => {
    switch (compound) {
      case "Soft":
        return "bg-red-500"
      case "Medium":
        return "bg-yellow-500"
      case "Hard":
        return "bg-white"
      default:
        return "bg-gray-500"
    }
  }

  const getWearColor = (wear: number) => {
    if (wear > 80) return "text-red-400"
    if (wear > 60) return "text-yellow-400"
    return "text-green-400"
  }

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Circle className="h-5 w-5 text-primary" />
          Tire Analysis
        </CardTitle>
        <CardDescription>Real-time tire performance and degradation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tireData.map((tire, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded bg-muted/20">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${getCompoundColor(tire.compound)}`}></div>
              <div>
                <div className="text-sm font-medium">{tire.position}</div>
                <div className="text-xs text-muted-foreground">
                  {tire.compound} - {tire.age} laps
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <div className={`font-medium ${getWearColor(tire.wear)}`}>{tire.wear}%</div>
                <div className="text-xs text-muted-foreground">Wear</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{tire.temp}°C</div>
                <div className="text-xs text-muted-foreground">Temp</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{tire.pressure}</div>
                <div className="text-xs text-muted-foreground">PSI</div>
              </div>
              {tire.wear > 80 && <AlertTriangle className="h-4 w-4 text-red-400" />}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
