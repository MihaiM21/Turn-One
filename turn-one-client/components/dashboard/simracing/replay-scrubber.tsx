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
        <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-primary/20 backdrop-blur-md">
            <button
                onClick={() => setPlaying(p => !p)}
                className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/20 border border-primary/40 hover:bg-primary/30 transition-colors"
                aria-label={playing ? "Pause" : "Play"}
            >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <span className="font-mono text-xs text-muted-foreground w-20">
                {format(new Date(pos), "HH:mm:ss")}
            </span>
            <input
                type="range"
                min={minTimestamp}
                max={maxTimestamp}
                value={pos}
                step={50}
                onChange={e => onChange(Number(e.target.value))}
                className="flex-1 accent-primary"
                style={{
                    background: `linear-gradient(to right, rgb(239 68 68 / 0.6) ${pct}%, rgb(255 255 255 / 0.1) ${pct}%)`,
                }}
            />
            <span className="font-mono text-xs text-muted-foreground w-20 text-right">
                {format(new Date(maxTimestamp), "HH:mm:ss")}
            </span>
        </div>
    );
}
