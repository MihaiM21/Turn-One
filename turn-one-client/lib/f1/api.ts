// Server-only client for the external F1 data API (F1_API_URL, X-API-Key).
//
// It talks to the API directly instead of through app/api/[...endpoint]: a
// static/ISR page has no request-scoped cookies or JWT for that proxy's auth
// gate. Caching is Next's own fetch cache (`next.revalidate` + tags), not a
// bespoke store. Never throws — failures come back as `{ status: 0 }` so
// callers classify them (lib/f1/outcome.ts) rather than guessing from a catch.
//
// Rate limit: the API allows 60 requests/min per key (429 beyond that, no
// Retry-After, recovers after about a minute) and the key is shared with every
// other consumer — the plot generator's proxy included. A cold /f1 catalog
// build is ~100 calls, so requests are paced here: a process-wide sliding
// window caps network calls, and any 429 pauses everyone.

import type { ApiResult } from "@/lib/f1/outcome"

// Cold sessions can take the upstream 20 s+ to compute the first time they're asked for.
const TIMEOUT_MS = 40_000
const ATTEMPTS = 3
const RATE_ATTEMPTS = 5 // 429s are expected under shared load; they're worth waiting out

// Stay well under the API's 60/min: the key is shared with other traffic.
const WINDOW_MS = 60_000
const BUDGET = 40
const RATE_PAUSE_MS = 15_000
/** A response this fast came from Next's data cache, not the network, and didn't cost a request. */
const CACHE_HIT_MS = 25

export type CacheMode = { revalidate: number; tags: string[] } | "no-store"

export function apiConfigured(): boolean {
  return !!process.env.F1_API_URL
}

function apiBase(): string | null {
  const base = process.env.F1_API_URL
  return base ? base.replace(/\/$/, "") : null
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Shared via globalThis: route bundles can each get their own copy of this module.
interface Limiter {
  stamps: number[]
  blockedUntil: number
}
const g = globalThis as unknown as { __f1RateLimiter?: Limiter }
const limiter = (g.__f1RateLimiter ??= { stamps: [], blockedUntil: 0 })

/** Wait for a slot in the sliding window (and for any 429 pause to end); returns the slot's stamp. */
async function acquire(): Promise<number> {
  for (;;) {
    const now = Date.now()
    limiter.stamps = limiter.stamps.filter((t) => now - t < WINDOW_MS)
    const windowWait = limiter.stamps.length >= BUDGET ? limiter.stamps[0] + WINDOW_MS - now : 0
    const wait = Math.max(limiter.blockedUntil - now, windowWait)
    if (wait <= 0) {
      limiter.stamps.push(now)
      return now
    }
    await sleep(Math.min(wait, 1_000) + Math.random() * 50)
  }
}

function refund(stamp: number) {
  const i = limiter.stamps.indexOf(stamp)
  if (i >= 0) limiter.stamps.splice(i, 1)
}

/** GET `${F1_API_URL}/v2/<endpoint>`, paced. Retries (backing off) on network error, 429 and 5xx. */
export async function apiGet(endpoint: string, cache: CacheMode): Promise<ApiResult> {
  const base = apiBase()
  if (!base) return { status: 0, error: "F1_API_URL is not configured" }
  const url = `${base}/v2/${endpoint}`
  const init: RequestInit & { next?: { revalidate: number; tags: string[] } } = {
    headers: { "X-API-Key": process.env.F1_API_KEY ?? "" },
    ...(cache === "no-store" ? { cache: "no-store" as const } : { next: { revalidate: cache.revalidate, tags: cache.tags } }),
  }

  let lastError = "request failed"
  let failures = 0
  let rateLimited = 0
  for (;;) {
    const stamp = await acquire()
    const started = Date.now()
    let res: Response | null = null
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) })
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
      if (e instanceof Error && e.name === "TimeoutError") return { status: 0, error: lastError }
    }

    if (res && res.ok && cache !== "no-store" && Date.now() - started < CACHE_HIT_MS) refund(stamp)

    if (res?.status === 429) {
      limiter.blockedUntil = Math.max(limiter.blockedUntil, Date.now() + RATE_PAUSE_MS + Math.random() * 2_000)
      console.warn(`[f1-api] ${endpoint} -> 429, pausing all requests ${RATE_PAUSE_MS / 1000}s (attempt ${rateLimited + 1}/${RATE_ATTEMPTS})`)
      if (++rateLimited < RATE_ATTEMPTS) continue
      return { status: 429, body: null }
    }

    if (!res || res.status >= 500) {
      console.warn(`[f1-api] ${endpoint} -> ${res ? res.status : lastError} (attempt ${failures + 1}/${ATTEMPTS})`)
      if (++failures < ATTEMPTS) {
        await sleep(500 * 2 ** failures)
        continue
      }
      return res ? { status: res.status, body: null } : { status: 0, error: lastError }
    }

    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      /* non-JSON body: status alone decides */
    }
    return { status: res.status, body }
  }
}

/** Run `fn` over `items` with at most `limit` in flight, keeping input order. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i], i)
    }
  })
  await Promise.all(workers)
  return out
}
