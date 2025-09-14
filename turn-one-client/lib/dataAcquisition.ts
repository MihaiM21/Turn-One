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
