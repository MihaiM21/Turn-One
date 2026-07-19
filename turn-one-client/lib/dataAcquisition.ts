'use client';

import { useState, useEffect } from 'react';
import { loadEnvConfig } from '@next/env'
import { fetchFromExternalAPI, fetchFromExternalAPIv1, fetchFromExternalAPIv1Image, fetchFromExternalAPIv2, fetchFromExternalAPIv2Image } from './data-fetcher';

export const fetchEventsByYear = async (year: number) => {
  // no-store: event lists change during a live race weekend, so the browser's
  // HTTP cache must not serve a stale list on refresh (see route.ts proxy cache header).
  return fetchFromExternalAPIv2(`seasons/${year}/events`, { cache: 'no-store' });
}

export const fetchSessionsByEvent = async (year: number, eventName: string) => {
  return fetchFromExternalAPIv2(`seasons/${year}/events/${encodeURIComponent(eventName)}/sessions`, { cache: 'no-store' });
}



export const fetchTopSpeeds = async (token: string, year: number, gp: number | string, session: string, version: string = 'v1', topSpeedType: string = 'telemetry') => {
  if (version === 'v2') {
    return fetchFromExternalAPIv2(`top-speed-${topSpeedType}-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`);
  }
  return fetchFromExternalAPIv1(`top-speed-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`);
}
export const fetchThrottleAverages = async (token: string, year: number, gp: number | string, session: string, version: string = 'v1') => { //
  const endpoint = `throttle-comparison-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`;
  return version === 'v2' ? fetchFromExternalAPIv2(endpoint) : fetchFromExternalAPIv1(endpoint);
}
export const fetchTrackComparison = async (
  token: string,
  year: number,
  gp: number | string,
  session: string,
  driver1: string,
  driver2: string,
  version: string = 'v1'
) => {
  const endpoint = `track-comparison-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}&d1=${driver1}&d2=${driver2}`;
  return version === 'v2' ? fetchFromExternalAPIv2(endpoint) : fetchFromExternalAPIv1(endpoint);
}

export const fetchTrackComparisonPlot = async (
  token: string,
  year: number,
  gp: number | string,
  session: string,
  driver1: string,
  driver2: string,
  version: string = 'v1'
) => {
  const endpoint = `track-comparison-plot?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}&d1=${driver1}&d2=${driver2}`;
  return version === 'v2' ? fetchFromExternalAPIv2Image(endpoint) : fetchFromExternalAPIv1Image(endpoint);
}

export const fetchSessionResults = async (token: string, year: number, gp: number | string, session: string, version: string = 'v1') => {
  const endpoint = `qualifying-results-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`;
  return version === 'v2' ? fetchFromExternalAPIv2(endpoint) : fetchFromExternalAPIv1(endpoint);
}

export const fetchThrottleBrakeComparison = async (
  token: string,
  year: number,
  gp: number | string,
  session: string,
  driver1: string,
  driver2: string,
  version: string = 'v1'
) => {
  const endpoint = `throttle-brake-comparison-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}&d1=${driver1}&d2=${driver2}`;
  return version === 'v2' ? fetchFromExternalAPIv2(endpoint) : fetchFromExternalAPIv1(endpoint);
}

export const fetchLaptimeData = async (token: string, year: number, gp: number | string, session: string, driver: string, version: string = 'v1') => {
  const endpoint = `laptimes-distribution-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}&driver=${driver}`;
  return version === 'v2' ? fetchFromExternalAPIv2(endpoint) : fetchFromExternalAPIv1(endpoint);
}

export const fetchLapDistributionData = async (
  token: string,
  year: number,
  gp: number | string,
  session: string,
  driver: string,
  version: string = 'v2'
): Promise<import('@/types/news-types').LapTimeDistributionPoint[]> => {
  const endpoint = `laptimes-distribution-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}&driver=${encodeURIComponent(driver)}`;
  const raw = version === 'v2' ? await fetchFromExternalAPIv2(endpoint) : await fetchFromExternalAPIv1(endpoint);

  let rows: Record<string, unknown>[] = [];
  if (Array.isArray(raw)) {
    rows = raw as Record<string, unknown>[];
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      rows = obj.data as Record<string, unknown>[];
    } else if (Array.isArray(obj.points)) {
      rows = obj.points as Record<string, unknown>[];
    } else {
      const keys = Object.keys(obj);
      if (keys.length > 0) {
        const firstVal = obj[keys[0]];
        if (firstVal && typeof firstVal === 'object' && !Array.isArray(firstVal)) {
          const indices = Object.keys(firstVal as Record<string, unknown>);
          rows = indices.map((i) => {
            const row: Record<string, unknown> = {};
            keys.forEach((k) => { row[k] = (obj[k] as Record<string, unknown>)[i]; });
            return row;
          });
        }
      }
    }
  }

  return rows
    .map((row) => {
      const lap = Number(row.LapNumber ?? row.lap_number ?? row.lap_numbers ?? 0);
      const rawTime = Number(row.LapTime ?? row.lap_time ?? row.lap_times_seconds ?? 0);
      const lapTime = rawTime > 1_000_000 ? rawTime / 1_000_000_000 : rawTime;
      return {
        driver: String(row.Driver ?? row.driver ?? driver),
        lap,
        lapTime,
        compound: String(row.Compound ?? row.compound ?? 'UNKNOWN').toUpperCase(),
        color: undefined as string | undefined,
      };
    })
    .filter((d) => d.lap > 0 && d.lapTime > 0);
};

