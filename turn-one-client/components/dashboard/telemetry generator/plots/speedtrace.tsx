'use client'

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,AreaChart,Area, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { AdvancedPlotSettings } from '@/types/plot-types'

interface SpeedData {
    distance: number;
    speed: number;
    throttle: number;
    brake: number;
}

export function SpeedTraceGraph({ speedData, advancedSettings }: { speedData: SpeedData[], advancedSettings?: AdvancedPlotSettings }) {
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
        <AreaChart data={speedData}>
            {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
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
            {settings.showLegend && <Legend />}
            <Area type="monotone" dataKey="speed" stroke="#DC2626" fill="#DC2626" fillOpacity={0.3} strokeWidth={settings.lineThickness} isAnimationActive={settings.animateChart} />
            <Area type="monotone" dataKey="throttle" stroke="#FC3029" fill="#FC3029" fillOpacity={0.2} strokeWidth={settings.lineThickness} isAnimationActive={settings.animateChart} />
        </AreaChart>
    </ResponsiveContainer>
  )
}