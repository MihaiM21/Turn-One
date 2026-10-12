// Pure formatting only — every fact here comes directly from the fetched
// data. No invented commentary, no generated prose.
//
// What the data is: `qualifying-results-data` returns each driver's BEST LAP of
// the session, fastest first. In Qualifying / Sprint Qualifying that is the
// qualifying order; in a Race / Sprint it is the fastest-lap ranking, NOT the
// finishing order. Copy on these pages must never call it "results" of the race
// without saying so — see `resultsHeading`.

import { driverName } from "@/lib/f1/driver-names"

interface TopSpeedRow {
  team: string
  speed: number
  color: string
}

interface SessionResultRow {
  Driver: string
  Team?: string
  LapTime: string
  LapTimeDelta: number
}

export interface SessionSummaryFacts {
  fastestDriver?: string
  fastestLapTime?: string
  runnerUpDriver?: string
  runnerUpGapSeconds?: number
  topSpeedTeam?: string
  topSpeedKmh?: number
  biggestGapDriver?: string
  biggestGapSeconds?: number
}

/** A gap this large is an incomplete or aborted lap, not pace — not worth a sentence (or a search snippet). */
const MAX_PLAUSIBLE_GAP_SECONDS = 10

const isQualifying = (code: string) => code === "Q" || code === "SQ"

/** Heading for the classification table. */
export function resultsHeading(code: string): string {
  return isQualifying(code) ? "Qualifying Classification" : "Fastest Laps"
}

/** One line saying what the classification measures. */
export function resultsCaption(code: string): string {
  return isQualifying(code)
    ? "Each driver's best lap of the session, fastest first, with the gap to the quickest lap."
    : "Each driver's fastest lap of the session, fastest first, with the gap to the quickest lap. This is a lap-time ranking, not the finishing order."
}

export function buildSessionSummaryFacts(results: SessionResultRow[], topSpeeds: TopSpeedRow[]): SessionSummaryFacts {
  const fastest = results[0]
  const second = results[1]
  const last = results[results.length - 1]
  const topSpeed = topSpeeds[0]

  return {
    fastestDriver: fastest?.Driver,
    fastestLapTime: fastest?.LapTime,
    runnerUpDriver: second?.Driver,
    runnerUpGapSeconds: second?.LapTimeDelta,
    topSpeedTeam: topSpeed?.team,
    topSpeedKmh: topSpeed?.speed,
    biggestGapDriver: last && last !== fastest ? last.Driver : undefined,
    biggestGapSeconds: last && last !== fastest ? last.LapTimeDelta : undefined,
  }
}

export function summaryToSentences(facts: SessionSummaryFacts, sessionName: string): string[] {
  const sentences: string[] = []
  if (facts.fastestDriver && facts.fastestLapTime) {
    const ahead =
      facts.runnerUpDriver && facts.runnerUpGapSeconds != null
        ? `, ${facts.runnerUpGapSeconds.toFixed(3)}s ahead of ${driverName(facts.runnerUpDriver)}`
        : ""
    sentences.push(`${driverName(facts.fastestDriver)} set the fastest lap of ${sessionName} at ${facts.fastestLapTime}${ahead}.`)
  }
  if (facts.topSpeedTeam && facts.topSpeedKmh) {
    sentences.push(`${facts.topSpeedTeam} recorded the highest top speed at ${facts.topSpeedKmh.toFixed(1)} km/h.`)
  }
  if (facts.biggestGapDriver && facts.biggestGapSeconds != null && facts.biggestGapSeconds <= MAX_PLAUSIBLE_GAP_SECONDS) {
    sentences.push(`The biggest gap to the quickest lap was ${driverName(facts.biggestGapDriver)}, +${facts.biggestGapSeconds.toFixed(3)}s.`)
  }
  return sentences
}

/** Meta description built only from what the session data says. */
export function summaryToDescription(facts: SessionSummaryFacts, label: string): string {
  const parts: string[] = []
  if (facts.fastestDriver && facts.fastestLapTime) {
    parts.push(`${driverName(facts.fastestDriver)} set the fastest lap at ${facts.fastestLapTime}.`)
  }
  if (facts.topSpeedTeam && facts.topSpeedKmh) {
    parts.push(`Top speed ${facts.topSpeedKmh.toFixed(1)} km/h (${facts.topSpeedTeam}).`)
  }
  return `${label}: ${parts.join(" ")} Full classification, top speeds and throttle charts — free, no account.`.replace(/\s+/g, " ").trim()
}
