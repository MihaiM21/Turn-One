'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';
import { useCircuitData } from '@/hooks/useCircuitData';

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

const TEAM_COLORS: Record<string, string> = {
  'Mercedes':         '#00D2BE',
  'Red Bull Racing':  '#3671C6',
  'Red Bull':         '#3671C6',
  'Ferrari':          '#E8002D',
  'McLaren':          '#FF8000',
  'Alpine':           '#FF87BC',
  'AlphaTauri':       '#64C4FF',
  'RB':               '#6692FF',
  'Aston Martin':     '#229971',
  'Williams':         '#64ACFF',
  'Alfa Romeo':       '#B12039',
  'Haas':             '#B6BABD',
  'Kick Sauber':      '#52E252',
  'Sauber':           '#52E252',
};

/** Return the index into x/y from miniSectorsIndexes based on completed segments. */
function getTrackIndex(
  miniSectorIndexes: number[],
  totalPoints: number,
  s1: Array<{ status: number }> | undefined,
  s2: Array<{ status: number }> | undefined,
  s3: Array<{ status: number }> | undefined,
): number {
  const isDone = (s: { status: number }) =>
    s.status === 2049 || s.status === 2051 || s.status === 2052;

  const done =
    (s1 ?? []).filter(isDone).length +
    (s2 ?? []).filter(isDone).length +
    (s3 ?? []).filter(isDone).length;

  if (done === 0) return 0;
  if (done >= miniSectorIndexes.length) return totalPoints - 1;
  return miniSectorIndexes[done - 1];
}

/** Normalise raw circuit x/y arrays into a 0–1 range, flipping Y (circuit Y-up → SVG Y-down). */
function normalisePoints(
  xs: number[],
  ys: number[],
  viewW: number,
  viewH: number,
  pad = 20,
) {
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const scaleX = (viewW - pad * 2) / rangeX;
  const scaleY = (viewH - pad * 2) / rangeY;
  const scale = Math.min(scaleX, scaleY);

  // Centre the circuit
  const offsetX = pad + (viewW - pad * 2 - rangeX * scale) / 2;
  const offsetY = pad + (viewH - pad * 2 - rangeY * scale) / 2;

  const toSvg = (x: number, y: number) => ({
    x: offsetX + (x - minX) * scale,
    // Flip Y: SVG y-axis points down, circuit y-axis points up
    y: offsetY + (maxY - y) * scale,
  });

  return { toSvg, scale, offsetX, offsetY, minX, maxX, minY, maxY };
}

// -----------------------------------------------------------------
// Types
// -----------------------------------------------------------------

interface DriverPosition {
  driverNumber: string;
  driverName: string;
  team: string;
  position: number;
  isOnTrack: boolean;
  retired?: boolean;
  sector1Segments?: Array<{ status: number }>;
  sector2Segments?: Array<{ status: number }>;
  sector3Segments?: Array<{ status: number }>;
}

interface TrackMapProps {
  drivers: DriverPosition[];
  sessionLocation?: string;
  sessionYear?: number;
}

// -----------------------------------------------------------------
// Component
// -----------------------------------------------------------------

const VIEW_W = 400;
const VIEW_H = 300;

export function TrackMap({ drivers, sessionLocation, sessionYear }: TrackMapProps) {
  const { data: circuit, loading, error } = useCircuitData(sessionLocation, sessionYear);

  // Build the SVG polyline points string and the normaliser once the circuit loads
  const { polylinePoints, norm } = useMemo(() => {
    if (!circuit) return { polylinePoints: '', norm: null };
    const { toSvg } = normalisePoints(circuit.x, circuit.y, VIEW_W, VIEW_H);
    const pts = circuit.x
      .map((_, i) => {
        const p = toSvg(circuit.x[i], circuit.y[i]);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(' ');
    return { polylinePoints: pts, norm: toSvg };
  }, [circuit]);

  // Per-driver dot positions
  const driverDots = useMemo(() => {
    if (!circuit || !norm) return [];
    const indexes = circuit.miniSectorsIndexes;
    // If no miniSectorsIndexes, fall back to evenly-spaced positions across x/y total length
    const fallbackIndexes = !indexes || indexes.length === 0
      ? Array.from({ length: 60 }, (_, i) => Math.floor((i / 59) * (circuit.x.length - 1)))
      : indexes;

    return drivers
      .filter(d => d.isOnTrack && !d.retired)
      .map(d => {
        const rawIdx = getTrackIndex(
          fallbackIndexes,
          circuit.x.length,
          d.sector1Segments,
          d.sector2Segments,
          d.sector3Segments,
        );
        const pt = norm(circuit.x[rawIdx], circuit.y[rawIdx]);
        const color = TEAM_COLORS[d.team] ?? '#6b7280';
        const tla = d.driverName.split(' ').pop()?.slice(0, 3).toUpperCase() ?? d.driverNumber;
        return { ...d, svgX: pt.x, svgY: pt.y, color, tla };
      });
  }, [circuit, norm, drivers]);

  const offTrack = drivers.filter(d => !d.isOnTrack || d.retired);

  return (
    <Card className="overflow-hidden border border-border/40">
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">
            {circuit?.circuitName ?? sessionLocation ?? 'Track Map'}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {loading
            ? 'Loading circuit…'
            : error && !circuit
            ? 'Using fallback'
            : 'Mini-sector positions'}
        </span>
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Circuit SVG */}
        {!loading && (
          <div className="relative w-full" style={{ paddingBottom: `${(VIEW_H / VIEW_W) * 100}%` }}>
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="absolute inset-0 w-full h-full"
              style={{ overflow: 'visible' }}
            >
              {/* Outer glow track */}
              {polylinePoints && (
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted/25"
                />
              )}
              {/* Track centre line */}
              {polylinePoints && (
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground/30"
                />
              )}

              {/* Fallback generic circuit if no data */}
              {!polylinePoints && (
                <>
                  <circle cx={200} cy={150} r={100} fill="none" stroke="currentColor" strokeWidth={8} className="text-muted/25" />
                  <circle cx={200} cy={150} r={100} fill="none" stroke="currentColor" strokeWidth={3} className="text-muted-foreground/30" />
                </>
              )}

              {/* Driver dots */}
              {driverDots.map((d, i) => (
                <g key={d.driverNumber}>
                  {/* Glow */}
                  <circle cx={d.svgX} cy={d.svgY} r={9} fill={d.color} opacity={0.18} />
                  {/* Dot */}
                  <circle
                    cx={d.svgX}
                    cy={d.svgY}
                    r={5.5}
                    fill={d.color}
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth={1.5}
                  />
                  {/* TLA label — alternate above/below to reduce overlap */}
                  <text
                    x={d.svgX}
                    y={d.svgY + (i % 2 === 0 ? -9 : 15)}
                    textAnchor="middle"
                    fontSize="6.5"
                    fontWeight="700"
                    fill={d.color}
                    stroke="rgba(0,0,0,0.65)"
                    strokeWidth="2"
                    paintOrder="stroke"
                    fontFamily="monospace"
                  >
                    {d.tla}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}

        {/* Off-track drivers */}
        {offTrack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/30">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold self-center mr-1">
              Off track:
            </span>
            {offTrack.map(d => {
              const color = TEAM_COLORS[d.team] ?? '#6b7280';
              const tla = d.driverName.split(' ').pop()?.slice(0, 3).toUpperCase() ?? d.driverNumber;
              return (
                <span
                  key={d.driverNumber}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                  style={{ borderColor: `${color}60`, color, backgroundColor: `${color}15` }}
                >
                  {tla}{d.retired ? ' ✕' : ''}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

