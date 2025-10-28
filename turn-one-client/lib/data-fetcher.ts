'use client';

import { getAuthToken } from './auth-utils';

// Base URL for the API - use consistent URL format
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.t1f1.com/api';
const API_URL = process.env.API_URL || 'https://api.t1f1.com/api';

// Generic fetch function with authentication from backend
export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  if (!token) {
    console.error('No authentication token available for request to', endpoint);
    throw new Error('No authentication token found');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };

  try {

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    

    if (!response.ok) {
      // Try to parse error message from response
      try {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 
          errorData.error || 
          `API request failed with status ${response.status}`
        );
      } catch (e) {
        // If we can't parse JSON, throw generic error
        throw new Error(`API request failed with status ${response.status}`);
      }
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    //console.error(`❌ Error fetching ${endpoint}:`, error);
    throw error;
  }
}

// Fetch from external API without auth
export const fetchFromExternalAPI = async (endpoint: string, options: RequestInit = {}) => {
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