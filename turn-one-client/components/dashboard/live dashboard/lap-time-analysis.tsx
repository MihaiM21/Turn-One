"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const lapTimeData = [
  { lap: 1, time: 85.234, sector1: 28.123, sector2: 31.456, sector3: 25.655 },
  { lap: 2, time: 84.891, sector1: 27.987, sector2: 31.234, sector3: 25.67 },
  { lap: 3, time: 84.456, sector1: 27.845, sector2: 31.123, sector3: 25.488 },
  { lap: 4, time: 84.123, sector1: 27.756, sector2: 30.987, sector3: 25.38 },
  { lap: 5, time: 83.987, sector1: 27.689, sector2: 30.876, sector3: 25.422 },
  { lap: 6, time: 83.756, sector1: 27.634, sector2: 30.789, sector3: 25.333 },
  { lap: 7, time: 83.456, sector1: 27.567, sector2: 30.678, sector3: 25.211 },
]

export function LapTimeAnalysis() {
  return (
    <Card className="border-red-800/20 bg-black/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Lap Time Analysis</CardTitle>
        <p className="text-sm text-red-200">Track: Monaco GP • Session: Practice 2</p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lapTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dc2626" opacity={0.2} />
              <XAxis dataKey="lap" stroke="#fecaca" />
              <YAxis stroke="#fecaca" domain={["dataMin - 0.5", "dataMax + 0.5"]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "1px solid #dc2626",
                  borderRadius: "8px",
                  color: "#ffffff",
                }}
              />
              <Line
                type="monotone"
                dataKey="time"
                stroke="#dc2626"
                strokeWidth={3}
                dot={{ fill: "#dc2626", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#dc2626", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-red-200">Best Lap</p>
            <p className="text-lg font-bold text-white">1:23.456</p>
          </div>
          <div>
            <p className="text-sm text-red-200">Average</p>
            <p className="text-lg font-bold text-white">1:24.123</p>
          </div>
          <div>
            <p className="text-sm text-red-200">Improvement</p>
            <p className="text-lg font-bold text-green-400">-1.778s</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
