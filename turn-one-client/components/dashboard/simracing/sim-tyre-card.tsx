"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SimPhysics } from "@/lib/simTelemetryService";

interface SimTyreCardProps {
    physics: SimPhysics | null;
}

export function SimTyreCard({ physics }: SimTyreCardProps) {
    // 0: FL, 1: FR, 2: RL, 3: RR
    const temps = physics?.tyreCoreTemperature || [0, 0, 0, 0];
    const pressures = physics?.wheelsPressure || [0, 0, 0, 0];

    return (
        <Card className="bg-black/60 border-primary/20 backdrop-blur-md shadow-xl">
            <CardContent className="p-6">
                <div className="flex justify-between mb-4">
                    <span className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">Tyres</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                    <TyreWidget temp={temps[0]} pressure={pressures[0]} label="FL" />
                    <TyreWidget temp={temps[1]} pressure={pressures[1]} label="FR" />
                    <TyreWidget temp={temps[2]} pressure={pressures[2]} label="RL" />
                    <TyreWidget temp={temps[3]} pressure={pressures[3]} label="RR" />
                </div>
            </CardContent>
        </Card>
    );
}

function TyreWidget({ temp, pressure, label }: { temp: number, pressure: number, label: string }) {
    // Colors based on ACC optimums (roughly 70-90C for dry GT3)
    const getColor = (t: number) => {
        if (t === 0) return "bg-black/80 text-muted-foreground border-primary/10"; // offline
        if (t < 50) return "bg-blue-950/40 text-blue-400 border-blue-900/50"; // very cold
        if (t < 70) return "bg-teal-950/40 text-teal-400 border-teal-900/50"; // cool
        if (t <= 95) return "bg-green-950/40 text-green-400 border-green-800/50 shadow-[0_0_10px_rgba(74,222,128,0.1)]"; // optimal
        if (t < 105) return "bg-orange-950/40 text-orange-400 border-orange-900/50"; // getting hot
        return "bg-primary/20 text-primary border-primary/50 animate-pulse"; // overheating
    };

    const colorClass = getColor(temp);
    
    return (
        <div className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-colors ${colorClass}`}>
            <span className="text-[10px] font-bold opacity-70 top-2 left-2 absolute hidden">{label}</span>
            <div className="text-xl font-black tabular-nums tracking-tighter">
                {temp === 0 ? "---" : Math.round(temp)}<span className="text-xs font-normal">°C</span>
            </div>
            <div className="text-xs font-mono font-semibold opacity-80 tabular-nums">
                {pressure === 0 ? "---" : pressure.toFixed(1)} psi
            </div>
        </div>
    );
}
