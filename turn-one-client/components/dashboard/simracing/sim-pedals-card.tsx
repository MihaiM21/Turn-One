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
            <CardContent className="p-6 h-full flex flex-col">
                <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase mb-4">Pedals</span>
                <div className="flex gap-3 flex-1 items-end justify-center min-h-0">
                    <PedalBar label="THR" value={gas} color="bg-green-500" glow="rgba(34,197,94,0.35)" />
                    <PedalBar label="BRK" value={brake} color="bg-primary" glow="rgba(239,68,68,0.35)" />
                    <PedalBar label="CLT" value={clutch} color="bg-yellow-400" glow="rgba(234,179,8,0.35)" />
                </div>
            </CardContent>
        </Card>
    );
}

function PedalBar({ label, value, color, glow }: { label: string; value: number; color: string; glow: string }) {
    return (
        <div className="flex flex-col items-center gap-2 flex-1 justify-end">
            <span className="text-xs font-mono font-bold text-white tabular-nums">{Math.round(value)}%</span>
            <div className="w-full max-w-[40px] h-36 bg-black/80 rounded-lg overflow-hidden relative border border-primary/20">
                {[25, 50, 75].map(tick => (
                    <div
                        key={tick}
                        className="absolute left-0 w-full border-b border-white/10 pointer-events-none"
                        style={{ bottom: `${tick}%` }}
                    />
                ))}
                <div
                    className={`absolute bottom-0 left-0 w-full transition-all duration-75 ${color}`}
                    style={{
                        height: `${value}%`,
                        boxShadow: value > 5 ? `0 0 12px ${glow}` : "none",
                    }}
                />
            </div>
            <span className="text-[10px] font-black tracking-widest text-muted-foreground">{label}</span>
        </div>
    );
}
