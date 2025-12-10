"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TopSpeed } from "@/types/news-types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { Gauge } from "lucide-react";

interface TopSpeedChartProps {
  data: TopSpeed[];
}

export function TopSpeedChart({ data }: TopSpeedChartProps) {
  const chartData = data.map((team) => ({
    team: team.Team,
    speed: team["Top Speed (km/h)"],
    color: team.Color,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-bold text-foreground" style={{ color: data.color }}>
            {data.team}
          </p>
          <p className="text-sm font-mono mt-1 text-foreground">
            Top Speed: <span className="font-semibold">{data.speed} km/h</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full bg-card/30 backdrop-blur-sm border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold mb-1">Top Speed</CardTitle>
            <CardDescription className="text-xs">by Team (km/h)</CardDescription>
          </div>
          <Gauge className="w-5 h-5 text-blue-500/70" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 60, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis 
                type="number" 
                domain={[315, 335]}
                stroke="#9CA3AF"
                tick={{ fill: "#F9FAFB", fontSize: 12 }}
              />
              <YAxis
                dataKey="team"
                type="category"
                stroke="#F9FAFB"
                width={120}
                tick={{ fill: "#F9FAFB", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(55, 65, 81, 0.3)" }} />
              <Bar dataKey="speed" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList 
                  dataKey="speed" 
                  position="right"
                  style={{ fill: "#F9FAFB", fontSize: "12px", fontWeight: "600" }}
                  formatter={(value: any) => `${Number(value).toFixed(0)} km/h`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