export const fetchSpeedDistributionData = async (
  token: string,
  year: number,
  gp: number | string,
  session: string,
  driver: string,
  version: string = 'v1'
) => {
  const endpoint = `speed-distribution-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}&driver=${encodeURIComponent(driver)}`;
  return version === 'v2' ? fetchFromExternalAPIv2(endpoint) : fetchFromExternalAPIv1(endpoint);
}

export const fetchTyreStintData = async (
  token: string,
  year: number,
  gp: number | string,
  session: string,
  version: string = 'v2'
) => {
  const endpoint = `tyre-stint-usage-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`;
  return version === 'v2' ? fetchFromExternalAPIv2(endpoint) : fetchFromExternalAPIv1(endpoint);
}

export const fetchStaticDrivers = async (): Promise<Map<string, string>> => {
  const raw = await fetchFromExternalAPI('static/drivers') as { drivers?: Array<{ code: string; color?: string }> };
  const list = raw?.drivers ?? [];
  return new Map(list.map((d) => [d.code, d.color ?? '']));
}

export const fetchAPIDailyStats = async () => {
  return fetchFromExternalAPI('v1/analytics/daily');
}
export const fetchAPITotalStats = async () => {
  return fetchFromExternalAPI('v1/analytics/total');
}

// --- New V2 data endpoints ---

export const fetchPositionChanges = async (year: number, gp: number | string, session: string) => {
  return fetchFromExternalAPIv2(`position-changes-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`);
}

export const fetchRaceGaps = async (
  year: number,
  gp: number | string,
  session: string,
  reference: 'leader' | 'average' = 'leader',
  drivers?: string[]
) => {
  let endpoint = `race-gaps-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}&reference=${reference}`;
  if (drivers && drivers.length > 0) endpoint += `&drivers=${encodeURIComponent(drivers.join(','))}`;
  return fetchFromExternalAPIv2(endpoint);
}

export const fetchTyreDegradation = async (
  year: number,
  gp: number | string,
  session: string,
  driver?: string,
  fuelCorrected: boolean = false
) => {
  let endpoint = `tyre-degradation-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}&fuel_corrected=${fuelCorrected}`;
  if (driver) endpoint += `&driver=${encodeURIComponent(driver)}`;
  return fetchFromExternalAPIv2(endpoint);
}

export const fetchPitStrategy = async (year: number, gp: number | string, session: string) => {
  return fetchFromExternalAPIv2(`pit-strategy-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`);
}

export const fetchSessionWeather = async (year: number, gp: number | string, session: string) => {
  return fetchFromExternalAPIv2(`session-weather-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`);
}

export const fetchRacePaceHeatmap = async (year: number, gp: number | string, session: string) => {
  return fetchFromExternalAPIv2(`race-pace-heatmap-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`);
}

export const fetchTrackEvolution = async (
  year: number,
  gp: number | string,
  session: string,
  drivers?: string[]
) => {
  let endpoint = `track-evolution-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`;
  if (drivers && drivers.length > 0) endpoint += `&drivers=${encodeURIComponent(drivers.join(','))}`;
  return fetchFromExternalAPIv2(endpoint);
}

export const fetchTheoreticalBest = async (year: number, gp: number | string, session: string = 'Q') => {
  return fetchFromExternalAPIv2(`theoretical-best-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`);
}

export const fetchRaceStory = async (year: number, gp: number | string, session: string) => {
  return fetchFromExternalAPIv2(`race-story-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`);
}

export const fetchTeammateBattle = async (year: number) => {
  return fetchFromExternalAPIv2(`seasons/${year}/teammate-battle-data`);
}

export const fetchFormGuide = async (year: number, window: number = 3, drivers?: string[]) => {
  let endpoint = `seasons/${year}/form-guide-data?window=${window}`;
  if (drivers && drivers.length > 0) endpoint += `&drivers=${encodeURIComponent(drivers.join(','))}`;
  return fetchFromExternalAPIv2(endpoint);
}

export const fetchSeasonDriverRadar = async (year: number, drivers?: string[]) => {
  let endpoint = `seasons/${year}/driver-radar-data`;
  if (drivers && drivers.length > 0) endpoint += `?drivers=${encodeURIComponent(drivers.join(','))}`;
  return fetchFromExternalAPIv2(endpoint);
}

// `yearsParam` is the already-formatted string built by the UI: either a span
// "YYYY-YYYY" or a comma list "YYYY,YYYY,...".
export const fetchCareerDriverRadar = async (yearsParam: string, drivers?: string[]) => {
  let endpoint = `career/driver-radar-data?years=${encodeURIComponent(yearsParam)}`;
  if (drivers && drivers.length > 0) endpoint += `&drivers=${encodeURIComponent(drivers.join(','))}`;
  return fetchFromExternalAPIv2(endpoint);
}

export const fetchTrackMap = async (
  year: number,
  gp: number | string,
  session: string,
  driver: string,
  colorBy: 'speed' | 'gear' = 'speed'
) => {
  return fetchFromExternalAPIv2(
    `track-map-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}&driver=${encodeURIComponent(driver)}&color_by=${colorBy}`
  );
}

export const fetchCornerDuel = async (
  year: number,
  gp: number | string,
  session: string,
  driver1: string,
  driver2: string
) => {
  return fetchFromExternalAPIv2(
    `corner-duel-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}&driver1=${encodeURIComponent(driver1)}&driver2=${encodeURIComponent(driver2)}`
  );
}

export const fetchSessionDriverRadar = async (
  year: number,
  gp: number | string,
  session: string,
  drivers?: string[]
) => {
  let endpoint = `driver-radar-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}`;
  if (drivers && drivers.length > 0) endpoint += `&drivers=${encodeURIComponent(drivers.join(','))}`;
  return fetchFromExternalAPIv2(endpoint);
}
