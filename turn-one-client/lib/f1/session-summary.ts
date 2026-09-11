// Pure formatting only — every fact here comes directly from the fetched
// data. No invented commentary, no generated prose.

interface TopSpeedRow {
  team: string
  speed: number
  color: string
}

interface SessionResultRow {
  Driver: string
  LapTime: string
  LapTimeDelta: number
}

export interface SessionSummaryFacts {
  fastestDriver?: string
  fastestLapTime?: string
  topSpeedTeam?: string
  topSpeedKmh?: number
  biggestGapDriver?: string
  biggestGapSeconds?: number
}

export function buildSessionSummaryFacts(
  results: SessionResultRow[],
  topSpeeds: TopSpeedRow[]
): SessionSummaryFacts {
  const fastest = results[0]
  const last = results[results.length - 1]
  const topSpeed = topSpeeds[0]

  return {
    fastestDriver: fastest?.Driver,
    fastestLapTime: fastest?.LapTime,
    topSpeedTeam: topSpeed?.team,
    topSpeedKmh: topSpeed?.speed,
    biggestGapDriver: last && last !== fastest ? last.Driver : undefined,
    biggestGapSeconds: last && last !== fastest ? last.LapTimeDelta : undefined,
  }
}

export function summaryToSentences(facts: SessionSummaryFacts, sessionName: string): string[] {
  const sentences: string[] = []
  if (facts.fastestDriver && facts.fastestLapTime) {
    sentences.push(`${facts.fastestDriver} set the fastest lap of ${sessionName} at ${facts.fastestLapTime}.`)
  }
  if (facts.topSpeedTeam && facts.topSpeedKmh) {
    sentences.push(`${facts.topSpeedTeam} recorded the highest top speed at ${facts.topSpeedKmh.toFixed(1)} km/h.`)
  }
  if (facts.biggestGapDriver && facts.biggestGapSeconds != null) {
    sentences.push(`The biggest gap to the leader was ${facts.biggestGapDriver}, +${facts.biggestGapSeconds.toFixed(3)}s.`)
  }
  return sentences
}
