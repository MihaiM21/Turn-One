'use client';

import { useEffect, useState } from 'react';
import { seasonApi, SeasonDriver } from '@/lib/seasonApi';

interface SeasonDriversResult {
  drivers: SeasonDriver[];
  /** TLA codes e.g. ["VER","HAM",...] */
  codes: string[];
  /** Full names e.g. ["Max Verstappen","Lewis Hamilton",...] */
  names: string[];
  loading: boolean;
  error: string | null;
}

const cache = new Map<number, SeasonDriver[]>();

export function useSeasonDrivers(year?: number): SeasonDriversResult {
  const resolvedYear = year ?? new Date().getFullYear();

  const [drivers, setDrivers] = useState<SeasonDriver[]>(() => cache.get(resolvedYear) ?? []);
  const [loading, setLoading] = useState(!cache.has(resolvedYear));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache.has(resolvedYear)) {
      setDrivers(cache.get(resolvedYear)!);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    seasonApi.getDrivers(resolvedYear)
      .then(data => {
        if (cancelled) return;
        cache.set(resolvedYear, data.drivers);
        setDrivers(data.drivers);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        setError(String(err));
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [resolvedYear]);

  return {
    drivers,
    codes: drivers.map(d => d.code),
    names: drivers.map(d => d.name),
    loading,
    error,
  };
}
