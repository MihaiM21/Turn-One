'use client';

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TopSpeedData } from '@/types/plot-types'

interface TopSpeedGraphProps {
  data: TopSpeedData[]
  speedDomain?: [number, number]
  height?: number
}

export function TopSpeedGraph({ data, speedDomain, height = 400 }: TopSpeedGraphProps) {
  return (
    <div className='h-[500px]'>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ right: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
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
          <Bar dataKey="speed" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>      
    </div>
  )
}