"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export const TOUR_STORAGE_KEY = "generator:tourSeen"

type Step = {
  anchor: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    anchor: "plotTypes",
    title: "Pick what to visualize",
    body: "Choose any plot type. PRO plots are unlocked with a subscription.",
  },
  {
    anchor: "raceSession",
    title: "Race & session",
    body: "Pick the season, Grand Prix, and session you want data from.",
  },
  {
    anchor: "drivers",
    title: "Drivers & options",
    body: "Some plot types need drivers selected. Defaults are pre-filled when relevant.",
  },
  {
    anchor: "advanced",
    title: "Tweak the chart",
    body: "Toggle grid, legend, animations, height, and line thickness here.",
  },
  {
    anchor: "generate",
    title: "Generate your plot",
    body: "Each plot costs 1 token. Tokens refill monthly or can be purchased.",
  },
]

type Rect = { top: number; left: number; width: number; height: number } | null

function getRect(selector: string): Rect {
  if (typeof document === "undefined") return null
  const el = document.querySelector<HTMLElement>(`[data-tour="${selector}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

type GeneratorTourProps = {
  open: boolean
  onClose: () => void
}

export function GeneratorTour({ open, onClose }: GeneratorTourProps) {
  const [stepIdx, setStepIdx] = useState(0)
  const [rect, setRect] = useState<Rect>(null)
  const [tick, setTick] = useState(0)

  const step = STEPS[stepIdx]

  useLayoutEffect(() => {
    if (!open) return
    const update = () => setRect(getRect(step.anchor))
    update()
    // Scroll target into view
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.anchor}"]`)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
    const onResize = () => setTick((t) => t + 1)
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onResize, true)
    const id = window.setTimeout(update, 350) // re-measure after scroll
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onResize, true)
      window.clearTimeout(id)
    }
  }, [open, step.anchor, tick])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish()
      if (e.key === "ArrowRight") next()
      if (e.key === "ArrowLeft") prev()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stepIdx])

  if (!open) return null

  const finish = () => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "1")
    } catch {
      /* ignore */
    }
    setStepIdx(0)
    onClose()
  }

  const next = () => {
    if (stepIdx >= STEPS.length - 1) finish()
    else setStepIdx((i) => i + 1)
  }
  const prev = () => setStepIdx((i) => Math.max(0, i - 1))

  // Position popover card next to the spotlight
  const cardWidth = 320
  const cardHeight = 180
  const margin = 12
  let cardTop = 80
  let cardLeft = 24

  if (rect && typeof window !== "undefined") {
    const vw = window.innerWidth
    const vh = window.innerHeight
    // Try below the rect first
    if (rect.top + rect.height + margin + cardHeight < vh) {
      cardTop = rect.top + rect.height + margin
      cardLeft = Math.min(Math.max(8, rect.left), vw - cardWidth - 8)
    } else if (rect.top - margin - cardHeight > 0) {
      cardTop = rect.top - margin - cardHeight
      cardLeft = Math.min(Math.max(8, rect.left), vw - cardWidth - 8)
    } else {
      // center fallback
      cardTop = Math.max(16, (vh - cardHeight) / 2)
      cardLeft = Math.max(16, (vw - cardWidth) / 2)
    }
  }

  return (
    <div className="fixed inset-0 z-[60]" aria-modal="true" role="dialog">
      {/* Click-through dim using 4 panels around the spotlight */}
      {rect ? (
        <>
          <div
            className="fixed bg-black/70 backdrop-blur-[1px]"
            style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top - 6) }}
            onClick={finish}
          />
          <div
            className="fixed bg-black/70 backdrop-blur-[1px]"
            style={{
              top: Math.max(0, rect.top - 6),
              left: 0,
              width: Math.max(0, rect.left - 6),
              height: rect.height + 12,
            }}
            onClick={finish}
          />
          <div
            className="fixed bg-black/70 backdrop-blur-[1px]"
            style={{
              top: Math.max(0, rect.top - 6),
              left: rect.left + rect.width + 6,
              right: 0,
              height: rect.height + 12,
            }}
            onClick={finish}
          />
          <div
            className="fixed bg-black/70 backdrop-blur-[1px]"
            style={{
              top: rect.top + rect.height + 6,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onClick={finish}
          />
          {/* Spotlight ring */}
          <div
            className="fixed rounded-lg ring-2 ring-primary pointer-events-none animate-pulse"
            style={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
            }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-[1px]" onClick={finish} />
      )}

      {/* Step card */}
      <div
        className="fixed bg-card border border-border rounded-lg shadow-xl p-4 space-y-3 z-[70]"
        style={{ top: cardTop, left: cardLeft, width: cardWidth }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs text-muted-foreground">
              Step {stepIdx + 1} of {STEPS.length}
            </div>
            <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={finish}
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
        <div className="flex items-center justify-between pt-1">
          <Button variant="ghost" size="sm" onClick={finish}>
            Skip
          </Button>
          <div className="flex items-center gap-2">
            {stepIdx > 0 && (
              <Button variant="outline" size="sm" onClick={prev}>
                Back
              </Button>
            )}
            <Button size="sm" onClick={next} className="bg-primary hover:bg-primary/90">
              {stepIdx === STEPS.length - 1 ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
