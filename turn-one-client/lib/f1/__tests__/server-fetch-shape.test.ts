import { describe, expect, it } from "vitest"
import { shapeThrottle, shapeTopSpeeds } from "@/lib/plots/server-fetch"

describe("shapeTopSpeeds", () => {
  it("reads the older 'Top Speed (km/h)' rows", () => {
    const rows = shapeTopSpeeds([
      { Team: "Audi", "Top Speed (km/h)": 331, Color: "#fff" },
      { Team: "Racing Bulls", "Top Speed (km/h)": 333, Color: "#66f" },
    ])
    expect(rows.map((r) => r.team)).toEqual(["Racing Bulls", "Audi"])
  })
  it("reads the newer 'Speed' rows (Singapore 2026) instead of dropping the section", () => {
    const rows = shapeTopSpeeds([{ Team: "Mercedes", Speed: 309, Color: "#27F4D2" }])
    expect(rows).toEqual([{ team: "Mercedes", speed: 309, color: "#27F4D2" }])
  })
  it("reads the column-oriented shape with either speed key", () => {
    expect(shapeTopSpeeds({ Team: { 0: "A" }, Color: { 0: "#000" }, "Top Speed (km/h)": { 0: 300 } })).toHaveLength(1)
    expect(shapeTopSpeeds({ Team: { 0: "A" }, Color: { 0: "#000" }, Speed: { 0: 300 } })).toHaveLength(1)
  })
  it("drops rows without a usable speed rather than inventing one", () => {
    expect(shapeTopSpeeds([{ Team: "X", Color: "#000" }])).toEqual([])
  })
})

describe("shapeThrottle", () => {
  it("keeps real rows and drops garbage", () => {
    expect(shapeThrottle([{ Driver: "HAM", "Average Throttle (%)": 65.6, Color: "#E80020" }, { Driver: "X" }])).toEqual([
      { driver: "HAM", throttle: 65.6, color: "#E80020" },
    ])
  })
})
