'use client';

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FormGuideData } from '@/types/plot-types-v2'
import { AdvancedPlotSettings } from '@/types/plot-types'

interface FormGuideGraphProps {
  data: FormGuideData
  advancedSettings?: AdvancedPlotSettings
}

type SeriesMode = 'race' | 'quali' | 'both'

export function FormGuideGraph({ data, advancedSettings }: FormGuideGraphProps) {
  const settings = advancedSettings || {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: false,
  }

  const [seriesMode, setSeriesMode] = useState<SeriesMode>('race')
  const [hoveredDriver, setHoveredDriver] = useState<string | null>(null)

  if (!data || !data.drivers || data.drivers.length === 0 || !data.rounds || data.rounds.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No form guide data available
      </div>
    )
  }

  const s = settings.textScale ?? 1
  const tickFontSize = Math.round(14 * s)

  const maxPos = Math.max(
    1,
    ...data.drivers.flatMap((d) => [...d.finish_rolling, ...d.quali_rolling].filter((v): v is number => v !== null))
  )

  const chartData = data.rounds.map((round, i) => {
    const row: Record<string, number | null> = { round }
    data.drivers.forEach((driver) => {
      row[`${driver.tla}_race`] = driver.finish_rolling[i] ?? null
      row[`${driver.tla}_quali`] = driver.quali_rolling[i] ?? null
    })
    return row
  })

  const showRace = seriesMode === 'race' || seriesMode === 'both'
  const showQuali = seriesMode === 'quali' || seriesMode === 'both'

  const lineOpacity = (tla: string) => (hoveredDriver && hoveredDriver !== tla ? 0.12 : 1)
  const lineWidth = (base: number, tla: string) => (hoveredDriver && hoveredDriver !== tla ? Math.max(1, base - 1) : base)

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">
        Each line is a driver&apos;s {data.window}-round rolling average finishing position — lower is better.
        Hover a driver below to isolate their line.
      </p>

      <div className="flex items-center gap-1.5">
        {(['race', 'quali', 'both'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setSeriesMode(mode)}
            className={`rounded border px-2 py-1 text-xs transition-colors ${
              seriesMode === mode
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
            }`}
          >
            {mode === 'race' ? 'Race' : mode === 'quali' ? 'Qualifying' : 'Both'}
          </button>
        ))}
        {seriesMode === 'both' && (
          <span className="ml-2 text-[10px] text-zinc-500">Solid = Race · Dashed = Qualifying</span>
        )}
      </div>

      <div style={{ height: `${settings.chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ right: 30, top: 10 }}>
            {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
            <XAxis dataKey="round" stroke="#9CA3AF" tick={{ fontSize: tickFontSize }} label={{ value: 'Round', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }} />
            <YAxis
              domain={[1, Math.ceil(maxPos)]}
              reversed
              stroke="#9CA3AF"
              tick={{ fontSize: tickFontSize }}
              label={{ value: 'Rolling avg finish', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const sorted = [...payload]
                  .filter((entry) => entry.value !== null && entry.value !== undefined)
                  .sort((a, b) => Number(a.value) - Number(b.value))
                if (sorted.length === 0) return null
                return (
                  <div style={{ backgroundColor: 'var(--popover)', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px' }}>
                    <p style={{ color: '#F9FAFB', marginBottom: 4 }}>Round {label}</p>
                    {sorted.map((entry) => (
                      <p key={String(entry.dataKey)} style={{ color: entry.color, margin: 0 }}>
                        {entry.name}: {Number(entry.value).toFixed(2)}
                      </p>
                    ))}
                  </div>
                )
              }}
            />
            {showRace &&
              data.drivers.map((driver) => (
                <Line
                  key={`${driver.tla}_race`}
                  type="linear"
                  dataKey={`${driver.tla}_race`}
                  name={`${driver.tla} (Race)`}
                  stroke={driver.color}
                  strokeWidth={lineWidth(settings.lineThickness, driver.tla)}
                  strokeOpacity={lineOpacity(driver.tla)}
                  dot={false}
                  connectNulls
                  isAnimationActive={settings.animateChart}
                />
              ))}
            {showQuali &&
              data.drivers.map((driver) => (
                <Line
                  key={`${driver.tla}_quali`}
                  type="linear"
                  dataKey={`${driver.tla}_quali`}
                  name={`${driver.tla} (Quali)`}
                  stroke={driver.color}
                  strokeDasharray="4 4"
                  strokeWidth={lineWidth(Math.max(1, (settings.lineThickness || 2) - 1), driver.tla)}
                  strokeOpacity={lineOpacity(driver.tla)}
                  dot={false}
                  connectNulls
                  isAnimationActive={settings.animateChart}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {settings.showLegend && (
        <div className="flex flex-wrap gap-1.5">
          {data.drivers.map((driver) => (
            <button
              key={driver.tla}
              onMouseEnter={() => setHoveredDriver(driver.tla)}
              onMouseLeave={() => setHoveredDriver(null)}
              className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs transition-opacity hover:bg-zinc-800/60"
              style={{ opacity: hoveredDriver && hoveredDriver !== driver.tla ? 0.4 : 1 }}
            >
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: driver.color }} />
              <span className="font-mono text-zinc-300">{driver.tla}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
