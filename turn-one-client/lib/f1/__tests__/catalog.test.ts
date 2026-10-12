import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CacheMode } from "@/lib/f1/api"

// Fake F1 API: three played events, one Qualifying session each. `cached` is what
// Next's data cache would serve (can be stale); `fresh` is what the API serves now.
type Answer = { status: number; body?: unknown; error?: string }
const world: { cached: Record<number, Answer>; fresh: Record<number, Answer> } = { cached: {}, fresh: {} }
let calls: { endpoint: string; fresh: boolean }[] = []

const rows = (seed: number) =>
  ["VER", "NOR", "LEC", "HAM", "RUS", "PIA", "ALO", "GAS"].map((Driver, i) => ({ Driver, Team: "T", LapTime: `1:2${i}.${seed}${i}`, LapTimeDelta: i / 10 }))
const ok = (seed: number): Answer => ({ status: 200, body: rows(seed) })

vi.mock("@/lib/f1/api", async (orig) => {
  const real = await orig<typeof import("@/lib/f1/api")>()
  return {
    ...real,
    apiGet: async (endpoint: string, cache: CacheMode): Promise<Answer> => {
      const isFresh = cache === "no-store"
      calls.push({ endpoint, fresh: isFresh })
      if (endpoint === "seasons/2026/events") {
        return { status: 200, body: { events: [1, 2, 3].map((k) => ({ name: `E${k} Grand Prix`, official_name: `E${k}`, location: "L", country: "C", key: 100 + k })) } }
      }
      const sess = endpoint.match(/seasons\/2026\/events\/(\d+)\/sessions/)
      if (sess) return { status: 200, body: { sessions: [{ name: "Qualifying", start_date: "2026-03-07T16:00:00", end_date: "2026-03-07T17:00:00" }] } }
      const key = Number(endpoint.match(/gp=(\d+)/)?.[1])
      return (isFresh ? world.fresh : world.cached)[key]
    },
  }
})

async function load() {
  vi.resetModules()
  ;(globalThis as { __f1CatalogMemo?: unknown }).__f1CatalogMemo = undefined
  const mod = await import("@/lib/f1/catalog")
  return mod
}
const statuses = (cat: Awaited<ReturnType<Awaited<ReturnType<typeof load>>["getSeasonCatalog"]>>) => cat.events.map((e) => e.sessions[0].status)

describe("season catalog", () => {
  beforeEach(() => {
    calls = []
    world.cached = { 101: ok(1), 102: ok(2), 103: ok(3) }
    world.fresh = { 101: ok(1), 102: ok(2), 103: ok(3) }
  })

  it("publishes every session with distinct data", async () => {
    const { getSeasonCatalog } = await load()
    expect(statuses(await getSeasonCatalog(2026))).toEqual(["final", "final", "final"])
  })

  it("heals a stale cached COPY once the API serves correct data (cache from before the fix)", async () => {
    world.cached[102] = ok(1) // cached answer duplicates event 1
    const { getSeasonCatalog } = await load()
    const cat = await getSeasonCatalog(2026)
    expect(statuses(cat)).toEqual(["final", "final", "final"])
    expect(calls.some((c) => c.fresh && c.endpoint.includes("gp=102"))).toBe(true)
    expect(cat.events[1].sessions[0].results?.[0].LapTime).toBe("1:20.20") // the fresh data, not the stale copy
  })

  it("heals a stale cached EMPTY", async () => {
    world.cached[103] = { status: 200, body: [] }
    const { getSeasonCatalog } = await load()
    expect(statuses(await getSeasonCatalog(2026))).toEqual(["final", "final", "final"])
  })

  it("still hides a session whose data is really a copy", async () => {
    world.cached[102] = ok(1)
    world.fresh[102] = ok(1)
    const { getSeasonCatalog } = await load()
    expect(statuses(await getSeasonCatalog(2026))).toEqual(["final", "suspect", "final"])
  })

  it("does not re-probe published sessions fresh (no extra upstream load)", async () => {
    const { getSeasonCatalog } = await load()
    await getSeasonCatalog(2026)
    expect(calls.filter((c) => c.fresh)).toHaveLength(0)
  })

  it("keeps a published session through a transient failure on refresh", async () => {
    const { getSeasonCatalog } = await load()
    await getSeasonCatalog(2026)
    world.cached[101] = { status: 0, error: "connection reset" }
    // expire the memo without dropping the last known catalog
    const memo = (globalThis as unknown as { __f1CatalogMemo: Map<number, { at: number }> }).__f1CatalogMemo
    memo.get(2026)!.at = 0
    const again = await getSeasonCatalog(2026) // stale-while-revalidate: returns immediately
    expect(statuses(again)).toEqual(["final", "final", "final"])
    await new Promise((r) => setTimeout(r, 20)) // let the background refresh finish
    expect(statuses(await getSeasonCatalog(2026))).toEqual(["final", "final", "final"])
  })

  it("shares one build between concurrent readers", async () => {
    const { getSeasonCatalog } = await load()
    await Promise.all([getSeasonCatalog(2026), getSeasonCatalog(2026), getSeasonCatalog(2026)])
    expect(calls.filter((c) => c.endpoint === "seasons/2026/events")).toHaveLength(1)
  })
})
