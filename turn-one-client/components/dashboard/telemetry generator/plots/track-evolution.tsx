'use client';

import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrackEvolutionData } from '@/types/plot-types-v2'
import { AdvancedPlotSettings } from '@/types/plot-types'

interface TrackEvolutionGraphProps {
  data: TrackEvolutionData
  advancedSettings?: AdvancedPlotSettings
}

// The API doesn't return a team/color per driver for this endpoint, so we
// assign a fixed palette by driver order.
const PALETTE = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1']

export function TrackEvolutionGraph({ data, advancedSettings }: TrackEvolutionGraphProps) {
  const settings = advancedSettings || {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: false,
  }

  const driverEntries = data ? Object.entries(data.drivers ?? {}) : []

  if (!data || driverEntries.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No track evolution data available
      </div>
    )
  }

  const s = settings.textScale ?? 1
  const tickFontSize = Math.round(14 * s)

  const maxMinute = Math.max(
    ...driverEntries.flatMap(([, points]) => points.map((p) => p.minute)),
    ...(data.overall ?? []).map((p) => p.minute),
    ...(data.weather ?? []).map((p) => p.minute)
  )

  // Merge each driver's running-best step points + overall best + track temp
  // series into a single timeline, forward-filling values between "new PB"
  // minutes so the step lines render continuously.
  const bucketedMinutes = Array.from({ length: Math.max(1, Math.ceil(maxMinute) + 1) }, (_, i) => i)

  const overallByMinute = new Map((data.overall ?? []).map((p) => [Math.floor(p.minute), p.best_s]))
  const tempByMinute = new Map((data.weather ?? []).map((p) => [Math.floor(p.minute), p.track_temp]))
  const driverPointsByMinute = driverEntries.map(([, points]) => new Map(points.map((p) => [Math.floor(p.minute), p.best_s])))

  const lastValues: Record<string, number | null> = { __overall: null }
  driverEntries.forEach(([driver]) => { lastValues[driver] = null })

  const chartData: Record<string, number | null>[] = bucketedMinutes.map((minute) => {
    const row: Record<string, number | null> = { minute }
    if (overallByMinute.has(minute)) lastValues['__overall'] = overallByMinute.get(minute)!
    row['__overall'] = lastValues['__overall']

    driverEntries.forEach(([driver], i) => {
      const map = driverPointsByMinute[i]
      if (map.has(minute)) lastValues[driver] = map.get(minute)!
      row[driver] = lastValues[driver]
    })

    row['track_temp'] = tempByMinute.get(minute) ?? null
    return row
  })

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">
        Each line is a driver&apos;s <span className="text-zinc-300">personal-best lap time so far</span> in the
        session — it steps down every time they set a new best and holds flat otherwise. The white{' '}
        <span className="text-zinc-300">Overall best</span> line is the fastest lap set by anyone up to that point.
        Track temperature (dashed, right axis) shows the grip conditions driving that improvement.
      </p>
      <div style={{ height: `${settings.chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ right: 30, top: 10 }}>
          {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
          <XAxis dataKey="minute" stroke="#9CA3AF" tick={{ fontSize: tickFontSize }} label={{ value: 'Session time (min)', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }} />
          <YAxis
            yAxisId="left"
            stroke="#9CA3AF"
            tick={{ fontSize: tickFontSize }}
            tickFormatter={(v) => `${Number(v).toFixed(1)}s`}
            domain={['auto', 'auto']}
            label={{ value: 'Lap time (s)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#f59e0b"
            tick={{ fontSize: tickFontSize }}
            tickFormatter={(v) => `${Number(v).toFixed(0)}°C`}
            label={{ value: 'Track temp', angle: 90, position: 'insideRight', fill: '#f59e0b' }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const lapTimeEntries = payload
                .filter((entry) => entry.dataKey !== 'track_temp' && entry.value !== null && entry.value !== undefined)
                .sort((a, b) => Number(a.value) - Number(b.value))
              const tempEntry = payload.find((entry) => entry.dataKey === 'track_temp')
              return (
                <div style={{ backgroundColor: 'var(--popover)', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px' }}>
                  <p style={{ color: '#F9FAFB', marginBottom: 4 }}>T+{label}min</p>
                  {lapTimeEntries.map((entry) => (
                    <p
                      key={String(entry.dataKey)}
                      style={{ color: entry.color, margin: 0, fontWeight: entry.dataKey === '__overall' ? 600 : 400 }}
                    >
                      {entry.name}: {Number(entry.value).toFixed(3)}s
                    </p>
                  ))}
                  {tempEntry && tempEntry.value !== null && tempEntry.value !== undefined && (
                    <p style={{ color: tempEntry.color, margin: '4px 0 0' }}>
                      Track temp: {Number(tempEntry.value).toFixed(1)}°C
                    </p>
                  )}
                </div>
              )
            }}
          />
          {settings.showLegend && <Legend />}
          {driverEntries.map(([driver], i) => (
            <Line
              key={driver}
              yAxisId="left"
              type="stepAfter"
              dataKey={driver}
              name={driver}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={settings.lineThickness}
              dot={false}
              connectNulls
              isAnimationActive={settings.animateChart}
            />
          ))}
          <Line
            yAxisId="left"
            type="stepAfter"
            dataKey="__overall"
            name="Overall best"
            stroke="#F9FAFB"
            strokeWidth={(settings.lineThickness || 2) + 1}
            dot={false}
            connectNulls
            isAnimationActive={settings.animateChart}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="track_temp"
            name="Track temp"
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            dot={false}
            connectNulls
            isAnimationActive={settings.animateChart}
          />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
