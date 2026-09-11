'use client';

import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { CornerDuelData } from '@/types/plot-types-v2'
import { AdvancedPlotSettings } from '@/types/plot-types'

interface CornerDuelGraphProps {
  data: CornerDuelData
  advancedSettings?: AdvancedPlotSettings
}

export function CornerDuelGraph({ data, advancedSettings }: CornerDuelGraphProps) {
  const settings = advancedSettings || {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: false,
  }

  if (!data || !data.corners || data.corners.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No corner duel data available
      </div>
    )
  }

  const s = settings.textScale ?? 1
  const tickFontSize = Math.round(13 * s)
  const d1Color = data.driver1_color || '#3b82f6'
  const d2Color = data.driver2_color || '#ef4444'

  // Trailing/leading points where one driver's telemetry hasn't started or
  // has already ended come through as delta_s: null, but the API still
  // reports their (often much larger) distance — left in, that stretches
  // the X axis far past where the line actually stops drawing. Trim to the
  // span that actually has data.
  const deltaSeries = data.delta_series.filter((p) => typeof p.delta_s === 'number')

  const apexData = data.corners.map((c) => {
    const v1 = c.min_speed_kmh?.[data.driver1]
    const v2 = c.min_speed_kmh?.[data.driver2]
    const delta = typeof v1 === 'number' && typeof v2 === 'number' ? v1 - v2 : null
    return {
      corner: `T${c.number}`,
      apex_delta_kmh: delta,
      beneficiary: c.beneficiary,
    }
  })

  const gainData = data.corners.map((c) => ({
    corner: `T${c.number}`,
    delta_gain_s: c.delta_gain_s,
    beneficiary: c.beneficiary,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border border-zinc-800 px-4 py-3">
        <p className="text-sm font-semibold">
          <span style={{ color: d1Color }}>{data.driver1}</span> vs <span style={{ color: d2Color }}>{data.driver2}</span>
        </p>
        <p className="text-xs text-zinc-400">
          {data.session_info?.event_name} — {data.session_info?.session_name}
          {data.same_team && <span className="ml-2 text-yellow-400">(teammates)</span>}
        </p>
      </div>

      {deltaSeries.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Running time delta over lap distance</p>
          <p className="text-[11px] text-zinc-500 mb-2">
            Cumulative time gap as the lap unfolds. Above zero = <span style={{ color: d2Color }}>{data.driver2}</span> is
            ahead so far; below zero = <span style={{ color: d1Color }}>{data.driver1}</span> is ahead.
          </p>
          <div style={{ height: `${Math.round(settings.chartHeight * 0.35)}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deltaSeries} margin={{ right: 30, top: 10 }}>
                {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
                <XAxis
                  dataKey="distance"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  stroke="#9CA3AF"
                  tick={{ fontSize: tickFontSize }}
                  tickFormatter={(v) => `${Math.round(Number(v))}m`}
                  label={{ value: 'Distance', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
                />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: tickFontSize }} tickFormatter={(v) => `${Number(v).toFixed(2)}s`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const value = Number(payload[0].value)
                    const leader = value > 0 ? data.driver2 : value < 0 ? data.driver1 : null
                    const leaderColor = value > 0 ? d2Color : d1Color
                    return (
                      <div style={{ backgroundColor: 'var(--popover)', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px' }}>
                        <p style={{ color: '#F9FAFB', marginBottom: 4 }}>{Math.round(Number(label))}m</p>
                        <p style={{ color: '#a855f7', margin: 0 }}>Delta: {value.toFixed(3)}s</p>
                        {leader && (
                          <p style={{ color: leaderColor, margin: 0 }}>{leader} ahead</p>
                        )}
                      </div>
                    )
                  }}
                />
                <ReferenceLine y={0} stroke="#71717a" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="delta_s" stroke="#a855f7" strokeWidth={settings.lineThickness} dot={false} isAnimationActive={settings.animateChart} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Apex speed delta per corner</p>
        <p className="text-[11px] text-zinc-500 mb-2">
          How much faster each driver was through the corner's slowest point. Bars above zero (
          <span style={{ color: d1Color }}>{data.driver1}</span>) or below zero (
          <span style={{ color: d2Color }}>{data.driver2}</span>) show who carried more min-corner speed.
        </p>
        <div style={{ height: `${Math.round(settings.chartHeight * 0.3)}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={apexData} margin={{ top: 10, left: 10 }}>
              {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
              <XAxis dataKey="corner" stroke="#9CA3AF" tick={{ fontSize: tickFontSize }} />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fontSize: tickFontSize }}
                tickFormatter={(v) => `${Number(v).toFixed(0)} km/h`}
                label={{ value: 'Apex speed delta', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const row = payload[0].payload as (typeof apexData)[number]
                  if (row.apex_delta_kmh === null) {
                    return (
                      <div style={{ backgroundColor: 'var(--popover)', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px' }}>
                        <p style={{ color: '#F9FAFB', margin: 0 }}>{label}: no data</p>
                      </div>
                    )
                  }
                  const faster = row.apex_delta_kmh >= 0 ? data.driver1 : data.driver2
                  const fasterColor = row.apex_delta_kmh >= 0 ? d1Color : d2Color
                  return (
                    <div style={{ backgroundColor: 'var(--popover)', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px' }}>
                      <p style={{ color: '#F9FAFB', marginBottom: 4 }}>{label}</p>
                      <p style={{ color: fasterColor, margin: 0 }}>
                        {faster} faster by {Math.abs(row.apex_delta_kmh).toFixed(1)} km/h
                      </p>
                    </div>
                  )
                }}
              />
              <ReferenceLine y={0} stroke="#71717a" />
              <Bar dataKey="apex_delta_kmh" isAnimationActive={settings.animateChart}>
                {apexData.map((entry, i) => (
                  <Cell key={i} fill={(entry.apex_delta_kmh ?? 0) >= 0 ? d1Color : d2Color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Time gained/lost per corner</p>
        <p className="text-[11px] text-zinc-500 mb-2">
          Time each driver gained or lost relative to their rival through that corner (colored by who benefited).
        </p>
        <div style={{ height: `${Math.round(settings.chartHeight * 0.3)}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gainData} margin={{ top: 10, left: 10 }}>
              {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
              <XAxis dataKey="corner" stroke="#9CA3AF" tick={{ fontSize: tickFontSize }} />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fontSize: tickFontSize }}
                tickFormatter={(v) => `${Number(v).toFixed(2)}s`}
                label={{ value: 'Time gained/lost', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const row = payload[0].payload as (typeof gainData)[number]
                  const color = row.beneficiary === data.driver1 ? d1Color : d2Color
                  return (
                    <div style={{ backgroundColor: 'var(--popover)', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px' }}>
                      <p style={{ color: '#F9FAFB', marginBottom: 4 }}>{label}</p>
                      <p style={{ color, margin: 0 }}>
                        {row.beneficiary ?? '-'} gained {Math.abs(row.delta_gain_s).toFixed(3)}s
                      </p>
                    </div>
                  )
                }}
              />
              <ReferenceLine y={0} stroke="#71717a" />
              <Bar dataKey="delta_gain_s" isAnimationActive={settings.animateChart}>
                {gainData.map((entry, i) => (
                  <Cell key={i} fill={entry.beneficiary === data.driver1 ? d1Color : d2Color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
