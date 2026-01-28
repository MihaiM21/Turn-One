'use client'

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Legend } from 'recharts'
import { AdvancedPlotSettings } from '@/types/plot-types'

interface GForceData {
  time: number;
  lateral: number;
  longitudinal: number;
}

export function GForceGraph({ gForceData, advancedSettings }: { gForceData: GForceData[], advancedSettings?: AdvancedPlotSettings }) {
  const settings = advancedSettings || {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: false
  }

  return (
    <ResponsiveContainer width="100%" height={settings.chartHeight}>
        <ScatterChart data={gForceData}>
            {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
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
            {settings.showLegend && <Legend />}
            <Scatter dataKey="longitudinal" fill="#DC2626" isAnimationActive={settings.animateChart} />
        </ScatterChart>
    </ResponsiveContainer>
  )
}