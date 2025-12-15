type F1Session = {
  name: string;
  startTime: Date;
  endTime: Date;
};
type F1Race = {
  grandPrix: string;
  circuit: string;
  country: string;
  hasSprint: boolean;
  sessions: F1Session[];
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { f1_2025_races, f1_2026_races } from "../../../lib/constants/f1_2025_races"
import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"

// Removed duplicate import

export function SessionManager() {
  const now = new Date()

  function getSessionStatus(session: F1Session): string {
    if (now >= session.startTime && now <= session.endTime) return "live"
    if (now > session.endTime) return "passed"
    return "upcoming"
  }

  // Find the race with a live session, or the next upcoming session
  let selectedRaceIdx = -1
  let selectedSessionIdx = -1
  let lastRaceIdx = -1
  let nextRaceIdx = -1

  for (let i = 0; i < f1_2026_races.length; i++) {
    const race = f1_2026_races[i]
    const liveIdx = race.sessions.findIndex((s: F1Session) => getSessionStatus(s) === "live")
    if (liveIdx !== -1) {
      selectedRaceIdx = i
      selectedSessionIdx = liveIdx
      break
    }
  }
  if (selectedRaceIdx === -1) {
    // No live session, find next upcoming session
    for (let i = 0; i < f1_2026_races.length; i++) {
      const race = f1_2026_races[i]
      const upcomingIdx = race.sessions.findIndex((s: F1Session) => getSessionStatus(s) === "upcoming")
      if (upcomingIdx !== -1) {
        selectedRaceIdx = i
        selectedSessionIdx = upcomingIdx
        break
      }
    }
  }

  // Find last and next grand prix
  for (let i = 0; i < f1_2026_races.length; i++) {
    const race = f1_2026_races[i]
    const allPassed = race.sessions.every((s: F1Session) => getSessionStatus(s) === "passed")
    if (allPassed) lastRaceIdx = i
    if (i > selectedRaceIdx && nextRaceIdx === -1) nextRaceIdx = i
  }

  const selectedRace = selectedRaceIdx !== -1 ? f1_2026_races[selectedRaceIdx] : null
  const selectedSession = selectedRace && selectedSessionIdx !== -1 ? selectedRace.sessions[selectedSessionIdx] : null
  const lastRace = lastRaceIdx !== -1 ? f1_2026_races[lastRaceIdx] : null
  const nextRace = nextRaceIdx !== -1 ? f1_2026_races[nextRaceIdx] : null

  return (
    <div className="flex flex-col gap-6">
      
      {selectedRace && (
        <Card key={selectedRace.grandPrix} className="border-none shadow-none bg-transparent">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-bold text-lg text-primary tracking-tight">{selectedRace.grandPrix}</span>
              </div>
              <span className="text-xs text-muted-foreground">{selectedRace.circuit} &middot; {selectedRace.country}</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-row flex-wrap items-center justify-center gap-4 py-4 px-2 w-full">
              {selectedRace.sessions.map((session: F1Session, idx: number) => {
                const status = getSessionStatus(session)
                // Format: Sat, 27 Sep · 14:00–15:00 UTC
                const start = session.startTime
                const end = session.endTime
                const dateStr = start.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })
                const startTimeStr = start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
                const endTimeStr = end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
                let highlight = false
                if (status === "live") highlight = true
                if (selectedRace.sessions.findIndex((s: F1Session) => getSessionStatus(s) === "live") === -1) {
                  const nextUpcomingIdx = selectedRace.sessions.findIndex((s: F1Session) => getSessionStatus(s) === "upcoming")
                  if (nextUpcomingIdx === idx) highlight = true
                }
                return (
                  <div
                    key={session.name}
                    className={`flex flex-col items-center justify-center px-4 py-4 rounded-xl shadow-sm transition-all duration-300 ${highlight ? "bg-primary/10 border-2 border-primary scale-105 animate-fade-in" : "bg-card/80 border border-muted-foreground/10 scale-100 animate-fade-in"}`}
                    style={{ minWidth: 140, maxWidth: 180 }}
                  >
                    <div className="flex flex-col items-center gap-2 mb-2">
                      <span className={`w-3 h-3 rounded-full ${highlight ? "bg-primary animate-pulse" : "bg-muted-foreground/40"}`}></span>
                      <span className={`font-semibold text-sm tracking-tight ${highlight ? "text-primary" : "text-muted-foreground"}`}>{session.name}</span>
                    </div>
                    <div className="text-[13px] text-center font-mono text-foreground mb-1">
                      {dateStr} <span className="text-primary">·</span> {startTimeStr}<span className="text-muted-foreground">–</span>{endTimeStr} <span className="text-xs text-muted-foreground">UTC</span>
                    </div>
                    {highlight && (
                      <Badge
                        variant={status === "live" ? "destructive" : "default"}
                        className="text-[11px] px-3 py-1 mt-2 animate-fade-in"
                      >
                        {status}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex flex-row justify-between items-center mb-4 px-2">
        <span className="text-xs text-muted-foreground">
          Last GP: <span className="font-semibold text-primary">{lastRace ? lastRace.grandPrix : "-"}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          Next GP: <span className="font-semibold text-primary">{nextRace ? nextRace.grandPrix : "-"}</span>
        </span>
      </div>
    </div>
  )
}
// ...existing code...
