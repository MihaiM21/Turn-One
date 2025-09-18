'use client';

import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api';

export const fetchWithAuth = async (endpoint: string, token: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}/${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      // Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const fetchTopSpeeds = async (token: string, year: number, gp: number, session: string) => { //
  return fetchWithAuth(`top-speed-data?year=${year}&gp=${gp}&session=${session}`, token);
}
export const fetchThrottleAverages = async (token: string, year: number, gp: number, session: string) => { //
  return fetchWithAuth(`throttle-comparison-data?year=${year}&gp=${gp}&session=${session}`, token);
}

export const fetchTrackComparison = async (
  token: string, 
  year: number, 
  gp: number, 
  session: string, 
  driver1: string, 
  driver2: string
) => {
  return fetchWithAuth(`track-comparison-2drivers-data?year=${year}&gp=${gp}&session=${session}&driver1=${driver1}&driver2=${driver2}`, token);
}
