'use client';

import { useState, useEffect } from 'react';
import { loadEnvConfig } from '@next/env'
import { fetchFromExternalAPI, fetchFromExternalAPIv1, fetchFromExternalAPIv1Image, fetchFromExternalAPIv2, fetchFromExternalAPIv2Image } from './data-fetcher';

export const fetchEventsByYear = async (year: number) => {
  return fetchFromExternalAPIv2(`seasons/${year}/events`);
}

export const fetchSessionsByEvent = async (year: number, eventName: string) => {
  return fetchFromExternalAPIv2(`seasons/${year}/events/${encodeURIComponent(eventName)}/sessions`);
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
