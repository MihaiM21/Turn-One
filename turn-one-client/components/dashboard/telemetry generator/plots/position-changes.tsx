'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { PositionChangesData } from '@/types/plot-types-v2'
import { AdvancedPlotSettings } from '@/types/plot-types'

interface PositionChangesGraphProps {
  data: PositionChangesData
  advancedSettings?: AdvancedPlotSettings
}

export function PositionChangesGraph({ data, advancedSettings }: PositionChangesGraphProps) {
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
        No position changes data available
      </div>
    )
  }

  const s = settings.textScale ?? 1
  const tickFontSize = Math.round(14 * s)

  const maxLap = Math.max(...data.flatMap((d) => d.positions.map((p) => p.lap)))
  const maxPos = Math.max(...data.flatMap((d) => d.positions.map((p) => p.position)))

  const driverByStartPos = new Map(data.map((d) => [d.start_pos, d.driver]))
  const startPosByDriver = new Map(data.map((d) => [d.driver, d.start_pos]))

  // `positions` only contains an entry for laps where a driver's position
  // actually changed, not every lap — forward-fill between events (and past
  // the last event, since holding position with no further overtakes is the
  // normal case, not a gap) so every lap has a value through the finish.
  const chartData: Record<string, number | null>[] = []
  for (let lap = 0; lap <= maxLap; lap++) {
    const row: Record<string, number | null> = { lap }
    data.forEach((driver) => {
      let pos = driver.start_pos
      for (const p of driver.positions) {
        if (p.lap > lap) break
        pos = p.position
      }
      row[driver.driver] = pos
    })
    chartData.push(row)
  }

  return (
    <div style={{ height: `${settings.chartHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ right: 30, top: Math.max(16, Math.round(tickFontSize * 1.2)) }}>
          {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
          <XAxis dataKey="lap" stroke="#9CA3AF" tick={{ fontSize: tickFontSize }} label={{ value: 'Lap', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }} />
          <YAxis
            domain={[1, maxPos]}
            reversed
            allowDecimals={false}
            ticks={Array.from({ length: maxPos }, (_, i) => i + 1)}
            tickFormatter={(pos) => driverByStartPos.get(pos) ?? pos}
            stroke="#9CA3AF"
            tick={{ fontSize: tickFontSize }}
            label={{ value: 'Position', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const sorted = [...payload].sort((a, b) => Number(a.value) - Number(b.value))
              return (
                <div style={{ backgroundColor: 'var(--popover)', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px' }}>
                  <p style={{ color: '#F9FAFB', marginBottom: 4 }}>Lap {label}</p>
                  {sorted.map((entry) => {
                    const driver = String(entry.dataKey)
                    const pos = Number(entry.value)
                    const startPos = startPosByDriver.get(driver)
                    const delta = startPos !== undefined ? startPos - pos : 0
                    return (
                      <p key={driver} style={{ color: entry.color, margin: 0 }}>
                        {driver}: {pos}{' '}
                        {delta !== 0 && (
                          <span style={{ color: delta > 0 ? '#22c55e' : '#ef4444' }}>
                            ({delta > 0 ? '+' : ''}{delta})
                          </span>
                        )}
                      </p>
                    )
                  })}
                </div>
              )
            }}
          />
          {settings.showLegend && <Legend />}
          {(() => {
            const teamSeen = new Set<string>()
            return data.map((driver) => {
              const isSecondTeammate = teamSeen.has(driver.team)
              teamSeen.add(driver.team)
              return (
                <Line
                  key={driver.driver}
                  type="linear"
                  dataKey={driver.driver}
                  stroke={driver.color}
                  strokeWidth={settings.lineThickness}
                  strokeDasharray={isSecondTeammate ? '6 3' : undefined}
                  dot={false}
                  isAnimationActive={settings.animateChart}
                  connectNulls
                />
              )
            })
          })()}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
