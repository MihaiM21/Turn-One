"use client";

import { useDashboardDataLoader } from "@/hooks/use-dashboard-data-loader";

// Mock data fetching function for dashboard data
const fetchDashboardData = async () => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  return {
    user: {
      name: "Test User",
      role: "USER",
      subscription: "BASIC"
    },
    sessionData: {
      active: true,
      track: "Monaco",
      sessionType: "RACE",
      drivers: [
        { driverNumber: 1, name: "Max Verstappen", team: "Red Bull" },
        { driverNumber: 11, name: "Sergio Perez", team: "Red Bull" },
        { driverNumber: 44, name: "Lewis Hamilton", team: "Mercedes" },
        // other drivers
      ]
    }
  };
};

export function useDashboardData() {
  const { data, isLoading, isReady, error, refetch } = useDashboardDataLoader(
    fetchDashboardData,
    [],
    "Loading dashboard..."
  );

  return {
    dashboardData: data,
    isLoading,
    isReady,
    error,
    refetch
  };
}