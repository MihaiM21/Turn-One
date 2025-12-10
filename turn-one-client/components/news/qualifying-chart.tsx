"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QualifyingResult } from "@/types/news-types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { Trophy } from "lucide-react";

interface QualifyingChartProps {
  data: QualifyingResult[];
  sessionName: string;
}

export function QualifyingChart({ data, sessionName }: QualifyingChartProps) {
  // Format data for the chart - show top 10
  const chartData = data.slice(0, 10).map((result, index) => ({
    driver: result.Driver,
    delta: result.LapTimeDelta,
    color: result.Color,
    position: index + 1,
    team: result.Team,
    lapTime: result.LapTime,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-bold text-foreground" style={{ color: data.color }}>
            P{data.position} - {data.driver}
          </p>
          <p className="text-sm text-muted-foreground">{data.team}</p>
          <p className="text-sm font-mono mt-1 text-foreground">
            Lap Time: <span className="font-semibold">{data.lapTime}</span>
          </p>
          <p className="text-sm font-mono text-foreground">
            Delta: <span className="font-semibold">+{data.delta.toFixed(3)}s</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-card/30 backdrop-blur-sm border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold mb-1">Qualifying Results</CardTitle>
            <CardDescription className="text-xs">Lap time delta (Top 10)</CardDescription>
          </div>
          <Trophy className="w-5 h-5 text-yellow-500/70" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="horizontal"
              margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="driver"
                stroke="#9CA3AF"
                tick={{ fill: "#F9FAFB", fontSize: 12 }}
              />
              <YAxis
                label={{ value: "Time Delta (s)", angle: -90, position: "insideLeft", fill: "#9CA3AF" }}
                stroke="#9CA3AF"
                tick={{ fill: "#F9FAFB", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(55, 65, 81, 0.3)" }} />
              <Bar dataKey="delta" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList 
                  dataKey="delta" 
                  position="right"
                  style={{ fill: "#F9FAFB", fontSize: "12px", fontWeight: "600" }}
                  formatter={(value: any) => `+${Number(value).toFixed(3)}s`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
