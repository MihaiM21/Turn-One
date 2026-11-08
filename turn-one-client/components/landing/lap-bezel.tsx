import { cn } from "@/lib/utils"
import { SAMPLE_LAP, biggestLosses, formatKm, formatLap, toPoints, type SampleLap } from "./sample-lap"

/**
 * The product in a browser bezel, drawn from one real lap (grill G9: "Product
 * bezel — date dintr-o tură reală"). Server-rendered SVG: crawlable, no JS.
 * Colours follow t1-style timing rules: PB green where the lap gained, gold where
 * it lost, everything else neutral.
 */

type Trend = "gain" | "loss" | "flat"

const TREND_STROKE: Record<Trend, string> = {
  gain: "var(--timing-pb)",
  loss: "var(--timing-slower)",
  flat: "color-mix(in srgb, var(--foreground) 35%, transparent)",
}

/** Splits the track into runs coloured by whether the lap gained or lost time over ~100 m. */
function trackRuns(lap: SampleLap) {
  const { x, y } = lap.map
  const d = lap.channels.deltaS
  const k = Math.max(1, Math.round(100 / lap.stepM))
  const trend = (i: number): Trend => {
    const slope = d[Math.min(d.length - 1, i + k)] - d[i]
    return slope > 0.04 ? "loss" : slope < -0.04 ? "gain" : "flat"
  }
  const runs: { trend: Trend; points: string }[] = []
  let current: { trend: Trend; pts: string[] } | null = null
  for (let i = 0; i < x.length; i++) {
    const t = trend(i)
    const pt = `${x[i]},${y[i]}`
    if (!current || current.trend !== t) {
      if (current) {
        current.pts.push(pt)
        runs.push({ trend: current.trend, points: current.pts.join(" ") })
      }
      current = { trend: t, pts: [pt] }
    } else current.pts.push(pt)
  }
  if (current) runs.push({ trend: current.trend, points: current.pts.join(" ") })
  return runs
}

