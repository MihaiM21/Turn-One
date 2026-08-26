"use client";

import { ChartSpline, Clock, Gauge, Grid3x3, Play, RadarIcon, Trophy, Coins, Medal, LineChart } from "lucide-react";

const TILE_ICONS = [Gauge, ChartSpline, Clock, Grid3x3, RadarIcon, Trophy];

/** Mini mock of the plot-type picker + a generated bar chart, used on the "How It Works" page. */
export function GeneratorIllustration() {
  const bars = [0.4, 0.65, 0.9, 0.55, 0.75, 0.35];
  return (
    <div className="space-y-4 p-5">
      <div className="grid grid-cols-6 gap-2">
        {TILE_ICONS.map((Icon, i) => (
          <div
            key={i}
            className={`flex h-10 items-center justify-center border ${
              i === 2
                ? "border-primary bg-primary/10 text-primary"
                : "border-zinc-800 bg-zinc-900 text-zinc-500"
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
        ))}
      </div>

      <div className="flex items-end gap-1.5" style={{ height: 90 }}>
        {bars.map((h, i) => (
          <div
            key={i}
            className="animate-grow-bar flex-1 bg-primary/70"
            style={{ height: `${h * 100}%`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {["VER", "NOR", "HAM"].map((d) => (
            <span key={d} className="border border-zinc-700 px-1.5 py-0.5 text-[9px] font-mono text-zinc-400">
              {d}
            </span>
          ))}
        </div>
        <span className="flex items-center gap-1.5 bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
          <Play className="h-2.5 w-2.5" /> Generate
        </span>
      </div>
    </div>
  );
}

/** Mini animated podium mock for the predictions section. */
export function PredictionsIllustration() {
  const podium = [
    { pos: 2, driver: "NOR", height: 62, delay: 120 },
    { pos: 1, driver: "VER", height: 92, delay: 0 },
    { pos: 3, driver: "HAM", height: 44, delay: 220 },
  ];
  return (
    <div className="space-y-5 p-5">
      <div className="flex items-end justify-center gap-3" style={{ height: 110 }}>
        {podium.map((p) => (
          <div key={p.pos} className="flex w-16 flex-col items-center gap-1.5">
            <span className="font-mono text-[10px] text-zinc-400">{p.driver}</span>
            <div
              className="animate-grow-bar flex w-full items-start justify-center border border-primary/40 bg-gradient-to-b from-primary/40 to-primary/10 pt-1.5"
              style={{ height: p.height, animationDelay: `${p.delay}ms` }}
            >
              <Medal className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-mono text-[9px] text-zinc-600">P{p.pos}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 border border-zinc-800 bg-zinc-900 px-3 py-2">
        <Coins className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono text-xs text-zinc-300">Wager: 250 coins</span>
        <span className="ml-auto font-mono text-xs font-bold text-primary">+375</span>
      </div>
    </div>
  );
}

/** Mini animated speed-trace overlay mock for the sim racing section. */
export function SimRacingIllustration() {
  return (
    <div className="space-y-4 p-5">
      <svg viewBox="0 0 300 100" className="h-[110px] w-full" preserveAspectRatio="none">
        <line x1="0" y1="25" x2="300" y2="25" stroke="#27272a" strokeWidth="1" />
        <line x1="0" y1="50" x2="300" y2="50" stroke="#27272a" strokeWidth="1" />
        <line x1="0" y1="75" x2="300" y2="75" stroke="#27272a" strokeWidth="1" />
        <path
          d="M0,70 C40,60 60,20 100,15 S160,55 200,50 S260,10 300,20"
          fill="none"
          stroke="#e11d48"
          strokeWidth="2.5"
          strokeDasharray="500"
          strokeDashoffset="500"
          className="animate-draw-line"
        />
        <path
          d="M0,80 C50,75 70,40 110,35 S170,65 210,60 S270,30 300,35"
          fill="none"
          stroke="#71717a"
          strokeWidth="2"
          strokeDasharray="500"
          strokeDashoffset="500"
          className="animate-draw-line"
          style={{ animationDelay: "200ms" }}
        />
      </svg>
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span className="flex items-center gap-1.5 text-primary">
          <LineChart className="h-3 w-3" /> Your lap
        </span>
        <span className="flex items-center gap-1.5 text-zinc-500">
          <LineChart className="h-3 w-3" /> Personal best
        </span>
      </div>
    </div>
  );
}
