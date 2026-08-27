'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  login as loginRequest,
  register as registerRequest,
  getCurrentUser,
  type AuthUser,
} from '@/lib/auth';
import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  setUnauthorizedHandler,
} from '@/lib/auth-utils';
import type { AuthResponse } from '@/types/auth-types';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (
    email: string,
    username: string,
    password: string,
    confirmPassword: string,
  ) => Promise<AuthResponse>;
  logout: () => void;
  /** Re-reads the current user from the server. */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * The single source of auth state for the app. Nothing else should hold its own
 * copy: this provider is mounted once in the root layout, so every consumer
 * shares one user object and one /Auth/me request.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    removeAuthToken();
    setUser(null);
  }, []);

  // Any API client that sees a 401 calls notifyUnauthorized(), which lands here.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      router.push('/auth/login');
    });
    return () => setUnauthorizedHandler(null);
  }, [router]);

  const loadUser = useCallback(async () => {
    if (!getAuthToken()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setUser(await getCurrentUser());
    } catch {
      // Token is stale or the request failed; drop it and stay logged out.
      removeAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest({ email, password });
    setAuthToken(response.token);
    setUser(await getCurrentUser());
    return response;
  }, []);

  const register = useCallback(
    async (email: string, username: string, password: string, confirmPassword: string) => {
      const response = await registerRequest({ email, username, password, confirmPassword });
      setAuthToken(response.token);
      setUser(await getCurrentUser());
      return response;
    },
    [],
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      register,
      logout,
      refresh: loadUser,
    }),
    [user, loading, login, register, logout, loadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
