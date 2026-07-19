import { AdvancedPlotSettings } from './plot-types';

export type { AdvancedPlotSettings };

// 1. Position Changes
export interface PositionChangeLap {
  lap: number;
  position: number;
}

export interface PositionChangesDriver {
  driver: string;
  team: string;
  color: string;
  start_pos: number;
  end_pos: number;
  positions: PositionChangeLap[];
}

export type PositionChangesData = PositionChangesDriver[];

// 2. Race Gaps
export interface RaceGapLap {
  lap: number;
  gap_s: number | null;
}

export interface RaceGapsDriver {
  driver: string;
  team: string;
  color: string;
  laps: RaceGapLap[];
}

export type RaceGapsData = RaceGapsDriver[];

// 3. Tyre Degradation
// Live shape: a flat array of compounds (no `{ compounds: [...] }` wrapper).
// Points mix laps from every driver who ran that compound.
export interface TyreDegradationPoint {
  driver: string;
  tyre_age: number;
  lap_time_s: number;
  fuel_corrected_s: number | null;
}

export interface TyreDegradationCompound {
  compound: string;
  color: string;
  points: TyreDegradationPoint[];
  deg_rate_s_per_lap: number;
  r_squared: number;
  n_points: number;
}

export type TyreDegradationData = TyreDegradationCompound[];

// 4. Pit Strategy
export interface PitStop {
  driver: string;
  team: string;
  lap: number;
  stop_n: number;
  pit_lane_time_s: number;
  compound_in: string | null;
  compound_out: string;
  under_sc: boolean;
  drive_through: boolean;
}

// Undercut shape is unverified against a live sample (none observed in
// practice) — kept loose so the component can defensively read whichever
// fields are actually present instead of crashing on a shape mismatch.
export interface Undercut {
  attacker?: string;
  attacked?: string;
  gain_s?: number;
  worked?: boolean;
  [key: string]: unknown;
}

export interface PitStopFastest {
  driver: string;
  lap: number;
  pit_lane_time_s: number;
}

export interface PitStopTeamAvg {
  team: string;
  avg_pit_lane_time_s: number;
  n_stops: number;
}

export interface PitStrategySummary {
  fastest_stop: PitStopFastest | null;
  avg_stop_by_team: PitStopTeamAvg[];
}

export interface FreeChange {
  driver: string;
  lap: number;
  compound_in: string;
  compound_out: string;
}

export interface PitStrategyData {
  stops: PitStop[];
  undercuts: Undercut[];
  summary: PitStrategySummary;
  free_changes: FreeChange[];
}

// 5. Session Weather
export interface WeatherPoint {
  time_s: number;
  lap: number;
  air_temp: number;
  track_temp: number;
  humidity: number;
  rainfall: number;
  wind_speed: number;
  wind_dir: number;
}

export interface TrackStatusPeriod {
  status: string;
  start_lap: number;
  end_lap: number;
  start_time_s: number;
  end_time_s: number;
}

export interface RaceControlMessage {
  time_s: number;
  lap: number;
  category: string;
  flag: string | null;
  message: string;
}

export interface SessionWeatherData {
  weather: WeatherPoint[];
  track_status_periods: TrackStatusPeriod[];
  race_control: RaceControlMessage[];
}

// 6. Race Pace Heatmap
// Live shape has no per-cell status array or field medians — `grid` is a
// driver-keyed dict of deltas, with separate pit/safety-car lap indices.
export interface RacePaceHeatmapData {
  drivers: string[];
  laps: number[];
  grid: Record<string, (number | null)[]>;
  pit_laps: Record<string, number[]>;
  sc_laps: number[];
}

// 7. Track Evolution
// Live shape has no team/color per driver and no track name/session field —
// `drivers` is a driver-keyed dict, not an array of driver objects.
export interface TrackEvolutionPoint {
  minute: number;
  best_s: number;
}

export interface TrackEvolutionWeatherPoint {
  minute: number;
  track_temp: number;
}

export interface TrackEvolutionData {
  overall: TrackEvolutionPoint[];
  drivers: Record<string, TrackEvolutionPoint[]>;
  weather: TrackEvolutionWeatherPoint[];
}

