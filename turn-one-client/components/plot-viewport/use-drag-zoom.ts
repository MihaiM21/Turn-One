"use client"

import { useState } from "react"
import { useChartViewport } from "./chart-viewport-context"

/** The subset of Recharts' mouse-handler argument this hook needs. */
interface ChartMouseState {
  activeLabel?: string | number
}

/** Recharts accepts `['dataMin', 'dataMax']` as well as concrete numbers. */
type AxisDomain = [number | string, number | string]

export interface DragZoom {
  /**
   * The selected window, or null when not zoomed. Use this when the chart has
   * its own meaningful default domain: `domain={zoomDomain ?? myDomain}`.
   */
  zoomDomain: [number, number] | null
  /**
   * `zoomDomain` with the usual full-range fallback already applied. Spread
   * onto `<XAxis domain={xDomain} allowDataOverflow />`.
   */
  xDomain: AxisDomain
  /** Spread onto the chart element (`<LineChart {...dragHandlers}>`). */
  dragHandlers: {
    onMouseDown: (state: ChartMouseState) => void
    onMouseMove: (state: ChartMouseState) => void
    onMouseUp: () => void
    onMouseLeave: () => void
  }
  /** The band to draw while dragging, or null. */
  selection: { x1: number; x2: number } | null
}

/**
 * Drag-across-to-zoom for a chart with a continuous numeric X axis.
 *
 * The selected window lives in the surrounding ChartViewport rather than here,
 * so its reset control can clear the zoom alongside its own. Outside a viewport
 * — the offscreen export renderer, for one — this is inert and the chart shows
 * its full range.
 *
 * The two-step anchoring matters: Recharts only populates `activeLabel` once it
 * has an active tooltip point, and a press can land before that happens. Rather
 * than give up (which would wedge the drag permanently, since a null start
 * would make every later move a no-op), the first move that does carry a label
 * anchors the selection.
 */
export function useDragZoom(): DragZoom {
  const viewport = useChartViewport()
  const [start, setStart] = useState<number | null>(null)
  const [end, setEnd] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const clear = () => {
    setIsDragging(false)
    setStart(null)
    setEnd(null)
  }

  return {
    zoomDomain: viewport?.xDomain ?? null,
    xDomain: viewport?.xDomain ?? ["dataMin", "dataMax"],
    selection: start !== null && end !== null ? { x1: start, x2: end } : null,
    dragHandlers: {
      onMouseDown: (state) => {
        if (!viewport) return
        setIsDragging(true)
        if (state?.activeLabel != null) setStart(Number(state.activeLabel))
      },
      onMouseMove: (state) => {
        if (!isDragging || state?.activeLabel == null) return
        const value = Number(state.activeLabel)
        if (start === null) setStart(value)
        else setEnd(value)
      },
      onMouseUp: () => {
        if (viewport && start !== null && end !== null && start !== end) {
          viewport.setXDomain([Math.min(start, end), Math.max(start, end)])
        }
        clear()
      },
      onMouseLeave: clear,
    },
  }
}
