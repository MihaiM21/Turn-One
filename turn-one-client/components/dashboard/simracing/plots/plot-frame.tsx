"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import { SectionCard } from "@/components/dashboard/simracing/section-card";
import { cn } from "@/lib/utils";
import type { SimPlotContext, SimPlotDefinition } from "@/lib/simracing/plot-catalog";

interface PlotFrameProps {
    definition: SimPlotDefinition;
    ctx: SimPlotContext;
    className?: string;
}

/**
 * The one card shell every catalog plot mounts inside: title/description header, a "?" toggle
 * that expands the plot's `explainer` copy, an empty state driven by `definition.isEmpty`, and the
 * plot's own `render(ctx)` output otherwise.
 */
export function PlotFrame({ definition, ctx, className }: PlotFrameProps) {
    const [showExplainer, setShowExplainer] = useState(false);
    const empty = definition.isEmpty?.(ctx) ?? false;

    return (
        <SectionCard
            className={className}
            label={definition.shortTitle}
            title={definition.title}
            actions={
                <button
                    type="button"
                    aria-pressed={showExplainer}
                    aria-label={`What does "${definition.title}" show`}
                    onClick={() => setShowExplainer(v => !v)}
                    className={cn(
                        "flex h-6 w-6 items-center justify-center border transition-colors",
                        showExplainer
                            ? "border-primary/50 bg-primary/15 text-primary"
                            : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    <CircleHelp className="h-3.5 w-3.5" />
                </button>
            }
        >
            <div className="space-y-3">
                <p className="text-[11px] text-zinc-500">{definition.description}</p>

                {showExplainer ? (
                    <div className="space-y-2 border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-[11px] text-zinc-400">
                        <p>
                            <span className="font-bold text-zinc-300">What it shows </span>
                            {definition.explainer.what}
                        </p>
                        <p>
                            <span className="font-bold text-zinc-300">How to read it </span>
                            {definition.explainer.howToRead}
                        </p>
                        <div>
                            <span className="font-bold text-zinc-300">Look for</span>
                            <ul className="mt-1 list-disc space-y-0.5 pl-4">
                                {definition.explainer.lookFor.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : null}

                {empty ? (
                    <div className="flex h-32 items-center justify-center font-mono text-sm text-zinc-600">
                        Not enough data for this plot — pick more laps or check the required channels.
                    </div>
                ) : (
                    definition.render(ctx)
                )}
            </div>
        </SectionCard>
    );
}
