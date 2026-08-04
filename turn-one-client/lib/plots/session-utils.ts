import type { ExportSessionType } from "@/types/export-types"

export interface F1Event {
  name: string
  official_name?: string
  key?: number
  [extra: string]: unknown
}

export interface F1Session {
  name: string
  type: string
  number: number | null
  [extra: string]: unknown
}

/** Maps a session's name/type/number to its short code (R, Q, SQ, S, FP1-3, D1-3). */
export function getSessionCode(name: string, type: string, number: number | null): string {
  const normalizedName = name.toLowerCase()
  const normalizedType = type.toLowerCase()

  if (normalizedName.includes("sprint shootout") || normalizedName.includes("sprint qualifying")) return "SQ"
  if (normalizedName === "sprint") return "S"
  if (normalizedName === "qualifying") return "Q"
  if (normalizedName === "race") return "R"

  if (normalizedType === "practice") return `FP${number}`
  if (normalizedType === "sprint shootout" || normalizedType === "sprint qualifying") return "SQ"
  if (normalizedType === "sprint") return "S"
  if (normalizedType === "qualifying") return "Q"
  if (normalizedType === "race") return "R"
  if (normalizedType === "day 1") return "D1"
  if (normalizedType === "day 2") return "D2"
  if (normalizedType === "day 3") return "D3"
  return name
}

export function sessionToExportType(code: string): ExportSessionType {
  if (code.startsWith("FP")) return "PRACTICE"
  if (code === "Q" || code === "SQ") return "QUALIFYING"
  return "RACE"
}

export const DEFAULT_SESSIONS: F1Session[] = [
  { name: "Practice 1", type: "Practice", number: 1 },
  { name: "Practice 2", type: "Practice", number: 2 },
  { name: "Practice 3", type: "Practice", number: 3 },
  { name: "Qualifying", type: "Qualifying", number: null },
  { name: "Race", type: "Race", number: null },
]

export const isTestingEvent = (e: F1Event) =>
  `${e.name ?? ""} ${e.official_name ?? ""}`.toLowerCase().includes("test")
