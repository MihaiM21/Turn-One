"use client";

import { TyreStintEntry } from "@/types/news-types";
import { Disc } from "lucide-react";

type Props = {
  data?: TyreStintEntry[] | null;
};

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: "#FF3333",
  MEDIUM: "#FFD93D",
  HARD: "#F0F0F0",
  INTERMEDIATE: "#22c55e",
  WET: "#3b82f6",
};

export function TyreStintChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="border border-zinc-800 bg-zinc-950 animate-in fade-in duration-500">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Race strategy</p>
            <p className="mt-0.5 font-bold">Tyre stints & pit stops</p>
          </div>
          <Disc className="h-4 w-4 text-primary/70" />
        </div>
        <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
          No tyre stint data available for this session
        </div>
      </div>
    );
  }

  const grouped = new Map<string, TyreStintEntry[]>();
  for (const s of data) {
    const list = grouped.get(s.driver) ?? [];
    list.push(s);
    grouped.set(s.driver, list);
  }

  const sortedDrivers = Array.from(grouped.entries()).sort(
    ([, a], [, b]) => (a[0]?.position ?? 99) - (b[0]?.position ?? 99)
  );

  const totalLaps = Math.max(...data.map((s) => s.end_lap));
  const usedCompounds = [...new Set(data.map((s) => s.compound.toUpperCase()))];

  return (
    <div className="border border-zinc-800 bg-zinc-950 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Race strategy</p>
          <p className="mt-0.5 font-bold">Tyre stints & pit stops</p>
        </div>
        <Disc className="h-4 w-4 text-primary/70" />
      </div>

      <div className="space-y-2 px-5 py-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-1">
          <span className="w-5 text-right shrink-0">P</span>
          <span className="w-10 shrink-0">DRV</span>
          <span className="flex-1">Lap progression ({totalLaps} laps)</span>
          <span className="w-10 text-right shrink-0">Stops</span>
        </div>

        {sortedDrivers.map(([driver, stints]) => {
          const position = stints[0]?.position;
          const color = stints[0]?.color;
          const stops = stints.length - 1;

          return (
            <div key={driver} className="flex items-center gap-2">
              <span className="w-5 text-right font-mono text-xs text-zinc-500 tabular-nums shrink-0">
                {position}
              </span>
              <span className="w-10 truncate text-xs font-semibold shrink-0" style={{ color }}>
                {driver}
              </span>
              <div className="relative flex h-5 flex-1 overflow-hidden bg-zinc-900">
                {stints.map((s, i) => {
                  const startPct = ((s.start_lap - 1) / totalLaps) * 100;
                  const widthPct = (s.lap_count / totalLaps) * 100;
                  const bgColor = COMPOUND_COLORS[s.compound.toUpperCase()] ?? s.color ?? "#71717a";
                  return (
                    <div
                      key={i}
                      className="absolute inset-y-0 flex items-center justify-center text-[9px] font-bold text-black"
                      style={{
                        left: `${startPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: bgColor,
                      }}
                      title={`${s.compound} · L${s.start_lap}–${s.end_lap} · ${s.lap_count} laps`}
                    >
                      {widthPct > 6 ? s.compound.charAt(0).toUpperCase() : ""}
                    </div>
                  );
                })}
              </div>
              <span className="w-10 text-right font-mono text-xs tabular-nums shrink-0">{stops}</span>
            </div>
          );
        })}

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-3 text-[10px] uppercase tracking-wider text-zinc-500">
          {usedCompounds.map((compound) => (
            <div key={compound} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0"
                style={{ backgroundColor: COMPOUND_COLORS[compound] ?? "#71717a" }}
                aria-hidden
              />
              {compound.charAt(0) + compound.slice(1).toLowerCase()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
