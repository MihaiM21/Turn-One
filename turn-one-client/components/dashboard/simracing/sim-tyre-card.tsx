"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SimPhysics } from "@/lib/simTelemetryService";

interface SimTyreCardProps {
    physics: SimPhysics | null;
}

export function SimTyreCard({ physics }: SimTyreCardProps) {
    const temps = physics?.tyreCoreTemperature || [0, 0, 0, 0];
    const pressures = physics?.wheelsPressure || [0, 0, 0, 0];

    return (
        <Card className="bg-black/60 border-primary/20 backdrop-blur-md shadow-xl">
            <CardContent className="p-6">
                <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase mb-5 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full inline-block" />
                    Tyre Status
                </span>

                <div className="grid grid-cols-2 gap-3 max-w-[260px] mx-auto">
                    <TyreWidget temp={temps[0]} pressure={pressures[0]} label="FL" />
                    <TyreWidget temp={temps[1]} pressure={pressures[1]} label="FR" />
                    <TyreWidget temp={temps[2]} pressure={pressures[2]} label="RL" />
                    <TyreWidget temp={temps[3]} pressure={pressures[3]} label="RR" />
                </div>
            </CardContent>
        </Card>
    );
}

function TyreWidget({ temp, pressure, label }: { temp: number; pressure: number; label: string }) {
    const getColorClass = (t: number) => {
        if (t === 0) return "bg-black/80 text-muted-foreground border-primary/10";
        if (t < 50) return "bg-blue-950/40 text-blue-400 border-blue-900/50";
        if (t < 70) return "bg-teal-950/40 text-teal-400 border-teal-900/50";
        if (t <= 95) return "bg-green-950/40 text-green-400 border-green-800/50 shadow-[0_0_10px_rgba(74,222,128,0.1)]";
        if (t < 105) return "bg-orange-950/40 text-orange-400 border-orange-900/50";
        return "bg-primary/20 text-primary border-primary/50 animate-pulse";
    };

    return (
        <div className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-colors ${getColorClass(temp)}`}>
            <span className="text-[10px] font-black tracking-widest opacity-60">{label}</span>
            <div className="text-xl font-black tabular-nums tracking-tighter leading-none">
                {temp === 0 ? "---" : Math.round(temp)}
                <span className="text-xs font-normal">°C</span>
            </div>
            <div className="text-xs font-mono font-semibold opacity-70 tabular-nums">
                {pressure === 0 ? "---" : pressure.toFixed(1)} psi
            </div>
        </div>
    );
}
