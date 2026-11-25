"use client"

/**
 * The hero's 2D renderer: a halftone dot field in which the dots on the real lap light up red
 * where it lost time and green where it gained, and a runner drives the lap at its real rhythm.
 * Used where the 3D dot morph is not (reduced motion, Save-Data, low memory, no WebGL); with
 * reduced motion it draws one still frame.
 */

import { useEffect, useRef, type RefObject } from "react"
import { type HudRefs, lap, lapClock, localLoss, sampleAt, writeHud } from "./hero-lap"

/** Grid spacing in CSS px. */
const STEP = 11

export function DotCircuitCanvas({ hud, active, still }: { hud: RefObject<HudRefs>; active: boolean; still: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    let raf = 0
    let dots: { x: number; y: number; near: number; dist: number }[] = []
    let track: { x: number; y: number }[] = []
    const mouse = { x: -1e4, y: -1e4 }
    const dpr = Math.min(2, window.devicePixelRatio || 1)

    const layout = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Track on the right on wide screens, behind the copy at the top on narrow ones.
      const wide = w >= 1024
      const box = wide ? { x: w * 0.45, y: h * 0.12, w: w * 0.5, h: h * 0.76 } : { x: w * 0.05, y: h * 0.1, w: w * 0.9, h: h * 0.4 }
      const xs = lap.map.x
      const ys = lap.map.y
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
      const s = Math.min(box.w / (maxX - minX), box.h / (maxY - minY))
      const ox = box.x + (box.w - (maxX - minX) * s) / 2
      const oy = box.y + (box.h - (maxY - minY) * s) / 2
      track = xs.map((x, i) => ({ x: ox + (x - minX) * s, y: oy + (maxY - ys[i]) * s }))
      const stride = Math.max(1, Math.floor(track.length / 500))
      const coarse = track.map((p, i) => ({ ...p, i })).filter((_, i) => i % stride === 0)
      dots = []
      for (let y = STEP / 2; y < h; y += STEP) {
        for (let x = STEP / 2; x < w; x += STEP) {
          let best = Infinity
          let near = 0
          for (const p of coarse) {
            const d = (p.x - x) ** 2 + (p.y - y) ** 2
            if (d < best) {
              best = d
              near = p.i
            }
          }
          dots.push({ x, y, near, dist: Math.sqrt(best) })
        }
      }
    }

    const start = performance.now()
    const total = lapClock[lapClock.length - 1]
    let frame = 0
    const draw = (now: number) => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)
      // The runner drives the real lap, sped up 4×; still mode freezes it a third of the way round.
      const idx = sampleAt(still ? total / 3 : (((now - start) / 1000) * 4) % total)
      const runner = track[Math.min(track.length - 1, idx)]

      for (const d of dots) {
        let a = 0.07
        let r = 1.1
        let color = "255,255,255"
        if (d.dist < 8) {
          const loss = localLoss[d.near] ?? 0
          color = loss > 0.004 ? "239,68,68" : loss < -0.004 ? "34,197,94" : "255,255,255"
          a = 0.5 + Math.min(0.5, Math.abs(loss) * 25)
          r = 1.6
        }
        if (runner) {
          const rd = Math.hypot(d.x - runner.x, d.y - runner.y)
          if (rd < 60) {
            a = Math.max(a, 0.9 * (1 - rd / 60))
            r = Math.max(r, 2.2 * (1 - rd / 60) + 1)
          }
        }
        const md = Math.hypot(d.x - mouse.x, d.y - mouse.y)
        if (md < 120) a = Math.max(a, 0.35 * (1 - md / 120))
        ctx.fillStyle = `rgba(${color},${a})`
        ctx.beginPath()
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      if (runner) {
        ctx.fillStyle = "rgba(255,255,255,1)"
        ctx.beginPath()
        ctx.arc(runner.x, runner.y, 4, 0, Math.PI * 2)
        ctx.fill()
      }
      if (still || frame++ % 6 === 0) writeHud(hud.current, idx)
      if (!still && active) raf = requestAnimationFrame(draw)
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      mouse.x = e.clientX - r.left
      mouse.y = e.clientY - r.top
    }
    layout()
    raf = requestAnimationFrame(draw)
    const ro = new ResizeObserver(() => {
      layout()
      if (still || !active) requestAnimationFrame(draw)
    })
    ro.observe(canvas)
    window.addEventListener("pointermove", onMove)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("pointermove", onMove)
    }
  }, [hud, active, still])

  return <canvas ref={ref} className="absolute inset-0 size-full" aria-hidden />
}
