'use client';

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
import { ThrottleAverageData } from '@/types/plot-types'

interface ThrottleAverageGraphProps {
  data: ThrottleAverageData[]
  throttleDomain?: [number, number]
  height?: number
}

export function ThrottleAverageGraph({ data, throttleDomain, height = 700 }: ThrottleAverageGraphProps) {
  // Don't render if no data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No throttle data available
      </div>
    )
  }

  return (
    <div style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ right: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          <XAxis type="number" domain={throttleDomain} stroke="#9CA3AF" />
          <YAxis 
            dataKey="driver" 
            type="category" 
            stroke="#F9FAFB" 
            width={120}
            tick={{ fontSize: 14   }}
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
          <Bar dataKey="throttle" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
            <LabelList 
              dataKey="throttle" 
              position="right"
              style={{ 
                fill: "#F9FAFB", 
                fontSize: "12px", 
                fontWeight: "600" 
              }}
              formatter={(value: any) => `${Number(value).toFixed(1)}%`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>      
    </div>
  )
}