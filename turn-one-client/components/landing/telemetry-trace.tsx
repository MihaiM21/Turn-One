"use client";

import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * One sector of a lap as the product draws it: speed, throttle and brake on a
 * shared distance axis, with the explanation written next to the chart.
 * Scrub it (pointer, touch or arrow keys) to read every channel at a point;
 * the note lights up when the cursor enters the braking zone it explains.
 * Server-rendered as plain SVG, so it's crawlable and works without JS.
 */

type Pt = [number, number];
const SPEED: Pt[] = [[0, 50], [40, 44], [90, 14], [110, 12], [130, 52], [150, 58], [170, 40], [220, 12], [250, 10], [270, 50], [290, 56], [320, 30], [360, 12]];
const THROTTLE: Pt[] = [[0, 60], [20, 58], [40, 10], [90, 4], [110, 6], [130, 70], [150, 72], [170, 20], [220, 6], [250, 8], [270, 64], [290, 66], [320, 10], [360, 4]];
const BRAKE: Pt[] = [[0, 78], [125, 78], [132, 30], [142, 40], [150, 78], [262, 78], [270, 26], [282, 42], [290, 78], [360, 78]];
const ZONE = { from: 126, to: 150 };
const W = 360;
const H = 84;
const SECTOR_M = 1840; // metres covered by the sector, for the distance readout

const path = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
function at(pts: Pt[], x: number) {
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    if (x <= x1) {
      const [x0, y0] = pts[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
    }
  }
  return pts[pts.length - 1][1];
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function TelemetryTrace() {
  const [x, setX] = useState<number | null>(null);
  const noteId = useId();
  const inZone = x !== null && x >= ZONE.from && x <= ZONE.to;

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    // map through the SVG's own transform so letterboxing (preserveAspectRatio) never skews the cursor
    const svg = e.currentTarget;
    const m = svg.getScreenCTM();
    if (!m) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    setX(clamp(p.x, 0, W));
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setX((v) => clamp((v ?? ZONE.from - 12) + (e.key === "ArrowRight" ? 6 : -6), 0, W));
  };

  const read =
    x === null
      ? null
      : {
          dist: Math.round((x / W) * SECTOR_M),
          speed: Math.round(335 - ((at(SPEED, x) - 4) / 56) * 240),
          throttle: clamp(Math.round(((72 - at(THROTTLE, x)) / 68) * 100), 0, 100),
          brake: clamp(Math.round(((78 - at(BRAKE, x)) / 52) * 100), 0, 100),
        };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-zinc-500">
        <span>Lap 27 · Sector 2</span>
        <span className="font-mono tabular-nums text-white">1:31.442</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-24 w-full touch-pan-y cursor-crosshair outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
        role="img"
        aria-label="Throttle, brake and speed traces for sector 2. Use the arrow keys to scrub."
        aria-describedby={noteId}
        tabIndex={0}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={(e) => e.pointerType === "mouse" && setX(null)}
        onKeyDown={onKey}
        onBlur={() => setX(null)}
      >
        <rect x={ZONE.from} y="0" width={ZONE.to - ZONE.from} height={H} fill="#D40924" fillOpacity={inZone ? 0.22 : 0.12} />
        <path d={path(SPEED)} fill="none" stroke="#f8f8f8" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <path d={path(THROTTLE)} fill="none" stroke="#868686" strokeWidth="1" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />
        <path d={path(BRAKE)} fill="none" stroke="#D40924" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        {x !== null && (
          <g>
            <line x1={x} x2={x} y1="0" y2={H} stroke="#f8f8f8" strokeOpacity="0.5" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <circle cx={x} cy={at(SPEED, x)} r="2.2" fill="#f8f8f8" />
            <circle cx={x} cy={at(BRAKE, x)} r="2.2" fill="#D40924" />
          </g>
        )}
      </svg>
      <dl className="mt-1 grid grid-cols-4 gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500" aria-live="off">
        {[
          ["Dist", read ? `${read.dist.toLocaleString("en-GB")} m` : "—"],
          ["Speed", read ? `${read.speed}` : "—"],
          ["Thr", read ? `${read.throttle}%` : "—"],
          ["Brk", read ? `${read.brake}%` : "—"],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col">
            <dt>{k}</dt>
            <dd className={cn("tabular-nums", k === "Brk" && read?.brake ? "text-red-400" : "text-white")}>{v}</dd>
          </div>
        ))}
      </dl>
      <p
        id={noteId}
        className={cn(
          "mt-3 border-l-2 pl-3 text-xs leading-relaxed transition-colors",
          inZone ? "border-red-500 text-white" : "border-red-600/70 text-zinc-300",
        )}
      >
        <span className="font-semibold text-white">Why the gap opened:</span> the brake trace peaks 8 m later into
        Turn 10 — <span className="font-mono tabular-nums text-red-400">−0.14 s</span> against the reference lap.
      </p>
    </div>
  );
}
