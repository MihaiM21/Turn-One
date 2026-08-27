import { LoginData, RegisterData, AuthResponse } from '../types/auth-types';
import { getAuthToken, notifyUnauthorized } from './auth-utils';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.t1f1.com/api';

/**
 * The user shape returned by GET /Auth/me, limited to the fields the app reads.
 * Extra fields are tolerated; this is not a full mirror of the backend entity
 * (see types/user-types.ts `UserProfile` for the profile endpoint's shape).
 */
export interface AuthUser {
  id?: string;
  username?: string;
  email?: string;
  avatar?: string;
  /** Serialised as either the enum name ('PRO') or its numeric value — see hooks/use-plan.ts. */
  plan?: string | number;
  role?: string;
  [key: string]: unknown;
}

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/Auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(errorData.message || 'Login failed');
  }

  return await response.json();
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/Auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    });
  } catch (err) {
    // Network or CORS error — surface a clearer message
    throw new Error('Unable to reach backend. Is the API running? ' + (err instanceof Error ? err.message : String(err)));
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(errorData.message || 'Registration failed');
  }

  return await response.json();
};

export const getCurrentUser = async (): Promise<AuthUser> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/Auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    notifyUnauthorized();
    throw new Error('Session expired');
  }

  if (!response.ok) {
    throw new Error('Failed to get user data');
  }

  return await response.json();
};

// NOTE: `useAuth` used to live here as a standalone stateful hook. Four
// components imported it directly instead of the context in
// components/auth/auth-provider.tsx, so each one held its own copy of the auth
// state and independently re-fetched /Auth/me. The state now lives solely in
// AuthProvider; import `useAuth` from '@/components/auth/auth-provider'.
