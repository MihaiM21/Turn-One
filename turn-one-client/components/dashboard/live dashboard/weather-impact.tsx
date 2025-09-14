"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cloud, Sun, CloudRain, Wind, Thermometer } from "lucide-react"

export function WeatherImpact() {
  const weatherData = {
    condition: "Partly Cloudy",
    temperature: 24,
    humidity: 65,
    windSpeed: 12,
    windDirection: "NE",
    trackTemp: 42,
    rainProbability: 15,
  }

  const impact = [
    { factor: "Grip Level", impact: "High", change: "+5%", color: "text-green-400" },
    { factor: "Tire Degradation", impact: "Normal", change: "±0%", color: "text-yellow-400" },
    { factor: "Fuel Consumption", impact: "Low", change: "-2%", color: "text-green-400" },
    { factor: "Aerodynamics", impact: "Optimal", change: "+3%", color: "text-green-400" },
  ]

  const getWeatherIcon = () => {
    if (weatherData.rainProbability > 50) return CloudRain
    if (weatherData.condition.includes("Cloudy")) return Cloud
    return Sun
  }

  const WeatherIcon = getWeatherIcon()

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WeatherIcon className="h-5 w-5 text-primary" />
          Weather Impact
        </CardTitle>
        <CardDescription>Environmental conditions affecting performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded bg-muted/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Thermometer className="h-4 w-4" />
              <span className="text-lg font-bold">{weatherData.temperature}°C</span>
            </div>
            <div className="text-xs text-muted-foreground">Air Temp</div>
          </div>
          <div className="text-center p-3 rounded bg-muted/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-lg font-bold text-primary">{weatherData.trackTemp}°C</span>
            </div>
            <div className="text-xs text-muted-foreground">Track Temp</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded bg-muted/20">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4" />
            <span className="text-sm">Wind</span>
          </div>
          <span className="font-medium">
            {weatherData.windSpeed} km/h {weatherData.windDirection}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded bg-muted/20">
          <span className="text-sm">Rain Probability</span>
          <Badge variant={weatherData.rainProbability > 30 ? "destructive" : "secondary"}>
            {weatherData.rainProbability}%
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Performance Impact</div>
          {impact.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/10">
              <span className="text-sm">{item.factor}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">{item.impact}</span>
                <span className={`text-xs font-medium ${item.color}`}>{item.change}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
