'use client';

import { useEffect, useState } from 'react';
import { seasonApi } from '@/lib/seasonApi';

export interface TeamDataResult {
  /** Team name → hex color */
  teamColors: Record<string, string>;
  /** Driver TLA → hex color (derived from team membership) */
  driverColors: Record<string, string>;
  loading: boolean;
  error: string | null;
}

const cache = new Map<number, { teamColors: Record<string, string>; driverColors: Record<string, string> }>();

export function useTeamData(year?: number): TeamDataResult {
  const resolvedYear = year ?? new Date().getFullYear();

  const [teamColors, setTeamColors] = useState<Record<string, string>>(
    () => cache.get(resolvedYear)?.teamColors ?? {}
  );
  const [driverColors, setDriverColors] = useState<Record<string, string>>(
    () => cache.get(resolvedYear)?.driverColors ?? {}
  );
  const [loading, setLoading] = useState(!cache.has(resolvedYear));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache.has(resolvedYear)) {
      const cached = cache.get(resolvedYear)!;
      setTeamColors(cached.teamColors);
      setDriverColors(cached.driverColors);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    seasonApi.getTeams(resolvedYear)
      .then(data => {
        if (cancelled) return;
        const tc: Record<string, string> = {};
        const dc: Record<string, string> = {};
        for (const team of data.teams) {
          tc[team.name] = team.color;
          for (const tla of team.drivers) {
            dc[tla] = team.color;
          }
        }
        cache.set(resolvedYear, { teamColors: tc, driverColors: dc });
        setTeamColors(tc);
        setDriverColors(dc);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        setError(String(err));
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [resolvedYear]);

  return { teamColors, driverColors, loading, error };
}
