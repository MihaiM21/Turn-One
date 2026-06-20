"use client";

import { DriverStanding, ConstructorStanding } from "@/types/news-types";
import { Trophy } from "lucide-react";

type StandingsTableProps = {
  drivers?: DriverStanding[] | null;
  constructors?: ConstructorStanding[] | null;
  limit?: number;
};

export function StandingsTable({ drivers, constructors, limit = 10 }: StandingsTableProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <StandingsPanel
        title="Drivers"
        subtitle="Championship order"
        rows={(drivers ?? []).slice(0, limit).map((d) => ({
          position: d.position,
          name: d.driver,
          team: d.team,
          points: d.points,
          color: d.color,
        }))}
      />
      <StandingsPanel
        title="Constructors"
        subtitle="Team standings"
        rows={(constructors ?? []).slice(0, limit).map((c) => ({
          position: c.position,
          name: c.team,
          team: undefined,
          points: c.points,
          color: c.color,
        }))}
      />
    </div>
  );
}

type Row = {
  position: number;
  name: string;
  team?: string;
  points?: number;
  color?: string;
};

function StandingsPanel({ title, subtitle, rows }: { title: string; subtitle: string; rows: Row[] }) {
  return (
    <div className="border border-zinc-800 bg-zinc-950 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{subtitle}</p>
          <p className="mt-0.5 font-bold">{title}</p>
        </div>
        <Trophy className="h-4 w-4 text-yellow-500/70" />
      </div>
      <div className="divide-y divide-zinc-800/60">
        {rows.length === 0 && (
          <div className="px-5 py-6 text-sm text-zinc-500">No standings data available yet.</div>
        )}
        {rows.map((r) => (
          <div key={`${title}-${r.position}-${r.name}`} className="flex items-center gap-3 px-5 py-3">
            <span className="w-6 font-mono text-sm tabular-nums text-zinc-500">
              {String(r.position).padStart(2, "0")}
            </span>
            <span
              className="h-3 w-1"
              style={{ backgroundColor: r.color ?? "#52525b" }}
              aria-hidden
            />
            <span className="truncate text-sm font-medium text-foreground">{r.name}</span>
            {r.team && <span className="truncate text-xs text-zinc-500">{r.team}</span>}
            {typeof r.points === "number" && (
              <span className="ml-auto font-mono text-sm font-bold tabular-nums">
                {r.points}
                <span className="ml-1 text-[10px] font-normal text-zinc-500">PTS</span>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
