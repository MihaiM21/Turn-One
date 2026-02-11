'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flag, Clock, Zap, Activity } from 'lucide-react';
import type { MappedF1Data } from '@/lib/f1DataMapper';
import { cn } from '@/lib/utils';

interface LiveSessionHeaderProps {
    sessionInfo: MappedF1Data['sessionInfo'];
    className?: string;
}

export function LiveSessionHeader({ sessionInfo, className }: LiveSessionHeaderProps) {
    if (!sessionInfo) return null;

    const isLive = sessionInfo.status === 'Started';
    const isFinished = sessionInfo.status === 'Finished';

    return (
        <Card className={cn(
            "overflow-hidden border border-primary/10 shadow-2xl bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md",
            className
        )}>
            <div className="relative">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-4 gap-4 border-b border-border/10">

                    {/* Status Indicator & Title */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                            <div className={cn(
                                "absolute inset-0 rounded-full blur-sm animate-pulse",
                                isLive ? "bg-green-500/50" : isFinished ? "bg-red-500/50" : "bg-primary/50"
                            )} />
                            <div className={cn(
                                "relative w-3 h-3 rounded-full shadow-lg",
                                isLive ? "bg-green-500 shadow-green-500/30" : isFinished ? "bg-red-500 shadow-red-500/30" : "bg-primary shadow-primary/30"
                            )} />
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xs font-bold uppercase tracking-widest text-primary/80">
                                    {sessionInfo.type}
                                </span>
                                <div className="h-4 w-px bg-border/20 hidden sm:block" />
                                <h2 className="text-lg font-bold tracking-tight">
                                    {sessionInfo.name}
                                </h2>
                            </div>
                            <p className={cn(
                                "text-sm font-medium",
                                isLive ? "text-green-400" : isFinished ? "text-red-400" : "text-muted-foreground"
                            )}>
                                {sessionInfo.status}
                            </p>
                        </div>
                    </div>

                    {/* Right Side Stats */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {sessionInfo.currentLap && sessionInfo.totalLaps && (
                            <Badge variant="secondary" className="bg-background/40 border-border/10 backdrop-blur-sm gap-2 h-9 px-4">
                                <Flag className="w-3.5 h-3.5 text-primary" />
                                <span className="text-sm font-mono">
                                    LAP {sessionInfo.currentLap}/{sessionInfo.totalLaps}
                                </span>
                            </Badge>
                        )}

                        <Badge variant="outline" className="border-primary/20 gap-2 h-9 px-4 ml-auto md:ml-0">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span className="text-sm font-mono tabular-nums">
                                {sessionInfo.timeRemaining || '00:00:00'}
                            </span>
                        </Badge>
                    </div>
                </div>

                {/* Progress Bar (if applicable) */}
                {sessionInfo.totalLaps && sessionInfo.currentLap && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border/20">
                        <div
                            className="h-full bg-primary/50 transition-all duration-1000 ease-in-out"
                            style={{ width: `${(sessionInfo.currentLap / sessionInfo.totalLaps) * 100}%` }}
                        />
                    </div>
                )}
            </div>
        </Card>
    );
}
