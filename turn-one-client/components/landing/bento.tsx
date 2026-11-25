"use client"

/**
 * The landing's product grid (PBI-073, sketch B chosen 2026-11-25): two asymmetric rows of
 * tiles, each holding a working slice of the product instead of an icon, then the analysis as a
 * wide band in perspective. Every number comes from the real sample lap (sample-lap.ts).
 * Tiles rise into place once as they scroll in; with reduced motion they simply appear.
 */

import { useEffect, useRef, useState, type ReactNode } from "react"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"
import { AnalysisFragment, BroadcastFragment, CompeteFragment, LinkFragment } from "./ui-fragments"
import { LapBezel } from "./lap-bezel"
import { SAMPLE_LAP, formatLap } from "./sample-lap"
import { Eyebrow, container } from "./sections"

/** Hidden only after mount and until seen, so the server HTML and no-JS visitors get every tile. */
function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const [armed, setArmed] = useState(false)
  useEffect(() => setArmed(true), [])
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "motion-safe:transition-[opacity,transform] motion-safe:duration-700 motion-safe:ease-out",
        armed && !inView && "motion-safe:translate-y-6 motion-safe:opacity-0",
        className,
      )}
    >
      {children}
    </div>
  )
}

function Tile({ title, body, children, className }: { title: string; body: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex h-full flex-col justify-between gap-8 rounded-3xl border border-white/10 p-6 md:p-7", className)}>
      <div>{children}</div>
      <div>
        <h3 className="font-display text-2xl leading-none">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  )
}

/** The sample lap's best, as a driver page shows it. No invented rank. */
function DriverFragment() {
  const lap = SAMPLE_LAP
  return (
    <div className="font-mono text-xs tabular-nums">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Personal best · {lap.sim}</div>
      <div className="mt-2 flex items-baseline justify-between border-b border-border pb-2">
        <span className="text-foreground">{lap.track}</span>
        <span className="text-base text-timing-fastest">{formatLap(lap.ref.timeMs)}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        {lap.ref.sectorsMs.map((s, i) => (
          <div key={i}>
            <div className="text-[10px] text-muted-foreground">S{i + 1}</div>
            <div className="text-foreground">{(s / 1000).toFixed(3)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * LapBezel is laid out for ~960 px on wide screens, so there it renders at that width, tilted, and
 * is scaled into the band. Below 768 px it has its own stacked layout and renders flat at full width.
 */
function AnalysisBand() {
  const W = 960
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ wide: boolean; scale: number; height?: number }>({ wide: true, scale: 1 })

  useEffect(() => {
    const el = outer.current
    if (!el) return
    const update = () => {
      const wide = el.clientWidth >= 768
      const scale = wide ? Math.min(1, el.clientWidth / W) : 1
      setBox({ wide, scale, height: wide && inner.current ? inner.current.offsetHeight * scale : undefined })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={outer} className="mx-auto w-full max-w-[960px]" style={{ height: box.height }}>
      <div
        ref={inner}
        style={box.wide ? { width: W, transform: `scale(${box.scale})`, transformOrigin: "top left" } : undefined}
        className="[perspective:1600px]"
      >
        <div
          className={cn(
            "rounded-2xl border border-white/10 bg-card/80 p-3 sm:p-4",
            box.wide && "origin-left shadow-[0_40px_120px_rgba(0,0,0,0.7)] [transform:rotateY(-10deg)_rotateX(4deg)]",
          )}
        >
          <LapBezel />
        </div>
      </div>
    </div>
  )
}

export function Bento() {
  return (
    <section id="lap" aria-labelledby="lap-title" className={cn(container, "scroll-mt-20 pb-16 md:pb-24")}>
      <div className="mx-auto max-w-3xl text-center">
        <Eyebrow>Inside Turn One</Eyebrow>
        <h2 id="lap-title" className="font-display mt-3 text-balance text-4xl leading-[0.95] sm:text-5xl">
          Everything from one lap.
        </h2>
      </div>

      <div className="mt-10 space-y-4">
        <div className="grid gap-4 md:grid-cols-5">
          <Reveal className="md:col-span-3">
            <Tile title="Where the time went" body="Your lap against your best, section by section, in seconds.">
              <AnalysisFragment />
            </Tile>
          </Reveal>
          <Reveal className="md:col-span-2" delay={80}>
            <Tile title="Every lap, recorded" body="Turn One Link runs beside the sim and uploads each lap when it ends.">
              <LinkFragment />
            </Tile>
          </Reveal>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Reveal>
            <Tile title="Verified leaderboards" body="A lap ranks only after it passes the checks.">
              <CompeteFragment />
            </Tile>
          </Reveal>
          <Reveal delay={80}>
            <Tile title="Overlays for your stream" body="Lap timer and delta as an OBS source, on the paid plans.">
              <BroadcastFragment />
            </Tile>
          </Reveal>
          <Reveal delay={160}>
            <Tile title="Your driver page" body="Personal bests and ranks on one page you can share.">
              <DriverFragment />
            </Tile>
          </Reveal>
        </div>

        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-white/10 p-4 sm:p-6 md:p-10">
            <AnalysisBand />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              The whole lap on one screen: the line, the traces and the corners that cost time.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
