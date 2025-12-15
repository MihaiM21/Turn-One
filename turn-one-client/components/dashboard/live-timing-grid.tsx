'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Trophy, 
  Zap,
  Timer
} from 'lucide-react';

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
      case 2051: return 'bg-purple-500'; // Purple (overall best)
      case 2048: return 'bg-yellow-500'; // Yellow (slower)
      case 2049: return 'bg-green-500';  // Green (personal best)
      default:   return 'bg-gray-500';   // Gray (no time/invalid)
    }
  };

  const getTeamAccentColor = (team: string) => {
    switch (team) {
      case 'Mercedes': return 'border-[#00D2BE]';
      case 'Red Bull': return 'border-[#0600EF]';
      case 'Ferrari': return 'border-[#DC0000]';
      case 'McLaren': return 'border-[#FF8700]';
      case 'Alpine': return 'border-[#0090FF]';
      case 'AlphaTauri': return 'border-[#2B4562]';
      case 'Aston Martin': return 'border-[#006F62]';
      case 'Williams': return 'border-[#005AFF]';
      case 'Alfa Romeo': return 'border-[#900000]';
      case 'Haas': return 'border-[#FFFFFF]';
      default: return 'border-gray-500';
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

  const formatGap = (gap: string) => {
    if (!gap || gap === '') return 'LEADER';
    return gap;
  };

  return (
    <Card className={cn('card-hover shadow-lg py-0', className)} >
      <CardContent className="p-0 ">
        <ScrollArea className="py-0 rounded-xl">
          <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto_auto] gap-x-4 text-sm bg-background/95">
            {/* Header */}
            <div className="contents text-xs uppercase tracking-wider font-medium text-muted-foreground ">
              <div className="sticky top-0 px-4 py-2.5 backdrop-blur-sm">Pos</div>
              <div className="sticky top-0 px-2 py-2.5 backdrop-blur-sm">No.</div>
              <div className="sticky top-0 px-2 py-2.5 backdrop-blur-sm">Driver</div>
              <div className="sticky top-0 px-2 py-2.5 backdrop-blur-sm text-right">Gap</div>
              <div className="sticky top-0 px-2 py-2.5 backdrop-blur-sm text-right">Last Lap</div>
              <div className="sticky top-0 px-2 py-2.5 backdrop-blur-sm text-right">Best Lap</div>
              <div className="sticky top-0 px-4 py-2.5 backdrop-blur-sm">Sectors</div>
              <div className="sticky top-0 px-4 py-2.5 backdrop-blur-sm text-right">Speed</div>
            </div>

            {/* Rows */}
            {positions.map((driver) => (
              <div key={driver.driverNumber} 
                className={cn(
                  "contents relative text-sm",
                  !driver.isOnTrack && "opacity-60"
                )}
              >
                {/* Position */}
                <div className={cn(
                  "group px-4 py-2 border-l-2",
                  getTeamAccentColor(driver.team)
                )}>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-mono font-medium",
                      driver.position === 1 && "text-yellow-500",
                      driver.position === 2 && "text-gray-400",
                      driver.position === 3 && "text-amber-600"
                    )}>
                      {driver.position}
                    </span>
                    {getPositionChangeIcon(driver.positionChange)}
                  </div>
                </div>

                {/* Number */}
                <div className="px-2 py-2">
                  <Badge variant="outline" className="font-mono">
                    {driver.driverNumber}
                  </Badge>
                </div>

                {/* Driver & Team */}
                <div className="px-2 py-2 flex items-center gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">{driver.driverName}</span>
                    <span className="text-xs text-muted-foreground truncate">{driver.team}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    {driver.drs && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400">
                        DRS
                      </Badge>
                    )}
                    <div 
                      className={cn("w-2.5 h-2.5 rounded-full", getTireColor(driver.tires.compound))} 
                      title={`${driver.tires.compound.toUpperCase()} (${driver.tires.age} laps)`}
                    />
                  </div>
                </div>

                {/* Gap */}
                <div className="px-2 py-2 font-mono text-right">
                  {driver.gap || 'LEADER'}
                </div>

                {/* Last Lap */}
                <div className="px-2 py-2 font-mono text-right">
                  {driver.lastLapTime || '--:--.---'}
                </div>

                {/* Best Lap */}
                <div className="px-2 py-2 font-mono text-right">
                  <span className={cn(driver.bestLapTime && "text-purple-400")}>
                    {driver.bestLapTime || '--:--.---'}
                  </span>
                </div>

                {/* Sectors */}
                <div className="px-4 py-2 flex items-center gap-3">
                  {/* Sector 1 */}
                  <div className="flex flex-col">
                    <span className={cn(
                      "font-mono text-xs mb-1",
                      driver.sector1Best && "text-purple-400"
                    )}>
                      {driver.sector1 || '--.---'}
                    </span>
                    <div className="flex gap-0.5">
                      {driver.sector1Segments?.map((segment, idx) => (
                        <div
                          key={`s1-${idx}`}
                          className={cn(
                            "h-1 w-1.5 rounded-sm opacity-75",
                            getSegmentStatusColor(segment.status)
                          )}
                          title={`Sector 1 Segment ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Sector 2 */}
                  <div className="flex flex-col">
                    <span className={cn(
                      "font-mono text-xs mb-1",
                      driver.sector2Best && "text-purple-400"
                    )}>
                      {driver.sector2 || '--.---'}
                    </span>
                    <div className="flex gap-0.5">
                      {driver.sector2Segments?.map((segment, idx) => (
                        <div
                          key={`s2-${idx}`}
                          className={cn(
                            "h-1 w-1.5 rounded-sm opacity-75",
                            getSegmentStatusColor(segment.status)
                          )}
                          title={`Sector 2 Segment ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Sector 3 */}
                  <div className="flex flex-col">
                    <span className={cn(
                      "font-mono text-xs mb-1",
                      driver.sector3Best && "text-purple-400"
                    )}>
                      {driver.sector3 || '--.---'}
                    </span>
                    <div className="flex gap-0.5">
                      {driver.sector3Segments?.map((segment, idx) => (
                        <div
                          key={`s3-${idx}`}
                          className={cn(
                            "h-1 w-1.5 rounded-sm opacity-75",
                            getSegmentStatusColor(segment.status)
                          )}
                          title={`Sector 3 Segment ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Speed */}
                <div className="px-4 py-2 font-mono text-right">
                  {driver.speed} km/h
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}