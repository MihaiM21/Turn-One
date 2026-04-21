"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SimPhysics } from "@/lib/simTelemetryService";

interface SimPedalsCardProps {
    physics: SimPhysics | null;
}

export function SimPedalsCard({ physics }: SimPedalsCardProps) {
    const gas = physics ? Math.min(physics.gas * 100, 100) : 0;
    const brake = physics ? Math.min(physics.brake * 100, 100) : 0;
    const clutch = physics ? Math.min(physics.clutch * 100, 100) : 0;

    return (
        <Card className="bg-black/60 border-primary/20 backdrop-blur-md shadow-xl h-full">
            <CardContent className="p-6 flex gap-4 h-full items-end justify-center">
                <PedalBar label="CLUTCH" value={clutch} color="bg-yellow-500" />
                <PedalBar label="BRAKE" value={brake} color="bg-primary" />
                <PedalBar label="THROTTLE" value={gas} color="bg-green-500" />
            </CardContent>
        </Card>
    );
}

function PedalBar({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className="flex flex-col items-center gap-2 h-full justify-end w-1/3">
            <div className="w-12 h-32 bg-black/80 rounded-md overflow-hidden relative border border-primary/20">
                <div 
                    className={`absolute bottom-0 left-0 w-full transition-all duration-75 ${color}`}
                    style={{ height: `${value}%` }}
                />
            </div>
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground">{label}</span>
            <span className="text-xs font-mono font-bold text-white tabular-nums">{Math.round(value)}%</span>
        </div>
    );
}
