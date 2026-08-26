"use client";

import { useMemo, useState } from "react";
import type { DistanceSample } from "@/lib/simracing/analysis";
import type { MultiChannelChartData } from "./multi-channel-chart";
import { buildTrackPath, buildRibbonPath, pointAtDistance } from "@/lib/simracing/track-map";
import { speedToColor, gearToColor, deltaToColor } from "@/lib/color-scale";
import { formatDistance } from "./chart-theme";

type ColorMode = "speed" | "gear" | "throttle" | "brake" | "delta";

const MODES: { key: ColorMode; label: string }[] = [
    { key: "speed", label: "Speed" },
    { key: "gear", label: "Gear" },
    { key: "throttle", label: "Throttle" },
    { key: "brake", label: "Brake" },
];

interface TrackMapProps {
    samples: DistanceSample[];
    raw: MultiChannelChartData;
    /** Per-sample time delta vs a reference, enabling the "delta" colour mode. */
    deltaByDistance?: { distance: number; delta: number }[] | null;
    cursorDistance?: number | null;
    onCursorChange?: (distance: number | null) => void;
    height?: number;
}

/**
 * The racing line, coloured by a chosen channel.
 *
 * The shape is reconstructed from heading + speed (see `lib/simracing/track-map.ts`); when
 * heading is unavailable it degrades to a straight ribbon so the colouring is still useful.
 */
export function TrackMap({
    samples,
    raw,
    deltaByDistance = null,
    cursorDistance = null,
    onCursorChange,
    height = 340,
}: TrackMapProps) {
    const [mode, setMode] = useState<ColorMode>("speed");

    const path = useMemo(() => {
        const real = buildTrackPath(samples, raw);
        return real.ok ? real : buildRibbonPath(samples);
    }, [samples, raw]);

    const bounds = useMemo(() => {
        const speeds = samples.map(s => s.speedKmh);
        const deltas = deltaByDistance?.map(d => Math.abs(d.delta)) ?? [];
        return {
            minSpeed: speeds.length ? Math.min(...speeds) : 0,
            maxSpeed: speeds.length ? Math.max(...speeds) : 1,
            maxDelta: deltas.length ? Math.max(...deltas, 0.05) : 0.05,
        };
    }, [samples, deltaByDistance]);

    const deltaLookup = useMemo(() => {
        if (!deltaByDistance?.length) return null;
        const map = new Map<number, number>();
        for (const d of deltaByDistance) map.set(Math.round(d.distance), d.delta);
        return map;
    }, [deltaByDistance]);

    const colorFor = (sample: DistanceSample) => {
        switch (mode) {
            case "gear":
                return gearToColor(sample.gear);
            case "throttle":
                return `rgb(${Math.round(34 + (1 - sample.gas) * 60)}, ${Math.round(197 * sample.gas + 40)}, 94)`;
            case "brake":
                return sample.brake > 0.03
                    ? `rgb(239, ${Math.round(120 - sample.brake * 100)}, 68)`
                    : "#3f3f46";
            case "delta": {
                const d = deltaLookup?.get(Math.round(sample.distance)) ?? 0;
                return deltaToColor(d, bounds.maxDelta);
            }
            default:
                return speedToColor(sample.speedKmh, bounds.minSpeed, bounds.maxSpeed);
        }
    };

    const cursorPoint = cursorDistance != null ? pointAtDistance(path, cursorDistance) : null;
    const hoveredSample = cursorPoint ? samples[cursorPoint.index] : null;

    const modes = deltaByDistance?.length ? [...MODES, { key: "delta" as ColorMode, label: "Delta" }] : MODES;

    if (!samples.length) {
        return (
            <div className="flex h-48 items-center justify-center font-mono text-sm text-zinc-600">
                No position data for this lap
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                    {modes.map(m => (
                        <button
                            key={m.key}
                            onClick={() => setMode(m.key)}
                            aria-pressed={mode === m.key}
                            className={`h-7 border px-2.5 text-[11px] font-bold transition-colors ${
                                mode === m.key
                                    ? "border-primary/50 bg-primary/10 text-primary"
                                    : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                            }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                {hoveredSample ? (
                    <div className="flex gap-3 font-mono text-[11px] tabular-nums text-zinc-400">
                        <span>{formatDistance(hoveredSample.distance)}</span>
                        <span className="text-white">{Math.round(hoveredSample.speedKmh)} km/h</span>
                        <span>G{hoveredSample.gear}</span>
                    </div>
                ) : null}
            </div>

            <div style={{ height }} className="w-full">
                <svg
                    viewBox={path.viewBox}
                    className="h-full w-full"
                    preserveAspectRatio="xMidYMid meet"
                    onMouseLeave={() => onCursorChange?.(null)}
                >
                    {/* Casing, so the coloured line reads against the page background. */}
                    <polyline
                        points={path.points.map(p => `${p.x},${p.y}`).join(" ")}
                        fill="none"
                        stroke="#18181b"
                        strokeWidth={path.ok ? 14 : 26}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {path.points.slice(0, -1).map((p, i) => {
                        const next = path.points[i + 1];
                        const sample = samples[p.index];
                        if (!sample) return null;
                        return (
                            <line
                                key={i}
                                x1={p.x}
                                y1={p.y}
                                x2={next.x}
                                y2={next.y}
                                stroke={colorFor(sample)}
                                strokeWidth={path.ok ? 9 : 20}
                                strokeLinecap="round"
                                onMouseEnter={() => onCursorChange?.(sample.distance)}
                            />
                        );
                    })}

                    {/* Start/finish */}
                    {path.points.length ? (
                        <circle cx={path.points[0].x} cy={path.points[0].y} r={path.ok ? 9 : 12} fill="#fff" />
                    ) : null}

                    {cursorPoint ? (
                        <circle
                            cx={cursorPoint.x}
                            cy={cursorPoint.y}
                            r={path.ok ? 11 : 14}
                            fill="none"
                            stroke="#fff"
                            strokeWidth={3}
                        />
                    ) : null}
                </svg>
            </div>

            {!path.ok ? (
                <p className="text-[11px] text-zinc-600">
                    Track shape unavailable for this session — showing the lap as a distance ribbon instead.
                </p>
            ) : null}
        </div>
    );
}
