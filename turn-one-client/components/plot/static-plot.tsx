"use client"

import { PLOT_BY_KEY } from "@/lib/plots/catalog"
import type { PlotFetchContext } from "@/lib/plots/types"
import type { AdvancedPlotSettings } from "@/types/plot-types"

const DEFAULT_SETTINGS: AdvancedPlotSettings = {
  showGrid: true,
  showLegend: true,
  animateChart: false,
  chartHeight: 500,
  lineThickness: 2,
  showDataLabels: false,
}

interface StaticPlotProps {
  plotKey: string
  data: unknown
  ctx: PlotFetchContext
  settings?: Partial<AdvancedPlotSettings>
}

/**
 * Renders a plot from data that was already fetched server-side (SEO pages,
 * embeds) — never calls def.fetch(). Same PlotDefinition.render() the
 * generator uses, so there is exactly one chart implementation per plot type.
 */
export function StaticPlot({ plotKey, data, ctx, settings }: StaticPlotProps) {
  const def = PLOT_BY_KEY.get(plotKey)
  if (!def) return null
  return def.render(data, { ...DEFAULT_SETTINGS, ...settings }, ctx)
}