function TrackMap({ lap }: { lap: SampleLap }) {
  const maxY = Math.max(...lap.map.y)
  const losses = biggestLosses(lap)
  const at = (m: number) => {
    const i = Math.min(lap.map.x.length - 1, Math.round(m / lap.stepM))
    return { x: lap.map.x[i], y: lap.map.y[i] }
  }
  return (
    <svg viewBox={`-40 -40 1080 ${maxY + 80}`} className="h-auto w-full" role="img" aria-label={`Track map of ${lap.track} coloured by where the lap gained or lost time`}>
      <polyline points={lap.map.x.map((x, i) => `${x},${lap.map.y[i]}`).join(" ")} fill="none" stroke="var(--border)" strokeWidth={26} strokeLinejoin="round" strokeLinecap="round" />
      {trackRuns(lap).map((r, i) => (
        <polyline key={i} points={r.points} fill="none" stroke={TREND_STROKE[r.trend]} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {losses.map((w, i) => {
        const p = at((w.fromM + w.toM) / 2)
        return (
          <g key={w.fromM}>
            <circle cx={p.x} cy={p.y} r={24} fill="var(--primary)" />
            <text x={p.x} y={p.y + 9} textAnchor="middle" fontSize={26} fontWeight={700} fill="#fff" fontFamily="var(--font-mono)">
              {i + 1}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function Traces({ lap }: { lap: SampleLap }) {
  const W = 600
  const { speed, refSpeed, deltaS } = lap.channels
  const vMax = Math.max(...speed, ...refSpeed)
  const dMin = Math.min(0, ...deltaS)
  const dMax = Math.max(0, ...deltaS)
  const zeroY = 60 - ((0 - dMin) / (dMax - dMin || 1)) * 60
  return (
    <div className="space-y-2">
      <div>
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>Speed · km/h</span>
          <span className="flex gap-3">
            <span className="text-foreground">Lap {lap.lap.number}</span>
            <span className="text-timing-fastest">Best · lap {lap.ref.number}</span>
          </span>
        </div>
        <svg viewBox={`0 0 ${W} 120`} preserveAspectRatio="none" className="mt-1 h-28 w-full" aria-hidden>
          <polyline points={toPoints(refSpeed, W, 120, 0, vMax)} fill="none" stroke="var(--timing-fastest)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          <polyline points={toPoints(speed, W, 120, 0, vMax)} fill="none" stroke="var(--foreground)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div>
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>Delta to best · s</span>
          <span className="tabular-nums text-timing-slower">+{((lap.lap.timeMs - lap.ref.timeMs) / 1000).toFixed(3)}</span>
        </div>
        <svg viewBox={`0 0 ${W} 60`} preserveAspectRatio="none" className="mt-1 h-14 w-full" aria-hidden>
          <line x1={0} x2={W} y1={zeroY} y2={zeroY} stroke="var(--border)" vectorEffect="non-scaling-stroke" />
          <polyline points={toPoints(deltaS, W, 60, dMin, dMax)} fill="none" stroke="var(--timing-slower)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="flex justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
          <span>0 km</span>
          <span>{formatKm(lap.trackLengthM)}</span>
        </div>
      </div>
    </div>
  )
}

function Losses({ lap }: { lap: SampleLap }) {
  const losses = biggestLosses(lap)
  const top = losses[0]
  return (
    <div className="flex h-full flex-col">
      <dl className="grid grid-cols-2 gap-3 font-mono tabular-nums">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Lap {lap.lap.number}</dt>
          <dd className="text-xl text-foreground">{formatLap(lap.lap.timeMs)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Best</dt>
          <dd className="text-xl text-timing-fastest">{formatLap(lap.ref.timeMs)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Where the time went</p>
      <ol className="mt-2 divide-y divide-border text-sm">
        {losses.map((w, i) => (
          <li key={w.fromM} className="flex items-center gap-3 py-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-[11px] text-primary-foreground">{i + 1}</span>
            <span className="flex-1 font-mono text-xs tabular-nums text-muted-foreground">
              {formatKm(w.fromM)}–{formatKm(w.toM)}
            </span>
            <span className="font-mono tabular-nums text-timing-slower">+{w.lostS.toFixed(2)} s</span>
          </li>
        ))}
      </ol>
      {top ? (
        <p className="mt-auto border-t border-border pt-3 text-xs leading-relaxed text-foreground/85">
          Biggest loss: {formatKm(top.fromM)}–{formatKm(top.toM)}, minimum speed{" "}
          <span className="font-mono tabular-nums">{top.minSpeed}</span> km/h against{" "}
          <span className="font-mono tabular-nums">{top.refMinSpeed}</span> on your best lap.
        </p>
      ) : null}
    </div>
  )
}

export function LapBezel({ className, lap = SAMPLE_LAP }: { className?: string; lap?: SampleLap }) {
  const recorded = new Date(lap.recordedAt + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  return (
    <figure className={cn("mx-auto max-w-5xl", className)}>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="ml-3 truncate font-mono text-[10px] text-muted-foreground">turnonehub.com/simracing/analysis</span>
        </div>
        <div className="grid gap-3 p-3 md:grid-cols-[1.1fr_1.4fr_1fr] lg:p-4">
          <div className="rounded-md border border-border bg-background p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{lap.track}</p>
            <TrackMap lap={lap} />
            <p className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
              <span className="text-timing-pb">■ gained</span>
              <span className="text-timing-slower">■ lost</span>
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-3">
            <Traces lap={lap} />
          </div>
          <div className="rounded-md border border-border bg-background p-3">
            <Losses lap={lap} />
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted-foreground">
        Real lap recorded with Turn One Link · {lap.sim} · {lap.track}
        {lap.car ? ` · ${lap.car}` : ""} · lap {lap.lap.number} against best lap {lap.ref.number} · {recorded}
      </figcaption>
    </figure>
  )
}
