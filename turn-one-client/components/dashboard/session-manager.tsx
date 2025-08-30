"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"
import { useState } from "react"

export function SessionManager() {
  const [selectedSession, setSelectedSession] = useState("race")

  const sessions = [
    { id: "fp1", name: "FP1", status: "completed", time: "90 min" },
    { id: "fp2", name: "FP2", status: "completed", time: "90 min" },
    { id: "fp3", name: "FP3", status: "completed", time: "60 min" },
    { id: "qualifying", name: "Qualifying", status: "completed", time: "60 min" },
    { id: "race", name: "Race", status: "live", time: "2h 00m" },
  ]

  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Session Manager
            </CardTitle>
            <CardDescription>Select session for telemetry analysis</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Monaco Grand Prix
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {sessions.map((session) => (
            <Button
              key={session.id}
              variant={selectedSession === session.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSession(session.id)}
              className={`flex items-center gap-2 ${selectedSession === session.id ? "glow-effect" : ""}`}
            >
              <Clock className="h-3 w-3" />
              {session.name}
              <Badge variant={session.status === "live" ? "destructive" : "secondary"} className="text-xs">
                {session.status}
              </Badge>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
