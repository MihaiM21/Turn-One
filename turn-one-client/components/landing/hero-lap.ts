/**
 * The real lap both hero renderers draw (the 3D dot morph and the 2D dotted circuit), and the
 * HUD they write to. Everything shown comes from the sample lap in sample-lap.ts.
 */

import { SAMPLE_LAP, formatKm } from "./sample-lap"

export const lap = SAMPLE_LAP

/** Seconds gained (−) or lost (+) over the next ~40 m, from the real delta channel. */
export const localLoss = (() => {
  const d = lap.channels.deltaS
  const k = Math.max(1, Math.round(40 / lap.stepM))
  return d.map((_, i) => (d[Math.min(d.length - 1, i + k)] ?? 0) - (d[i] ?? 0))
})()

/** Cumulative time at each sample from the speed channel, so a runner keeps the lap's rhythm. */
export const lapClock = (() => {
  const v = lap.channels.speed
  const t = [0]
  for (let i = 1; i < v.length; i++) t.push(t[i - 1] + lap.stepM / Math.max(5, (v[i] + v[i - 1]) / 2 / 3.6))
  return t
})()

/** Sample index the runner has reached `seconds` into the lap. */
export function sampleAt(seconds: number): number {
  let lo = 0
  let hi = lapClock.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (lapClock[mid] < seconds) lo = mid + 1
    else hi = mid
  }
  return lo
}

/** DOM nodes of the hero's live readout; renderers write to them directly, a few times a second. */
export interface HudRefs {
  root: HTMLElement | null
  speed: HTMLElement | null
  gear: HTMLElement | null
  delta: HTMLElement | null
  dist: HTMLElement | null
}

export function writeHud(h: HudRefs | null, sample: number) {
  if (!h) return
  const delta = lap.channels.deltaS[sample] ?? 0
  if (h.speed) h.speed.textContent = String(Math.round(lap.channels.speed[sample] ?? 0))
  if (h.gear) h.gear.textContent = String(lap.channels.gear[sample] ?? 0)
  if (h.delta) {
    h.delta.textContent = `${delta > 0 ? "+" : ""}${delta.toFixed(2)}`
    h.delta.style.color = delta > 0 ? "rgb(248,113,113)" : "rgb(74,222,128)"
  }
  if (h.dist) h.dist.textContent = formatKm(sample * lap.stepM)
}
