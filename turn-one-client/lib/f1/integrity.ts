// Guard against the F1 API serving one session's data under another session's name.
//
// Verified failure (2026-10-12): `Japanese Grand Prix` Qualifying returned the
// Australian Grand Prix's results byte for byte, and the Sepang round returned
// China's rows with a few of its own mixed in. A page built from that "works"
// but shows the wrong lap times — worse than a 404.
//
// Two different sessions never share lap times to the millisecond across most
// of the grid, so a high overlap of (driver, lap time) pairs between two events
// for the same session type means one of them is a copy. The later event is the
// copy: stale data propagates forward, not backward.

export interface ResultLike {
  Driver: string
  LapTime: string
}

export const MIN_SHARED_ROWS = 5
export const OVERLAP_THRESHOLD = 0.5

export function fingerprint(rows: ResultLike[]): Set<string> {
  const out = new Set<string>()
  for (const r of rows) if (r?.Driver && r?.LapTime) out.add(`${r.Driver}|${r.LapTime}`)
  return out
}

export function overlap(a: Set<string>, b: Set<string>): { shared: number; ratio: number } {
  if (a.size === 0 || b.size === 0) return { shared: 0, ratio: 0 }
  const [small, large] = a.size <= b.size ? [a, b] : [b, a]
  let shared = 0
  for (const k of small) if (large.has(k)) shared++
  return { shared, ratio: shared / small.size }
}

export function looksCopied(a: Set<string>, b: Set<string>): boolean {
  const { shared, ratio } = overlap(a, b)
  return shared >= MIN_SHARED_ROWS && ratio >= OVERLAP_THRESHOLD
}

/**
 * `entries` are one session type's results across a season, in calendar order.
 * Returns the keys that duplicate an *earlier* entry.
 */
export function findCopied<K extends string>(entries: { key: K; rows: ResultLike[] }[]): Map<K, K> {
  const copied = new Map<K, K>()
  const prints = entries.map((e) => ({ key: e.key, fp: fingerprint(e.rows) }))
  for (let i = 1; i < prints.length; i++) {
    for (let j = 0; j < i; j++) {
      if (looksCopied(prints[i].fp, prints[j].fp)) {
        copied.set(prints[i].key, prints[j].key)
        break
      }
    }
  }
  return copied
}
