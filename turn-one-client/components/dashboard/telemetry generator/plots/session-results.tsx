'use client';

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts'
import { SessionResultsData, AdvancedPlotSettings } from '@/types/plot-types'

interface SessionResultsGraphProps {
  data: SessionResultsData[]
  deltaDomain?: [number, number]
  height?: number
  advancedSettings?: AdvancedPlotSettings
}

export function SessionResultsGraph({ data, deltaDomain, height = 700, advancedSettings }: SessionResultsGraphProps) {
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
        No session results data available
      </div>
    )
  }

  // Sort data by lap time delta (fastest first)
  const sortedData = [...data].sort((a, b) => a.LapTimeDelta - b.LapTimeDelta)

  return (
    <div style={{ height: `${settings.chartHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedData} layout="vertical" margin={{ right: 140, left: 20 }}>
          {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />}
          <XAxis 
            type="number" 
            domain={deltaDomain || [0, 'dataMax']}
            stroke="#9CA3AF"
            tickFormatter={(value) => `+${value.toFixed(3)}s`}
          />
          <YAxis 
            dataKey="Driver" 
            type="category" 
            stroke="#F9FAFB" 
            width={60}
            tick={{ fontSize: 14 }}
            tickFormatter={(value) => value}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--popover)",
              border: "1px solid #374151",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#F9FAFB" }}
            itemStyle={{ color: "#F9FAFB" }}
            formatter={(value, name, props) => [
              <span key="value" style={{ color: "#F9FAFB" }}>
                +{Number(value).toFixed(3)}s behind leader
              </span>,
              "Gap"
            ]}
            labelFormatter={(label) => {
              const entry = sortedData.find(item => item.Driver === label)
              return (
                <div>
                  <span style={{ color: entry?.Color || "#F9FAFB", fontWeight: "bold" }}>
                    {label}
                  </span>
                  <br />
                  <span style={{ color: "#9CA3AF", fontSize: "12px" }}>
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
            {settings.showDataLabels && (
              <>
                <LabelList 
                  dataKey="LapTime" 
                  position="right"
                  offset={10}
                  style={{ 
                    fill: "#F9FAFB", 
                    fontSize: "11px", 
                    fontWeight: "500" 
                  }}
                  formatter={(value: any) => value}
                />
                <LabelList 
                  dataKey="LapTimeDelta" 
                  position="right"
                  offset={80}
                  style={{ 
                    fill: "#9CA3AF", 
                    fontSize: "10px", 
                    fontWeight: "400"
                  }}
                  formatter={(value: any) => value === 0 ? "POLE" : `+${Number(value).toFixed(3)}s`}
                />
              </>
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>      
    </div>
  )
}