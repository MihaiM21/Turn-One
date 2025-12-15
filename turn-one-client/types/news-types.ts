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
