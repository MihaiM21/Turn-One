"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SimPhysics } from "@/lib/simTelemetryService";

interface SimBrakesCardProps {
    physics: SimPhysics | null;
}

const WHEEL_LABELS = ["FL", "FR", "RL", "RR"] as const;

export function SimBrakesCard({ physics }: SimBrakesCardProps) {
    const temps = physics?.brakeTemp || [0, 0, 0, 0];
    const padLife = physics?.padLife || [0, 0, 0, 0];

    return (
        <Card className="bg-black/60 border-primary/20 backdrop-blur-md shadow-xl">
            <CardContent className="p-6">
                <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase mb-5 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full inline-block" />
                    Brake Status
                </span>

                <div className="grid grid-cols-2 gap-3 max-w-[260px] mx-auto">
                    {([0, 1, 2, 3] as const).map(i => (
                        <BrakeWidget key={i} temp={temps[i]} padLife={padLife[i]} label={WHEEL_LABELS[i]} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function BrakeWidget({ temp, padLife, label }: { temp: number; padLife: number; label: string }) {
    const getTempClass = (t: number) => {
        if (t === 0) return "text-muted-foreground";
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
        <div className="p-3 rounded-xl border-2 border-primary/10 bg-black/80 flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-black tracking-widest text-muted-foreground/70">{label}</span>
            <div className={`text-xl font-black tabular-nums tracking-tighter ${getTempClass(temp)}`}>
                {temp === 0 ? "---" : Math.round(temp)}
                <span className="text-xs font-normal opacity-50">°C</span>
            </div>
            <div className="w-full">
                <div className="flex justify-between text-[9px] text-muted-foreground font-mono mb-0.5">
                    <span>PAD</span>
                    <span>{padLife > 0 ? padLife.toFixed(1) : "-"}</span>
                </div>
                <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-primary/10">
                    <div
                        className={`h-full transition-all duration-300 ${getPadBarClass(padLife)}`}
                        style={{ width: `${padPct}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
