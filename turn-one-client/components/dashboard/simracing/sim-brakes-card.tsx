"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SimPhysics } from "@/lib/simTelemetryService";

interface SimBrakesCardProps {
    physics: SimPhysics | null;
}

export function SimBrakesCard({ physics }: SimBrakesCardProps) {
    const temps = physics?.brakeTemp || [0, 0, 0, 0];
    const padLife = physics?.padLife || [0, 0, 0, 0];

    return (
        <Card className="bg-black/60 border-primary/20 backdrop-blur-md shadow-xl">
            <CardContent className="p-6">
                <div className="flex justify-between mb-4">
                    <span className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">Brakes</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                    <BrakeWidget temp={temps[0]} padLife={padLife[0]} />
                    <BrakeWidget temp={temps[1]} padLife={padLife[1]} />
                    <BrakeWidget temp={temps[2]} padLife={padLife[2]} />
                    <BrakeWidget temp={temps[3]} padLife={padLife[3]} />
                </div>
            </CardContent>
        </Card>
    );
}

function BrakeWidget({ temp, padLife }: { temp: number, padLife: number }) {
    // Colors based on ACC brake optimums (roughly 300C - 600C is good for GT3)
    const getColor = (t: number) => {
        if (t === 0) return "text-muted-foreground";
        if (t < 200) return "text-blue-400";
        if (t < 300) return "text-teal-400";
        if (t <= 650) return "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.3)]";
        if (t < 800) return "text-orange-400";
        return "text-primary animate-pulse";
    };

    return (
        <div className="p-3 rounded-xl border-2 border-primary/10 bg-black/80 flex flex-col items-center justify-center gap-1">
            <div className={`text-xl font-black tabular-nums tracking-tighter ${getColor(temp)}`}>
                {temp === 0 ? "---" : Math.round(temp)}<span className="text-xs font-normal opacity-50">°C</span>
            </div>
            {/* Pad life bar visually 0-30 max */}
            <div className="w-full mt-1">
                <div className="flex justify-between text-[9px] text-muted-foreground font-mono mb-0.5">
                    <span>PAD</span>
                    <span>{padLife > 0 ? padLife.toFixed(1) : '-'}</span>
                </div>
                <div className="w-full h-1 bg-black rounded-full overflow-hidden border border-primary/10">
                    <div 
                        className="h-full bg-muted-foreground" 
                        style={{ width: `${Math.min((Math.max(padLife,0) / 30) * 100, 100)}%` }} 
                    />
                </div>
            </div>
        </div>
    );
}
