'use client';

import { ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ZAxis } from 'recharts'
import { TyreDegradationData } from '@/types/plot-types-v2'
import { AdvancedPlotSettings } from '@/types/plot-types'

interface TyreDegradationGraphProps {
  data: TyreDegradationData
  advancedSettings?: AdvancedPlotSettings
}

export function TyreDegradationGraph({ data, advancedSettings }: TyreDegradationGraphProps) {
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
        No tyre degradation data available
      </div>
    )
  }

  const s = settings.textScale ?? 1
  const tickFontSize = Math.round(14 * s)

  const maxLapAge = Math.max(...data.flatMap((c) => c.points.map((p) => p.tyre_age)), 1)

  // Only slope is provided by the API; derive the intercept from the
  // observed means so the fitted trendline passes through the data cloud.
  const trendlines = data.map((compound) => {
    const n = compound.points.length
    const meanLapAge = n > 0 ? compound.points.reduce((a, p) => a + p.tyre_age, 0) / n : 0
    const meanLapTime = n > 0 ? compound.points.reduce((a, p) => a + p.lap_time_s, 0) / n : 0
    const intercept = meanLapTime - compound.deg_rate_s_per_lap * meanLapAge
    const line = [1, maxLapAge].map((tyreAge) => ({
      tyre_age: tyreAge,
      [`trend_${compound.compound}`]: intercept + compound.deg_rate_s_per_lap * tyreAge,
    }))
    return { compound: compound.compound, line }
  })

  return (
    <div className="space-y-4">
      <div style={{ height: `${settings.chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ right: 30, top: 10 }}>
            {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
            <XAxis
              dataKey="tyre_age"
              type="number"
              domain={[0, maxLapAge + 1]}
              stroke="#9CA3AF"
              tick={{ fontSize: tickFontSize }}
              label={{ value: 'Tyre age (laps)', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
            />
            <YAxis
              dataKey="lap_time_s"
              type="number"
              stroke="#9CA3AF"
              tick={{ fontSize: tickFontSize }}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `${Number(v).toFixed(1)}s`}
              label={{ value: 'Lap time (s)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <ZAxis range={[40, 40]} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const points = payload
                  .filter((entry) => !String(entry.dataKey ?? '').startsWith('trend_'))
                  .map((entry) => entry.payload as { driver: string; tyre_age: number; lap_time_s: number })
                  .filter((p) => p && typeof p.lap_time_s === 'number')
                  .sort((a, b) => a.lap_time_s - b.lap_time_s)
                if (points.length === 0) return null
                return (
                  <div style={{ backgroundColor: 'var(--popover)', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px' }}>
                    {points.map((p, i) => {
                      const entry = payload.find((e) => e.payload === p)
                      return (
                        <p key={i} style={{ color: entry?.color, margin: 0 }}>
                          {p.driver}: {p.lap_time_s.toFixed(3)}s (age {p.tyre_age})
                        </p>
                      )
                    })}
                  </div>
                )
              }}
            />
            {settings.showLegend && <Legend />}
            {data.map((compound) => (
              <Scatter
                key={compound.compound}
                name={compound.compound}
                data={compound.points}
                fill={compound.color}
                isAnimationActive={settings.animateChart}
              />
            ))}
            {trendlines.map(({ compound, line }) => (
              <Line
                key={`trend_${compound}`}
                data={line}
                dataKey={`trend_${compound}`}
                name={`${compound} trend`}
                stroke={data.find((c) => c.compound === compound)?.color}
                strokeWidth={settings.lineThickness}
                strokeDasharray="6 3"
                dot={false}
                legendType="none"
                isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
        {data.map((c) => (
          <span key={c.compound} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
            {c.compound}: {c.deg_rate_s_per_lap.toFixed(3)}s/lap (R²={c.r_squared.toFixed(2)}, n={c.n_points})
          </span>
        ))}
      </div>
    </div>
  )
}
