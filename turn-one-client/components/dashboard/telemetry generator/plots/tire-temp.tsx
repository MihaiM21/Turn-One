'use client';

import {Line, LineChart, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export interface tireData{
    lap: number;
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
}

export function TireTempGraph({ tireTempData }: { tireTempData: tireData[] }) {
    return(
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tireTempData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
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
                <Line type="monotone" dataKey="frontLeft" stroke="#DC2626" strokeWidth={2} />
                <Line type="monotone" dataKey="frontRight" stroke="#FC3029" strokeWidth={2} />
                <Line type="monotone" dataKey="rearLeft" stroke="#EF4444" strokeWidth={2} />
                <Line type="monotone" dataKey="rearRight" stroke="#F87171" strokeWidth={2} />
            </LineChart>
        </ResponsiveContainer>
    )
}