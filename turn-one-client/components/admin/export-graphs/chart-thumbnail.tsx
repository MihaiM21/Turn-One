"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { isChartDataEmpty, type ChartDefinition, type ChartFetchContext } from "@/lib/export/chart-catalog"
import type { AdvancedPlotSettings } from "@/types/plot-types"

interface ChartThumbnailProps {
  chart: ChartDefinition
  ctx: ChartFetchContext | null
  selected: boolean
  onToggle: () => void
}

const PREVIEW_SETTINGS: AdvancedPlotSettings = {
  showGrid: true,
  showLegend: false,
  animateChart: false,
  chartHeight: 240,
  lineThickness: 2,
  showDataLabels: false,
}

export function ChartThumbnail({ chart, ctx, selected, onToggle }: ChartThumbnailProps) {
  const [data, setData] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!ctx) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    chart
      .fetch(ctx)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e) => {
        if (!cancelled) setError(String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [chart, ctx])

  return (
    <Card
      className={`p-3 border ${selected ? "border-primary bg-primary/5" : "border-zinc-800 bg-zinc-950"} cursor-pointer transition`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Checkbox checked={selected} onCheckedChange={onToggle} onClick={(e) => e.stopPropagation()} />
          <span className="text-sm font-medium">{chart.title}</span>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase">
          {chart.sessionTypes.join(" / ")}
        </span>
      </div>
      <div className="h-[240px] overflow-hidden rounded bg-black/40">
        {!ctx ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Select a session to preview
          </div>
        ) : loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center text-xs text-muted-foreground px-2 text-center gap-1">
            <span className="text-amber-400 font-medium">No data available</span>
            <span className="opacity-60">{/404/.test(error) ? "Session not yet recorded" : error}</span>
          </div>
        ) : isChartDataEmpty(chart, data) ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground px-2 text-center">
            No data for this session
          </div>
        ) : (
          chart.render(data, PREVIEW_SETTINGS)
        )}
      </div>
    </Card>
  )
}
