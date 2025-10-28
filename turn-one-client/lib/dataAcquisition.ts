'use client';

import { Console } from 'console';
import { useState, useEffect } from 'react';
import { loadEnvConfig } from '@next/env'
import { fetchWithAuth, fetchFromExternalAPI } from './data-fetcher';



export const fetchTopSpeeds = async (token:string, year: number, gp: number, session: string) => { //
  console.log(year)
  return fetchFromExternalAPI(`top-speed-data?year=${year}&gp=${gp}&session=${session}`);
}
export const fetchThrottleAverages = async (token:string, year: number, gp: number, session: string) => { //
  return fetchFromExternalAPI(`throttle-comparison-data?year=${year}&gp=${gp}&session=${session}`);
}
export const fetchTrackComparison = async (
  token:string, 
  year: number, 
  gp: number, 
  session: string, 
  driver1: string, 
  driver2: string
) => {
  return fetchFromExternalAPI(`track-comparison-2drivers-data?year=${year}&gp=${gp}&session=${session}&driver1=${driver1}&driver2=${driver2}`);
}

export const fetchSessionResults = async (token:string, year: number, gp: number, session: string) => {
  return fetchFromExternalAPI(`qualifying-results-data?year=${year}&gp=${gp}&session=${session}`);
}

export const fetchThrottleBrakeComparison = async (
  token:string, 
  year: number, 
  gp: number, 
  session: string, 
  driver1: string, 
  driver2: string
) => {
  return fetchFromExternalAPI(`throttleBrake-comparison-2drivers-data?year=${year}&gp=${gp}&session=${session}&driver1=${driver1}&driver2=${driver2}`);
}

export const fetchLaptimeData = async (token:string, year: number, gp: number, session: string, driver: string) => {
  return fetchFromExternalAPI(`laptimes?year=${year}&gp=${gp}&session=${session}&driver=${driver}`);
}

export const fetchAPIDailyStats = async () => {
  return fetchFromExternalAPI('analytics/daily');
}
export const fetchAPITotalStats = async () => {
  return fetchFromExternalAPI('analytics/total');
}
