"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SimGraphics } from "@/lib/simTelemetryService";
import { Flag, Fuel, CloudRain, Settings2, MapPin } from "lucide-react";

interface SimSessionStatusCardProps {
    graphics: SimGraphics | null;
}

export function SimSessionStatusCard({ graphics }: SimSessionStatusCardProps) {
    return (
        <Card className="bg-black/60 border-primary/20 backdrop-blur-md shadow-xl h-full">
            <CardContent className="p-6 h-full flex flex-col">
                <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                    <Settings2 className="w-3 h-3" />
                    Session Status
                </span>

                <div className="grid grid-cols-2 gap-2.5 flex-1">
                    <StatusItem icon={<Flag className="w-3 h-3" />} label="Position" value={`P${graphics?.position || "-"}`} />
                    <StatusItem icon={<MapPin className="w-3 h-3" />} label="Laps Done" value={graphics?.completedLaps ?? 0} />
                    <StatusItem icon={<Fuel className="w-3 h-3" />} label="Fuel Est." value={graphics?.fuelEstimatedLaps ? `${graphics.fuelEstimatedLaps.toFixed(1)} laps` : "-"} />
                    <StatusItem label="Track Grip" value={graphics?.trackGripStatus || "-"} valueClass="text-green-400" />
                    <StatusItem icon={<CloudRain className="w-3 h-3" />} label="Rain" value={graphics?.rainIntensity || "None"} />
                    <StatusItem label="Status" value={graphics?.status?.replace("AC_", "") || "-"} />
                </div>

                <div className="mt-3 pt-3 border-t border-primary/10 flex justify-between gap-2">
                    <MapSetting label="TC" val={graphics?.tc} />
                    <MapSetting label="ABS" val={graphics?.abs} />
                    <MapSetting label="MAP" val={graphics?.engineMap} />
                </div>
            </CardContent>
        </Card>
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
        <div className="bg-black/40 rounded-lg p-2.5 border border-primary/10 flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                {icon}
                {label}
            </span>
            <span className={`text-base font-bold leading-tight ${valueClass}`}>{value}</span>
        </div>
    );
}

function MapSetting({ label, val }: { label: string; val?: number }) {
    return (
        <div className="flex-1 flex flex-col items-center bg-black/80 px-2 py-2 rounded-lg border border-primary/10">
            <span className="text-[10px] text-muted-foreground font-bold">{label}</span>
            <span className="text-sm text-white font-black font-mono">{val ?? "-"}</span>
        </div>
    );
}
