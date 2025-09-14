'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth as useAuthHook } from '@/lib/auth';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, username: string, password: string, confirmPassword: string) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthHook();
  
  return (
    <AuthContext.Provider
      value={{
        user: auth.user,
        isAuthenticated: auth.isAuthenticated,
        loading: auth.loading,
        login: async (email, password) => {
          return await auth.loginUser({ email, password });
        },
        register: async (email, username, password, confirmPassword) => {
          return await auth.registerUser({ email, username, password, confirmPassword });
        },
        logout: auth.logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
