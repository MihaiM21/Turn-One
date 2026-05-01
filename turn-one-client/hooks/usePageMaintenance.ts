'use client';

import { useState, useEffect } from 'react';
import { getPageStatus, type PageStatusData } from '@/lib/adminService';

interface UsePageMaintenanceReturn {
  isDisabled: boolean;
  message: string | undefined;
  loading: boolean;
}

/**
 * Checks whether a page is in maintenance mode.
 * Fetches from the public /api/pages/{slug} endpoint — no auth required.
 * Returns loading=true until the fetch resolves.
 */
export function usePageMaintenance(slug: string): UsePageMaintenanceReturn {
  const [status, setStatus] = useState<PageStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getPageStatus(slug).then((data) => {
      if (!cancelled) {
        setStatus(data);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [slug]);

  return {
    isDisabled: status?.isDisabled ?? false,
    message: status?.maintenanceMessage ?? undefined,
    loading,
  };
}
