"use client";

import { CircleDot } from "lucide-react";
import { SectionCard } from "./section-card";
import { SimPhysics } from "@/lib/simTelemetryService";

interface SimTyreCardProps {
    physics: SimPhysics | null;
}

export function SimTyreCard({ physics }: SimTyreCardProps) {
    const temps = physics?.tyreCoreTemperature || [0, 0, 0, 0];
    const pressures = physics?.wheelsPressure || [0, 0, 0, 0];

    return (
        <SectionCard label="Tyres" title="Core temps & pressures" icon={CircleDot} className="h-full">
            <div className="mx-auto grid max-w-[260px] grid-cols-2 gap-3">
                <TyreWidget temp={temps[0]} pressure={pressures[0]} label="FL" />
                <TyreWidget temp={temps[1]} pressure={pressures[1]} label="FR" />
                <TyreWidget temp={temps[2]} pressure={pressures[2]} label="RL" />
                <TyreWidget temp={temps[3]} pressure={pressures[3]} label="RR" />
            </div>
        </SectionCard>
    );
}

function TyreWidget({ temp, pressure, label }: { temp: number; pressure: number; label: string }) {
    const getColorClass = (t: number) => {
        if (t === 0) return "bg-black text-zinc-600 border-zinc-800";
        if (t < 50) return "bg-blue-950/40 text-blue-400 border-blue-900/50";
        if (t < 70) return "bg-teal-950/40 text-teal-400 border-teal-900/50";
        if (t <= 95) return "bg-green-950/40 text-green-400 border-green-800/50";
        if (t < 105) return "bg-orange-950/40 text-orange-400 border-orange-900/50";
        return "bg-primary/20 text-primary border-primary/50 animate-pulse";
    };

    return (
        <div className={`flex flex-col items-center gap-1 border p-3 transition-colors ${getColorClass(temp)}`}>
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
