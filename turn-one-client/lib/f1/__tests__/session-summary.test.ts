import { describe, expect, it } from "vitest"
import { buildSessionSummaryFacts, resultsHeading, summaryToDescription, summaryToSentences } from "@/lib/f1/session-summary"

const rows = [
  { Driver: "VER", LapTime: "1:31.373", LapTimeDelta: 0 },
  { Driver: "LEC", LapTime: "1:31.427", LapTimeDelta: 0.054 },
  { Driver: "HAD", LapTime: "4:23.003", LapTimeDelta: 171.63 },
]

describe("session summary", () => {
  it("states only facts from the data, with driver names", () => {
    const s = summaryToSentences(buildSessionSummaryFacts(rows, [{ team: "Mercedes", speed: 309, color: "#fff" }]), "Singapore Grand Prix 2026 Qualifying")
    expect(s[0]).toBe("Max Verstappen set the fastest lap of Singapore Grand Prix 2026 Qualifying at 1:31.373, 0.054s ahead of Charles Leclerc.")
    expect(s[1]).toBe("Mercedes recorded the highest top speed at 309.0 km/h.")
  })
  it("leaves out an implausible gap caused by an incomplete lap", () => {
    const s = summaryToSentences(buildSessionSummaryFacts(rows, []), "x")
    expect(s.some((x) => x.includes("biggest gap"))).toBe(false)
  })
  it("does not call a race lap-time ranking the finishing order", () => {
    expect(resultsHeading("R")).toBe("Fastest Laps")
    expect(resultsHeading("Q")).toBe("Qualifying Classification")
  })
  it("builds the description from the same facts", () => {
    expect(summaryToDescription(buildSessionSummaryFacts(rows, []), "Singapore Grand Prix 2026 Qualifying")).toContain("Max Verstappen set the fastest lap at 1:31.373.")
  })
})
