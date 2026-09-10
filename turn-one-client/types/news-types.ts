export interface QualifyingResult {
  Driver: string;
  Team: string;
  LapTime: string;
  LapTimeDelta: number;
  Color: string;
}

export interface TopSpeed {
  Team: string;
  "Top Speed (km/h)": number;
  Color: string;
}

export interface ThrottleComparison {
  Driver: string;
  "Average Throttle (%)": number;
  Color: string;
}

export interface RaceResult {
  Driver: string;
  Team: string;
  Position: number;
  Points: number;
  Status: string;
  Color: string;
}

export interface SessionDashboardData {
  session_type: "qualifying" | "race" | "practice";
  year: number;
  round: number;
  session_name: string;
  qualifying_results?: QualifyingResult[];
  race_results?: RaceResult[];
  top_speed: TopSpeed[];
  throttle_comparison: ThrottleComparison[];
}

export type SessionType = "qualifying" | "race" | "practice";

// -----------------------------------------------------------------
// Extended news page data (Phase B)
// -----------------------------------------------------------------

export interface DriverStanding {
  position: number;
  driver: string;
  code?: string;
  team: string;
  points?: number;
  wins?: number;
  color?: string;
}

export interface ConstructorStanding {
  position: number;
  team: string;
  points?: number;
  wins?: number;
  color?: string;
}

export interface LapTimeDistributionPoint {
  driver: string;
  team?: string;
  color?: string;
  lap: number;
  lapTime: number; // seconds
  compound?: string;
}

export interface TyreStintEntry {
  driver: string;
  team: string;
  position: number;
  stint_number: number;
  compound: string;
  start_lap: number;
  end_lap: number;
  lap_count: number;
  tyre_life_end: number;
  color: string;
}

// Distinguishes "the upstream data pipeline hasn't published this session yet"
// (transient — will resolve on its own, worth a friendly message + retry) from
// a genuine fetch failure (network error, unexpected 5xx, etc).
export type SessionFetchStatus =
  /** The session exists but its data has not been published yet. */
  | { kind: "not_ready"; retryAfterSeconds?: number }
  /** The data service itself is failing — a gateway error, not missing data. */
  | { kind: "unavailable"; message: string }
  | { kind: "error"; message: string };

/** Errors are collected rather than thrown so one failed section cannot blank the page. */
export type NewsErrors = Partial<
  Record<"session" | "driverStandings" | "constructorStandings" | "lapDistribution" | "tyreStintData", string>
>;

/**
 * The fast half of the news page: the session itself plus championship
 * standings. Rendered immediately.
 */
export interface NewsCoreData {
  session: SessionDashboardData | null;
  driverStandings: DriverStanding[] | null;
  constructorStandings: ConstructorStanding[] | null;
  errors: NewsErrors;
  sessionStatus?: SessionFetchStatus;
}

/**
 * The slow half: lap-time distribution fans out one request per driver, so it
 * streams in behind a Suspense boundary rather than holding up the whole page.
 */
export interface NewsDeepData {
  lapDistribution: LapTimeDistributionPoint[] | null;
  tyreStintData: TyreStintEntry[] | null;
  errors: NewsErrors;
}