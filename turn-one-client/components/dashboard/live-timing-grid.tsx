'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Trophy, Timer, Zap } from 'lucide-react';
import { useTeamData } from '@/hooks/useTeamData';

interface Position {
  position: number;
  driverNumber: string;
  driverName: string;
  team: string;
  gap: string;
  interval: string;
  lastLapTime: string;
  bestLapTime?: string;
  currentLapTime?: string;
  sector1?: string;
  sector2?: string;
  sector3?: string;
  sector1Best?: boolean;
  sector2Best?: boolean;
  sector3Best?: boolean;
  sector1Segments?: Array<{ status: number }>;
  sector2Segments?: Array<{ status: number }>;
  sector3Segments?: Array<{ status: number }>;
  speed: number;
  drs: boolean;
  positionChange?: number; // +1 gained, -1 lost, 0 no change
  isOnTrack: boolean;
  retired?: boolean;
  knockedOut?: boolean;
  numberOfLaps?: number;
  numberOfPitStops?: number;
  tires: {
    compound: 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet';
    age: number;
  };
}

interface LiveTimingGridProps {
  positions: Position[];
  sessionType?: string;
  sessionYear?: number;
  qualiSegment?: 'Q1' | 'Q2' | 'Q3';
  className?: string;
}

const SEGMENT_COLOR: Record<number, string> = {
  2051: '#a855f7',
  2052: '#a855f7',
  2049: '#22c55e',
  2048: '#eab308',
};

const TIRE_STYLES: Record<string, { bg: string; dark: boolean; label: string }> = {
  soft:         { bg: '#ef4444', dark: false, label: 'S' },
  medium:       { bg: '#eab308', dark: true,  label: 'M' },
  hard:         { bg: '#e5e7eb', dark: true,  label: 'H' },
  intermediate: { bg: '#22c55e', dark: false, label: 'I' },
  wet:          { bg: '#3b82f6', dark: false, label: 'W' },
};

