'use client';

import { getAuthToken, notifyUnauthorized } from './auth-utils';
import { cachedFetchJson, dedupedFetchBlob, type FetchOptions } from './cache/request-cache';
import { sanitizeErrorMessage } from './api-error-message';

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
      // A 401 means the JWT expired or was revoked. There is no refresh flow,
      // so hand off to the auth layer to clear the session and redirect
      // instead of letting every subsequent request fail silently.
      if (response.status === 401) notifyUnauthorized();

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


// ---------------------------------------------------------------------------
// External API access, via the secure proxy at app/api/[...endpoint]/route.ts.
// The API key is attached server-side and never reaches the browser.
//
// Every call goes through lib/cache/request-cache.ts, which de-duplicates
// concurrent identical requests, serves finished-session data from cache, and
// applies a request timeout. Response parsing (and therefore all error
// handling) stays here so each fetcher keeps its established error shape —
// errors thrown during parsing are never cached.
// ---------------------------------------------------------------------------

/** True for the abort a request timeout produces. */
const isTimeout = (error: unknown): boolean =>
  error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');

const timeoutMessage = (endpoint: string) =>
  `The F1 data service didn't respond in time (${endpoint}). It may be busy preparing this session — please try again.`;

/**
 * Reads an error body, preferring the upstream's structured fields.
 *
 * The message is sanitised because an infrastructure failure (a Cloudflare 502
 * page, say) can arrive as a whole HTML document, which must never reach the
 * UI as an error message.
 */
const readErrorBody = async (response: Response) => {
  const body = await response.json().catch(() => ({}));
  const raw = body.detail || body.error || body.message;
  return { body, message: sanitizeErrorMessage(raw, response.status) };
};

/**
 * Some upstream errors arrive as a 200 with an error sentinel in the body
 * rather than a failure status, so a successful status alone isn't enough.
 */
const embeddedError = (data: unknown): { message: string; code?: string; retryAfter?: number } | null => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  if (record.error) {
    return {
      message: String(record.detail || record.error),
      code: String(record.error),
      retryAfter: record.retry_after_seconds as number | undefined,
    };
  }
  if (typeof record.detail === 'string') return { message: record.detail };
  if (typeof record.message === 'string' && record.message.toLowerCase().includes('error')) {
    return { message: record.message };
  }
  return null;
};

/**
 * Parses a proxy response, throwing ExternalApiError so callers can tell a
 * transient "data not published yet" state from a genuine failure — see
 * classifySessionFetchError in lib/newsService.ts.
 */
const parseTyped = async (response: Response): Promise<unknown> => {
  if (!response.ok) {
    const { body, message } = await readErrorBody(response);
    throw new ExternalApiError(message, response.status, body.error, body.retry_after_seconds);
  }
  const data = await response.json();
  const embedded = embeddedError(data);
  if (embedded) {
    throw new ExternalApiError(embedded.message, response.status, embedded.code, embedded.retryAfter);
  }
  return data;
};

/** As parseTyped, but throwing plain Errors, matching the v1/v2 fetchers' contract. */
const parsePlain = async (response: Response): Promise<unknown> => {
  if (!response.ok) {
    const { message } = await readErrorBody(response);
    throw new Error(message);
  }
  const data = await response.json();
  const embedded = embeddedError(data);
  if (embedded) throw new Error(embedded.message);
  return data;
};

/**
 * The upstream stats API is schema-less and every caller narrows the result
 * itself. This preserves the pre-existing contract of these fetchers, which
 * returned `any` straight from `response.json()`; tightening it to `unknown`
 * is a worthwhile migration but a separate one from caching.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResponse = any;

export const fetchFromExternalAPI = async (endpoint: string, options: FetchOptions = {}): Promise<ApiResponse> => {
  const url = `${EXTERNAL_API_BASE_URL}/${endpoint}`;
  try {
    return await cachedFetchJson(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    }, parseTyped);
  } catch (error) {
    if (isTimeout(error)) throw new ExternalApiError(timeoutMessage(endpoint), 408);
    console.error(`❌ Error fetching from external API [${endpoint}]:`, error);
    throw error;
  }
};

const fetchVersioned = async (
  pathPrefix: 'v1' | 'v2',
  endpoint: string,
  options: FetchOptions = {},
): Promise<ApiResponse> => {
  const url = `${EXTERNAL_API_BASE_URL}/${pathPrefix}/${endpoint}`;
  try {
    return await cachedFetchJson(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    }, parsePlain);
  } catch (error) {
    if (isTimeout(error)) throw new Error(timeoutMessage(endpoint));
    console.error(`❌ Error fetching from external API [${endpoint}]:`, error);
    throw error;
  }
};

export const fetchFromExternalAPIv1 = async (endpoint: string, options: FetchOptions = {}): Promise<ApiResponse> =>
  fetchVersioned('v1', endpoint, options);

export const fetchFromExternalAPIv2 = async (endpoint: string, options: FetchOptions = {}): Promise<ApiResponse> =>
  fetchVersioned('v2', endpoint, options);

/**
 * Image endpoints return a rendered PNG. The request is de-duplicated and the
 * resulting Blob reused, but each caller gets its own object URL — callers
 * revoke theirs on unmount, so a shared URL would be handed out already dead.
 */
const fetchImageFromExternalAPI = async (
  pathPrefix: 'v1' | 'v2',
  endpoint: string,
  options: FetchOptions = {}
): Promise<string> => {
  const url = `${EXTERNAL_API_BASE_URL}/${pathPrefix}/${endpoint}`;
  try {
    const blob = await dedupedFetchBlob(url, { ...options, headers: { ...options.headers } }, async (response) => {
      if (!response.ok) {
        const { message } = await readErrorBody(response);
        throw new Error(message);
      }
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(sanitizeErrorMessage(errorBody, response.status));
      }
      return response.blob();
    });
    return URL.createObjectURL(blob);
  } catch (error) {
    if (isTimeout(error)) throw new Error(timeoutMessage(endpoint));
    console.error(`❌ Error fetching image from external API [${endpoint}]:`, error);
    throw error;
  }
};

export const fetchFromExternalAPIv1Image = async (endpoint: string, options: FetchOptions = {}) => {
  return fetchImageFromExternalAPI('v1', endpoint, options);
};

export const fetchFromExternalAPIv2Image = async (endpoint: string, options: FetchOptions = {}) => {
  return fetchImageFromExternalAPI('v2', endpoint, options);
};
