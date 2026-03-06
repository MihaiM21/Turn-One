'use client';

import { useState, useEffect } from 'react';

export interface CircuitData {
  circuitKey: number;
  circuitName: string;
  x: number[];
  y: number[];
  miniSectorsIndexes?: number[];
  rotation: number;
  round?: number;
}

/**
 * Maps F1 live timing Meeting.Location values to F1 Multiviewer circuit keys.
 * Includes multiple aliases per circuit to handle variations in the live data.
 */
const LOCATION_TO_KEY: Record<string, number> = {
  // Bahrain
  'Bahrain': 63, 'Sakhir': 63,
  // Saudi Arabia
  'Jeddah': 149, 'Saudi Arabia': 149,
  // Australia
  'Melbourne': 10, 'Australia': 10,
  // Japan
  'Suzuka': 46, 'Japan': 46,
  // China
  'Shanghai': 49, 'China': 49,
  // Miami
  'Miami': 151,
  // Emilia Romagna
  'Imola': 6,
  // Monaco
  'Monaco': 22, 'Monte Carlo': 22,
  // Canada
  'Montreal': 23, 'Canada': 23,
  // Spain
  'Barcelona': 15, 'Catalunya': 15, 'Spain': 15,
  // Austria
  'Spielberg': 19, 'Austria': 19,
  // Great Britain
  'Silverstone': 2, 'Great Britain': 2,
  // Hungary
  'Budapest': 4, 'Hungary': 4, 'Hungaroring': 4,
  // Belgium
  'Spa-Francorchamps': 7, 'Spa': 7, 'Belgium': 7,
  // Netherlands
  'Zandvoort': 55, 'Netherlands': 55,
  // Italy
  'Monza': 39, 'Italy': 39,
  // Azerbaijan
  'Baku': 144, 'Azerbaijan': 144,
  // Singapore
  'Singapore': 61,
  // USA (COTA)
  'Austin': 9, 'United States': 9,
  // Mexico
  'Mexico City': 65, 'Mexico': 65,
  // Brazil
  'São Paulo': 14, 'Sao Paulo': 14, 'Interlagos': 14, 'Brazil': 14,
  // Las Vegas
  'Las Vegas': 152,
  // Qatar
  'Lusail': 150, 'Losail': 150, 'Qatar': 150,
  // Abu Dhabi
  'Abu Dhabi': 70, 'Yas Marina': 70, 'Yas Marina Circuit': 70,
};

const cache = new Map<string, CircuitData>();

export function useCircuitData(location: string | undefined, year: number | undefined) {
  const [data, setData] = useState<CircuitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;

    const circuitKey = LOCATION_TO_KEY[location];
    if (!circuitKey) {
      setError(`Unknown circuit location: ${location}`);
      return;
    }

    // Try requested year, then fall back year-by-year up to 3 years back
    const baseYear = year ?? new Date().getFullYear();

    const tryFetch = async (yr: number, retriesLeft: number): Promise<void> => {
      const cacheKey = `${circuitKey}-${yr}`;
      if (cache.has(cacheKey)) {
        setData(cache.get(cacheKey)!);
        return;
      }

      const res = await fetch(
        `https://api.multiviewer.app/api/v1/circuits/${circuitKey}/${yr}`
      );

      if (!res.ok) {
        if (retriesLeft > 0) {
          return tryFetch(yr - 1, retriesLeft - 1);
        }
        throw new Error(`No circuit data found for ${location} (key ${circuitKey})`);
      }

      const d: CircuitData = await res.json();
      cache.set(cacheKey, d);
      setData(d);
    };

    setLoading(true);
    setError(null);

    tryFetch(baseYear, 3)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [location, year]);

  return { data, loading, error };
}
