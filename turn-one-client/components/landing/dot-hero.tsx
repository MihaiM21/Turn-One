"use client"

/**
 * The landing hero (chosen 2026-11-25, replaces the wind-tunnel car): one cloud of dots that is
 * the car, then streams into the real Paul Ricard lap coloured by where it lost and gained time,
 * with a live readout, then back. Without 3D (reduced motion, Save-Data, low memory, no WebGL)
 * the same idea runs as a 2D dotted circuit. Both pause while the hero is off screen.
 */

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useAuth } from "@/components/auth/auth-provider"
import { SimStrip } from "./sim-strip"
import { Btn, Eyebrow } from "./sections"
import { HERO } from "./data"
import { useRender3D } from "./render-3d"
import { DotCircuitCanvas } from "./hero-dot-circuit"
import { type HudRefs, lap } from "./hero-lap"

const DotMorphScene = dynamic(() => import("./hero-dot-morph").then((m) => m.DotMorphScene), { ssr: false, loading: () => null })

export function DotHero() {
  const { isAuthenticated } = useAuth()
  const primaryHref = isAuthenticated ? "/simracing/beta" : HERO.primary.href
  const mode = useRender3D()
  const [still, setStill] = useState(false)
  const [visible, setVisible] = useState(true)
  const section = useRef<HTMLElement>(null)
  const hud = useRef<HudRefs>({ root: null, speed: null, gear: null, delta: null, dist: null })

  useEffect(() => setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches), [])
  useEffect(() => {
    const el = section.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={section} aria-labelledby="hero-title" className="relative h-[100svh] min-h-[640px] w-full overflow-hidden border-b border-border bg-black">
      {/* Faint grid: what first paint shows, and the field the scene sits in. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_at_65%_50%,black,transparent_75%)]"
      />
      {mode === "yes" ? (
        <div className="absolute inset-0 lg:left-[28%]">
          <DotMorphScene hud={hud} reduced={false} active={visible} />
        </div>
      ) : mode === "no" ? (
        <DotCircuitCanvas hud={hud} active={visible} still={still} />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent lg:via-transparent" />

      <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-end px-4 pb-12 sm:px-6 lg:justify-center lg:px-8 lg:pb-0">
        <div className="max-w-xl">
          <Eyebrow>{HERO.eyebrow}</Eyebrow>
          <h1 id="hero-title" className="font-display mt-4 text-balance leading-[0.9] text-foreground [font-size:clamp(2.8rem,1.2rem+5.5vw,6rem)]">
            {HERO.h1}
          </h1>
          <p className="mt-5 max-w-md text-pretty text-sm text-foreground/80 sm:text-lg">{HERO.sub}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Btn href={primaryHref}>{HERO.primary.label}</Btn>
            <Btn href={HERO.secondary.href} variant="ghost">
              {HERO.secondary.label}
            </Btn>
          </div>
          <div className="mt-5">
            <SimStrip />
          </div>
        </div>
      </div>

      {/* Live readout of the lap; the 3D scene fades it in while the dots are the lap. */}
      <div
        ref={(el) => {
          hud.current.root = el
        }}
        style={{ opacity: mode === "yes" ? 0 : 1 }}
        className="pointer-events-none absolute bottom-6 right-4 hidden w-64 rounded-2xl border border-white/10 bg-black/70 p-4 font-mono text-xs tabular-nums backdrop-blur sm:right-8 lg:block"
      >
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {lap.sim} · {lap.track} · lap {lap.lap.number} vs {lap.ref.number}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground">KM/H</p>
            <p ref={(el) => { hud.current.speed = el }} className="text-lg text-white">0</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">GEAR</p>
            <p ref={(el) => { hud.current.gear = el }} className="text-lg text-white">0</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">DELTA</p>
            <p ref={(el) => { hud.current.delta = el }} className="text-lg">0.00</p>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          <span ref={(el) => { hud.current.dist = el }}>0.0 km</span> · red lost time, green gained · real lap
        </p>
      </div>
    </section>
  )
}
