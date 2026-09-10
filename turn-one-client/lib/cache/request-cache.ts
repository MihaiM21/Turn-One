/**
 * Client-side request cache and de-duplicator sitting in front of the external
 * F1 API proxy.
 *
 * Two independent mechanisms:
 *
 *  1. **In-flight de-duplication.** Identical concurrent GETs collapse to a
 *     single network request. This is what tames burst patterns like resolving
 *     the latest event, where many components ask for the same thing at once.
 *  2. **A two-level cache** — an in-memory LRU in front of sessionStorage, with
 *     the TTL chosen per request by lib/cache/f1-freshness.ts. Memory survives
 *     navigation within the SPA; sessionStorage survives a reload.
 *
 * Everything degrades safely: storage failures, quota exhaustion and private
 * browsing all fall back to memory-only, and an unclassifiable request is
 * simply not cached.
 */
import { classify, type TierPolicy } from "./f1-freshness"

interface CacheEntry {
  data: unknown
  expiresAt: number
}

const MAX_MEMORY_ENTRIES = 300
/** Refuse to persist very large payloads; one plot must not exhaust the quota. */
const MAX_PERSISTED_BYTES = 256 * 1024
const STORAGE_PREFIX = "f1cache:v1:"

export const DEFAULT_TIMEOUT_MS = 15_000

/** Insertion-ordered, so the first key is the least recently used. */
const memory = new Map<string, CacheEntry>()
const inFlight = new Map<string, Promise<unknown>>()

/**
 * Counts requests that actually reached the network. The generator reads this
 * around a plot fetch to decide whether to charge a token: if the count did not
 * move, every request was served from cache and cost us nothing upstream.
 *
 * A plain counter is sufficient because generation is serialised — the Generate
 * button is disabled while a plot is in flight.
 */
let networkRequests = 0
export function networkRequestCount(): number {
  return networkRequests
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.sessionStorage
  } catch {
    // Private mode or blocked site data.
    return null
  }
}

function readCache(key: string, now: number): unknown | undefined {
  const hit = memory.get(key)
  if (hit) {
    if (hit.expiresAt > now) {
      // Refresh recency.
      memory.delete(key)
      memory.set(key, hit)
      return hit.data
    }
    memory.delete(key)
  }

  const store = storage()
  if (!store) return undefined
  try {
    const raw = store.getItem(STORAGE_PREFIX + key)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as CacheEntry
    if (parsed.expiresAt <= now) {
      store.removeItem(STORAGE_PREFIX + key)
      return undefined
    }
    memory.set(key, parsed)
    return parsed.data
  } catch {
    return undefined
  }
}

/** Drops the soonest-expiring persisted entries to make room. */
function evictPersisted(store: Storage, count: number): void {
  const entries: Array<{ key: string; expiresAt: number }> = []
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i)
    if (!key?.startsWith(STORAGE_PREFIX)) continue
    try {
      entries.push({ key, expiresAt: (JSON.parse(store.getItem(key)!) as CacheEntry).expiresAt })
    } catch {
      entries.push({ key, expiresAt: 0 })
    }
  }
  entries.sort((a, b) => a.expiresAt - b.expiresAt)
  for (const entry of entries.slice(0, count)) store.removeItem(entry.key)
}

function writeCache(key: string, data: unknown, policy: TierPolicy, now: number): void {
  if (!policy.cacheable || policy.ttl <= 0) return

  const entry: CacheEntry = { data, expiresAt: now + policy.ttl * 1000 }
  if (memory.size >= MAX_MEMORY_ENTRIES) {
    const oldest = memory.keys().next().value
    if (oldest !== undefined) memory.delete(oldest)
  }
  memory.set(key, entry)

  // Live data expires faster than a reload takes; persisting it is pure churn.
  if (policy.tier === "live") return

  const store = storage()
  if (!store) return
  let serialised: string
  try {
    serialised = JSON.stringify(entry)
  } catch {
    return
  }
  if (serialised.length > MAX_PERSISTED_BYTES) return

  try {
    store.setItem(STORAGE_PREFIX + key, serialised)
  } catch {
    // Almost certainly a quota error — make room once, then give up quietly.
    try {
      evictPersisted(store, 10)
      store.setItem(STORAGE_PREFIX + key, serialised)
    } catch {
      /* memory cache still serves this session */
    }
  }
}

export interface FetchOptions extends RequestInit {
  /** Overrides DEFAULT_TIMEOUT_MS. */
  timeoutMs?: number
}

/**
 * Runs `parse` on a fresh network response, or returns a cached value.
 * `parse` owns all status/body error handling so callers keep their own error
 * shapes (see lib/data-fetcher.ts).
 */
export async function cachedFetchJson(
  url: string,
  init: FetchOptions,
  parse: (response: Response) => Promise<unknown>,
): Promise<unknown> {
  // An explicit no-store from the caller wins over the tier policy.
  const bypass = init.cache === "no-store"
  const policy = classify(url)
  const now = Date.now()

  if (!bypass && policy.cacheable) {
    const cached = readCache(url, now)
    if (cached !== undefined) return cached
  }

  const pending = inFlight.get(url)
  if (pending) return pending

  const { timeoutMs, signal, ...rest } = init
  const request = (async () => {
    const timeout = AbortSignal.timeout(timeoutMs ?? DEFAULT_TIMEOUT_MS)
    // Honour a caller's own abort signal alongside the timeout.
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
    networkRequests++
    try {
      const response = await fetch(url, { ...rest, signal: combined })
      const data = await parse(response)
      if (!bypass) writeCache(url, data, policy, Date.now())
      return data
    } finally {
      inFlight.delete(url)
    }
  })()

  inFlight.set(url, request)
  return request
}

/**
 * De-duplicates image requests, caching the **Blob** rather than an object URL.
 * Object URLs are revoked by their owner when a plot unmounts, so a cached URL
 * would be handed out dead. A Blob can back any number of independently
 * revocable object URLs, so each caller gets its own.
 */
const inFlightBlobs = new Map<string, Promise<Blob>>()

export function dedupedFetchBlob(
  url: string,
  init: FetchOptions,
  parse: (response: Response) => Promise<Blob>,
): Promise<Blob> {
  const pending = inFlightBlobs.get(url)
  if (pending) return pending

  const { timeoutMs, signal, ...rest } = init
  const timeout = AbortSignal.timeout(timeoutMs ?? DEFAULT_TIMEOUT_MS)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
  networkRequests++
  const request = fetch(url, { ...rest, signal: combined })
    .then(parse)
    .finally(() => inFlightBlobs.delete(url))

  inFlightBlobs.set(url, request)
  return request
}

/** Clears every cached response. Exposed for debugging and tests. */
export function clearRequestCache(): void {
  memory.clear()
  inFlight.clear()
  inFlightBlobs.clear()
  const store = storage()
  if (!store) return
  const keys: string[] = []
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i)
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key)
  }
  for (const key of keys) store.removeItem(key)
}
