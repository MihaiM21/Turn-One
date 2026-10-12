import { describe, expect, it } from "vitest"
import { definitelyFuture, ttlSeconds } from "@/lib/f1/cache-policy"

const NOW = Date.parse("2026-10-12T12:00:00Z")
const DAY = 86_400_000

describe("definitelyFuture", () => {
  it("is false for a session that may already have started in its own timezone", () => {
    expect(definitelyFuture("2026-10-13T01:00:00", NOW)).toBe(false) // UTC+14 could already be past this
  })
  it("is true when no offset could have started it", () => {
    expect(definitelyFuture("2026-10-25T14:00:00", NOW)).toBe(true)
  })
  it("is false without a date (probe instead)", () => {
    expect(definitelyFuture(null, NOW)).toBe(false)
  })
})

describe("ttlSeconds", () => {
  const iso = (daysAgo: number) => new Date(NOW - daysAgo * DAY).toISOString().slice(0, 19)
  it("keeps recent and unknown sessions short so 'no data yet' heals quickly", () => {
    expect(ttlSeconds(iso(0.1), NOW)).toBe(300)
    expect(ttlSeconds(iso(2), NOW)).toBe(300)
    expect(ttlSeconds(null, NOW)).toBe(300)
  })
  it("lengthens as the session ages", () => {
    expect(ttlSeconds(iso(10), NOW)).toBe(3600)
    expect(ttlSeconds(iso(90), NOW)).toBe(21600)
  })
})
