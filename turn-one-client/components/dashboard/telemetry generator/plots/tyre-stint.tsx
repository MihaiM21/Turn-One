"use client";

import { TyreStintEntry } from "@/types/news-types";
import { AdvancedPlotSettings } from "@/types/plot-types";

interface TyreStintGraphProps {
  data: TyreStintEntry[];
  advancedSettings?: AdvancedPlotSettings;
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: "#FF3333",
  MEDIUM: "#FFD93D",
  HARD: "#F0F0F0",
  INTERMEDIATE: "#22c55e",
  WET: "#3b82f6",
};

export function TyreStintGraph({ data, advancedSettings }: TyreStintGraphProps) {
  const settings = advancedSettings ?? {
    showGrid: true,
    showLegend: true,
    animateChart: true,
    chartHeight: 700,
    lineThickness: 2,
    showDataLabels: true,
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No tyre stint data available
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
  const lapTicks = Array.from({ length: Math.floor(totalLaps / 10) + 1 }, (_, i) => i * 10);
  const usedCompounds = [...new Set(data.map((s) => s.compound.toUpperCase()))];

  const numDrivers = sortedDrivers.length;
  // Calculate row height to fill the full chartHeight so export images have no blank space.
  const PADDING = 32;       // p-4 top + bottom
  const HEADER = settings.showGrid ? 28 : 0;
  const LEGEND = settings.showLegend ? 52 : 0;
  const GAP = 6;            // space-y-1.5 between rows
  const availableForRows = settings.chartHeight - PADDING - HEADER - LEGEND - GAP * Math.max(0, numDrivers - 1);
  const rowHeight = Math.max(20, Math.floor(availableForRows / numDrivers));
  const labelFontSize = Math.max(8, Math.min(13, Math.floor(rowHeight * 0.45)));

  return (
    <div style={{ height: `${settings.chartHeight}px`, overflow: "hidden" }}>
      <div className="p-4" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Lap axis */}
        {settings.showGrid && (
          <div className="relative ml-[100px] mr-[44px] mb-1 shrink-0" style={{ height: HEADER - 4 }}>
            {lapTicks.map((lap) => (
              <div
                key={lap}
                className="absolute text-[9px] text-zinc-500 -translate-x-1/2"
                style={{ left: `${(lap / totalLaps) * 100}%` }}
              >
                {lap > 0 ? lap : ""}
              </div>
            ))}
            {lapTicks.filter((l) => l > 0).map((lap) => (
              <div
                key={`tick-${lap}`}
                className="absolute bottom-0 w-px bg-zinc-800"
                style={{ left: `${(lap / totalLaps) * 100}%`, top: 14 }}
              />
            ))}
          </div>
        )}

        {/* Driver rows — flex column with even spacing */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: GAP,
            flex: 1,
            minHeight: 0,
          }}
        >
          {sortedDrivers.map(([driver, stints]) => {
            const position = stints[0]?.position;
            const color = stints[0]?.color;
            const stops = stints.length - 1;

            return (
              <div key={driver} style={{ display: "flex", alignItems: "center", gap: 8, height: rowHeight }}>
                <div
                  className="text-right font-mono text-zinc-500 tabular-nums shrink-0"
                  style={{ width: 36, fontSize: labelFontSize }}
                >
                  P{position}
                </div>
                <div
                  className="shrink-0 truncate font-semibold"
                  style={{ width: 56, color, fontSize: labelFontSize }}
                >
                  {driver}
                </div>
                <div className="relative flex-1 bg-zinc-900" style={{ height: "100%" }}>
                  {stints.map((s, i) => {
                    const startPct = ((s.start_lap - 1) / totalLaps) * 100;
                    const widthPct = (s.lap_count / totalLaps) * 100;
                    const bgColor = COMPOUND_COLORS[s.compound.toUpperCase()] ?? s.color ?? "#71717a";
                    return (
                      <div
                        key={i}
                        className="absolute inset-y-0 flex items-center justify-center font-bold text-black hover:opacity-80 transition-opacity"
                        style={{
                          left: `${startPct}%`,
                          width: `${widthPct}%`,
                          backgroundColor: bgColor,
                          fontSize: labelFontSize,
                        }}
                        title={`${s.compound} · L${s.start_lap}–${s.end_lap} · ${s.lap_count} laps · Tyre age at end: ${s.tyre_life_end}`}
                      >
                        {widthPct > 4 && settings.showDataLabels
                          ? s.compound.charAt(0).toUpperCase()
                          : ""}
                      </div>
                    );
                  })}
                  {/* Pit stop dividers */}
                  {stints.slice(0, -1).map((s, i) => (
                    <div
                      key={`pit-${i}`}
                      className="absolute inset-y-0 w-0.5 bg-zinc-600 z-10"
                      style={{ left: `${(s.end_lap / totalLaps) * 100}%` }}
                      title={`Pit stop after lap ${s.end_lap}`}
                    />
                  ))}
                </div>
                <div
                  className="text-right font-mono text-zinc-400 tabular-nums shrink-0"
                  style={{ width: 36, fontSize: labelFontSize }}
                >
                  {stops}x
                </div>
              </div>
            );
          })}
        </div>

        {settings.showLegend && (
          <div className="flex flex-wrap items-center gap-4 border-t border-zinc-800 ml-[100px] shrink-0" style={{ paddingTop: 10, marginTop: 6 }}>
            {usedCompounds.map((compound) => (
              <div key={compound} className="flex items-center gap-1.5">
                <span
                  className="inline-block shrink-0"
                  style={{ width: 12, height: 12, backgroundColor: COMPOUND_COLORS[compound] ?? "#71717a" }}
                />
                <span className="text-xs text-zinc-400">
                  {compound.charAt(0) + compound.slice(1).toLowerCase()}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="inline-block bg-zinc-600" style={{ width: 2, height: 12 }} />
              <span className="text-xs text-zinc-400">Pit stop</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
