"use client";

import { Loading } from "@/components/ui/loading";

interface DashboardLoadingContainerProps {
  isReady: boolean;
  children: React.ReactNode;
  loadingMessage?: string;
}

export function DashboardLoadingContainer({ 
  isReady, 
  children, 
  loadingMessage = "Loading dashboard..." 
}: DashboardLoadingContainerProps) {
  // Simple component with no development-specific features

  if (!isReady) {
    return (
      <Loading message={loadingMessage} />
    );
  }

  return <>{children}</>;
}