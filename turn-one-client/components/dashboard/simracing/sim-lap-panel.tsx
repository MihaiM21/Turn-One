"use client";

import { SectionCard } from "./section-card";
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
        <SectionCard label="Timing" title="Lap times" icon={Timer} className="h-full">
            <div className="mb-5 flex items-end justify-between border-b border-zinc-800 pb-4">
                <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                        Current lap
                    </span>
                    <span className="font-mono text-5xl font-black leading-none tracking-tighter tabular-nums text-white">
                        {current}
                    </span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Delta</span>
                    <span
                        className={`font-mono text-3xl font-black leading-none tabular-nums ${
                            !hasValidDelta ? "text-zinc-600" : isDeltaNegative ? "text-green-500" : "text-primary"
                        }`}
                    >
                        {delta}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-zinc-800">
                <div className="flex flex-col justify-center bg-zinc-950 p-3">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                        Last lap
                    </span>
                    <span className="font-mono text-xl font-bold tabular-nums text-white">{last}</span>
                </div>
                <div className="flex flex-col justify-center bg-zinc-950 p-3">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                        Best lap
                    </span>
                    <span className="font-mono text-xl font-bold tabular-nums text-primary">{best}</span>
                </div>
            </div>
        </SectionCard>
    );
}
