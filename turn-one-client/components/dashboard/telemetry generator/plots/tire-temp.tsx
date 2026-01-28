'use client';

import {Line, LineChart, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { AdvancedPlotSettings } from '@/types/plot-types'

export interface tireData{
    lap: number;
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
}

export function TireTempGraph({ tireTempData, advancedSettings }: { tireTempData: tireData[], advancedSettings?: AdvancedPlotSettings }) {
    const settings = advancedSettings || {
      showGrid: true,
      showLegend: true,
      animateChart: true,
      chartHeight: 700,
      lineThickness: 2,
      showDataLabels: false
    }

    return(
        <ResponsiveContainer width="100%" height={settings.chartHeight}>
            <LineChart data={tireTempData}>
                {settings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
                <XAxis dataKey="lap" stroke="#9CA3AF" />
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
                <Line type="monotone" dataKey="frontLeft" stroke="#DC2626" strokeWidth={settings.lineThickness} isAnimationActive={settings.animateChart} />
                <Line type="monotone" dataKey="frontRight" stroke="#FC3029" strokeWidth={settings.lineThickness} isAnimationActive={settings.animateChart} />
                <Line type="monotone" dataKey="rearLeft" stroke="#EF4444" strokeWidth={settings.lineThickness} isAnimationActive={settings.animateChart} />
                <Line type="monotone" dataKey="rearRight" stroke="#F87171" strokeWidth={settings.lineThickness} isAnimationActive={settings.animateChart} />
            </LineChart>
        </ResponsiveContainer>
    )
}