"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Loading } from '@/components/ui/loading';
import { usePathname, useSearchParams } from 'next/navigation';

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Reset loading state on route change
  useEffect(() => {
    setIsLoading(true);
    
    // Set a timeout to ensure data is loaded
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  const startLoading = (message = "Loading...") => {
    setLoadingMessage(message);
    setIsLoading(true);
  };
  
  const stopLoading = () => {
    setIsLoading(false);
  };

  return (
    <PageLoadingContext.Provider value={{ isLoading, setIsLoading, startLoading, stopLoading }}>
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