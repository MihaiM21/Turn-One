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
    if (!change || change === 0) return <Minus className="w-3 h-3 text-muted-foreground" />;
    if (change > 0) return <TrendingUp className="w-3 h-3 text-green-500" />;
    return <TrendingDown className="w-3 h-3 text-red-500" />;
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
    <Card className={cn('card-hover', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Live Timing & Positions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[700px]">
          <div className="space-y-1">
            {positions.map((driver, index) => (
              <div 
                key={driver.driverNumber} 
                className={cn(
                  'p-3 rounded-lg transition-all duration-200',
                  'bg-gradient-to-r from-muted/20 to-muted/10',
                  'hover:from-muted/40 hover:to-muted/20',
                  'border border-border/50',
                  !driver.isOnTrack && 'opacity-60'
                )}
              >
                {/* Main Position Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {/* Position Badge */}
                    <div className="flex items-center gap-1">
                      <Badge 
                        variant={driver.position <= 3 ? "default" : "outline"} 
                        className={cn(
                          'w-7 h-7 flex items-center justify-center p-0 font-bold',
                          driver.position === 1 && 'bg-yellow-500 text-black',
                          driver.position === 2 && 'bg-gray-400 text-black',
                          driver.position === 3 && 'bg-amber-600 text-white'
                        )}
                      >
                        {driver.position}
                      </Badge>
                      {getPositionChangeIcon(driver.positionChange)}
                    </div>

                    {/* Driver Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{driver.driverName}</p>
                        <Badge variant="outline" className="text-xs px-1 h-5">
                          {driver.driverNumber}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{driver.team}</p>
                    </div>
                  </div>

                  {/* Gap & Status */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium">
                        {formatGap(driver.gap)}
                      </span>
                      {driver.drs && (
                        <Badge variant="secondary" className="text-xs px-1 h-5 bg-green-500/20 text-green-400">
                          DRS
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{driver.speed} km/h</span>
                      <div className={cn('w-2 h-2 rounded-full', getTireColor(driver.tires.compound))} />
                      <span>{driver.tires.age}</span>
                    </div>
                  </div>
                </div>

                {/* Timing Row */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-muted-foreground mb-1">Last</div>
                    <div className="font-mono font-medium">{driver.lastLapTime}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground mb-1">Best</div>
                    <div className="font-mono text-green-400 font-medium">
                      {driver.bestLapTime || '--:--.---'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground mb-1">Current</div>
                    <div className="font-mono text-primary font-medium">
                      {driver.currentLapTime || '--:--.---'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground mb-1">Int</div>
                    <div className="font-mono text-muted-foreground">
                      {driver.interval || '--:--.---'}
                    </div>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      driver.isOnTrack ? 'bg-green-500' : 'bg-red-500'
                    )} />
                    <span className="text-xs text-muted-foreground">
                      {driver.isOnTrack ? 'On Track' : 'In Pits'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Timer className="w-3 h-3" />
                    <span>Tire: {driver.tires.compound.toUpperCase()} ({driver.tires.age} laps)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}