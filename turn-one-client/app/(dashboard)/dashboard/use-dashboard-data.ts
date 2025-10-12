"use client";

import { useDashboardDataLoader } from "@/hooks/use-dashboard-data-loader";
import { fetchWithAuth } from "@/lib/data-fetcher";
import { getAuthToken } from "@/lib/auth-utils";
import { useEffect, useState } from "react";

// API endpoint for dashboard data - use consistent path format
const DASHBOARD_API_URL = 'dashboard';

// Fetch dashboard data from API
const fetchDashboardData = async () => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    // Use consistent API URL format
    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5271/api';
    console.log(`Fetching dashboard data from ${API_URL}/${DASHBOARD_API_URL}`);
    
    const response = await fetch(`${API_URL}/${DASHBOARD_API_URL}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Dashboard data request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

export function useDashboardData() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  
  // Check if token exists when component mounts
  useEffect(() => {
    const token = getAuthToken();
    setHasToken(!!token);
    
    // Setup a periodic check for token in case it changes
    const tokenCheckInterval = setInterval(() => {
      const tokenExists = !!getAuthToken();
      if (tokenExists !== hasToken) {
        setHasToken(tokenExists);
      }
    }, 1000);
    
    return () => clearInterval(tokenCheckInterval);
  }, [hasToken]);

  const { data, isLoading, isReady, error, refetch } = useDashboardDataLoader(
    fetchDashboardData,
    [hasToken], // Re-fetch if token status changes
    "Loading dashboard..."
  );

  // If we get an error and we have a token, we should retry
  useEffect(() => {
    if (error && hasToken) {
      const retryTimeout = setTimeout(() => {
        console.log('Retrying dashboard data fetch due to error...');
        refetch();
      }, 3000); // Retry after 3 seconds
      
      return () => clearTimeout(retryTimeout);
    }
  }, [error, hasToken, refetch]);

  return {
    dashboardData: data,
    isLoading,
    isReady: isReady && hasToken !== null, // Only ready if token check is complete
    error,
    refetch,
    hasToken
  };
}