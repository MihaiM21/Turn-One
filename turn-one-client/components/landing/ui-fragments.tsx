import type { PillarId } from "./data";
import { SAMPLE_LAP, biggestLosses, formatKm, formatLap, toPoints } from "./sample-lap";

/**
 * Small, honest slices of the product, rendered as static markup so they are
 * crawlable and cost nothing. Every number comes from the real lap in
 * public/samples/sample-lap.json. They sit on a dark plate (CHROME rule: never
 * bare text over the WORLD render). Numbers are tabular.
 */

const lap = SAMPLE_LAP;
const label = "text-[10px] uppercase tracking-[0.25em] text-muted-foreground";

export function LinkFragment() {
  const laps = [lap.ref, lap.lap].sort((a, b) => a.number - b.number);
  return (
    <div className="font-mono text-xs">
      <div className={`mb-2 flex items-center justify-between ${label}`}>
        <span>{lap.sim} · {lap.track}</span>
        <span className="flex items-center gap-1.5 text-timing-pb">
          <span className="size-1.5 rounded-full bg-timing-pb" /> Recorded
        </span>
      </div>
      <ul className="divide-y divide-border tabular-nums">
        {laps.map((l) => (
          <li key={l.number} className="flex items-center gap-3 py-1.5">
            <span className="w-10 text-muted-foreground">Lap {l.number}</span>
            <span className={`flex-1 ${l.number === lap.ref.number ? "text-timing-fastest" : "text-foreground"}`}>{formatLap(l.timeMs)}</span>
            <span className="text-muted-foreground">{l.sectorsMs.map((s) => (s / 1000).toFixed(1)).join(" · ")}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] text-muted-foreground">Uploaded to your account when the lap ends.</p>
    </div>
  );
}

export function AnalysisFragment() {
  const losses = biggestLosses(lap, 400, 2);
  const d = lap.channels.deltaS;
  return (
    <div>
      <div className={`flex items-center justify-between ${label}`}>
        <span>Delta · lap {lap.lap.number} vs best</span>
        <span className="font-mono tabular-nums text-timing-slower">+{((lap.lap.timeMs - lap.ref.timeMs) / 1000).toFixed(3)} s</span>
      </div>
      <svg viewBox="0 0 300 50" preserveAspectRatio="none" className="mt-2 h-12 w-full" aria-hidden>
        <polyline points={toPoints(d, 300, 50, Math.min(0, ...d), Math.max(...d))} fill="none" stroke="var(--timing-slower)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      </svg>
      <ul className="mt-2 space-y-1 font-mono text-xs tabular-nums">
        {losses.map((w) => (
          <li key={w.fromM} className="flex justify-between">
            <span className="text-muted-foreground">{formatKm(w.fromM)}–{formatKm(w.toM)}</span>
            <span className="text-timing-slower">+{w.lostS.toFixed(2)} s</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The server checks a lap passes before it ranks, run against the real best lap. */
export function CompeteFragment() {
  const sum = lap.ref.sectorsMs.reduce((a, b) => a + b, 0);
  const checks = [
    ["Valid in the sim", true],
    ["Flying lap, no pit", true],
    [`Sectors add up (${formatLap(sum)})`, Math.abs(sum - lap.ref.timeMs) <= 50],
    [`Full track length (${lap.trackLengthM} m)`, true],
  ] as const;
  return (
    <div>
      <div className={`flex items-center justify-between ${label}`}>
        <span>Lap {lap.ref.number} · ranking checks</span>
        <span className="font-mono tabular-nums text-timing-fastest">{formatLap(lap.ref.timeMs)}</span>
      </div>
      <ul className="mt-2 space-y-1.5 text-xs">
        {checks.map(([text, ok]) => (
          <li key={text} className="flex items-center gap-2">
            <span className={ok ? "text-timing-pb" : "text-primary"}>{ok ? "✓" : "✕"}</span>
            <span className="text-foreground/85">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BroadcastFragment() {
  return (
    <div className="rounded-md border border-border bg-black/80 p-3 font-mono tabular-nums">
      <div className={label}>Lap timer overlay</div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[10px] text-muted-foreground">LAST</div>
          <div className="text-sm text-foreground">{formatLap(lap.lap.timeMs)}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">BEST</div>
          <div className="text-sm text-timing-fastest">{formatLap(lap.ref.timeMs)}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">DELTA</div>
          <div className="text-sm text-timing-slower">+{((lap.lap.timeMs - lap.ref.timeMs) / 1000).toFixed(3)}</div>
        </div>
      </div>
    </div>
  );
}

export function Fragment({ id }: { id: PillarId }) {
  switch (id) {
    case "link":
      return <LinkFragment />;
    case "analysis":
      return <AnalysisFragment />;
    case "compete":
      return <CompeteFragment />;
    case "broadcast":
      return <BroadcastFragment />;
  }
}
