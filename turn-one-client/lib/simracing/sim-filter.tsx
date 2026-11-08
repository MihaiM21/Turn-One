"use client"

import * as React from "react"
import { isSimFilter, type SimFilter } from "@/lib/simracing/sims"

/**
 * The dashboard-wide sim filter (grill 2026-11-08, G10). Lives in the dashboard
 * layout, so it survives navigation between Overview, Sessions and Leaderboards.
 * A `?sim=` param on first load wins (shareable links); after that the choice is
 * kept in localStorage. Storage can throw in private windows, so every access
 * is guarded and the filter falls back to "all".
 */

export const SIM_FILTER_STORAGE_KEY = "t1.simFilter"

interface SimFilterContextValue {
  filter: SimFilter
  setFilter: (filter: SimFilter) => void
}

const SimFilterContext = React.createContext<SimFilterContextValue | null>(null)

export function readInitialSimFilter(search: string, stored: string | null): SimFilter {
  const fromUrl = new URLSearchParams(search).get("sim")
  if (isSimFilter(fromUrl)) return fromUrl
  return isSimFilter(stored) ? stored : "all"
}

function readStored(): string | null {
  try {
    return window.localStorage.getItem(SIM_FILTER_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStored(value: SimFilter) {
  try {
    window.localStorage.setItem(SIM_FILTER_STORAGE_KEY, value)
  } catch {
    // Private mode or blocked storage: the filter still works for this visit.
  }
}

export function SimFilterProvider({ children }: { children: React.ReactNode }) {
  // "all" on the server and on the first client render, then the real value after mount.
  const [filter, setFilterState] = React.useState<SimFilter>("all")

  React.useEffect(() => {
    setFilterState(readInitialSimFilter(window.location.search, readStored()))
  }, [])

  const setFilter = React.useCallback((next: SimFilter) => {
    setFilterState(next)
    writeStored(next)
  }, [])

  const value = React.useMemo(() => ({ filter, setFilter }), [filter, setFilter])
  return <SimFilterContext.Provider value={value}>{children}</SimFilterContext.Provider>
}

/** Outside the provider (e.g. a public page) the filter is a fixed "all". */
export function useSimFilter(): SimFilterContextValue {
  return React.useContext(SimFilterContext) ?? { filter: "all", setFilter: () => {} }
}
