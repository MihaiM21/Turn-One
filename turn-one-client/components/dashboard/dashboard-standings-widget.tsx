"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getSeasonStandings } from "@/lib/newsService";
import { DriverStanding, ConstructorStanding } from "@/types/news-types";

export function DashboardStandingsWidget() {
  const [drivers, setDrivers] = useState<DriverStanding[] | null>(null);
  const [constructors, setConstructors] = useState<ConstructorStanding[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSeasonStandings()
      .then(({ drivers, constructors }) => {
        setDrivers(drivers);
        setConstructors(constructors);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-zinc-500">
        Season standings
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StandingsPanel title="Drivers" loading={loading}>
          {(drivers ?? []).slice(0, 10).map((d) => (
            <StandingRow
              key={d.code ?? d.driver}
              position={d.position}
              primary={d.driver}
              secondary={d.team}
              points={d.points}
              color={d.color}
            />
          ))}
        </StandingsPanel>

        <StandingsPanel title="Constructors" loading={loading}>
          {(constructors ?? []).map((c) => (
            <StandingRow
              key={c.team}
              position={c.position}
              primary={c.team}
              points={c.points}
              color={c.color}
            />
          ))}
        </StandingsPanel>
      </div>
    </div>
  );
}

function StandingsPanel({
  title,
  loading,
  children,
}: {
  title: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Championship</p>
          <p className="mt-0.5 font-bold">{title}</p>
        </div>
        <Trophy className="h-4 w-4 text-yellow-500/70" />
      </div>
      <div className="divide-y divide-zinc-800/60">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <Skeleton className="h-3 w-6 bg-zinc-800" />
                <Skeleton className="h-3 w-1 bg-zinc-800" />
                <Skeleton className="h-3 w-32 bg-zinc-800" />
                <Skeleton className="ml-auto h-3 w-12 bg-zinc-800" />
              </div>
            ))
          : children}
      </div>
    </div>
  );
}

function StandingRow({
  position,
  primary,
  secondary,
  points,
  color,
}: {
  position: number;
  primary: string;
  secondary?: string;
  points?: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <span className="w-6 shrink-0 font-mono text-sm tabular-nums text-zinc-500">
        {String(position).padStart(2, "0")}
      </span>
      <span
        className="h-3 w-1 shrink-0"
        style={{ backgroundColor: color ?? "#52525b" }}
        aria-hidden
      />
      <span className="truncate text-sm font-medium text-foreground">{primary}</span>
      {secondary && (
        <span className="truncate text-xs text-zinc-500">{secondary}</span>
      )}
      {typeof points === "number" && (
        <span className="ml-auto shrink-0 font-mono text-sm font-bold tabular-nums">
          {points}
          <span className="ml-1 text-[10px] font-normal text-zinc-500">PTS</span>
        </span>
      )}
    </div>
  );
}
