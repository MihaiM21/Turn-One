"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function TrackMap() {
  return (
    <Card className="border-red-800/20 bg-black/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Track Map</CardTitle>
        <p className="text-sm text-red-200">Monaco Grand Prix Circuit</p>
      </CardHeader>
      <CardContent>
        <div className="relative h-80 bg-gradient-to-br from-red-950/20 to-black rounded-lg border border-red-800/20 overflow-hidden">
          {/* Monaco track outline - simplified representation */}
          <svg
            viewBox="0 0 400 300"
            className="absolute inset-0 w-full h-full"
            style={{ filter: "drop-shadow(0 0 10px rgba(220, 38, 38, 0.3))" }}
          >
            <path
              d="M50 150 Q80 120 120 130 Q160 140 180 120 Q220 100 260 120 Q300 140 330 160 Q350 180 340 220 Q330 260 300 270 Q260 280 220 270 Q180 260 140 250 Q100 240 70 220 Q40 200 50 150"
              fill="none"
              stroke="#dc2626"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Start/Finish line */}
            <line x1="50" y1="145" x2="50" y2="155" stroke="#ffffff" strokeWidth="3" />
            {/* Sector markers */}
            <circle cx="180" cy="120" r="4" fill="#f59e0b" />
            <circle cx="340" cy="220" r="4" fill="#f59e0b" />
            <circle cx="140" cy="250" r="4" fill="#f59e0b" />
          </svg>

          {/* Track information overlay */}
          <div className="absolute bottom-4 left-4 space-y-2">
            <Badge variant="secondary" className="bg-red-600/20 text-red-200 border-red-600/30">
              3.337 km
            </Badge>
            <Badge variant="secondary" className="bg-red-600/20 text-red-200 border-red-600/30">
              19 Turns
            </Badge>
          </div>

          {/* Current position indicator */}
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-lg"></div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-red-200">Current Sector</span>
            <span className="text-white font-mono">Sector 2</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-red-200">Track Position</span>
            <span className="text-white font-mono">1,247m</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-red-200">Next Corner</span>
            <span className="text-white font-mono">Casino (T5)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
