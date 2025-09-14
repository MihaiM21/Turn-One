'use client'

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,AreaChart,Area, Tooltip, ResponsiveContainer } from 'recharts'

interface SpeedData {
    distance: number;
    speed: number;
    throttle: number;
    brake: number;
}

export function SpeedTraceGraph({ speedData }: { speedData: SpeedData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={speedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="distance" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
            contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#F9FAFB",
            }}
            />
            <Area type="monotone" dataKey="speed" stroke="#DC2626" fill="#DC2626" fillOpacity={0.3} />
            <Area type="monotone" dataKey="throttle" stroke="#FC3029" fill="#FC3029" fillOpacity={0.2} />
        </AreaChart>
    </ResponsiveContainer>
  )
}