"use client";

import { useMemo } from "react";
import { LapTimeDistributionPoint } from "@/types/news-types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { LineChart as LineIcon } from "lucide-react";

type Props = {
  data?: LapTimeDistributionPoint[] | null;
};

const formatLapTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = (secs % 60).toFixed(1);
  return `${m}:${s.padStart(4, "0")}`;
};

export function LapDistributionChart({ data }: Props) {
  const points = data ?? [];

  const driverMeta = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of points) {
      if (!m.has(p.driver)) m.set(p.driver, p.color ?? "#e11d48");
    }
    return m;
  }, [points]);

  const drivers = useMemo(() => Array.from(driverMeta.keys()).slice(0, 10), [driverMeta]);

  // Build a lap-indexed table: [{ lap: 1, VER: 83.4, HAM: 84.1, ... }, ...]
  const chartData = useMemo(() => {
    if (points.length === 0) return [];
    const byLap = new Map<number, Record<string, number>>();
    for (const p of points) {
      if (!byLap.has(p.lap)) byLap.set(p.lap, { lap: p.lap });
      byLap.get(p.lap)![p.driver] = p.lapTime;
    }
    return Array.from(byLap.values()).sort((a, b) => a.lap - b.lap);
  }, [points]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs">
        <p className="mb-1 font-mono text-zinc-400">Lap {label}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} style={{ color: entry.color }} className="font-mono">
            {entry.dataKey}: {formatLapTime(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="border border-zinc-800 bg-zinc-950 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Lap-by-lap</p>
          <p className="mt-0.5 font-bold">Lap time distribution</p>
        </div>
        <LineIcon className="h-4 w-4 text-primary/70" />
      </div>

      <div className="h-[360px] px-3 py-4">
        {chartData.length === 0 ? (
          <PlaceholderDistribution />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis
                dataKey="lap"
                stroke="#71717a"
                tick={{ fontFamily: "monospace", fontSize: 11 }}
                label={{ value: "Lap", position: "insideBottom", offset: -4, fill: "#52525b", fontSize: 10 }}
              />
              <YAxis
                stroke="#71717a"
                tick={{ fontFamily: "monospace", fontSize: 11 }}
                tickFormatter={formatLapTime}
                domain={["auto", "auto"]}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, fontFamily: "monospace", paddingTop: 8 }}
              />
              {drivers.map((d) => (
                <Line
                  key={d}
                  type="monotone"
                  dataKey={d}
                  stroke={driverMeta.get(d)}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function PlaceholderDistribution() {
  const rows = Array.from({ length: 6 });
  return (
    <div className="flex h-full flex-col justify-between gap-2">
      {rows.map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-10 font-mono text-[10px] text-zinc-600">
            L{String((i + 1) * 8).padStart(2, "0")}
          </span>
          <div className="relative h-2 flex-1 bg-zinc-900">
            <div
              className="absolute inset-y-0 left-0 bg-primary/60"
              style={{ width: `${30 + (i * 9) % 55}%` }}
            />
            <div
              className="absolute inset-y-0 bg-zinc-500/50"
              style={{ left: `${20 + (i * 7) % 30}%`, width: `${10 + (i * 5) % 15}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
