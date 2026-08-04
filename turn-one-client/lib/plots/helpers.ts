import { fetchStaticDrivers } from "@/lib/dataAcquisition"

export function pickArray<T = unknown>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.data)) return obj.data as T[]
  }
  return []
}

export function columnarToRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[]
  if (!raw || typeof raw !== "object") return []
  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[]
  const keys = Object.keys(obj)
  if (!keys.length) return []
  const first = obj[keys[0]]
  if (first && typeof first === "object" && !Array.isArray(first)) {
    const indices = Object.keys(first as Record<string, unknown>)
    return indices.map((i) => {
      const row: Record<string, unknown> = {}
      keys.forEach((k) => {
        row[k] = (obj[k] as Record<string, unknown>)[i]
      })
      return row
    })
  }
  return []
}

// Cache the static driver→color map for the page session.
let _driverColorsPromise: Promise<Map<string, string>> | null = null
export async function getDriverColors(): Promise<Map<string, string>> {
  if (!_driverColorsPromise) {
    _driverColorsPromise = fetchStaticDrivers().catch(() => new Map<string, string>())
  }
  return _driverColorsPromise
}

export const formatSecs = (secs: number) => {
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(3)
  return `${m}:${s.padStart(6, "0")}`
}
