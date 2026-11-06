'use client';

// Utility to handle the authentication token
export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const setAuthToken = (token: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
};

export const removeAuthToken = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Where to go after signing in: the `next` path a protected page sent the visitor here with, or
 * the dashboard. Only same-site paths are accepted ("/link?code=…"), never "//host" or "https://…".
 */
export const safeNextPath = (next: string | null | undefined, fallback = '/dashboard') => {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
};

/**
 * Session-expiry plumbing.
 *
 * There is no token refresh: once the JWT expires every authenticated request
 * starts failing with 401 and, previously, nothing anywhere reacted to that —
 * the app just silently stopped working until the user reloaded. API clients
 * call `notifyUnauthorized()` on a 401; `AuthProvider` registers the handler
 * that clears auth state and redirects to the login page.
 *
 * Lives here rather than in a React module so API clients can import it without
 * pulling in the provider (and creating an import cycle).
 */
type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null) => {
  unauthorizedHandler = handler;
};

let notifying = false;

export const notifyUnauthorized = () => {
  removeAuthToken();
  // Guard against re-entry: the handler may itself trigger requests that 401.
  if (notifying) return;
  notifying = true;
  try {
    unauthorizedHandler?.();
  } finally {
    notifying = false;
  }
};