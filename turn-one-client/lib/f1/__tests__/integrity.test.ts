import { describe, expect, it } from "vitest"
import { findCopied, looksCopied, fingerprint } from "@/lib/f1/integrity"

const row = (Driver: string, LapTime: string) => ({ Driver, LapTime })
const grid = (times: number[]) => ["VER", "NOR", "LEC", "HAM", "RUS", "PIA", "ALO", "GAS"].map((d, i) => row(d, `1:2${i}.${times[i] ?? 100 + i}`))

describe("integrity guard", () => {
  const australia = grid([1, 2, 3, 4, 5, 6, 7, 8])
  const china = grid([11, 12, 13, 14, 15, 16, 17, 18])

  it("flags an identical copy (Japan Q = Australia Q)", () => {
    const copied = findCopied([
      { key: "aus", rows: australia },
      { key: "chn", rows: china },
      { key: "jpn", rows: [...australia] },
    ])
    expect([...copied.entries()]).toEqual([["jpn", "aus"]])
  })

  it("flags a partial copy with a few own rows mixed in (Sepang vs China)", () => {
    const mixed = [...china.slice(0, 6), row("BOR", "1:33.549"), row("OCO", "1:33.600")]
    expect(looksCopied(fingerprint(mixed), fingerprint(china))).toBe(true)
  })

  it("blames the later event, never the earlier one", () => {
    const copied = findCopied([
      { key: "first", rows: australia },
      { key: "second", rows: [...australia] },
    ])
    expect(copied.has("first")).toBe(false)
    expect(copied.get("second")).toBe("first")
  })

  it("does not flag genuinely different sessions", () => {
    expect(findCopied([{ key: "a", rows: australia }, { key: "b", rows: china }]).size).toBe(0)
  })

  it("does not flag when only a handful of rows could match by chance", () => {
    const tiny = [row("VER", "1:20.000"), row("NOR", "1:20.100")]
    expect(looksCopied(fingerprint(tiny), fingerprint(tiny))).toBe(false)
  })
})
