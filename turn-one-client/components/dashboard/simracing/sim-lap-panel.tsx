"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SimGraphics } from "@/lib/simTelemetryService";
import { Timer } from "lucide-react";

interface SimLapPanelProps {
    graphics: SimGraphics | null;
}

export function SimLapPanel({ graphics }: SimLapPanelProps) {
    const current = graphics?.currentTime || "0:00:000";
    const last = graphics?.iLastTime !== 2147483647 ? graphics?.lastTime : "-:--:---";
    const best = graphics?.iBestTime !== 2147483647 ? graphics?.bestTime : "-:--:---";
    const delta = graphics?.deltaLapTime || "-:--:---";
    const isDeltaNegative = delta.startsWith("-");
    const hasValidDelta = delta !== "-:--:---";

    return (
        <Card className="bg-black/60 border-primary/20 backdrop-blur-md shadow-xl h-full">
            <CardContent className="p-6 flex flex-col h-full">
                <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                    <Timer className="w-3 h-3" />
                    Lap Times
                </span>

                <div className="flex justify-between items-end mb-5 pb-4 border-b border-primary/10">
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase mb-1">Current Lap</span>
                        <span className="text-5xl font-black text-white tracking-tighter tabular-nums font-mono leading-none">{current}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase mb-1">Delta</span>
                        <span
                            className={`text-3xl font-black tabular-nums font-mono leading-none ${
                                !hasValidDelta
                                    ? "text-muted-foreground"
                                    : isDeltaNegative
                                    ? "text-green-500"
                                    : "text-primary"
                            }`}
                        >
                            {delta}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 flex-1">
                    <div className="bg-black/80 p-3 rounded-lg border border-primary/10 flex flex-col justify-center">
                        <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Last Lap</span>
                        <span className="text-xl font-bold text-white font-mono tabular-nums">{last}</span>
                    </div>
                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 flex flex-col justify-center">
                        <span className="text-primary/80 text-xs font-bold uppercase tracking-widest mb-1">Best Lap</span>
                        <span className="text-xl font-bold text-primary font-mono tabular-nums">{best}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
