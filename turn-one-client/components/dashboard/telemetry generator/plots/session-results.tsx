'use client';

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import { SessionResultsData, AdvancedPlotSettings } from '@/types/plot-types'

interface SessionResultsGraphProps {
  data: SessionResultsData[]
  deltaDomain?: [number, number]
  height?: number
  advancedSettings?: AdvancedPlotSettings
}

export function SessionResultsGraph({ data, deltaDomain, height = 700, advancedSettings }: SessionResultsGraphProps) {
  const settings = advancedSettings || {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: true
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No session results data available
      </div>
    )
  }

  const sortedData = [...data].sort((a, b) => a.LapTimeDelta - b.LapTimeDelta)

  const s = settings.textScale ?? 1
  const tickFontSize  = Math.round(14 * s)
  const yAxisWidth    = Math.round(60  * s)
  const marginRight   = Math.round(180 * s)
  const lapTimeOffset = Math.round(12  * s)
  const deltaOffset   = Math.round(90  * s)

  // Upper bound of the x-axis domain — needed to compute bar-right x in ReferenceLine labels
  const xDomainMax = Math.max(
    deltaDomain?.[1] ?? 0,
    ...sortedData.map(e => e.LapTimeDelta),
    0.001   // guard against division-by-zero when there's only one driver
  )

  return (
    <div style={{ height: `${settings.chartHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedData} layout="vertical" margin={{ right: marginRight, left: 20 }}>
          {settings.showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          )}
          <XAxis
            type="number"
            domain={deltaDomain || [0, 'dataMax']}
            stroke="#9CA3AF"
            tick={{ fontSize: tickFontSize }}
            tickFormatter={(value) => `+${value.toFixed(3)}s`}
          />
          <YAxis
            dataKey="Driver"
            type="category"
            stroke="#F9FAFB"
            width={yAxisWidth}
            tick={{ fontSize: tickFontSize }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--popover)',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#F9FAFB' }}
            itemStyle={{ color: '#F9FAFB' }}
            formatter={(value) => [
              <span key="v" style={{ color: '#F9FAFB' }}>
                +{Number(value).toFixed(3)}s behind leader
              </span>,
              'Gap',
            ]}
            labelFormatter={(label) => {
              const entry = sortedData.find(item => item.Driver === label)
              return (
                <div>
                  <span style={{ color: entry?.Color || '#F9FAFB', fontWeight: 'bold' }}>{label}</span>
                  <br />
                  <span style={{ color: '#9CA3AF', fontSize: '12px' }}>
                    {entry?.Team} • {entry?.LapTime}
                  </span>
                </div>
              )
            }}
          />
          {settings.showLegend && <Legend />}

          <Bar dataKey="LapTimeDelta" radius={[0, 4, 4, 0]} isAnimationActive={settings.animateChart}>
            {sortedData.map((entry, index) => (
              <Cell key={index} fill={entry.Color} />
            ))}
          </Bar>

          {/* One ReferenceLine per driver for labels.
              ReferenceLine resolves y from the categorical axis (correct for all rows,
              including the 0-width pole sitter bar that causes LabelList to shift positions).
              x is computed as proportion of delta within the domain. */}
          {settings.showDataLabels && sortedData.map((entry) => (
            <ReferenceLine
              key={`rl-${entry.Driver}`}
              y={entry.Driver}
              stroke="transparent"
              label={(refProps: any) => {
                const vb = refProps.viewBox
                if (!vb || !vb.width) return null
                const barRightX = vb.x + (entry.LapTimeDelta / xDomainMax) * vb.width
                return (
                  <g>
                    <text
                      x={barRightX + lapTimeOffset}
                      y={vb.y}
                      fill="#F9FAFB"
                      fontSize={Math.round(11 * s)}
                      fontWeight={600}
                      dominantBaseline="middle"
                    >
                      {entry.LapTime}
                    </text>
                    <text
                      x={barRightX + deltaOffset}
                      y={vb.y}
                      fill="#9CA3AF"
                      fontSize={Math.round(10 * s)}
                      dominantBaseline="middle"
                    >
                      {entry.LapTimeDelta === 0 ? 'POLE' : `+${entry.LapTimeDelta.toFixed(3)}s`}
                    </text>
                  </g>
                )
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
