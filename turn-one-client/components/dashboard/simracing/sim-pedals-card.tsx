"use client";

import { Footprints } from "lucide-react";
import { SectionCard } from "./section-card";
import { SimPhysics } from "@/lib/simTelemetryService";

interface SimPedalsCardProps {
    physics: SimPhysics | null;
}

export function SimPedalsCard({ physics }: SimPedalsCardProps) {
    const gas = physics ? Math.min(physics.gas * 100, 100) : 0;
    const brake = physics ? Math.min(physics.brake * 100, 100) : 0;
    const clutch = physics ? Math.min(physics.clutch * 100, 100) : 0;

    return (
        <SectionCard label="Inputs" title="Pedals" icon={Footprints} className="h-full" bodyClassName="px-5 py-4 h-[calc(100%-49px)]">
            <div className="flex h-full min-h-0 flex-1 items-end justify-center gap-3">
                <PedalBar label="THR" value={gas} color="bg-green-500" />
                <PedalBar label="BRK" value={brake} color="bg-primary" />
                <PedalBar label="CLT" value={clutch} color="bg-yellow-400" />
            </div>
        </SectionCard>
    );
}

function PedalBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-end gap-2">
            <span className="font-mono text-xs font-bold tabular-nums text-white">{Math.round(value)}%</span>
            <div className="relative h-36 w-full max-w-[40px] overflow-hidden border border-zinc-800 bg-black">
                {[25, 50, 75].map(tick => (
                    <div
                        key={tick}
                        className="pointer-events-none absolute left-0 w-full border-b border-white/10"
                        style={{ bottom: `${tick}%` }}
                    />
                ))}
                <div
                    className={`absolute bottom-0 left-0 w-full transition-all duration-75 ${color}`}
                    style={{ height: `${value}%` }}
                />
            </div>
            <span className="text-[10px] font-black tracking-widest text-zinc-500">{label}</span>
        </div>
    );
}
