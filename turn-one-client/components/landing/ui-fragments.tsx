import type { PillarId } from "./data";
import { TelemetryTrace } from "./telemetry-trace";

/**
 * Small, honest slices of the real product UI, rendered as static markup so
 * they are crawlable and cost nothing. They sit on a dark plate (CHROME rule:
 * never bare text over the WORLD render). Numbers are tabular.
 */

// Illustrative. `int` is the interval to the car ahead; under 1.0 s is the 2026 Overtake Mode window.
const tower = [
  { p: 1, drv: "NOR", gap: "LEADER", int: null, tyre: "M", age: 12 },
  { p: 2, drv: "VER", gap: "+1.204", int: 1.204, tyre: "M", age: 12 },
  { p: 3, drv: "LEC", gap: "+1.871", int: 0.667, tyre: "H", age: 20 },
  { p: 4, drv: "PIA", gap: "+6.330", int: 4.459, tyre: "H", age: 19 },
  { p: 5, drv: "RUS", gap: "+6.915", int: 0.585, tyre: "S", age: 4 },
];

const tyreColor: Record<string, string> = { S: "text-red-400", M: "text-yellow-300", H: "text-zinc-200" };

export function TimingTowerFragment() {
  return (
    <div className="font-mono text-xs">
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-zinc-500">
        <span>Lap 41 / 62</span>
        <span className="flex items-center gap-1.5 text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Live
        </span>
      </div>
      <ul className="divide-y divide-zinc-800/80">
        {tower.map((r) => (
          <li key={r.p} className="flex items-center gap-3 py-1.5 tabular-nums">
            <span className="w-4 text-zinc-500">{r.p}</span>
            <span className="w-9 font-semibold text-white">{r.drv}</span>
            <span className="flex-1 text-zinc-300">{r.gap}</span>
            <span className={`w-4 font-bold ${tyreColor[r.tyre]}`}>{r.tyre}</span>
            <span className="w-6 text-zinc-500">{r.age}</span>
            <span
              className={`w-8 text-right text-[10px] ${r.int !== null && r.int < 1 ? "text-emerald-400" : "text-zinc-700"}`}
              title="Overtake Mode: within 1.0 s of the car ahead"
            >
              OVT
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Throttle / brake / speed traces for one lap, with the explanation inline — interactive, see telemetry-trace.tsx. */
export const TelemetryFragment = TelemetryTrace;

export function PredictionsFragment() {
  const picks = ["NOR", "VER", "LEC"];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-zinc-500">
        <span>Podium prediction</span>
        <span className="text-zinc-300">closes in <span className="font-mono tabular-nums text-white">02:14:07</span></span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {picks.map((p, i) => (
          <div key={p} className="border border-zinc-800 bg-zinc-950 p-3 text-center">
            <div className="text-[10px] text-zinc-500">P{i + 1}</div>
            <div className="text-lg font-black tracking-wide text-white">{p}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-zinc-500">Potential</span>
        <span className="font-mono tabular-nums text-white">
          +120 <span className="text-zinc-500">coins</span> · <span className="text-red-400">×2 streak</span>
        </span>
      </div>
    </div>
  );
}

export function DashboardFragment() {
  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="col-span-2 border border-zinc-800 bg-zinc-950 p-3">
        <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Lights out in</div>
        <div className="mt-1 font-mono text-2xl font-black tabular-nums text-white">2d 04:12:07</div>
      </div>
      <div className="border border-zinc-800 bg-zinc-950 p-3">
        <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Streak</div>
        <div className="mt-1 font-mono text-xl font-black tabular-nums text-white">07</div>
      </div>
      <div className="border border-zinc-800 bg-zinc-950 p-3">
        <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Daily gift</div>
        <div className="mt-1 font-mono text-xl font-black tabular-nums text-red-400">+50</div>
      </div>
    </div>
  );
}

export function Fragment({ id }: { id: PillarId }) {
  switch (id) {
    case "live":
      return <TimingTowerFragment />;
    case "telemetry":
      return <TelemetryFragment />;
    case "play":
      return <PredictionsFragment />;
    case "hub":
      return <DashboardFragment />;
  }
}
