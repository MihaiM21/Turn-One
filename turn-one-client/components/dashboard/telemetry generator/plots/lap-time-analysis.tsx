'use client';

import {Line, LineChart, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export interface LapTimeData {
    lap: number;
    time: number; // in seconds
    driver: string;
    sector1: number;
    sector2: number;
    sector3: number;
}

export function LapTimeAnalysisGraph({ lapTimeData }: { lapTimeData: LapTimeData[] }) {
    return(
        <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={lapTimeData}>
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
                      <Line
                        type="monotone"
                        dataKey="time"
                        stroke="#DC2626"
                        strokeWidth={3}
                        dot={{ fill: "#DC2626", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
    )
}