"use client";

import { Disc3 } from "lucide-react";
import { SectionCard } from "./section-card";
import { SimPhysics } from "@/lib/simTelemetryService";

interface SimBrakesCardProps {
    physics: SimPhysics | null;
}

const WHEEL_LABELS = ["FL", "FR", "RL", "RR"] as const;

export function SimBrakesCard({ physics }: SimBrakesCardProps) {
    const temps = physics?.brakeTemp || [0, 0, 0, 0];
    const padLife = physics?.padLife || [0, 0, 0, 0];

    return (
        <SectionCard label="Brakes" title="Disc temps & pad life" icon={Disc3} className="h-full">
            <div className="mx-auto grid max-w-[260px] grid-cols-2 gap-3">
                {([0, 1, 2, 3] as const).map(i => (
                    <BrakeWidget key={i} temp={temps[i]} padLife={padLife[i]} label={WHEEL_LABELS[i]} />
                ))}
            </div>
        </SectionCard>
    );
}

function BrakeWidget({ temp, padLife, label }: { temp: number; padLife: number; label: string }) {
    const getTempClass = (t: number) => {
        if (t === 0) return "text-zinc-600";
        if (t < 200) return "text-blue-400";
        if (t < 300) return "text-teal-400";
        if (t <= 650) return "text-green-400";
        if (t < 800) return "text-orange-400";
        return "text-primary animate-pulse";
    };

    const getPadBarClass = (life: number) => {
        const pct = (life / 30) * 100;
        if (pct > 60) return "bg-green-500";
        if (pct > 30) return "bg-orange-400";
        return "bg-primary";
    };

    const padPct = Math.min((Math.max(padLife, 0) / 30) * 100, 100);

    return (
        <div className="flex flex-col items-center gap-1.5 border border-zinc-800 bg-black p-3">
            <span className="text-[10px] font-black tracking-widest text-zinc-600">{label}</span>
            <div className={`text-xl font-black tabular-nums tracking-tighter ${getTempClass(temp)}`}>
                {temp === 0 ? "---" : Math.round(temp)}
                <span className="text-xs font-normal opacity-50">°C</span>
            </div>
            <div className="w-full">
                <div className="mb-0.5 flex justify-between font-mono text-[9px] text-zinc-500">
                    <span>PAD</span>
                    <span>{padLife > 0 ? padLife.toFixed(1) : "-"}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden border border-zinc-800 bg-black">
                    <div
                        className={`h-full transition-all duration-300 ${getPadBarClass(padLife)}`}
                        style={{ width: `${padPct}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
