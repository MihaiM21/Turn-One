"use client";

import { TireStrategy, DriverStint } from "@/types/news-types";
import { Disc } from "lucide-react";

type Props = {
  data?: TireStrategy | null;
};

const compoundColor: Record<string, string> = {
  soft: "#ef4444",
  medium: "#eab308",
  hard: "#e5e7eb",
  intermediate: "#22c55e",
  wet: "#3b82f6",
};

export function TireStrategyChart({ data }: Props) {
  const strategy = data ?? MOCK_STRATEGY;
  const totalLaps = strategy.totalLaps;

  const grouped = new Map<string, DriverStint[]>();
  for (const s of strategy.stints) {
    const list = grouped.get(s.driver) ?? [];
    list.push(s);
    grouped.set(s.driver, list);
  }

  return (
    <div className="border border-zinc-800 bg-zinc-950 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Race strategy</p>
          <p className="mt-0.5 font-bold">Tire stints & pit stops</p>
        </div>
        <Disc className="h-4 w-4 text-primary/70" />
      </div>

      <div className="space-y-2 px-5 py-4">
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          <span className="w-12">Driver</span>
          <span className="flex-1">Lap progression</span>
          <span className="w-12 text-right">Stops</span>
        </div>
        {Array.from(grouped.entries()).slice(0, 10).map(([driver, stints]) => {
          const stops = strategy.pitStops.filter((p) => p.driver === driver).length;
          return (
            <div key={driver} className="flex items-center gap-3">
              <span className="w-12 truncate text-xs font-medium" style={{ color: stints[0]?.color }}>
                {driver}
              </span>
              <div className="relative flex h-5 flex-1 overflow-hidden bg-zinc-900">
                {stints.map((s, i) => {
                  const startPct = (s.startLap / totalLaps) * 100;
                  const widthPct = ((s.endLap - s.startLap) / totalLaps) * 100;
                  return (
                    <div
                      key={`${driver}-${i}`}
                      className="absolute inset-y-0 flex items-center justify-center text-[9px] font-bold uppercase text-black"
                      style={{
                        left: `${startPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: compoundColor[s.compound] ?? "#71717a",
                      }}
                      title={`${s.compound} · L${s.startLap}-${s.endLap}`}
                    >
                      {s.compound.charAt(0).toUpperCase()}
                    </div>
                  );
                })}
              </div>
              <span className="w-12 text-right font-mono text-xs tabular-nums">{stops}</span>
            </div>
          );
        })}

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-3 text-[10px] uppercase tracking-wider text-zinc-500">
          {Object.entries(compoundColor).map(([compound, color]) => (
            <div key={compound} className="flex items-center gap-1.5">
              <span className="h-2 w-2" style={{ backgroundColor: color }} aria-hidden />
              {compound}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const MOCK_STRATEGY: TireStrategy = {
  totalLaps: 60,
  stints: [
    { driver: "VER", color: "#1e3a8a", startLap: 0, endLap: 22, compound: "medium" },
    { driver: "VER", color: "#1e3a8a", startLap: 22, endLap: 60, compound: "hard" },
    { driver: "NOR", color: "#f97316", startLap: 0, endLap: 18, compound: "soft" },
    { driver: "NOR", color: "#f97316", startLap: 18, endLap: 42, compound: "medium" },
    { driver: "NOR", color: "#f97316", startLap: 42, endLap: 60, compound: "hard" },
    { driver: "LEC", color: "#dc2626", startLap: 0, endLap: 25, compound: "medium" },
    { driver: "LEC", color: "#dc2626", startLap: 25, endLap: 60, compound: "hard" },
    { driver: "HAM", color: "#06b6d4", startLap: 0, endLap: 20, compound: "soft" },
    { driver: "HAM", color: "#06b6d4", startLap: 20, endLap: 45, compound: "hard" },
    { driver: "HAM", color: "#06b6d4", startLap: 45, endLap: 60, compound: "medium" },
  ],
  pitStops: [
    { driver: "VER", lap: 22 },
    { driver: "NOR", lap: 18 },
    { driver: "NOR", lap: 42 },
    { driver: "LEC", lap: 25 },
    { driver: "HAM", lap: 20 },
    { driver: "HAM", lap: 45 },
  ],
};
