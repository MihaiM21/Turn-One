"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { Loading } from '@/components/ui/loading';

interface PageLoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
}

const PageLoadingContext = createContext<PageLoadingContextType | undefined>(undefined);

export function PageLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  // This provider used to force `isLoading` true for 200ms on every pathname or
  // searchParams change, which put a full-screen overlay flash on every single
  // navigation regardless of whether anything was actually loading. Route-level
  // loading states belong in App Router `loading.tsx` files; this context is now
  // only driven explicitly via startLoading/stopLoading.

  const startLoading = useCallback((message = "Loading...") => {
    setLoadingMessage(message);
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Memoized so the whole app doesn't re-render whenever this provider does.
  const value = useMemo(
    () => ({ isLoading, setIsLoading, startLoading, stopLoading }),
    [isLoading, startLoading, stopLoading],
  );

  return (
    <PageLoadingContext.Provider value={value}>
      {isLoading && <Loading message={loadingMessage} />}
      {children}
    </PageLoadingContext.Provider>
  );
}

export function usePageLoading() {
  const context = useContext(PageLoadingContext);
  if (context === undefined) {
    throw new Error('usePageLoading must be used within a PageLoadingProvider');
  }
  return context;
}
