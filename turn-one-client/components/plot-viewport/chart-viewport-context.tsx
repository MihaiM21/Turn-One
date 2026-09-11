"use client"

import { createContext, useContext } from "react"

/** An inclusive [min, max] window on a chart's numeric X axis. */
export type XDomain = [number, number]

export interface ChartViewportState {
  /** The active data window, or null for "show everything". */
  xDomain: XDomain | null
  setXDomain: (domain: XDomain | null) => void
  /** True while the chart is rendered inside the expanded dialog. */
  isExpanded: boolean
}

const ChartViewportContext = createContext<ChartViewportState | null>(null)

export const ChartViewportProvider = ChartViewportContext.Provider

/**
 * Subscribes a chart to its surrounding viewport.
 *
 * Returns null when a chart is rendered outside a ChartViewport (the offscreen
 * export renderer, for instance), so every consumer must tolerate that and fall
 * back to its full domain.
 */
export function useChartViewport(): ChartViewportState | null {
  return useContext(ChartViewportContext)
}
