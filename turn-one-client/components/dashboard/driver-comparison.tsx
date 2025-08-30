"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { useState } from "react"

export function DriverComparison() {
  const [selectedDrivers, setSelectedDrivers] = useState(["VER", "LEC"])

  const drivers = [
    { code: "VER", name: "Max Verstappen", team: "Red Bull", color: "#0600EF", lapTime: "1:12.345" },
    { code: "LEC", name: "Charles Leclerc", team: "Ferrari", color: "#DC143C", lapTime: "1:12.567" },
    { code: "HAM", name: "Lewis Hamilton", team: "Mercedes", color: "#00D2BE", lapTime: "1:12.789" },
    { code: "NOR", name: "Lando Norris", team: "McLaren", color: "#FF8700", lapTime: "1:12.901" },
  ]

  const comparisonData = [
    { metric: "Best Lap", ver: "1:12.345", lec: "1:12.567", diff: "+0.222" },
    { metric: "Sector 1", ver: "23.456", lec: "23.678", diff: "+0.222" },
    { metric: "Sector 2", ver: "28.789", lec: "28.567", diff: "-0.222" },
    { metric: "Sector 3", ver: "20.100", lec: "20.322", diff: "+0.222" },
    { metric: "Top Speed", ver: "342 km/h", lec: "339 km/h", diff: "-3 km/h" },
  ]

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Driver Comparison
        </CardTitle>
        <CardDescription>Compare telemetry data between drivers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {drivers.map((driver) => (
            <Button
              key={driver.code}
              variant={selectedDrivers.includes(driver.code) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (selectedDrivers.includes(driver.code)) {
                  setSelectedDrivers(selectedDrivers.filter((d) => d !== driver.code))
                } else if (selectedDrivers.length < 3) {
                  setSelectedDrivers([...selectedDrivers, driver.code])
                }
              }}
              className="flex items-center gap-2"
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: driver.color }}></div>
              {driver.code}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          {comparisonData.map((data, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/20">
              <span className="text-sm font-medium">{data.metric}</span>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-blue-400">{data.ver}</span>
                <span className="text-red-400">{data.lec}</span>
                <Badge variant={data.diff.startsWith("+") ? "destructive" : "secondary"} className="text-xs">
                  {data.diff}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
