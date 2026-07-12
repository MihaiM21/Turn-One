'use client';

import { getAuthToken } from './auth-utils';

// Typed error for failed external API calls. Preserves the HTTP status and the
// structured error body (when the upstream API returns one) so callers can
// distinguish transient states — e.g. "data not published yet" (503 +
// code "data_not_available") — from genuine failures, instead of matching on
// a flattened error message string.
export class ExternalApiError extends Error {
  status: number;
  code?: string;
  retryAfterSeconds?: number;

  constructor(message: string, status: number, code?: string, retryAfterSeconds?: number) {
    super(message);
    this.name = 'ExternalApiError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// Base URL for the API - use consistent URL format
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.t1f1.com/api';
// External API Base URL - routes through secure proxy (never exposes API key to browser)
const EXTERNAL_API_BASE_URL = process.env.NEXT_PUBLIC_F1_API_BASE || '/api';

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

// Fetch from external API through secure proxy
// The API key is added server-side and never exposed to the browser
export const fetchFromExternalAPI = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${EXTERNAL_API_BASE_URL}/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData.detail ||
        errorData.error ||
        errorData.message ||
        `External API request failed with status ${response.status}`;
      throw new ExternalApiError(message, response.status, errorData.error, errorData.retry_after_seconds);
    }

    const data = await response.json();

    // Catch 200 OK responses that are actually errors
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (data.error) throw new ExternalApiError(data.detail || data.error, response.status, data.error, data.retry_after_seconds);
      if (data.detail && typeof data.detail === 'string') throw new ExternalApiError(data.detail, response.status);
      if (data.message && typeof data.message === 'string' && data.message.toLowerCase().includes('error')) throw new ExternalApiError(data.message, response.status);
    }

    return data;
  } catch (error) {
    console.error(`❌ Error fetching from external API [${endpoint}]:`, error);
    throw error;
  }
};

export const fetchFromExternalAPIv1 = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${EXTERNAL_API_BASE_URL}/v1/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
        errorData.message ||
        `External API request failed with status ${response.status}`
      );
    }

    const data = await response.json();

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (data.error) throw new Error(data.error);
      if (data.detail && typeof data.detail === 'string') throw new Error(data.detail);
      if (data.message && typeof data.message === 'string' && data.message.toLowerCase().includes('error')) throw new Error(data.message);
    }

    return data;
  } catch (error) {
    console.error(`❌ Error fetching from external API [${endpoint}]:`, error);
    throw error;
  }
};

export const fetchFromExternalAPIv2 = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${EXTERNAL_API_BASE_URL}/v2/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
        errorData.message ||
        `External API request failed with status ${response.status}`
      );
    }

    const data = await response.json();

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (data.error) throw new Error(data.error);
      if (data.detail && typeof data.detail === 'string') throw new Error(data.detail);
      if (data.message && typeof data.message === 'string' && data.message.toLowerCase().includes('error')) throw new Error(data.message);
    }

    return data;
  } catch (error) {
    console.error(`❌ Error fetching from external API [${endpoint}]:`, error);
    throw error;
  }
};

const fetchImageFromExternalAPI = async (
  pathPrefix: 'v1' | 'v2',
  endpoint: string,
  options: RequestInit = {}
): Promise<string> => {
  try {
    const response = await fetch(`${EXTERNAL_API_BASE_URL}/${pathPrefix}/${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
        errorData.message ||
        `External API request failed with status ${response.status}`
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      const errorBody = await response.text().catch(() => 'Unexpected non-image response');
      throw new Error(errorBody || 'Unexpected non-image response from external API');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error(`❌ Error fetching image from external API [${endpoint}]:`, error);
    throw error;
  }
};

export const fetchFromExternalAPIv1Image = async (endpoint: string, options: RequestInit = {}) => {
  return fetchImageFromExternalAPI('v1', endpoint, options);
};

export const fetchFromExternalAPIv2Image = async (endpoint: string, options: RequestInit = {}) => {
  return fetchImageFromExternalAPI('v2', endpoint, options);
};