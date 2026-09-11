"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Pause, Play } from "lucide-react";

interface ReplayScrubberProps {
    minTimestamp: number;
    maxTimestamp: number;
    value: number | null;
    onChange: (timestamp: number) => void;
}

export function ReplayScrubber({ minTimestamp, maxTimestamp, value, onChange }: ReplayScrubberProps) {
    const [playing, setPlaying] = useState(false);
    const rafRef = useRef<number | null>(null);
    const lastTickRef = useRef<number>(0);
    const valueRef = useRef<number | null>(value);

    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    useEffect(() => {
        if (!playing) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            return;
        }

        const tick = (now: number) => {
            const dt = lastTickRef.current ? now - lastTickRef.current : 16;
            lastTickRef.current = now;
            const current = valueRef.current ?? minTimestamp;
            const next = current + dt;
            if (next >= maxTimestamp) {
                onChange(maxTimestamp);
                setPlaying(false);
                return;
            }
            onChange(next);
            rafRef.current = requestAnimationFrame(tick);
        };

        lastTickRef.current = 0;
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [playing, minTimestamp, maxTimestamp, onChange]);

    const pos = value ?? minTimestamp;
    const pct = maxTimestamp > minTimestamp ? ((pos - minTimestamp) / (maxTimestamp - minTimestamp)) * 100 : 0;

    return (
        <div className="flex items-center gap-3 border border-zinc-800 bg-zinc-950 p-3">
            <button
                onClick={() => setPlaying(p => !p)}
                className="flex h-9 w-9 shrink-0 items-center justify-center border border-primary/40 bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                aria-label={playing ? "Pause" : "Play"}
            >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <span className="w-20 shrink-0 font-mono text-xs tabular-nums text-zinc-500">
                {format(new Date(pos), "HH:mm:ss")}
            </span>
            <input
                type="range"
                min={minTimestamp}
                max={maxTimestamp}
                value={pos}
                step={50}
                onChange={e => onChange(Number(e.target.value))}
                aria-label="Replay position"
                className="h-1.5 flex-1 appearance-none accent-primary"
                style={{
                    background: `linear-gradient(to right, rgb(220 38 38 / 0.7) ${pct}%, rgb(63 63 70) ${pct}%)`,
                }}
            />
            <span className="w-20 shrink-0 text-right font-mono text-xs tabular-nums text-zinc-500">
                {format(new Date(maxTimestamp), "HH:mm:ss")}
            </span>
        </div>
    );
}
