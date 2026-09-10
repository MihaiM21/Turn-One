"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ChartViewportProvider, type XDomain } from "./chart-viewport-context"

const MIN_SCALE = 1
const MAX_SCALE = 8
const ZOOM_STEP = 1.25
const PAN_STEP_PX = 60

interface Transform {
  scale: number
  x: number
  y: number
}

const IDENTITY: Transform = { scale: 1, x: 0, y: 0 }

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/**
 * Keeps panned content covering the frame: at scale 1 there is nothing to pan,
 * and beyond that the offset is bounded by how much content overflows.
 */
function clampTranslate(next: Transform, width: number, height: number): Transform {
  if (next.scale <= 1) return { scale: next.scale, x: 0, y: 0 }
  return {
    scale: next.scale,
    x: clamp(next.x, width * (1 - next.scale), 0),
    y: clamp(next.y, height * (1 - next.scale), 0),
  }
}

interface ViewportSurfaceProps {
  children: ReactNode
  /** Omitted when already expanded, which hides the expand control. */
  onExpand?: () => void
  onResetDomain?: () => void
  hasDomainZoom: boolean
}

/**
 * The interactive surface: a clipping frame around a transformed inner div.
 *
 * The transform is applied for paint only, so it never changes the layout box
 * children measure themselves against. That matters because 25 of the 26 plots
 * use Recharts ResponsiveContainer, which sizes its SVG from a ResizeObserver
 * on its parent. Scaling visually rather than by resizing keeps it entirely
 * unaware of the zoom, just like browser page zoom, and works identically for
 * the hand-rolled SVG and rendered-PNG plots.
 */
function ViewportSurface({ children, onExpand, onResetDomain, hasDomainZoom }: ViewportSurfaceProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState<Transform>(IDENTITY)

  /** Active pointers, for drag-pan and two-finger pinch. */
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchDistance = useRef<number | null>(null)

  const measure = () => {
    const rect = frameRef.current?.getBoundingClientRect()
    return { width: rect?.width ?? 0, height: rect?.height ?? 0 }
  }

  const zoomAbout = useCallback((factor: number, originX?: number, originY?: number) => {
    setTransform((current) => {
      const { width, height } = measure()
      const nextScale = clamp(current.scale * factor, MIN_SCALE, MAX_SCALE)
      if (nextScale === current.scale) return current

      // Anchor on a point so whatever sits under the cursor stays put.
      const cx = originX ?? width / 2
      const cy = originY ?? height / 2
      const ratio = nextScale / current.scale

      return clampTranslate(
        { scale: nextScale, x: cx - (cx - current.x) * ratio, y: cy - (cy - current.y) * ratio },
        width,
        height,
      )
    })
  }, [])

  const reset = useCallback(() => {
    setTransform(IDENTITY)
    onResetDomain?.()
  }, [onResetDomain])

  // Wheel zoom is bound manually because preventDefault requires a non-passive
  // listener. It is scoped to the frame, so scrolling elsewhere is untouched.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = frame.getBoundingClientRect()
      zoomAbout(
        event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP,
        event.clientX - rect.left,
        event.clientY - rect.top,
      )
    }

    frame.addEventListener("wheel", onWheel, { passive: false })
    return () => frame.removeEventListener("wheel", onWheel)
  }, [zoomAbout])

  const isZoomed = transform.scale > 1

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    // Only capture the pointer once there is something to pan. At scale 1 the
    // surface must stay transparent to input, or the Recharts hover tooltips
    // every plot depends on would stop working.
    if (pointers.current.size === 1 && !isZoomed) return
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId)
    if (!previous) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    const active = [...pointers.current.values()]

    if (active.length >= 2) {
      const [a, b] = active
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinchDistance.current != null && pinchDistance.current > 0) {
        const rect = frameRef.current?.getBoundingClientRect()
        zoomAbout(
          distance / pinchDistance.current,
          (a.x + b.x) / 2 - (rect?.left ?? 0),
          (a.y + b.y) / 2 - (rect?.top ?? 0),
        )
      }
      pinchDistance.current = distance
      return
    }

    if (!isZoomed) return
    const dx = event.clientX - previous.x
    const dy = event.clientY - previous.y
    setTransform((current) => {
      const { width, height } = measure()
      return clampTranslate({ ...current, x: current.x + dx, y: current.y + dy }, width, height)
    })
  }

  const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size < 2) pinchDistance.current = null
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const panBy = (dx: number, dy: number) => {
      if (!isZoomed) return
      event.preventDefault()
      setTransform((current) => {
        const { width, height } = measure()
        return clampTranslate({ ...current, x: current.x + dx, y: current.y + dy }, width, height)
      })
    }

    switch (event.key) {
      case "+":
      case "=":
        event.preventDefault()
        zoomAbout(ZOOM_STEP)
        break
      case "-":
      case "_":
        event.preventDefault()
        zoomAbout(1 / ZOOM_STEP)
        break
      case "0":
        event.preventDefault()
        reset()
        break
      case "f":
        if (onExpand) {
          event.preventDefault()
          onExpand()
        }
        break
      case "ArrowLeft":
        panBy(PAN_STEP_PX, 0)
        break
      case "ArrowRight":
        panBy(-PAN_STEP_PX, 0)
        break
      case "ArrowUp":
        panBy(0, PAN_STEP_PX)
        break
      case "ArrowDown":
        panBy(0, -PAN_STEP_PX)
        break
    }
  }

  const canReset = isZoomed || hasDomainZoom

  return (
    <div
      ref={frameRef}
      tabIndex={0}
      role="group"
      aria-label="Chart viewport. Scroll to zoom, drag to pan, press 0 to reset."
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onDoubleClick={reset}
      className="relative h-full w-full overflow-hidden outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
      style={{
        // Claim touch gestures only once zoomed, so the page scrolls normally
        // while the chart sits at its default size.
        touchAction: isZoomed ? "none" : "auto",
        cursor: isZoomed ? "grab" : "default",
      }}
    >
      <div
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: "0 0",
          width: "100%",
          height: "100%",
        }}
      >
        {children}
      </div>

      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-sm border border-zinc-800 bg-zinc-950/85 p-1 backdrop-blur">
        {isZoomed && (
          <span className="px-1.5 font-mono text-[10px] tabular-nums text-zinc-400">
            {Math.round(transform.scale * 100)}%
          </span>
        )}
        <ViewportButton
          label="Zoom out"
          onClick={() => zoomAbout(1 / ZOOM_STEP)}
          disabled={transform.scale <= MIN_SCALE}
        >
          <Minus className="h-3.5 w-3.5" />
        </ViewportButton>
        <ViewportButton
          label="Zoom in"
          onClick={() => zoomAbout(ZOOM_STEP)}
          disabled={transform.scale >= MAX_SCALE}
        >
          <Plus className="h-3.5 w-3.5" />
        </ViewportButton>
        <ViewportButton label="Reset view" onClick={reset} disabled={!canReset}>
          <RotateCcw className="h-3.5 w-3.5" />
        </ViewportButton>
        {onExpand && (
          <ViewportButton label="Expand to full screen" onClick={onExpand}>
            <Maximize2 className="h-3.5 w-3.5" />
          </ViewportButton>
        )}
      </div>
    </div>
  )
}

function ViewportButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className="h-6 w-6 p-0 text-zinc-400 hover:text-foreground"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}

export interface ChartViewportProps {
  /**
   * The plot to display. Pass a function to render differently when expanded —
   * plots size themselves via AdvancedPlotSettings.chartHeight, so a static
   * node would keep its inline height in the dialog and merely gain whitespace
   * rather than becoming genuinely bigger.
   */
  children: ReactNode | ((state: { isExpanded: boolean }) => ReactNode)
  /** Heading shown when expanded. */
  title: string
  /**
   * True when the wrapped plot reads ChartViewportContext to restrict its own X
   * axis. This only controls whether reset also clears the data window — the
   * visual zoom applies to every plot either way.
   */
  domainZoomable?: boolean
}

/**
 * Adds zoom, pan and a full-screen view to any rendered plot.
 *
 * Two independent mechanisms share one reset:
 *  - a visual transform, which needs nothing from the chart itself; and
 *  - an optional data window (chart-viewport-context.tsx) that charts opt into,
 *    so their axes re-tick instead of merely being magnified.
 */
export function ChartViewport({ children, title, domainZoomable = false }: ChartViewportProps) {
  const [expanded, setExpanded] = useState(false)
  const [xDomain, setXDomain] = useState<XDomain | null>(null)

  const resetDomain = useCallback(() => setXDomain(null), [])

  const inlineContext = useMemo(() => ({ xDomain, setXDomain, isExpanded: false }), [xDomain])
  const expandedContext = useMemo(() => ({ xDomain, setXDomain, isExpanded: true }), [xDomain])

  const hasDomainZoom = domainZoomable && xDomain !== null
  const onResetDomain = domainZoomable ? resetDomain : undefined

  const render = (isExpanded: boolean) =>
    typeof children === "function" ? children({ isExpanded }) : children

  return (
    <>
      {expanded ? (
        <div className="flex h-[400px] items-center justify-center border border-dashed border-zinc-800 text-sm text-zinc-500">
          Showing full screen — close it to bring the chart back here.
        </div>
      ) : (
        <ChartViewportProvider value={inlineContext}>
          <ViewportSurface
            onExpand={() => setExpanded(true)}
            onResetDomain={onResetDomain}
            hasDomainZoom={hasDomainZoom}
          >
            {render(false)}
          </ViewportSurface>
        </ChartViewportProvider>
      )}

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent
          className="flex h-[92vh] w-[96vw] max-w-[96vw] flex-col gap-3 p-4 sm:max-w-[96vw]"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogTitle className="text-sm font-medium text-zinc-300">{title}</DialogTitle>
          {/* Mounting the chart at the dialog size lets ResponsiveContainer
              re-measure and lay out properly, rather than magnifying the small
              version. */}
          <div className="min-h-0 flex-1">
            <ChartViewportProvider value={expandedContext}>
              <ViewportSurface onResetDomain={onResetDomain} hasDomainZoom={hasDomainZoom}>
                {render(true)}
              </ViewportSurface>
            </ChartViewportProvider>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
