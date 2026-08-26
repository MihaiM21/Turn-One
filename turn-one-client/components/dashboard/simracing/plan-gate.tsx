"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { usePlan } from "@/hooks/use-plan";
import type { PlanType } from "@/lib/plan-features";
import { cn } from "@/lib/utils";

interface PlanGateProps {
    /** Minimum plan required to see the real content. */
    required: PlanType;
    title: string;
    description: string;
    /**
     * Optional teaser rendered blurred behind the lock. Omit for a plain locked panel —
     * don't pass anything that would fetch gated data, since it renders either way.
     */
    preview?: ReactNode;
    children: ReactNode;
    className?: string;
}

/**
 * Renders `children` when the user's plan is high enough, otherwise an upsell panel.
 *
 * Entitlement comes from `usePlan()`, so locked features are known up front rather than
 * discovered by firing a request and catching a 403.
 */
export function PlanGate({ required, title, description, preview, children, className }: PlanGateProps) {
    const { atLeast, loading } = usePlan();

    if (loading) {
        return (
            <div className={cn("flex items-center justify-center border border-zinc-800 bg-zinc-950 px-5 py-12", className)}>
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    if (atLeast(required)) return <>{children}</>;

    return (
        <div className={cn("relative overflow-hidden border border-zinc-800 bg-zinc-950", className)}>
            {preview ? (
                <div className="pointer-events-none select-none opacity-30 blur-[6px]" aria-hidden>
                    {preview}
                </div>
            ) : null}

            <div
                className={cn(
                    "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
                    preview && "absolute inset-0 bg-black/70 backdrop-blur-[2px]"
                )}
            >
                <div className="flex h-10 w-10 items-center justify-center border border-primary/40 bg-primary/10">
                    <Lock className="h-4 w-4 text-primary" />
                </div>

                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-primary">{required} feature</p>
                    <p className="mt-1 text-sm font-bold text-white">{title}</p>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500">{description}</p>
                </div>

                <Link
                    href="/pricing"
                    className="mt-1 inline-flex h-8 items-center gap-1.5 border border-primary/50 bg-primary/10 px-4 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    Upgrade to {required}
                </Link>
            </div>
        </div>
    );
}

/** Small inline "PRO"/"ELITE" tag, matching the generator's plot-picker badge. */
export function PlanBadge({ plan, className }: { plan: PlanType; className?: string }) {
    return (
        <span
            className={cn(
                "inline-flex items-center border border-primary/50 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary",
                className
            )}
        >
            {plan}
        </span>
    );
}
