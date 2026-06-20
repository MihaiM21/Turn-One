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

export type TireCompound = "soft" | "medium" | "hard" | "intermediate" | "wet" | string;

export interface DriverStint {
  driver: string;
  team?: string;
  color?: string;
  startLap: number;
  endLap: number;
  compound: TireCompound;
  isFresh?: boolean;
}

export interface PitStop {
  driver: string;
  lap: number;
  durationSeconds?: number;
  color?: string;
}

export interface TireStrategy {
  stints: DriverStint[];
  pitStops: PitStop[];
  totalLaps: number;
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

export interface NewsPageData {
  session: SessionDashboardData | null;
  driverStandings: DriverStanding[] | null;
  constructorStandings: ConstructorStanding[] | null;
  lapDistribution: LapTimeDistributionPoint[] | null;
  tireStrategy: TireStrategy | null;
  tyreStintData: TyreStintEntry[] | null;
  errors: Partial<Record<"session" | "driverStandings" | "constructorStandings" | "lapDistribution" | "tireStrategy" | "tyreStintData", string>>;
}
