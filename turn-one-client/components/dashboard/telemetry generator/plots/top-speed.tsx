'use client';

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts'
import { TopSpeedData, AdvancedPlotSettings } from '@/types/plot-types'

interface TopSpeedGraphProps {
  data: TopSpeedData[]
  speedDomain?: [number, number]
  height?: number
  advancedSettings?: AdvancedPlotSettings
}

export function TopSpeedGraph({ data, speedDomain, height = 400, advancedSettings }: TopSpeedGraphProps) {
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
        No top speed data available
      </div>
    )
  }

  return (
    <div style={{ height: `${settings.chartHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ right: 60 }}>
          {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />}
          <XAxis type="number" domain={speedDomain} stroke="#9CA3AF" />
          <YAxis 
            dataKey="team" 
            type="category" 
            stroke="#F9FAFB" 
            width={120}
            tick={{ fontSize: 14 }}
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
              <span key="value" style={{ color: "#F9FAFB" }}>{value} km/h</span>
            ]}
            labelFormatter={(label) => {
              const entry = data.find(item => item.team === label)
              return <span style={{ color: entry?.color || "#F9FAFB" }}>{label}</span>
            }}
          />
          {settings.showLegend && <Legend />}
          <Bar dataKey="speed" radius={[0, 4, 4, 0]} isAnimationActive={settings.animateChart}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
            {settings.showDataLabels && (
              <LabelList 
                dataKey="speed" 
                position="right"
                style={{ 
                  fill: "#F9FAFB", 
                  fontSize: "12px", 
                  fontWeight: "600" 
                }}
                formatter={(value: any) => `${Number(value).toFixed(0)} km/h`}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>      
    </div>
  )
}