/**
 * The real lap shown on the landing page, baked by scripts/export-sample-lap.mjs
 * from a Turn One Link log (telemetry only). Everything said about it on the page
 * is computed here from the data, never written by hand.
 */
import raw from "@/public/samples/sample-lap.json"

export interface SampleLap {
  note: string
  sim: string
  track: string
  car: string | null
  trackLengthM: number
  recordedAt: string
  stepM: number
  lap: { number: number; timeMs: number; sectorsMs: number[] }
  ref: { number: number; timeMs: number; sectorsMs: number[] }
  map: { x: number[]; y: number[] }
  channels: {
    speed: number[]
    throttle: number[]
    brake: number[]
    gear: number[]
    refSpeed: number[]
    /** Seconds; positive = the shown lap is behind its reference at that distance. */
    deltaS: number[]
  }
}

export const SAMPLE_LAP = raw as SampleLap

export interface LossWindow {
  fromM: number
  toM: number
  lostS: number
  /** Minimum speed in the window, shown lap vs reference. */
  minSpeed: number
  refMinSpeed: number
}

/**
 * The stretches of track where the most time went, as non-overlapping windows of
 * `windowM` metres, biggest loss first. Ignores windows that gained time.
 */
export function biggestLosses(lap: SampleLap, windowM = 400, count = 3): LossWindow[] {
  const { deltaS, speed, refSpeed } = lap.channels
  const w = Math.max(1, Math.round(windowM / lap.stepM))
  const candidates: { i: number; lost: number }[] = []
  for (let i = 0; i + w < deltaS.length; i++) candidates.push({ i, lost: deltaS[i + w] - deltaS[i] })
  candidates.sort((a, b) => b.lost - a.lost)

  const picked: { i: number; lost: number }[] = []
  for (const c of candidates) {
    if (c.lost <= 0 || picked.length >= count) break
    if (picked.some((p) => Math.abs(p.i - c.i) < w)) continue
    picked.push(c)
  }

  return picked.map(({ i, lost }) => {
    const s = speed.slice(i, i + w + 1)
    const r = refSpeed.slice(i, i + w + 1)
    return {
      fromM: i * lap.stepM,
      toM: (i + w) * lap.stepM,
      lostS: Math.round(lost * 100) / 100,
      minSpeed: Math.min(...s),
      refMinSpeed: Math.min(...r),
    }
  })
}

/** `2:04.442` */
export function formatLap(ms: number): string {
  const m = Math.floor(ms / 60000)
  const s = ((ms % 60000) / 1000).toFixed(3).padStart(6, "0")
  return `${m}:${s}`
}

export function formatKm(m: number): string {
  return `${(m / 1000).toFixed(1)} km`
}

/** SVG polyline points for a series on a w×h box. */
export function toPoints(values: number[], w: number, h: number, min: number, max: number): string {
  const span = max - min || 1
  return values
    .map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - ((v - min) / span) * h).toFixed(1)}`)
    .join(" ")
}
