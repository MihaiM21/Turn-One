'use client';

import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea } from 'recharts'
import { SessionWeatherData } from '@/types/plot-types-v2'
import { AdvancedPlotSettings } from '@/types/plot-types'

interface SessionWeatherGraphProps {
  data: SessionWeatherData
  advancedSettings?: AdvancedPlotSettings
}

const STATUS_FILL: Record<string, string> = {
  GREEN: 'transparent',
  YELLOW: 'rgba(234, 179, 8, 0.15)',
  RED: 'rgba(239, 68, 68, 0.2)',
  DOUBLE_YELLOW: 'rgba(234, 179, 8, 0.25)',
}

const STATUS_LABEL_COLOR: Record<string, string> = {
  GREEN: '#22c55e',
  YELLOW: '#eab308',
  RED: '#ef4444',
  DOUBLE_YELLOW: '#eab308',
}

const STATUS_LABEL_TEXT: Record<string, string> = {
  GREEN: 'Green',
  YELLOW: 'Yellow flag',
  RED: 'Red flag',
  DOUBLE_YELLOW: 'Double yellow',
}

export function SessionWeatherGraph({ data, advancedSettings }: SessionWeatherGraphProps) {
  const settings = advancedSettings || {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: false,
  }

  if (!data || !data.weather || data.weather.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No session weather data available
      </div>
    )
  }

  const s = settings.textScale ?? 1
  const tickFontSize = Math.round(14 * s)
  const periods = data.track_status_periods ?? []
  const messages = data.race_control ?? []

  const statusAtTime = (time: number) =>
    periods.find((p) => time >= p.start_time_s && time <= p.end_time_s)?.status

  const activeStatuses = Array.from(new Set(periods.map((p) => p.status).filter((st) => st !== 'GREEN')))

  return (
    <div className="space-y-4">
      <div style={{ height: `${settings.chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data.weather} margin={{ right: 30, top: 10 }}>
            {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
            <XAxis
              dataKey="time_s"
              type="number"
              stroke="#9CA3AF"
              tick={{ fontSize: tickFontSize }}
              tickFormatter={(v) => `${Math.round(Number(v) / 60)}min`}
              label={{ value: 'Session time', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#9CA3AF"
              tick={{ fontSize: tickFontSize }}
              tickFormatter={(v) => `${Number(v).toFixed(0)}°C`}
              label={{ value: 'Temperature', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#3b82f6"
              tick={{ fontSize: tickFontSize }}
              label={{ value: 'Rainfall', angle: 90, position: 'insideRight', fill: '#3b82f6' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const status = statusAtTime(Number(label))
                return (
                  <div style={{ backgroundColor: 'var(--popover)', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px' }}>
                    <p style={{ color: '#F9FAFB', marginBottom: 4 }}>T+{Math.round(Number(label) / 60)}min</p>
                    {payload.map((entry) => (
                      <p key={String(entry.dataKey)} style={{ color: entry.color, margin: 0 }}>
                        {entry.name}: {entry.value}
                      </p>
                    ))}
                    {status && status !== 'GREEN' && (
                      <p style={{ color: STATUS_LABEL_COLOR[status] ?? '#9CA3AF', margin: '4px 0 0', fontWeight: 600 }}>
                        {STATUS_LABEL_TEXT[status] ?? status}
                      </p>
                    )}
                  </div>
                )
              }}
            />
            {settings.showLegend && <Legend />}
            {periods.map((period, i) => (
              <ReferenceArea
                key={i}
                yAxisId="left"
                x1={period.start_time_s}
                x2={period.end_time_s}
                fill={STATUS_FILL[period.status] ?? 'transparent'}
                stroke="none"
              />
            ))}
            <Line yAxisId="left" type="monotone" dataKey="air_temp" name="Air temp" stroke="#22c55e" strokeWidth={settings.lineThickness} dot={false} isAnimationActive={settings.animateChart} />
            <Line yAxisId="left" type="monotone" dataKey="track_temp" name="Track temp" stroke="#f59e0b" strokeWidth={settings.lineThickness} dot={false} isAnimationActive={settings.animateChart} />
            <Bar yAxisId="right" dataKey="rainfall" name="Rainfall" fill="#3b82f6" isAnimationActive={settings.animateChart} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {activeStatuses.length > 0 && (
        <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
          {activeStatuses.map((status) => (
            <span key={status} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-4 rounded-sm"
                style={{ backgroundColor: STATUS_FILL[status] ?? 'transparent', border: `1px solid ${STATUS_LABEL_COLOR[status] ?? '#9CA3AF'}` }}
              />
              {STATUS_LABEL_TEXT[status] ?? status}
            </span>
          ))}
        </div>
      )}
      {messages.length > 0 && (
        <div className="max-h-48 overflow-y-auto border border-zinc-800 divide-y divide-zinc-800">
          {messages.map((m, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-2 text-sm">
              <span className="font-mono text-xs text-zinc-500 mt-0.5 shrink-0">Lap {m.lap}</span>
              <span className="text-zinc-300">{m.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
