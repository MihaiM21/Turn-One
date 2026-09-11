"use client"

import type { ReactNode } from "react"
import { Pin, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PlotFetchContext } from "@/lib/plots/types"

/** A one-line description of what a pinned chart was generated from. */
export function describeContext(ctx: PlotFetchContext): string {
  const drivers = [ctx.driver1, ctx.driver2, ...(ctx.multiDrivers ?? [])]
    .filter((d): d is string => Boolean(d) && d !== "none")
  const unique = [...new Set(drivers)]
  const parts = [String(ctx.year), ctx.eventName, ctx.sessionName]
  if (unique.length > 0) parts.push(unique.join(" v "))
  return parts.filter(Boolean).join(" · ")
}

interface ComparePaneProps {
  /** Description of the pinned chart. */
  pinnedLabel: string
  pinnedChart: ReactNode
  /** Description of the chart currently being generated against. */
  currentLabel: string
  currentChart: ReactNode
  onClear: () => void
}

/**
 * Side-by-side comparison of a pinned chart and the current one.
 *
 * Deliberately a snapshot comparison rather than a merged overlay: it reuses
 * every plot's existing render path untouched, so it works for all 26 chart
 * types — including the ones that are a rendered PNG or hand-rolled SVG and
 * could never share an axis. A true synced-cursor overlay would need per-plot
 * work and only ever apply to a subset.
 */
export function ComparePane({
  pinnedLabel,
  pinnedChart,
  currentLabel,
  currentChart,
  onClear,
}: ComparePaneProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Pin className="h-3.5 w-3.5 text-primary" />
          Comparing two selections
        </div>
        <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-zinc-400">
          <X className="mr-1.5 h-3.5 w-3.5" />
          Stop comparing
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ComparePanel label={pinnedLabel} badge="Pinned" accent>
          {pinnedChart}
        </ComparePanel>
        <ComparePanel label={currentLabel} badge="Current">
          {currentChart}
        </ComparePanel>
      </div>
    </div>
  )
}

function ComparePanel({
  label,
  badge,
  accent,
  children,
}: {
  label: string
  badge: string
  accent?: boolean
  children: ReactNode
}) {
  return (
    <div className={`border ${accent ? "border-primary/40" : "border-zinc-800"}`}>
      <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
        <Badge
          variant="outline"
          className={`rounded-none text-[10px] uppercase tracking-wider ${
            accent ? "border-primary/50 text-primary" : "border-zinc-700 text-zinc-400"
          }`}
        >
          {badge}
        </Badge>
        <p className="truncate font-mono text-xs text-zinc-400">{label}</p>
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}
