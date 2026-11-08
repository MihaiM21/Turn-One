'use client';

import { RacePaceHeatmapData } from '@/types/plot-types-v2'
import { AdvancedPlotSettings } from '@/types/plot-types'
import { deltaToColor, LAP_STATUS_COLORS } from '@/lib/color-scale'

interface RacePaceHeatmapGraphProps {
  data: RacePaceHeatmapData
  advancedSettings?: AdvancedPlotSettings
}

export function RacePaceHeatmapGraph({ data, advancedSettings }: RacePaceHeatmapGraphProps) {
  const settings = advancedSettings || {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: false,
  }

  if (!data || !data.grid || !data.drivers || data.drivers.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No race pace heatmap data available
      </div>
    )
  }

  const s = settings.textScale ?? 1
  const cellFont = Math.round(10 * s)
  const cellSize = Math.max(24, Math.round(28 * s))

  const allDeltas = Object.values(data.grid).flat().filter((v): v is number => v !== null)
  const maxAbs = allDeltas.length > 0 ? Math.max(...allDeltas.map((v) => Math.abs(v))) : 1
  const scLaps = new Set(data.sc_laps ?? [])

  return (
    <div className="space-y-3">
      <div
        className="overflow-auto border border-border"
        style={{ maxHeight: `${settings.chartHeight}px` }}
      >
        <table className="border-collapse" style={{ fontSize: `${cellFont}px` }}>
          <thead>
            <tr>
              <th
                className="sticky left-0 top-0 z-20 bg-card border-b border-r border-border px-2 py-1 text-left text-muted-foreground"
                style={{ minWidth: cellSize * 2 }}
              >
                Driver
              </th>
              {data.laps.map((lap) => (
                <th
                  key={lap}
                  className="sticky top-0 z-10 bg-card border-b border-border text-muted-foreground font-normal"
                  style={{ width: cellSize, minWidth: cellSize }}
                >
                  {lap % 5 === 0 || lap === data.laps[0] ? lap : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.drivers.map((driver) => {
              const row = data.grid[driver] ?? []
              const pitLapsForDriver = new Set(data.pit_laps?.[driver] ?? [])
              return (
                <tr key={driver}>
                  <td className="sticky left-0 z-10 bg-card border-r border-border px-2 py-0.5 font-mono font-semibold text-foreground/95">
                    {driver}
                  </td>
                  {data.laps.map((lap, i) => {
                    const value = row[i] ?? null
                    const isPit = pitLapsForDriver.has(lap)
                    const isSC = scLaps.has(lap)
                    const overrideColor = isPit
                      ? LAP_STATUS_COLORS.pit
                      : isSC
                      ? LAP_STATUS_COLORS.safety_car
                      : ''
                    const bg = value === null
                      ? (overrideColor || '#27272a')
                      : (overrideColor || deltaToColor(value, maxAbs))
                    const status = isPit ? 'pit' : isSC ? 'safety car' : 'green'
                    return (
                      <td
                        key={lap}
                        title={`${driver} — Lap ${lap}: ${value !== null ? `${value > 0 ? '+' : ''}${value.toFixed(3)}s` : '-'} (${status})`}
                        style={{ backgroundColor: bg, width: cellSize, height: cellSize }}
                        className="text-center border border-border/60"
                      />
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: deltaToColor(-maxAbs, maxAbs) }} /> Faster than median</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-zinc-500" /> On median</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: deltaToColor(maxAbs, maxAbs) }} /> Slower than median</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: LAP_STATUS_COLORS.pit }} /> Pit</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: LAP_STATUS_COLORS.safety_car }} /> Safety car</span>
      </div>
    </div>
  )
}