// 8. Theoretical Best
// Live shape has no per-sector breakdown.
export interface TheoreticalBestDriver {
  driver: string;
  team: string;
  color: string;
  theoretical_s: number;
  actual_s: number;
  delta_s: number;
}

export type TheoreticalBestData = TheoreticalBestDriver[];

// 9. Race Story
export interface RaceStoryLapGap {
  lap: number;
  gap_s: number | null;
}

export interface RaceStoryPitStop {
  lap: number;
  compound: string;
}

export interface RaceStoryDriver {
  driver: string;
  team: string;
  color: string;
  finish_rank: number;
  laps: RaceStoryLapGap[];
  pit_stops: RaceStoryPitStop[];
  last_lap: number;
}

export interface RaceStoryMoment {
  lap: number;
  kind: string;
  caption: string;
  n: number;
}

export interface RaceStoryData {
  drivers: RaceStoryDriver[];
  key_moments: RaceStoryMoment[];
  track_status_periods: TrackStatusPeriod[];
}

// 10. Teammate Battle
// Live shape has no top-level `year` field.
export interface TeammateBattleTeam {
  team: string;
  color: string;
  driver_a: string;
  driver_b: string;
  quali_h2h: [number, number];
  race_h2h: [number, number];
  avg_quali_gap_s: number;
  rounds_counted: number;
}

export interface TeammateBattleData {
  teams: TeammateBattleTeam[];
}

// 11. Form Guide
// Live shape is parallel arrays (rounds/finish/quali/finish_rolling/quali_rolling)
// per driver, not one object per round.
export interface FormGuideDriver {
  tla: string;
  team: string;
  color: string;
  rounds: number[];
  finish: number[];
  quali: number[];
  finish_rolling: (number | null)[];
  quali_rolling: (number | null)[];
}

export interface FormGuideData {
  window: number;
  rounds: number[];
  drivers: FormGuideDriver[];
}

// 12/13/16. Driver Radar (shared shape across session/season/career scopes)
// Axes are human-readable labels ("Race Pace") that don't map mechanically
// onto the snake_case `raw` keys ("quali_pace" for "Qualifying") — consumers
// should rely on index alignment between `axes` and `values`, not on
// deriving a raw-dict key from the axis label.
export interface DriverRadarEntry {
  tla: string;
  team: string;
  color: string;
  values: number[];
  raw: Record<string, number>;
}

export interface DriverRadarData {
  scope: 'session' | 'season' | 'career';
  axes: string[];
  drivers: DriverRadarEntry[];
  years?: number[];
}

// 14. Track Map
export interface TrackMapPoint {
  distance: number;
  x: number;
  y: number;
  speed: number;
  gear: number;
  brake: number;
}

export interface TrackMapBrakingSegment {
  start_idx: number;
  end_idx: number;
  start_distance: number;
  end_distance: number;
}

export interface TrackMapCallout {
  distance: number;
  speed: number;
  x: number;
  y: number;
}

export interface TrackMapCircuit {
  rotation: number;
  corners: unknown[];
  x: number[];
  y: number[];
}

export interface TrackMapSessionInfo {
  year: number;
  event_name: string;
  session_name: string;
}

export interface TrackMapData {
  driver: string;
  color_by: 'speed' | 'gear';
  lap_time_s: number;
  points: TrackMapPoint[];
  braking_segments: TrackMapBrakingSegment[];
  callouts: {
    top_speed: TrackMapCallout;
    slowest_corner: TrackMapCallout;
  };
  circuit: TrackMapCircuit;
  session_info: TrackMapSessionInfo;
}

// 15. Corner Duel
export interface CornerDuelDeltaPoint {
  distance: number;
  delta_s: number;
}

export interface CornerDuelCorner {
  number: number;
  apex_distance_m: number;
  min_speed_kmh: Record<string, number | null>;
  braking_point_m: Record<string, number | null>;
  delta_gain_s: number;
  beneficiary: string;
}

export interface CornerDuelSessionInfo {
  year: number;
  event_name: string;
  session_name: string;
}

export interface CornerDuelData {
  driver1: string;
  driver2: string;
  driver1_color: string;
  driver2_color: string;
  same_team: boolean;
  delta_series: CornerDuelDeltaPoint[];
  speed_series: unknown[];
  corners: CornerDuelCorner[];
  session_info: CornerDuelSessionInfo;
}
