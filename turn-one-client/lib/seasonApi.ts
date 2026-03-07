/**
 * Turn One Season API client
 * Routed through the secure proxy via fetchFromExternalAPI.
 * Proxy base: NEXT_PUBLIC_F1_API_BASE (defaults to /api)
 * Full path: /api/v1/season/{year}/...
 */

import { fetchFromExternalAPI } from './data-fetcher';

// -----------------------------------------------------------------
// Response types
// -----------------------------------------------------------------

export interface SeasonTeam {
  name: string;
  color: string;
  drivers: string[]; // TLA codes
}

export interface SeasonDriver {
  code: string;        // TLA e.g. "VER"
  name: string;        // Full name
  number: number;
  team: string;        // Team name
  nationality?: string;
  imageUrl?: string;
}

export interface SeasonSummary {
  year: number;
  teams: SeasonTeam[];
  drivers: SeasonDriver[];
}

// -----------------------------------------------------------------
// API methods
// -----------------------------------------------------------------

export const seasonApi = {
  /** GET /api/v1/season/{year} */
  getSeason: (year: number) =>
    fetchFromExternalAPI(`v1/season/${year}`) as Promise<SeasonSummary>,

  /** GET /api/v1/season/{year}/teams */
  getTeams: (year: number) =>
    fetchFromExternalAPI(`v1/season/${year}/teams`) as Promise<{ year: number; teams: SeasonTeam[] }>,

  /** GET /api/v1/season/{year}/drivers */
  getDrivers: (year: number) =>
    fetchFromExternalAPI(`v1/season/${year}/drivers`) as Promise<{ year: number; drivers: SeasonDriver[] }>,

  /** GET /api/v1/season/{year}/driver/{driver_code} */
  getDriver: (year: number, driverCode: string) =>
    fetchFromExternalAPI(`v1/season/${year}/driver/${encodeURIComponent(driverCode)}`) as Promise<SeasonDriver>,

  /** GET /api/v1/season/{year}/team/{team_name} */
  getTeam: (year: number, teamName: string) =>
    fetchFromExternalAPI(`v1/season/${year}/team/${encodeURIComponent(teamName)}`) as Promise<SeasonTeam>,
};
