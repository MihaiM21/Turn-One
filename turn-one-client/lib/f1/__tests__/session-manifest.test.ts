import { describe, expect, it } from "vitest"
import { canonicalEventSlug, eventSlug, findSession, findSessionByApiName, isSupportedYear, supportedYears } from "@/lib/f1/session-manifest"

describe("eventSlug", () => {
  it("shortens Grand Prix and folds accents", () => {
    expect(eventSlug("Singapore Grand Prix")).toBe("singapore-gp")
    expect(eventSlug("São Paulo Grand Prix")).toBe("sao-paulo-gp")
    expect(eventSlug("Mexico City Grand Prix")).toBe("mexico-city-gp")
    expect(eventSlug("Bahrain Grand Prix")).toBe("bahrain-gp")
  })
})

describe("legacy slugs", () => {
  it("maps every slug the old site generated to its current form", () => {
    expect(canonicalEventSlug("s-o-paulo-gp")).toBe("sao-paulo-gp")
    expect(canonicalEventSlug("gran-premio-de-barcelona-catalunya")).toBe("barcelona-gp")
    expect(canonicalEventSlug("monza-gp")).toBe("italian-gp")
    expect(canonicalEventSlug("singapore-gp")).toBeUndefined()
  })
})

describe("sessions", () => {
  it("covers Q, R, Sprint Qualifying and Sprint with the codes the API expects", () => {
    expect(findSession("qualifying")?.code).toBe("Q")
    expect(findSession("race")?.code).toBe("R")
    expect(findSession("sprint-qualifying")?.code).toBe("SQ")
    expect(findSession("sprint")?.code).toBe("S")
    expect(findSessionByApiName("Sprint Qualifying")?.slug).toBe("sprint-qualifying")
    expect(findSessionByApiName("Practice 1")).toBeUndefined()
  })
  it("supports 2025 onwards only", () => {
    const now = new Date("2026-10-12")
    expect(supportedYears(now)).toEqual([2026, 2025])
    expect(isSupportedYear("2025", now)).toBe(true)
    expect(isSupportedYear("2024", now)).toBe(false)
    expect(isSupportedYear("abc", now)).toBe(false)
  })
})
