'use client';

import { getAuthToken } from './auth-utils';

// Base URL for the API - use consistent URL format
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.t1f1.com/api';

// Generic fetch function with authentication
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
    console.log(`🔄 Fetching ${endpoint}...`);
    
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
    console.error(`❌ Error fetching ${endpoint}:`, error);
    throw error;
  }
}

// Data fetcher with no fallbacks - always uses real API endpoints
// Fallback functionality has been removed for production