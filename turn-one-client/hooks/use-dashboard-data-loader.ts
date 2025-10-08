"use client";

import { useDataLoader } from "./use-data-loader";
import { useEffect, useState } from "react";

/**
 * A hook for pages that need to load essential data before rendering content
 * 
 * @param fetchFunction - Function to fetch the data
 * @param dependencies - Array of dependencies for the useEffect
 * @param loadingMessage - Custom loading message
 */
export function useDashboardDataLoader<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
  loadingMessage: string = "Loading dashboard data..."
) {
  const { data, isLoading, error, refetch } = useDataLoader(
    fetchFunction, 
    dependencies,
    loadingMessage
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // Add a small delay to ensure smooth transitions
      const timeout = setTimeout(() => {
        setIsReady(true);
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  return {
    data,
    isLoading,
    isReady,
    error,
    refetch
  };
}