'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { getTeamColor } from '@/lib/constants/f1-teams';

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
  tires: {
    compound: 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet';
    age: number;
  };
}

interface LiveTimingGridProps {
  positions: Position[];
  className?: string;
}

export function LiveTimingGrid({ positions, className }: LiveTimingGridProps) {
  const getPositionChangeIcon = (change?: number) => {
    if (!change || change === 0) return null;
    if (change > 0) return <TrendingUp className="w-3 h-3 text-green-500" />;
    return <TrendingDown className="w-3 h-3 text-red-500" />;
  };

  const getSegmentStatusColor = (status: number) => {
    switch (status) {
      case 2051: return 'bg-purple-500'; // Purple - Overall best
      case 2048: return 'bg-yellow-500'; // Yellow - slower
      case 2049: return 'bg-green-500';  // Green - personal best
      default: return 'bg-muted/50';   // Gray - no time/invalid
    }
  };

  const getTireColor = (compound: string) => {
    switch (compound) {
      case 'soft': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-gray-300';
      case 'intermediate': return 'bg-green-500';
      case 'wet': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className={cn('card-hover shadow-lg py-0 overflow-hidden border-primary/10', className)} >
      <CardContent className="p-0 ">
        <ScrollArea className="h-[600px] w-full rounded-xl">
          <div className="min-w-[800px] grid grid-cols-[auto_auto_2fr_1fr_1fr_1fr_2fr_1fr] gap-x-4 text-sm bg-background/95">
            {/* Header */}
            <div className="contents text-xs uppercase tracking-wider font-bold text-muted-foreground/80 sticky top-0 z-10 bg-background/95 backdrop-blur-md">
              <div className="sticky top-0 px-4 py-3 border-b border-border/10">Pos</div>
              <div className="sticky top-0 px-2 py-3 border-b border-border/10">No.</div>
              <div className="sticky top-0 px-2 py-3 border-b border-border/10">Driver</div>
              <div className="sticky top-0 px-2 py-3 border-b border-border/10 text-right">Gap</div>
              <div className="sticky top-0 px-2 py-3 border-b border-border/10 text-right">Last Lap</div>
              <div className="sticky top-0 px-2 py-3 border-b border-border/10 text-right">Best Lap</div>
              <div className="sticky top-0 px-4 py-3 border-b border-border/10">Sectors</div>
              <div className="sticky top-0 px-4 py-3 border-b border-border/10 text-right">Speed</div>
            </div>

            {/* Rows */}
            {positions.map((driver, idx) => (
              <div key={driver.driverNumber}
                className={cn(
                  "contents relative text-sm group hover:bg-muted/5 transition-colors",
                  !driver.isOnTrack && "opacity-60 grayscale"
                )}
              >
                {/* Position */}
                <div className="px-4 py-3 flex items-center relative border-b border-border/5">
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: getTeamColor(driver.team) }}
                  />
                  <div className="flex items-center gap-3 pl-2">
                    <span className={cn(
                      "font-mono font-bold text-lg w-6 text-center",
                      driver.position === 1 && "text-yellow-500 text-xl",
                      driver.position === 2 && "text-gray-400 text-xl",
                      driver.position === 3 && "text-amber-700 text-xl"
                    )}>
                      {driver.position}
                    </span>
                    {getPositionChangeIcon(driver.positionChange)}
                  </div>
                </div>

                {/* Number */}
                <div className="px-2 py-3 flex items-center border-b border-border/5">
                  <Badge variant="outline" className="font-mono text-xs border-primary/20 bg-background/50">
                    {driver.driverNumber}
                  </Badge>
                </div>

                {/* Driver & Team */}
                <div className="px-2 py-3 flex items-center gap-3 border-b border-border/5">
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold truncate text-foreground/90">{driver.driverName}</span>
                    <span className="text-[10px] uppercase font-medium text-muted-foreground truncate tracking-wider">{driver.team}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    {driver.drs && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 border-0 font-bold">
                        DRS
                      </Badge>
                    )}
                    <div
                      className={cn("w-3 h-3 rounded-full border border-background/20 ring-1 ring-white/10", getTireColor(driver.tires.compound))}
                      title={`${driver.tires.compound.toUpperCase()} (${driver.tires.age} laps)`}
                    />
                  </div>
                </div>

                {/* Gap */}
                <div className="px-2 py-3 flex items-center justify-end font-mono text-right border-b border-border/5 text-muted-foreground">
                  {driver.gap || <span className="text-yellow-500 font-bold text-xs">LEADER</span>}
                </div>

                {/* Last Lap */}
                <div className="px-2 py-3 flex items-center justify-end font-mono text-right border-b border-border/5 font-medium">
                  {driver.lastLapTime || <span className="text-muted-foreground/30">--:--.---</span>}
                </div>

                {/* Best Lap */}
                <div className="px-2 py-3 flex items-center justify-end font-mono text-right border-b border-border/5">
                  <span className={cn(driver.bestLapTime && "text-purple-400 font-bold")}>
                    {driver.bestLapTime || <span className="text-muted-foreground/30">--:--.---</span>}
                  </span>
                </div>

                {/* Sectors */}
                <div className="px-4 py-3 flex items-center gap-4 border-b border-border/5">
                  {['sector1', 'sector2', 'sector3'].map((sectorKey, sIdx) => {
                    // Adding type safety for indexing
                    const sectorValue = driver[sectorKey as keyof Position] as string | undefined;
                    const isBest = driver[`${sectorKey}Best` as keyof Position] as boolean | undefined;
                    const segments = driver[`${sectorKey}Segments` as keyof Position] as Array<{ status: number }> | undefined;

                    return (
                      <div key={sIdx} className="flex flex-col gap-1 min-w-[50px]">
                        <span className={cn(
                          "font-mono text-[10px] font-medium transition-colors",
                          isBest ? "text-purple-400" : "text-muted-foreground"
                        )}>
                          {sectorValue || '--.---'}
                        </span>
                        <div className="flex gap-0.5 h-1">
                          {segments?.map((segment, idx) => (
                            <div
                              key={`s${sIdx}-${idx}`}
                              className={cn(
                                "flex-1 rounded-sm opacity-90",
                                getSegmentStatusColor(segment.status)
                              )}
                              title={`Segment ${idx + 1} (Status: ${segment.status})`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Speed */}
                <div className="px-4 py-3 flex items-center justify-end font-mono text-right border-b border-border/5 text-muted-foreground">
                  {driver.speed} <span className="text-[10px] ml-1 opacity-50">km/h</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
