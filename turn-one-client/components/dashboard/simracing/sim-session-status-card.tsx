"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SimGraphics } from "@/lib/simTelemetryService";

interface SimSessionStatusCardProps {
    graphics: SimGraphics | null;
}

export function SimSessionStatusCard({ graphics }: SimSessionStatusCardProps) {
    return (
        <Card className="bg-black/60 border-primary/20 backdrop-blur-md shadow-xl h-full">
            <CardContent className="p-6">
                 <span className="text-muted-foreground text-sm font-semibold tracking-wider uppercase mb-4 block">Session Status</span>
                 
                 <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                     <StatusItem label="Position" value={`P${graphics?.position || '-'}`} />
                     <StatusItem label="Laps Completed" value={graphics?.completedLaps || 0} />
                     <StatusItem label="Fuel Remaining" value={graphics?.fuelEstimatedLaps ? `${graphics.fuelEstimatedLaps.toFixed(1)} Laps` : '-'} />
                     <StatusItem label="Track Grip" value={graphics?.trackGripStatus || '-'} valueClass="text-green-400" />
                     <StatusItem label="Rain Int." value={graphics?.rainIntensity || 'NoRain'} />
                     
                     <div className="col-span-2 mt-2 pt-2 border-t border-primary/10 flex justify-between">
                         <MapSetting label="TC" val={graphics?.tc} />
                         <MapSetting label="ABS" val={graphics?.abs} />
                         <MapSetting label="MAP" val={graphics?.engineMap} />
                     </div>
                 </div>
            </CardContent>
        </Card>
    );
}

function StatusItem({ label, value, valueClass = "text-white" }: { label: string, value: string | number, valueClass?: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-semibold">{label}</span>
            <span className={`text-lg font-bold ${valueClass}`}>{value}</span>
        </div>
    );
}

function MapSetting({ label, val }: { label: string, val?: number }) {
    return (
        <div className="flex gap-2 items-center bg-black/80 px-3 py-1.5 rounded border border-primary/10">
            <span className="text-xs text-muted-foreground font-bold">{label}</span>
            <span className="text-sm text-white font-black font-mono">{val ?? '-'}</span>
        </div>
    );
}
