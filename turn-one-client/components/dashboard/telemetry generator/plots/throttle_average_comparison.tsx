'use client';

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts'
import { ThrottleAverageData, AdvancedPlotSettings } from '@/types/plot-types'

interface ThrottleAverageGraphProps {
  data: ThrottleAverageData[]
  throttleDomain?: [number, number]
  height?: number
  advancedSettings?: AdvancedPlotSettings
}

export function ThrottleAverageGraph({ data, throttleDomain, height = 700, advancedSettings }: ThrottleAverageGraphProps) {
  // Use advanced settings or defaults
  const settings = advancedSettings || {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: true
  }

  // Don't render if no data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No throttle data available
      </div>
    )
  }

  const s = settings.textScale ?? 1
  const tickFontSize = Math.round(14 * s)
  const yAxisWidth   = Math.round(120 * s)
  const marginRight  = Math.round(100 * s)
  const labelFontSz  = `${Math.round(12 * s)}px`

  return (
    <div style={{ height: `${settings.chartHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ right: marginRight }}>
          {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />}
          <XAxis type="number" domain={throttleDomain} stroke="#9CA3AF" tick={{ fontSize: tickFontSize }} />
          <YAxis
            dataKey="driver"
            type="category"
            stroke="#F9FAFB"
            width={yAxisWidth}
            interval={0}
            tick={{ fontSize: tickFontSize }}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--popover)",
              border: "1px solid #374151",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#F9FAFB" }}
            itemStyle={{ color: "#F9FAFB" }}
            formatter={(value) => [
              <span key="value" style={{ color: "#F9FAFB" }}>{value} %</span>
            ]}
            labelFormatter={(label) => {
              const entry = data.find(item => item.driver === label)
              return <span style={{ color: entry?.color || "#F9FAFB" }}>{label}</span>
            }}
          />
          {settings.showLegend && <Legend />}
          <Bar dataKey="throttle" radius={[0, 4, 4, 0]} isAnimationActive={settings.animateChart}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
            {settings.showDataLabels && (
              <LabelList
                dataKey="throttle"
                position="right"
                style={{ fill: "#F9FAFB", fontSize: labelFontSz, fontWeight: "600" }}
                formatter={(value: any) => `${Number(value).toFixed(1)}%`}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}