'use client';

import { useState, useEffect } from 'react';
import { loadEnvConfig } from '@next/env'
import { fetchFromExternalAPI, fetchFromExternalAPIv1, fetchFromExternalAPIv2 } from './data-fetcher';

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
  const endpoint = `track-comparison-2drivers-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}&driver1=${driver1}&driver2=${driver2}`;
  return version === 'v2' ? fetchFromExternalAPIv2(endpoint) : fetchFromExternalAPIv1(endpoint);
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
  const endpoint = `throttleBrake-comparison-2drivers-data?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}&driver1=${driver1}&driver2=${driver2}`;
  return version === 'v2' ? fetchFromExternalAPIv2(endpoint) : fetchFromExternalAPIv1(endpoint);
}

export const fetchLaptimeData = async (token: string, year: number, gp: number | string, session: string, driver: string, version: string = 'v1') => {
  const endpoint = `laptimes?year=${year}&gp=${encodeURIComponent(gp)}&session=${session}&driver=${driver}`;
  return version === 'v2' ? fetchFromExternalAPIv2(endpoint) : fetchFromExternalAPIv1(endpoint);
}

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

export const fetchAPIDailyStats = async () => {
  return fetchFromExternalAPI('v1/analytics/daily');
}
export const fetchAPITotalStats = async () => {
  return fetchFromExternalAPI('v1/analytics/total');
}
