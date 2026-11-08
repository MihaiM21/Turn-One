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
 * Sign-up intents: `?intent=beta` from the sim landing's "Join the beta" CTA. The intent rides
 * along signup ⇄ login links and is also remembered in localStorage, because a sign-up that needs
 * email confirmation comes back through /auth/confirm-email → /auth/login without the query.
 */
export const AUTH_INTENT_PATHS = {
  beta: '/simracing/beta',
} as const;

export type AuthIntent = keyof typeof AUTH_INTENT_PATHS;

const INTENT_STORAGE_KEY = 'turnone.authIntent';

export const parseAuthIntent = (raw: string | null | undefined): AuthIntent | null =>
  raw && Object.prototype.hasOwnProperty.call(AUTH_INTENT_PATHS, raw) ? (raw as AuthIntent) : null;

/** `?intent=beta` for links between auth pages, or "" when there is no intent. */
export const intentQuery = (intent: AuthIntent | null) => (intent ? `?intent=${intent}` : '');

export const rememberAuthIntent = (intent: AuthIntent | null) => {
  if (typeof window === 'undefined' || !intent) return;
  try {
    localStorage.setItem(INTENT_STORAGE_KEY, intent);
  } catch {
    /* storage blocked — the query string still carries it */
  }
};

/** The intent in the URL, else one remembered from an earlier sign-up step. */
export const currentAuthIntent = (search: string | URLSearchParams): AuthIntent | null => {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const fromUrl = parseAuthIntent(params.get('intent'));
  if (fromUrl) return fromUrl;
  if (typeof window === 'undefined') return null;
  try {
    return parseAuthIntent(localStorage.getItem(INTENT_STORAGE_KEY));
  } catch {
    return null;
  }
};

export const clearAuthIntent = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(INTENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

/**
 * Where to send a user who just signed in or up: an explicit same-site `next` wins (a protected
 * page sent them here), then the intent's page, then the dashboard.
 */
export const postAuthPath = (next: string | null | undefined, intent: AuthIntent | null) => {
  const fallback = intent ? AUTH_INTENT_PATHS[intent] : '/dashboard';
  return safeNextPath(next, fallback);
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