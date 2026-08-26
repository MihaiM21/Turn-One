"use client";

import { ReactNode } from "react";
import { SectionCard } from "./section-card";
import { SimGraphics } from "@/lib/simTelemetryService";
import { Flag, Fuel, CloudRain, Settings2, MapPin } from "lucide-react";

interface SimSessionStatusCardProps {
    graphics: SimGraphics | null;
}

export function SimSessionStatusCard({ graphics }: SimSessionStatusCardProps) {
    return (
        <SectionCard label="Session" title="Status" icon={Settings2} className="h-full">
            <div className="flex h-full flex-col">
                <div className="grid flex-1 grid-cols-2 gap-2.5">
                    <StatusItem icon={<Flag className="w-3 h-3" />} label="Position" value={`P${graphics?.position || "-"}`} />
                    <StatusItem icon={<MapPin className="w-3 h-3" />} label="Laps Done" value={graphics?.completedLaps ?? 0} />
                    <StatusItem icon={<Fuel className="w-3 h-3" />} label="Fuel Est." value={graphics?.fuelEstimatedLaps ? `${graphics.fuelEstimatedLaps.toFixed(1)} laps` : "-"} />
                    <StatusItem label="Track Grip" value={graphics?.trackGripStatus || "-"} valueClass="text-green-400" />
                    <StatusItem icon={<CloudRain className="w-3 h-3" />} label="Rain" value={graphics?.rainIntensity || "None"} />
                    <StatusItem label="Status" value={graphics?.status?.replace("AC_", "") || "-"} />
                </div>

                <div className="mt-3 flex justify-between gap-2 border-t border-zinc-800 pt-3">
                    <MapSetting label="TC" val={graphics?.tc} />
                    <MapSetting label="ABS" val={graphics?.abs} />
                    <MapSetting label="MAP" val={graphics?.engineMap} />
                </div>
            </div>
        </SectionCard>
    );
}

function StatusItem({
    icon,
    label,
    value,
    valueClass = "text-white",
}: {
    icon?: ReactNode;
    label: string;
    value: string | number;
    valueClass?: string;
}) {
    return (
        <div className="flex flex-col gap-0.5 border border-zinc-800 bg-black p-2.5">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {icon}
                {label}
            </span>
            <span className={`text-base font-bold leading-tight ${valueClass}`}>{value}</span>
        </div>
    );
}

function MapSetting({ label, val }: { label: string; val?: number }) {
    return (
        <div className="flex flex-1 flex-col items-center border border-zinc-800 bg-black px-2 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
            <span className="font-mono text-sm font-black text-white">{val ?? "-"}</span>
        </div>
    );
}
