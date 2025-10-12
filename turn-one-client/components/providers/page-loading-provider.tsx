"use client";

import { createContext, useContext, useState, useEffect, ReactNode, Suspense } from 'react';
import { Loading } from '@/components/ui/loading';
import { usePathname, useSearchParams } from 'next/navigation';

interface PageLoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
}

const PageLoadingContext = createContext<PageLoadingContextType | undefined>(undefined);

// SearchParams consumer component that uses the hook inside Suspense
function SearchParamsWatcher({ onParamsChange }: { onParamsChange: (value: URLSearchParams) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (searchParams) {
      onParamsChange(searchParams);
    }
  }, [searchParams, onParamsChange]);
  
  return null;
}

export function PageLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const pathname = usePathname();
  const [currentSearchParams, setCurrentSearchParams] = useState<URLSearchParams | null>(null);
  
  // Reset loading state on route change
  useEffect(() => {
    setIsLoading(true);
    
    // Set a timeout to ensure data is loaded
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [pathname, currentSearchParams]);

  const startLoading = (message = "Loading...") => {
    setLoadingMessage(message);
    setIsLoading(true);
  };
  
  const stopLoading = () => {
    setIsLoading(false);
  };

  return (
    <PageLoadingContext.Provider value={{ isLoading, setIsLoading, startLoading, stopLoading }}>
      <Suspense fallback={null}>
        <SearchParamsWatcher onParamsChange={(params) => setCurrentSearchParams(params)} />
      </Suspense>
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