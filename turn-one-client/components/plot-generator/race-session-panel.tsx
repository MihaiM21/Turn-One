"use client"

import { CalendarClock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { getSessionCode, type F1Event, type F1Session } from "@/lib/plots/session-utils"
import type { PlotScope } from "@/lib/plots/types"

type EventDateFields = { start_date?: string; date?: string; event_date?: string; session_date?: string }
type SessionDateFields = { end_date?: string; start_date?: string; date?: string; session_date?: string }

type RaceSessionPanelProps = {
  years: string[]
  selectedYear: string
  onYearChange: (year: string) => void
  events: F1Event[]
  selectedEventName: string
  onEventChange: (eventName: string) => void
  sessions: F1Session[]
  selectedSession: string
  onSessionChange: (sessionCode: string) => void
  /** Anything but "session" hides the GP/session pickers; "career" also hides the year. */
  scope?: PlotScope
  /** Hide events/sessions that haven't started yet (user-facing generator). */
  filterToFinished?: boolean
  onRefresh?: () => void
  isRefreshing?: boolean
  onUseLatestRace?: () => void
  isResolvingLatestRace?: boolean
  dataTour?: string
}

export function RaceSessionPanel({
  years,
  selectedYear,
  onYearChange,
  events,
  selectedEventName,
  onEventChange,
  sessions,
  selectedSession,
  onSessionChange,
  scope = "session",
  filterToFinished = false,
  onRefresh,
  isRefreshing = false,
  onUseLatestRace,
  isResolvingLatestRace = false,
  dataTour,
}: RaceSessionPanelProps) {
  const isSeasonScope = scope === "season"
  const isCareerScope = scope === "career"

  const now = Date.now()
  const shownEvents = (() => {
    if (!filterToFinished) return events
    const dated = events.filter((e) => {
      const raw = (e as EventDateFields).start_date || (e as EventDateFields).date || (e as EventDateFields).event_date || (e as EventDateFields).session_date
      const t = raw ? new Date(raw).getTime() : NaN
      return Number.isFinite(t) && t <= now
    })
    return dated.length > 0 ? dated : events
  })()
  const shownSessions = (() => {
    if (!filterToFinished) return sessions
    const filtered = sessions.filter((s) => {
      const raw = (s as SessionDateFields).end_date || (s as SessionDateFields).start_date || (s as SessionDateFields).date || (s as SessionDateFields).session_date
      if (!raw) return true
      return new Date(raw).getTime() <= now
    })
    return filtered.length > 0 ? filtered : sessions
  })()

  return (
    <div data-tour={dataTour} className="border border-zinc-800">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-5 py-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-medium leading-none">Race &amp; session</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {isCareerScope
                ? "This plot spans multiple seasons — configure the year range in Plot options below."
                : isSeasonScope
                ? "This plot aggregates a full season — Grand Prix and session do not apply."
                : "Pick the season, Grand Prix, and session."}
            </p>
          </div>
        </div>
        {!isSeasonScope && !isCareerScope && onRefresh && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-zinc-500 hover:text-foreground"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label="Refresh sessions"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Refresh available Grands Prix &amp; sessions</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="space-y-4 px-5 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {!isCareerScope && (
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={selectedYear} onValueChange={onYearChange}>
                <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!isSeasonScope && !isCareerScope && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="round">Round</Label>
                {onUseLatestRace && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={onUseLatestRace}
                        className="text-[10px] text-primary hover:underline disabled:opacity-50"
                        disabled={!shownEvents.length || isResolvingLatestRace}
                      >
                        {isResolvingLatestRace ? "Finding latest race..." : "Use latest race"}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Jump to the most recent past event</TooltipContent>
                  </Tooltip>
                )}
              </div>
              <Select value={selectedEventName} onValueChange={onEventChange}>
                <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
                  <SelectValue placeholder="Select round" />
                </SelectTrigger>
                <SelectContent>
                  {shownEvents.length > 0 ? (
                    shownEvents.map((event, index) => {
                      const isDuplicate = shownEvents.filter((e) => e.name === event.name).length > 1
                      const displayName = isDuplicate ? event.official_name : event.name
                      const identifier = event.official_name || event.name
                      return (
                        <SelectItem key={event.key || index} value={identifier}>
                          {`${displayName}`}
                        </SelectItem>
                      )
                    })
                  ) : (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {!isSeasonScope && !isCareerScope && (
            <div className="space-y-2">
              <Label htmlFor="session">Session</Label>
              <Select value={selectedSession} onValueChange={onSessionChange}>
                <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {shownSessions.length > 0 ? (
                    shownSessions.map((session) => {
                      const code = getSessionCode(session.name, session.type, session.number)
                      return (
                        <SelectItem key={(session.key as string | number | undefined) || code} value={code}>
                          {session.name}
                        </SelectItem>
                      )
                    })
                  ) : (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