export function LiveTimingGrid({ positions, sessionType, sessionYear, qualiSegment, className }: LiveTimingGridProps) {
  const { teamColors } = useTeamData(sessionYear);

  const isQuali = sessionType === 'Qualifying' || sessionType === 'Sprint Shootout';
  const isPractice = sessionType?.startsWith('Practice') ?? false;
  const isRace = !isQuali && !isPractice;

  // Position after which eliminated drivers are shown
  // 22-car grid: Q1 bottom 6 out (after P16), Q2 bottom 6 out (after P10), Q3 no cutoff
  const eliminationCutoff = isQuali
    ? qualiSegment === 'Q1' ? 16 : qualiSegment === 'Q2' ? 10 : null
    : null;

  const sessionBadge = isQuali
    ? { label: qualiSegment ?? 'QUALI', color: '#a855f7' }
    : isPractice
    ? { label: sessionType ?? 'PRACTICE', color: '#3b82f6' }
    : { label: 'RACE', color: '#ef4444' };

  const getPositionChangeIcon = (change?: number) => {
    if (!change || change === 0) return null;
    if (change > 0) return <TrendingUp className="w-3 h-3 text-green-500 shrink-0" />;
    return <TrendingDown className="w-3 h-3 text-red-500 shrink-0" />;
  };

  return (
    <Card className={cn('overflow-hidden border border-border/40', className)}>
      {/* Header with colour legend */}
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {isQuali ? <Zap className="w-4 h-4 text-primary" /> : isPractice ? <Timer className="w-4 h-4 text-primary" /> : <Trophy className="w-4 h-4 text-primary" />}
          <span className="text-sm font-semibold">Live Timing</span>
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded tracking-wider uppercase"
            style={{ backgroundColor: `${sessionBadge.color}20`, color: sessionBadge.color, border: `1px solid ${sessionBadge.color}40` }}
          >
            {sessionBadge.label}
          </span>
          <span className="text-xs text-muted-foreground">— {positions.length} drivers</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[11px] text-muted-foreground">
          {[
            { color: '#a855f7', label: 'Overall Best' },
            { color: '#22c55e', label: 'Personal Best' },
            { color: '#eab308', label: 'Slower' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
              <th className="text-left px-3 py-2.5 font-medium w-14">Pos</th>
              <th className="text-left px-2 py-2.5 font-medium">Driver</th>
              {isQuali || isPractice ? (
                <>
                  <th className="text-right px-3 py-2.5 font-medium">Best Lap</th>
                  <th className="text-right px-3 py-2.5 font-medium hidden sm:table-cell">Gap</th>
                  <th className="text-right px-3 py-2.5 font-medium hidden md:table-cell">Last Lap</th>
                </>
              ) : (
                <>
                  <th className="text-right px-3 py-2.5 font-medium">Gap</th>
                  <th className="text-right px-3 py-2.5 font-medium hidden sm:table-cell">Last Lap</th>
                  <th className="text-right px-3 py-2.5 font-medium hidden md:table-cell">Best Lap</th>
                </>
              )}
              <th className="text-left px-4 py-2.5 font-medium hidden xl:table-cell">S1 · S2 · S3</th>
              <th className="text-right px-3 py-2.5 font-medium">Tyre</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((driver, index) => {
              const teamColor = teamColors[driver.team] ?? '#6b7280';
              const tire = TIRE_STYLES[driver.tires.compound] ?? { bg: '#6b7280', dark: false, label: '?' };
              const isKnockedOut = driver.knockedOut && isQuali;
              const showEliminationLine = eliminationCutoff !== null && driver.position === eliminationCutoff;
              return (
              <React.Fragment key={driver.driverNumber}>
              {showEliminationLine && (
                <tr>
                  <td colSpan={7} className="px-3 py-0.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 border-b border-dashed border-red-500/50" />
                      <span className="text-[10px] font-bold text-red-400/80 uppercase tracking-wider shrink-0">
                        ── Elimination ──
                      </span>
                      <div className="flex-1 border-b border-dashed border-red-500/50" />
                    </div>
                  </td>
                </tr>
              )}
              <tr
                className={cn(
                  'border-b border-border/20 transition-colors hover:bg-muted/20',
                  (!driver.isOnTrack || driver.retired) && 'opacity-40',
                  isKnockedOut && 'opacity-35',
                  index % 2 === 1 && 'bg-muted/[0.03]'
                )}
              >
                {/* Position — left border uses team colour */}
                <td className="px-3 py-3" style={{ borderLeft: `3px solid ${teamColor}` }}>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      'font-mono font-black text-base w-5 text-center leading-none tabular-nums',
                      driver.position === 1 && 'text-yellow-400',
                      driver.position === 2 && 'text-slate-400',
                      driver.position === 3 && 'text-amber-600'
                    )}>
                      {driver.position}
                    </span>
                    {getPositionChangeIcon(driver.positionChange)}
                  </div>
                </td>

                {/* Driver — number & team coloured with team hex */}
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="text-xs font-black font-mono w-6 shrink-0 tabular-nums leading-none"
                      style={{ color: teamColor }}
                    >
                      {driver.driverNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate leading-tight">{driver.driverName}</div>
                      <div
                        className="text-xs truncate font-medium leading-tight"
                        style={{ color: `${teamColor}99` }}
                      >
                        {driver.team}
                      </div>
                    </div>
                    {driver.drs && (
                      <span className="shrink-0 text-[10px] font-bold px-1 py-0.5 rounded bg-violet-500/20 text-violet-400 leading-none">
                        DRS
                      </span>
                    )}
                    {isKnockedOut && (
                      <span className="shrink-0 text-[10px] font-bold px-1 py-0.5 rounded bg-red-500/20 text-red-400 leading-none">
                        OUT
                      </span>
                    )}
                  </div>
                </td>

                {/* Timing columns — different layout for Quali/Practice vs Race */}
                {isQuali || isPractice ? (
                  <>
                    {/* Best Lap — primary in FP/Quali */}
                    <td className="px-3 py-3 text-right font-mono tabular-nums">
                      <span className={cn(
                        'font-bold',
                        driver.bestLapTime ? 'text-purple-300 text-sm' : 'text-foreground/25 text-sm'
                      )}>
                        {driver.bestLapTime || '—'}
                      </span>
                    </td>
                    {/* Gap to leader's best lap */}
                    <td className="px-3 py-3 text-right font-mono text-sm hidden sm:table-cell tabular-nums">
                      {driver.position === 1 ? (
                        <span className="text-[11px] font-bold tracking-wide" style={{ color: teamColor }}>LEADER</span>
                      ) : (
                        <span className="text-foreground/70">{driver.gap || '—'}</span>
                      )}
                    </td>
                    {/* Last Lap */}
                    <td className="px-3 py-3 text-right font-mono text-sm text-foreground/70 hidden md:table-cell tabular-nums">
                      {driver.lastLapTime || '—'}
                    </td>
                  </>
                ) : (
                  <>
                    {/* Gap — race interval */}
                    <td className="px-3 py-3 text-right font-mono text-sm">
                      {driver.position === 1 ? (
                        <span className="text-[11px] font-bold tracking-wide" style={{ color: teamColor }}>LEADER</span>
                      ) : (
                        <span className="text-foreground/80 tabular-nums">{driver.gap || '—'}</span>
                      )}
                    </td>
                    {/* Last Lap */}
                    <td className="px-3 py-3 text-right font-mono text-sm text-foreground/80 hidden sm:table-cell tabular-nums">
                      {driver.lastLapTime || '—'}
                    </td>
                    {/* Best Lap */}
                    <td className="px-3 py-3 text-right font-mono text-sm hidden md:table-cell tabular-nums">
                      <span className={driver.bestLapTime ? 'text-purple-400 font-semibold' : 'text-foreground/25'}>
                        {driver.bestLapTime || '—'}
                      </span>
                    </td>
                  </>
                )}

                {/* Sectors with inline-coloured mini segments */}
                <td className="px-4 py-3 hidden xl:table-cell">
                  <div className="flex items-stretch gap-3">
                    {[
                      { time: driver.sector1, best: driver.sector1Best, segs: driver.sector1Segments },
                      { time: driver.sector2, best: driver.sector2Best, segs: driver.sector2Segments },
                      { time: driver.sector3, best: driver.sector3Best, segs: driver.sector3Segments },
                    ].map(({ time, best, segs }, sIdx) => (
                      <div key={sIdx} className="flex flex-col items-end gap-1 min-w-[52px]">
                        <span className={cn(
                          'font-mono text-xs tabular-nums',
                          best ? 'text-purple-400 font-bold' : time ? 'text-foreground/75' : 'text-foreground/25'
                        )}>
                          {time || '—'}
                        </span>
                        <div className="flex gap-0.5">
                          {segs?.map((seg, i) => (
                            <div
                              key={i}
                              className="h-1.5 w-3 rounded-sm"
                              style={{ backgroundColor: SEGMENT_COLOR[seg.status] ?? '#374151' }}
                              title={
                                seg.status === 2051 || seg.status === 2052 ? 'Overall Best' :
                                seg.status === 2049 ? 'Personal Best' :
                                seg.status === 2048 ? 'Slower' : 'No time'
                              }
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </td>

                {/* Tyre — coloured circle via TIRE_STYLES */}
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 leading-none"
                      style={{ backgroundColor: tire.bg, color: tire.dark ? '#111827' : '#ffffff' }}
                      title={`${driver.tires.compound.charAt(0).toUpperCase() + driver.tires.compound.slice(1)} — ${driver.tires.age} laps`}
                    >
                      {tire.label}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground tabular-nums">{driver.tires.age}L</span>
                  </div>
                </td>
              </tr>
              </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}