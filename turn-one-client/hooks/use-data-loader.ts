"use client";

import { useState, useEffect } from 'react';
import { usePageLoading } from '@/components/providers/page-loading-provider';

export function useDataLoader<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
  loadingMessage: string = "Loading data..."
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLocalLoading, setIsLocalLoading] = useState(true);
  const { startLoading, stopLoading } = usePageLoading();

  const fetchData = async () => {
    setIsLocalLoading(true);
    startLoading(loadingMessage);
    
    try {
      const result = await fetchFunction();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLocalLoading(false);
      stopLoading();
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  const refetch = async () => {
    await fetchData();
  };

  return {
    data,
    isLoading: isLocalLoading,
    error,
    refetch,
  };
}