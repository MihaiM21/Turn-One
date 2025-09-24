'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Car, Zap, Clock } from 'lucide-react';

interface LiveSectorTimesProps {
  sectors: {
    sector1: string;
    sector2: string;
    sector3: string;
    lastLapTime: string;
    personalBest?: boolean;
    overallBest?: boolean;
  };
  driverName: string;
  driverNumber: string;
  className?: string;
}

export function LiveSectorTimes({ 
  sectors, 
  driverName, 
  driverNumber, 
  className 
}: LiveSectorTimesProps) {
  const getSectorColor = (isPersonalBest: boolean, isOverallBest: boolean) => {
    if (isOverallBest) return 'text-purple-400 font-bold';
    if (isPersonalBest) return 'text-green-400 font-semibold';
    return 'text-yellow-400';
  };

  return (
    <Card className={cn('card-hover', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Car className="w-4 h-4 text-primary" />
          <Badge variant="outline" className="w-8 h-6 text-xs justify-center p-0">
            {driverNumber}
          </Badge>
          <span className="truncate">{driverName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">S1</div>
            <div className={cn('text-xs font-mono', getSectorColor(false, false))}>
              {sectors.sector1}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">S2</div>
            <div className={cn('text-xs font-mono', getSectorColor(false, false))}>
              {sectors.sector2}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">S3</div>
            <div className={cn('text-xs font-mono', getSectorColor(false, false))}>
              {sectors.sector3}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Lap Time</span>
          </div>
          <div className={cn(
            'text-sm font-mono font-bold',
            sectors.overallBest ? 'text-purple-400' : 
            sectors.personalBest ? 'text-green-400' : 'text-foreground'
          )}>
            {sectors.lastLapTime}
            {sectors.overallBest && <Zap className="inline w-3 h-3 ml-1" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}