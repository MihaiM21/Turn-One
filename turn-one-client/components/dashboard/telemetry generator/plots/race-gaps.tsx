'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import { RaceGapsData } from '@/types/plot-types-v2'
import { AdvancedPlotSettings } from '@/types/plot-types'

interface RaceGapsGraphProps {
  data: RaceGapsData
  reference: 'leader' | 'average'
  advancedSettings?: AdvancedPlotSettings
}

export function RaceGapsGraph({ data, reference, advancedSettings }: RaceGapsGraphProps) {
  const settings = advancedSettings || {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: false,
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No race gaps data available
      </div>
    )
  }

  const s = settings.textScale ?? 1
  const tickFontSize = Math.round(14 * s)

  const maxLap = Math.max(...data.flatMap((d) => d.laps.map((l) => l.lap)))

  const chartData: Record<string, number | null>[] = []
  for (let lap = 1; lap <= maxLap; lap++) {
    const row: Record<string, number | null> = { lap }
    data.forEach((driver) => {
      const point = driver.laps.find((l) => l.lap === lap)
      row[driver.driver] = point ? point.gap_s : null
    })
    chartData.push(row)
  }

  return (
    <div style={{ height: `${settings.chartHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ right: 30, top: 10 }}>
          {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
          <XAxis dataKey="lap" stroke="#9CA3AF" tick={{ fontSize: tickFontSize }} label={{ value: 'Lap', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }} />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fontSize: tickFontSize }}
            label={{ value: reference === 'leader' ? 'Gap to leader (s)' : 'Gap vs avg pace (s)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const sorted = [...payload]
                .filter((entry) => entry.value !== null && entry.value !== undefined)
                .sort((a, b) => Number(a.value) - Number(b.value))
              return (
                <div style={{ backgroundColor: 'var(--popover)', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px' }}>
                  <p style={{ color: '#F9FAFB', marginBottom: 4 }}>Lap {label}</p>
                  {sorted.map((entry) => (
                    <p key={String(entry.dataKey)} style={{ color: entry.color, margin: 0 }}>
                      {String(entry.dataKey)}: {Number(entry.value).toFixed(3)}s
                    </p>
                  ))}
                </div>
              )
            }}
          />
          {settings.showLegend && <Legend />}
          {reference === 'average' && <ReferenceLine y={0} stroke="#71717a" strokeDasharray="4 4" />}
          {(() => {
            const teamSeen = new Set<string>()
            return data.map((driver) => {
              const isSecondTeammate = teamSeen.has(driver.team)
              teamSeen.add(driver.team)
              return (
                <Line
                  key={driver.driver}
                  type="monotone"
                  dataKey={driver.driver}
                  stroke={driver.color}
                  strokeWidth={settings.lineThickness}
                  strokeDasharray={isSecondTeammate ? '6 3' : undefined}
                  dot={false}
                  isAnimationActive={settings.animateChart}
                  connectNulls={false}
                />
              )
            })
          })()}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
