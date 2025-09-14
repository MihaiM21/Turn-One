'use client'

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'

interface GForceData {
  time: number;
  lateral: number;
  longitudinal: number;
}

export function GForceGraph({ gForceData }: { gForceData: GForceData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
        <ScatterChart data={gForceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="lateral" stroke="#9CA3AF" />
            <YAxis dataKey="longitudinal" stroke="#9CA3AF" />
            <Tooltip
            contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#F9FAFB",
            }}
            />
            <Scatter dataKey="longitudinal" fill="#DC2626" />
        </ScatterChart>
    </ResponsiveContainer>
  )
}