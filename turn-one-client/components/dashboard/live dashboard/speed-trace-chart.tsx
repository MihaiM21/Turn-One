"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const speedData = [
  { distance: 0, speed: 0, throttle: 0, brake: 0 },
  { distance: 100, speed: 85, throttle: 100, brake: 0 },
  { distance: 200, speed: 145, throttle: 100, brake: 0 },
  { distance: 300, speed: 180, throttle: 100, brake: 0 },
  { distance: 400, speed: 220, throttle: 100, brake: 0 },
  { distance: 500, speed: 250, throttle: 100, brake: 0 },
  { distance: 600, speed: 280, throttle: 100, brake: 0 },
  { distance: 700, speed: 310, throttle: 100, brake: 0 },
  { distance: 800, speed: 340, throttle: 100, brake: 0 },
  { distance: 900, speed: 320, throttle: 0, brake: 30 },
  { distance: 1000, speed: 280, throttle: 0, brake: 60 },
  { distance: 1100, speed: 220, throttle: 0, brake: 100 },
  { distance: 1200, speed: 150, throttle: 0, brake: 100 },
  { distance: 1300, speed: 80, throttle: 20, brake: 0 },
  { distance: 1400, speed: 120, throttle: 80, brake: 0 },
]

export function SpeedTraceChart() {
  return (
    <Card className="border-red-800/20 bg-black/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Speed Trace Analysis</CardTitle>
        <p className="text-sm text-red-200">Monaco GP • Turn 1 to Sainte Devote</p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dc2626" opacity={0.2} />
              <XAxis
                dataKey="distance"
                stroke="#fecaca"
                label={{ value: "Distance (m)", position: "insideBottom", offset: -5 }}
              />
              <YAxis stroke="#fecaca" label={{ value: "Speed (km/h)", angle: -90, position: "insideLeft" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "1px solid #dc2626",
                  borderRadius: "8px",
                  color: "#ffffff",
                }}
              />
              <Line type="monotone" dataKey="speed" stroke="#dc2626" strokeWidth={3} dot={false} name="Speed" />
              <Line type="monotone" dataKey="throttle" stroke="#22c55e" strokeWidth={2} dot={false} name="Throttle %" />
              <Line type="monotone" dataKey="brake" stroke="#f59e0b" strokeWidth={2} dot={false} name="Brake %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <span className="text-red-200">Speed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-red-200">Throttle</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-red-200">Brake</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
