"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const sectorData = [
  { sector: "Sector 1", current: 27.567, best: 27.234, difference: 0.333 },
  { sector: "Sector 2", current: 30.678, best: 30.456, difference: 0.222 },
  { sector: "Sector 3", current: 25.211, best: 25.123, difference: 0.088 },
]

export function SectorComparison() {
  return (
    <Card className="border-red-800/20 bg-black/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Sector Comparison</CardTitle>
        <p className="text-sm text-red-200">Current vs Personal Best</p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dc2626" opacity={0.2} />
              <XAxis dataKey="sector" stroke="#fecaca" />
              <YAxis stroke="#fecaca" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "1px solid #dc2626",
                  borderRadius: "8px",
                  color: "#ffffff",
                }}
              />
              <Bar dataKey="current" fill="#dc2626" name="Current" />
              <Bar dataKey="best" fill="#f59e0b" name="Personal Best" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {sectorData.map((sector) => (
            <div key={sector.sector} className="flex justify-between items-center text-sm">
              <span className="text-red-200">{sector.sector}</span>
              <span className={`font-mono ${sector.difference > 0 ? "text-red-400" : "text-green-400"}`}>
                {sector.difference > 0 ? "+" : ""}
                {sector.difference.toFixed(3)}s
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
