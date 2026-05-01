"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SimPhysics } from "@/lib/simTelemetryService";

interface SimVitalsCardProps {
    physics: SimPhysics | null;
    maxRpm: number;
}

const LED_COUNT = 14;

export function SimVitalsCard({ physics, maxRpm }: SimVitalsCardProps) {
    const speed = physics ? Math.round(physics.speedKmh) : 0;
    const gear = physics ? physics.gear : 1;
    const displayGear = gear === 0 ? "R" : gear === 1 ? "N" : (gear - 1).toString();
    const rpm = physics ? Math.round(physics.rpms) : 0;
    const rpmPct = maxRpm > 0 ? Math.min((rpm / maxRpm) * 100, 100) : 0;

    const isShiftLight = rpmPct > 95;
    const isNearShift = rpmPct > 85;
    const activeLeds = Math.floor((rpmPct / 100) * LED_COUNT);

    const getLedColor = (i: number) => {
        const fraction = i / LED_COUNT;
        if (fraction < 0.5) return "bg-green-500";
        if (fraction < 0.75) return "bg-yellow-400";
        if (fraction < 0.9) return "bg-orange-500";
        return "bg-primary";
    };

    return (
        <Card className="bg-black/60 border-primary/20 shadow-xl backdrop-blur-md overflow-hidden">
            <CardContent className="p-6">
                {/* LED shift light bar */}
                <div className={`flex gap-1 mb-5 ${isShiftLight ? "animate-pulse" : ""}`}>
                    {Array.from({ length: LED_COUNT }).map((_, i) => (
                        <div
                            key={i}
                            className={`flex-1 h-2 rounded-full transition-all duration-75 ${
                                i < activeLeds ? getLedColor(i) : "bg-primary/10"
                            }`}
                        />
                    ))}
                </div>

                <div className="flex justify-between items-center mb-5">
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase mb-1">Speed</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-white tracking-tighter tabular-nums leading-none">{speed}</span>
                            <span className="text-lg font-bold text-muted-foreground">km/h</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase mb-1">Gear</span>
                        <div
                            className={`flex items-center justify-center w-20 h-24 rounded-xl bg-black/80 border-2 transition-all duration-100 ${
                                isShiftLight
                                    ? "border-primary shadow-[0_0_30px_rgba(239,68,68,0.6)]"
                                    : isNearShift
                                    ? "border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.25)]"
                                    : "border-primary/20"
                            }`}
                        >
                            <span
                                className={`text-6xl font-black transition-colors duration-100 ${
                                    isShiftLight ? "text-primary" : isNearShift ? "text-orange-400" : "text-white"
                                }`}
                            >
                                {displayGear}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                        <span>RPM</span>
                        <span className="tabular-nums font-mono">{rpm.toLocaleString()} / {maxRpm ? maxRpm.toLocaleString() : "---"}</span>
                    </div>
                    <div className="h-3 w-full bg-black/80 border border-primary/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-75 rounded-full ${
                                isShiftLight
                                    ? "bg-primary shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                                    : isNearShift
                                    ? "bg-orange-500"
                                    : "bg-primary/60"
                            }`}
                            style={{ width: `${rpmPct}%` }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
