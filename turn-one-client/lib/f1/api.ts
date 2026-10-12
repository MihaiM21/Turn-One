// Server-only client for the external F1 data API (F1_API_URL, X-API-Key).
//
// It talks to the API directly instead of through app/api/[...endpoint]: a
// static/ISR page has no request-scoped cookies or JWT for that proxy's auth
// gate. Caching is Next's own fetch cache (`next.revalidate` + tags), not a
// bespoke store. Never throws — failures come back as `{ status: 0 }` so
// callers classify them (lib/f1/outcome.ts) rather than guessing from a catch.

import type { ApiResult } from "@/lib/f1/outcome"

// Cold sessions can take the upstream 20 s+ to compute the first time they're asked for.
const TIMEOUT_MS = 40_000
const MAX_RETRY_WAIT_MS = 3_000

export type CacheMode = { revalidate: number; tags: string[] } | "no-store"

export function apiConfigured(): boolean {
  return !!process.env.F1_API_URL
}

function apiBase(): string | null {
  const base = process.env.F1_API_URL
  return base ? base.replace(/\/$/, "") : null
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function retryDelay(res: Response | null): number | null {
  if (!res) return 400 // network error (a timeout is not retried — see apiGet)
  if (res.status === 429) {
    const secs = Number(res.headers.get("retry-after"))
    return Math.min(Number.isFinite(secs) && secs > 0 ? secs * 1000 : 1_000, MAX_RETRY_WAIT_MS)
  }
  if (res.status >= 500) return 500
  return null
}

/** GET `${F1_API_URL}/v2/<endpoint>`. One retry on network error, 429 (honouring Retry-After) and 5xx. */
export async function apiGet(endpoint: string, cache: CacheMode): Promise<ApiResult> {
  const base = apiBase()
  if (!base) return { status: 0, error: "F1_API_URL is not configured" }
  const url = `${base}/v2/${endpoint}`
  const init: RequestInit & { next?: { revalidate: number; tags: string[] } } = {
    headers: { "X-API-Key": process.env.F1_API_KEY ?? "" },
    ...(cache === "no-store" ? { cache: "no-store" as const } : { next: { revalidate: cache.revalidate, tags: cache.tags } }),
  }

  let lastError = "request failed"
  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Response | null = null
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) })
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
      if (e instanceof Error && e.name === "TimeoutError") return { status: 0, error: lastError }
    }
    const wait = attempt === 0 ? retryDelay(res) : null
    if (wait != null) {
      await sleep(wait)
      continue
    }
    if (!res) return { status: 0, error: lastError }
    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      /* non-JSON body: status alone decides */
    }
    return { status: res.status, body }
  }
  return { status: 0, error: lastError }
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
