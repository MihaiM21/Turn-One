'use client';

import { ComposedChart, Bar, Scatter, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
import { TheoreticalBestData } from '@/types/plot-types-v2'
import { AdvancedPlotSettings } from '@/types/plot-types'

interface TheoreticalBestGraphProps {
  data: TheoreticalBestData
  advancedSettings?: AdvancedPlotSettings
}

export function TheoreticalBestGraph({ data, advancedSettings }: TheoreticalBestGraphProps) {
  const settings = advancedSettings || {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: true,
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No theoretical best data available
      </div>
    )
  }

  const s = settings.textScale ?? 1
  const tickFontSize = Math.round(14 * s)
  const yAxisWidth = Math.round(70 * s)
  const labelFontSz = `${Math.round(12 * s)}px`

  const chartData = data.map((d) => ({
    driver: d.driver,
    color: d.color,
    actual_s: d.actual_s,
    theoretical_s: d.theoretical_s,
    delta_s: d.delta_s,
    range: [Math.min(d.actual_s, d.theoretical_s), Math.max(d.actual_s, d.theoretical_s)] as [number, number],
  }))

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-white" />
          Actual best lap
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-zinc-500" />
          Theoretical best (sum of best sectors)
        </span>
      </div>
      <div style={{ height: `${settings.chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} layout="vertical" margin={{ right: 110 }}>
            {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />}
            <XAxis
              type="number"
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              stroke="#9CA3AF"
              tick={{ fontSize: tickFontSize }}
              tickFormatter={(v) => `${Number(v).toFixed(1)}s`}
            />
            <YAxis dataKey="driver" type="category" stroke="#F9FAFB" width={yAxisWidth} interval={0} tick={{ fontSize: tickFontSize }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as (typeof chartData)[number]
                return (
                  <div style={{ backgroundColor: 'var(--popover)', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px' }}>
                    <p style={{ color: '#F9FAFB', marginBottom: 4, fontWeight: 600 }}>{label}</p>
                    <p style={{ color: row.color, margin: 0 }}>Actual: {row.actual_s.toFixed(3)}s</p>
                    <p style={{ color: '#a1a1aa', margin: 0 }}>Theoretical: {row.theoretical_s.toFixed(3)}s</p>
                    <p style={{ color: '#22c55e', margin: '4px 0 0', fontWeight: 600 }}>Could&apos;ve gained: -{row.delta_s.toFixed(3)}s</p>
                  </div>
                )
              }}
            />
            <Bar dataKey="range" barSize={3} fill="#3f3f46" isAnimationActive={settings.animateChart} legendType="none">
              {settings.showDataLabels && (
                <LabelList
                  dataKey="delta_s"
                  position="right"
                  style={{ fill: '#ef4444', fontSize: labelFontSz, fontWeight: 600 }}
                  formatter={(value: any) => `-${Number(value).toFixed(3)}s`}
                />
              )}
            </Bar>
            <Scatter dataKey="theoretical_s" fill="#52525b" shape={(props: any) => <circle cx={props.cx} cy={props.cy} r={8} fill={props.fill} />} isAnimationActive={settings.animateChart} legendType="none">
              {chartData.map((_, i) => (
                <Cell key={i} fill="#52525b" />
              ))}
            </Scatter>
            <Scatter dataKey="actual_s" shape={(props: any) => <circle cx={props.cx} cy={props.cy} r={8} fill={props.fill} stroke="#F9FAFB" strokeWidth={1} />} isAnimationActive={settings.animateChart} legendType="none">
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Scatter>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
