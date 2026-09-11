"use client"

import { useEffect, useMemo, useState } from "react"
import { fetchEventsByYear, fetchSessionsByEvent } from "@/lib/dataAcquisition"
import {
  DEFAULT_SESSIONS,
  getSessionCode,
  isTestingEvent,
  type F1Event,
  type F1Session,
} from "@/lib/plots/session-utils"
import { recordSessionEnd } from "@/lib/cache/session-clock"

type SessionDateFields = {
  start_date?: string
  date?: string
  session_date?: string
  end_date?: string
}

/** How far back to walk when the newest listed event hasn't started yet. */
const LATEST_EVENT_LOOKBACK = 3

interface UseGeneratorCoreOptions {
  initialYear?: string
  initialSession?: string
  /** Which session to fall back to when the current one disappears: Practice 1 ("first") or the last listed, usually Race ("last"). */
  defaultSessionPick?: "first" | "last"
  notify?: {
    success?: (message: string) => void
    error?: (message: string) => void
  }
}

/**
 * Shared season/Grand Prix/session selection state for the plot generators:
 * loads events per year, sessions per event, resolves the most recent race,
 * and keeps the selection valid as lists change.
 */
export function useGeneratorCore({
  initialYear = "2026",
  initialSession = "FP1",
  defaultSessionPick = "first",
  notify,
}: UseGeneratorCoreOptions = {}) {
  const [selectedYear, setSelectedYear] = useState(initialYear)
  const [selectedEventName, setSelectedEventName] = useState("")
  const [availableEvents, setAvailableEvents] = useState<F1Event[]>([])
  const [availableSessions, setAvailableSessions] = useState<F1Session[]>(DEFAULT_SESSIONS)
  const [selectedSession, setSelectedSession] = useState(initialSession)
  const [isResolvingLatestRace, setIsResolvingLatestRace] = useState(false)
  const [isRefreshingSessions, setIsRefreshingSessions] = useState(false)

  // Fallback used only if session lookups fail entirely (e.g. offline):
  // skip testing events and just take the first remaining event.
  const pickDefaultEvent = (events: F1Event[]) => {
    if (!events.length) return null
    const races = events.filter((e) => !isTestingEvent(e))
    return (races.length ? races : events)[0]
  }

  // The events list carries no dates, but it is returned in calendar order and
  // — for the current season — truncated to events that actually have data, so
  // the newest entry is almost always the one we want. Verified against the
  // live API: the 2026 list ends at the most recently run Grand Prix.
  //
  // This replaces a fan-out that fetched sessions for every event in the season
  // (~24 parallel requests) on each mount and year change. We still confirm the
  // candidate has started, walking back a few events if not, so a season whose
  // full future calendar is published doesn't select a race that hasn't
  // happened. Costs one request in the normal case.
  //
  // Note round numbers are deliberately not used: the events list has no round
  // field, and its `key` is a FastF1 identifier with gaps where a round is
  // missing, so position-based round arithmetic is unsafe.
  const resolveLatestEvent = async (events: F1Event[], year: string) => {
    if (!events.length) return null
    const races = events.filter((e) => !isTestingEvent(e))
    if (!races.length) return pickDefaultEvent(events)

    const now = Date.now()
    for (
      let i = races.length - 1;
      i >= 0 && i > races.length - 1 - LATEST_EVENT_LOOKBACK;
      i--
    ) {
      const candidate = races[i]
      try {
        const data = await fetchSessionsByEvent(Number(year), candidate.name)
        const sessions: (F1Session & SessionDateFields)[] = data?.sessions || []
        const starts = sessions
          .map((s) => {
            const raw = s.start_date || s.date || s.session_date
            return raw ? new Date(raw).getTime() : NaN
          })
          .filter((t) => Number.isFinite(t))
        if (starts.length && Math.min(...starts) <= now) return candidate
      } catch {
        // Try the previous event rather than failing the whole resolution.
      }
    }

    // Nothing has started yet (e.g. a brand-new season): fall back to the first.
    return pickDefaultEvent(events)
  }

  const loadEvents = async (year: string, preserveSelection = true) => {
    const data = await fetchEventsByYear(Number(year))
    const events: F1Event[] = data.events || []
    setAvailableEvents(events)

    if (events.length > 0) {
      const stillValid =
        preserveSelection &&
        events.some((e) => (e.official_name || e.name) === selectedEventName)
      if (!stillValid) {
        const defaultEvent = await resolveLatestEvent(events, year)
        if (defaultEvent) {
          setSelectedEventName(defaultEvent.official_name || defaultEvent.name)
        }
      }
    }
    return events
  }

  useEffect(() => {
    if (selectedYear) {
      loadEvents(selectedYear, false).catch(console.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear])

  const useLatestRace = async () => {
    if (!availableEvents.length) return
    setIsResolvingLatestRace(true)
    try {
      const defaultEvent = await resolveLatestEvent(availableEvents, selectedYear)
      if (defaultEvent) {
        setSelectedEventName(defaultEvent.official_name || defaultEvent.name)
      }
    } catch (error) {
      console.error("Error resolving latest race:", error)
      notify?.error?.("Failed to find the latest race")
    } finally {
      setIsResolvingLatestRace(false)
    }
  }

  const loadSessions = async (year: string, eventName: string, events: F1Event[]) => {
    const event = events.find((e) => (e.official_name || e.name) === eventName)
    const apiEventName = event ? event.name : eventName

    try {
      const data = await fetchSessionsByEvent(Number(year), apiEventName)
      const sessions: F1Session[] = data.sessions || []
      const resolved = sessions.length > 0 ? sessions : DEFAULT_SESSIONS
      setAvailableSessions(resolved)

      // Tell the cache policy when each of these sessions ends. A finished
      // session's data is immutable, so this is what lets requests for it be
      // cached hard instead of conservatively. Registered under both event-name
      // spellings, since callers pass whichever they hold.
      for (const session of sessions as (F1Session & SessionDateFields)[]) {
        const code = getSessionCode(session.name, session.type, session.number)
        const dates = { startDate: session.start_date, endDate: session.end_date }
        recordSessionEnd(Number(year), apiEventName, code, dates)
        if (eventName !== apiEventName) recordSessionEnd(Number(year), eventName, code, dates)
      }

      if (resolved.length > 0) {
        const currentValid = resolved.find(
          (s) => getSessionCode(s.name, s.type, s.number) === selectedSession
        )
        if (!currentValid) {
          const fallback =
            defaultSessionPick === "last"
              ? resolved[resolved.length - 1]
              : resolved.find((s) => s.type === "Practice" && s.number === 1) || resolved[0]
          setSelectedSession(getSessionCode(fallback.name, fallback.type, fallback.number))
        }
      }
    } catch {
      setAvailableSessions(DEFAULT_SESSIONS)
      const currentValid = DEFAULT_SESSIONS.find(
        (s) => getSessionCode(s.name, s.type, s.number) === selectedSession
      )
      if (!currentValid) {
        setSelectedSession(defaultSessionPick === "last" ? "R" : "FP1")
      }
    }
  }

  useEffect(() => {
    if (selectedYear && selectedEventName) {
      loadSessions(selectedYear, selectedEventName, availableEvents)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedEventName, availableEvents])

  const handleRefreshSessions = async () => {
    setIsRefreshingSessions(true)
    try {
      const events = await loadEvents(selectedYear, true)
      await loadSessions(selectedYear, selectedEventName, events)
      notify?.success?.("Sessions refreshed")
    } catch (error) {
      console.error("Error refreshing sessions:", error)
      notify?.error?.("Failed to refresh sessions")
    } finally {
      setIsRefreshingSessions(false)
    }
  }

  /** Friendly event name to pass as `gp` to the API. */
  const apiEventName = useMemo(() => {
    const event = availableEvents.find((e) => (e.official_name || e.name) === selectedEventName)
    return event ? event.official_name || event.name : selectedEventName
  }, [availableEvents, selectedEventName])

  /** Full session name (e.g. "Race") for the selected session code. */
  const sessionName = useMemo(() => {
    const sessionObj = availableSessions.find(
      (s) => getSessionCode(s.name, s.type, s.number) === selectedSession
    )
    return sessionObj ? sessionObj.name : selectedSession
  }, [availableSessions, selectedSession])

  return {
    selectedYear,
    setSelectedYear,
    selectedEventName,
    setSelectedEventName,
    availableEvents,
    availableSessions,
    selectedSession,
    setSelectedSession,
    apiEventName,
    sessionName,
    useLatestRace,
    isResolvingLatestRace,
    handleRefreshSessions,
    isRefreshingSessions,
  }
}
