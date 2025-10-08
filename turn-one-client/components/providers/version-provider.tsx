"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import VersionService, { Version } from '@/lib/versionService';

interface VersionContextType {
  version: Version | null;
  isLoading: boolean;
  error: Error | null;
}

const VersionContext = createContext<VersionContextType | undefined>(undefined);

export function VersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState<Version | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadVersion() {
      try {
        const versionData = await VersionService.getCurrentVersion();
        setVersion(versionData);
      } catch (err) {
        console.error('Error loading version:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    loadVersion();
  }, []);

  return (
    <VersionContext.Provider value={{ version, isLoading, error }}>
      {children}
    </VersionContext.Provider>
  );
}

export function useVersion() {
  const context = useContext(VersionContext);
  if (context === undefined) {
    throw new Error('useVersion must be used within a VersionProvider');
  }
  return context;
}