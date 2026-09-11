"use client";

import { Gauge } from "lucide-react";
import { SectionCard } from "./section-card";
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
        <SectionCard label="Vitals" title="Speed & gear" icon={Gauge} className="h-full">
            <div>
                {/* LED shift light bar */}
                <div className={`flex gap-1 mb-5 ${isShiftLight ? "animate-pulse" : ""}`}>
                    {Array.from({ length: LED_COUNT }).map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 flex-1 transition-all duration-75 ${
                                i < activeLeds ? getLedColor(i) : "bg-zinc-800"
                            }`}
                        />
                    ))}
                </div>

                <div className="flex justify-between items-center mb-5">
                    <div className="flex flex-col">
                        <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Speed</span>
                        <div className="flex items-baseline gap-2">
                            <span className="font-mono text-6xl font-black leading-none tracking-tighter tabular-nums text-white">
                                {speed}
                            </span>
                            <span className="text-lg font-bold text-zinc-500">km/h</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Gear</span>
                        <div
                            className={`flex h-24 w-20 items-center justify-center border-2 bg-black transition-colors duration-100 ${
                                isShiftLight
                                    ? "border-primary"
                                    : isNearShift
                                      ? "border-orange-500/50"
                                      : "border-zinc-800"
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
                    <div className="flex justify-between text-[11px] font-semibold text-zinc-500">
                        <span className="uppercase tracking-wider">RPM</span>
                        <span className="font-mono tabular-nums">
                            {rpm.toLocaleString()} / {maxRpm ? maxRpm.toLocaleString() : "---"}
                        </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden border border-zinc-800 bg-black">
                        <div
                            className={`h-full transition-all duration-75 ${
                                isShiftLight ? "bg-primary" : isNearShift ? "bg-orange-500" : "bg-primary/60"
                            }`}
                            style={{ width: `${rpmPct}%` }}
                        />
                    </div>
                </div>
            </div>
        </SectionCard>
    );
}
