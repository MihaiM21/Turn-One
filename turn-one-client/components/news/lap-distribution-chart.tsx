"use client";

import { useMemo } from "react";
import { LapTimeDistributionPoint } from "@/types/news-types";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { LineChart as LineIcon } from "lucide-react";

type Props = {
  data?: LapTimeDistributionPoint[] | null;
};

export function LapDistributionChart({ data }: Props) {
  const points = data ?? [];

  const driverColor = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of points) {
      if (!m.has(p.driver)) m.set(p.driver, p.color ?? "#e11d48");
    }
    return m;
  }, [points]);

  const drivers = useMemo(() => Array.from(driverColor.keys()).slice(0, 10), [driverColor]);

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
        {points.length === 0 ? (
          <PlaceholderDistribution />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="lap"
                name="Lap"
                stroke="#71717a"
                tick={{ fontFamily: "monospace", fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="lapTime"
                name="Lap time"
                stroke="#71717a"
                tick={{ fontFamily: "monospace", fontSize: 11 }}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", fontSize: 12 }}
                labelStyle={{ color: "#fafafa" }}
              />
              {drivers.map((d) => (
                <Scatter
                  key={d}
                  name={d}
                  data={points.filter((p) => p.driver === d)}
                  fill={driverColor.get(d)}
                >
                  {points
                    .filter((p) => p.driver === d)
                    .map((_, idx) => (
                      <Cell key={idx} fill={driverColor.get(d)} />
                    ))}
                </Scatter>
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// Decorative placeholder used both when data is missing and behind the paywall gate.
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
