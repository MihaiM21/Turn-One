import { describe, expect, it } from "vitest"
import { classifyResponse } from "@/lib/f1/outcome"

describe("classifyResponse", () => {
  it("treats network failure / no response as transient", () => {
    expect(classifyResponse({ status: 0, error: "timeout" })).toEqual({ kind: "transient", detail: "timeout" })
  })
  it("maps 400 and 404 to not-found", () => {
    expect(classifyResponse({ status: 400, body: { detail: "Could not find session" } }).kind).toBe("not-found")
    expect(classifyResponse({ status: 404, body: { error: "session_not_found" } }).kind).toBe("not-found")
  })
  it("treats 429, 5xx and auth failures as transient (never cached as a 404)", () => {
    for (const status of [401, 403, 429, 500, 502, 503]) expect(classifyResponse({ status, body: null }).kind).toBe("transient")
  })
  it("treats 200 with an empty body as empty", () => {
    expect(classifyResponse({ status: 200, body: [] }).kind).toBe("empty")
    expect(classifyResponse({ status: 200, body: {} }).kind).toBe("empty")
    expect(classifyResponse({ status: 200, body: { data: [] } }).kind).toBe("empty")
    expect(classifyResponse({ status: 200, body: null }).kind).toBe("empty")
  })
  it("treats 200 with an error body as not-found, not data", () => {
    expect(classifyResponse({ status: 200, body: { error: "session_not_found", detail: "x" } }).kind).toBe("not-found")
  })
  it("returns ok for real data, including the column-oriented top-speed shape", () => {
    expect(classifyResponse({ status: 200, body: [{ Driver: "VER" }] }).kind).toBe("ok")
    expect(classifyResponse({ status: 200, body: { Team: { 0: "Ferrari" }, Color: { 0: "#fff" }, "Top Speed (km/h)": { 0: 330 } } }).kind).toBe("ok")
  })
})
