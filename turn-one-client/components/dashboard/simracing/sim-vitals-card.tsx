"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SimPhysics } from "@/lib/simTelemetryService";

interface SimVitalsCardProps {
    physics: SimPhysics | null;
    maxRpm: number;
}

export function SimVitalsCard({ physics, maxRpm }: SimVitalsCardProps) {
    const speed = physics ? Math.round(physics.speedKmh) : 0;
    const gear = physics ? physics.gear : 1; 
    // 0 = R, 1 = N, 2 = 1st, etc (ACC specific mapping depending on car, but simple fallback)
    const displayGear = gear === 0 ? "R" : gear === 1 ? "N" : (gear - 1).toString();
    const rpm = physics ? Math.round(physics.rpms) : 0;
    const rpmPercentage = maxRpm > 0 ? Math.min((rpm / maxRpm) * 100, 100) : 0;
    
    const isShiftLight = rpmPercentage > 95;

    return (
        <Card className="bg-black/60 border-primary/20 shadow-xl backdrop-blur-md overflow-hidden">
            <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">Speed</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-6xl font-black text-white tracking-tighter tabular-nums">{speed}</span>
                            <span className="text-xl font-bold text-muted-foreground">km/h</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">Gear</span>
                        <div className={`flex items-center justify-center w-20 h-24 rounded-lg bg-black/80 border-2 ${isShiftLight ? 'border-primary shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'border-primary/20'}`}>
                            <span className={`text-6xl font-black ${isShiftLight ? 'text-primary' : 'text-white'}`}>{displayGear}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                        <span>RPM</span>
                        <span className="tabular-nums">{rpm} / {maxRpm || '---'}</span>
                    </div>
                    <div className="h-4 w-full bg-black/80 border border-primary/10 rounded-full overflow-hidden flex">
                        {/* RPM Bar segmented */}
                        <div 
                            className={`h-full transition-all duration-75 ${isShiftLight ? 'bg-primary' : rpmPercentage > 85 ? 'bg-orange-500' : 'bg-primary/50'}`}
                            style={{ width: `${rpmPercentage}%` }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
