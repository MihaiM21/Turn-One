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
  cancelled?: boolean;
  sessions: F1Session[];
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { f1_2026_races } from "../../../lib/constants/f1_races"
import React, { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin } from "lucide-react"

function formatClockUnits(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds)
  const days = Math.floor(safeSeconds / 86400)
  const hours = Math.floor((safeSeconds % 86400) / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  return {
    days,
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  }
}

export function SessionManager() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  function getSessionStatus(session: F1Session): "live" | "passed" | "upcoming" {
    if (now >= session.startTime && now <= session.endTime) return "live"
    if (now > session.endTime) return "passed"
    return "upcoming"
  }

  const selection = useMemo(() => {
    // Find race with live session first, otherwise next upcoming.
    let selectedRaceIdx = -1
    let selectedSessionIdx = -1
    let lastRaceIdx = -1
    let nextRaceIdx = -1

    for (let i = 0; i < f1_2026_races.length; i++) {
      const race = f1_2026_races[i]
      if (race.cancelled) continue
      const liveIdx = race.sessions.findIndex((s: F1Session) => getSessionStatus(s) === "live")
      if (liveIdx !== -1) {
        selectedRaceIdx = i
        selectedSessionIdx = liveIdx
        break
      }
    }

    if (selectedRaceIdx === -1) {
      for (let i = 0; i < f1_2026_races.length; i++) {
        const race = f1_2026_races[i]
        if (race.cancelled) continue
        const upcomingIdx = race.sessions.findIndex((s: F1Session) => getSessionStatus(s) === "upcoming")
        if (upcomingIdx !== -1) {
          selectedRaceIdx = i
          selectedSessionIdx = upcomingIdx
          break
        }
      }
    }

    for (let i = 0; i < f1_2026_races.length; i++) {
      const race = f1_2026_races[i]
      if (race.cancelled) continue
      const allPassed = race.sessions.every((s: F1Session) => getSessionStatus(s) === "passed")
      if (allPassed) lastRaceIdx = i
      if (i > selectedRaceIdx && nextRaceIdx === -1) {
        const nextRace = f1_2026_races[i]
        if (!nextRace.cancelled) nextRaceIdx = i
      }
    }

    return { selectedRaceIdx, selectedSessionIdx, lastRaceIdx, nextRaceIdx }
  }, [now])

  const selectedRace = selection.selectedRaceIdx !== -1 ? f1_2026_races[selection.selectedRaceIdx] : null
  const selectedSession = selectedRace && selection.selectedSessionIdx !== -1 ? selectedRace.sessions[selection.selectedSessionIdx] : null
  const lastRace = selection.lastRaceIdx !== -1 ? f1_2026_races[selection.lastRaceIdx] : null
  const nextRace = selection.nextRaceIdx !== -1 ? f1_2026_races[selection.nextRaceIdx] : null

  const selectedSessionStatus = selectedSession ? getSessionStatus(selectedSession) : null
  const secondsToTarget = selectedSession
    ? Math.max(
        0,
        Math.floor(
          ((selectedSessionStatus === "live" ? selectedSession.endTime : selectedSession.startTime).getTime() - now.getTime()) /
            1000
        )
      )
    : 0
  const countdown = formatClockUnits(secondsToTarget)
  const targetLabel = selectedSessionStatus === "live" ? "Ends in" : "Starts in"

  const selectedSessionStartLocal = selectedSession
    ? selectedSession.startTime.toLocaleString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-"
  const selectedSessionStartUtc = selectedSession
    ? selectedSession.startTime.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      })
    : "-"

  return (
    <div className="flex flex-col gap-4 mt-4">

      {selectedRace && (
        <Card
          key={selectedRace.grandPrix}
          className={`overflow-hidden border ${selectedRace.cancelled ? 'border-destructive/20 bg-gradient-to-br from-destructive/10 via-background to-background opacity-75' : 'border-primary/20 bg-gradient-to-br from-primary/20 via-background to-background'} shadow-[0_10px_28px_-22px_rgba(0,0,0,0.85)]`}
        >
          <CardHeader className="pb-2 pt-5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span>{selectedRace.cancelled ? 'Cancelled Event' : 'Next Event Window'}</span>
                </div>
                <CardTitle className="text-xl tracking-tight">{selectedRace.grandPrix}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>{selectedRace.circuit}</span>
                  <span className="text-primary">•</span>
                  <span>{selectedRace.country}</span>
                  {selectedRace.cancelled && (
                    <>
                      <span className="text-destructive">•</span>
                      <Badge variant="destructive" className="ml-1">Cancelled</Badge>
                    </>
                  )}
                </CardDescription>
              </div>

              {selectedSession && !selectedRace.cancelled && (
                <div className="rounded-xl border border-primary/25 bg-background/60 px-3 py-2 backdrop-blur-sm">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{targetLabel}</span>
                    <Badge
                      variant={selectedSessionStatus === "live" ? "destructive" : "default"}
                      className="px-2 py-0 text-[10px] uppercase tracking-wide"
                    >
                      {selectedSessionStatus === "live" ? "Live" : "Upcoming"}
                    </Badge>
                  </div>
                  <div className="font-mono text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                    {countdown.days > 0 && <span>{countdown.days}d </span>}
                    <span>{countdown.hours}</span>
                    <span className="text-primary/80">:</span>
                    <span>{countdown.minutes}</span>
                    <span className="text-primary/80">:</span>
                    <span>{countdown.seconds}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {selectedSession.name} • {selectedSessionStartLocal} (UTC {selectedSessionStartUtc})
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {selectedRace.cancelled ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                This Grand Prix has been cancelled and will not take place.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 py-1 sm:grid-cols-2 xl:grid-cols-3">
                {selectedRace.sessions.map((session: F1Session, idx: number) => {
                  const status = getSessionStatus(session)
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
                      className={`rounded-lg border px-3 py-2.5 transition-all duration-300 ${highlight ? "border-primary/60 bg-primary/10 shadow-[0_8px_20px_-16px_rgba(239,68,68,0.9)]" : "border-border/50 bg-background/70"}`}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className={`font-semibold text-xs sm:text-sm tracking-tight ${highlight ? "text-primary" : "text-foreground"}`}>{session.name}</span>
                        <Badge
                          variant="outline"
                          className={`px-1.5 py-0 text-[9px] uppercase ${status === "passed" ? "border-border text-muted-foreground" : status === "live" ? "border-red-400/40 text-red-300" : "border-primary/30 text-primary"}`}
                        >
                          {status}
                        </Badge>
                      </div>
                      <div className="text-xs font-mono text-foreground">
                        {dateStr} <span className="text-primary">·</span> {startTimeStr}
                        <span className="text-muted-foreground"> - </span>
                        {endTimeStr} <span className="text-xs text-muted-foreground">UTC</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <div className="flex flex-row items-center justify-between rounded-lg border border-border/40 bg-card/40 px-3 py-3">
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
