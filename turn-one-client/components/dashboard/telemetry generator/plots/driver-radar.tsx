'use client';

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DriverRadarData } from '@/types/plot-types-v2'
import { AdvancedPlotSettings } from '@/types/plot-types'

interface DriverRadarGraphProps {
  data: DriverRadarData
  title: string
  subtitle?: string
  advancedSettings?: AdvancedPlotSettings
}

// Recharts' RadarChart expects one row per axis with each driver as a
// sibling key, e.g. [{ axis: "Race Pace", VER: 98.5, NOR: 95.2 }, ...].
// Axis labels are human-readable already and don't map mechanically onto the
// `raw` dict's snake_case keys (e.g. "Qualifying" -> "quali_pace"), so the
// tooltip below shows only the normalized 0-100 value, not the raw metric.
function reshapeRadarData(data: DriverRadarData) {
  return data.axes.map((axis, i) => {
    const row: Record<string, string | number> = { axis }
    data.drivers.forEach((driver) => {
      row[driver.tla] = driver.values[i] ?? 0
    })
    return row
  })
}

export function DriverRadarGraph({ data, title, subtitle, advancedSettings }: DriverRadarGraphProps) {
  const settings = advancedSettings || {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: false,
  }

  if (!data || !data.drivers || data.drivers.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No driver radar data available
      </div>
    )
  }

  const s = settings.textScale ?? 1
  const tickFontSize = Math.round(13 * s)
  const chartData = reshapeRadarData(data)

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
      </div>
      <div style={{ height: `${settings.chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} outerRadius="70%">
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: tickFontSize, fill: '#9CA3AF' }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: Math.round(11 * s), fill: '#71717a' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#F9FAFB' }}
              formatter={(value: any, name: any) => [Number(value).toFixed(1), name]}
            />
            {settings.showLegend && <Legend />}
            {data.drivers.map((driver) => (
              <Radar
                key={driver.tla}
                name={driver.tla}
                dataKey={driver.tla}
                stroke={driver.color}
                fill={driver.color}
                fillOpacity={0.2}
                strokeWidth={settings.lineThickness}
                isAnimationActive={settings.animateChart}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
