'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceDot, ReferenceLine } from 'recharts'
import { RaceStoryData } from '@/types/plot-types-v2'
import { AdvancedPlotSettings } from '@/types/plot-types'

interface RaceStoryGraphProps {
  data: RaceStoryData
  advancedSettings?: AdvancedPlotSettings
}

const MAJOR_KINDS = new Set(['retirement', 'lead_change', 'safety_car', 'red_flag'])

export function RaceStoryGraph({ data, advancedSettings }: RaceStoryGraphProps) {
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
        No race story data available
      </div>
    )
  }

  const s = settings.textScale ?? 1
  const tickFontSize = Math.round(14 * s)

  const maxLap = Math.max(...data.drivers.flatMap((d) => d.laps.map((l) => l.lap)), 1)

  const chartData: Record<string, number | null>[] = []
  for (let lap = 1; lap <= maxLap; lap++) {
    const row: Record<string, number | null> = { lap }
    data.drivers.forEach((driver) => {
      const point = driver.laps.find((l) => l.lap === lap)
      row[driver.driver] = point ? point.gap_s : null
    })
    chartData.push(row)
  }

  const gapByDriverLap = new Map<string, number>()
  data.drivers.forEach((d) => {
    d.laps.forEach((l) => {
      if (l.gap_s !== null) gapByDriverLap.set(`${d.driver}_${l.lap}`, l.gap_s)
    })
  })

  const moments = data.key_moments ?? []
  const majorMoments = moments.filter((m) => MAJOR_KINDS.has(m.kind))

  return (
    <div className="space-y-4">
      <div style={{ height: `${settings.chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ right: 30, top: 10 }}>
            {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
            <XAxis dataKey="lap" stroke="#9CA3AF" tick={{ fontSize: tickFontSize }} label={{ value: 'Lap', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }} />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fontSize: tickFontSize }}
              label={{ value: 'Gap to leader (s)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
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
                        {String(entry.dataKey)}: +{Number(entry.value).toFixed(3)}s
                      </p>
                    ))}
                  </div>
                )
              }}
            />
            {settings.showLegend && <Legend />}
            {majorMoments.map((m, i) => (
              <ReferenceLine
                key={`moment-${i}`}
                x={m.lap}
                stroke="#ef4444"
                strokeWidth={1.5}
                label={{
                  value: m.caption,
                  position: 'top',
                  fill: '#ef4444',
                  fontSize: Math.round(10 * s),
                  offset: 10 + (i % 3) * (Math.round(10 * s) + 6),
                }}
              />
            ))}
            {(() => {
              const teamSeen = new Set<string>()
              return data.drivers.map((driver) => {
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
                    connectNulls={false}
                    isAnimationActive={settings.animateChart}
                  />
                )
              })
            })()}
            {data.drivers.flatMap((driver) =>
              driver.pit_stops.map((stop, i) => {
                const gap = gapByDriverLap.get(`${driver.driver}_${stop.lap}`)
                if (gap === undefined) return null
                return (
                  <ReferenceDot
                    key={`${driver.driver}-pit-${i}`}
                    x={stop.lap}
                    y={gap}
                    r={4}
                    fill={driver.color}
                    stroke="#F9FAFB"
                  />
                )
              })
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {moments.length > 0 && (
        <div className="max-h-48 overflow-y-auto border border-zinc-800 divide-y divide-zinc-800">
          {moments.map((m, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-2 text-sm">
              <span className="font-mono text-xs text-zinc-500 mt-0.5 shrink-0">Lap {m.lap}</span>
              <span className={MAJOR_KINDS.has(m.kind) ? 'font-semibold text-red-400' : 'text-zinc-300'}>{m.caption}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
