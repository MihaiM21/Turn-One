"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SectionCardProps {
    /** Small uppercase eyebrow above the title. */
    label?: string;
    title?: ReactNode;
    icon?: LucideIcon;
    iconClassName?: string;
    /** Right-aligned header content (links, toggles, buttons). */
    actions?: ReactNode;
    /** Renders a spinner in place of children. */
    loading?: boolean;
    /** Renders this message in place of children when there is nothing to show. */
    empty?: ReactNode;
    emptyIcon?: LucideIcon;
    /** Drop the default body padding — for tables and divided lists that manage their own. */
    flush?: boolean;
    className?: string;
    bodyClassName?: string;
    children?: ReactNode;
}

/**
 * The single card primitive for the simracing section.
 *
 * Matches the dashboard idiom used elsewhere in the app (square corners, zinc-800 hairline,
 * zinc-950 surface, wide-tracked uppercase eyebrow) rather than the rounded/blurred shadcn
 * `Card` these pages used to reach for.
 */
export function SectionCard({
    label,
    title,
    icon: Icon,
    iconClassName,
    actions,
    loading,
    empty,
    emptyIcon: EmptyIcon,
    flush,
    className,
    bodyClassName,
    children,
}: SectionCardProps) {
    const hasHeader = label || title || actions || Icon;

    return (
        <section className={cn("border border-zinc-800 bg-zinc-950", className)}>
            {hasHeader ? (
                <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-5 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                        {Icon ? <Icon className={cn("h-4 w-4 shrink-0 text-primary", iconClassName)} /> : null}
                        <div className="min-w-0">
                            {label ? (
                                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{label}</p>
                            ) : null}
                            {title ? <p className="mt-0.5 truncate text-sm font-bold text-white">{title}</p> : null}
                        </div>
                    </div>
                    {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
                </div>
            ) : null}

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 px-5 py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-xs uppercase tracking-[0.25em] text-zinc-500">Loading</span>
                </div>
            ) : empty ? (
                <div className="flex flex-col items-center justify-center gap-3 px-5 py-12 text-center">
                    {EmptyIcon ? <EmptyIcon className="h-8 w-8 text-zinc-700" /> : null}
                    <div className="text-sm text-zinc-500">{empty}</div>
                </div>
            ) : (
                <div className={cn(!flush && "px-5 py-4", bodyClassName)}>{children}</div>
            )}
        </section>
    );
}

/** Divided stat strip — the mono/tabular metric row used across the dashboard. */
export function StatStrip({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                "grid grid-cols-2 gap-px overflow-hidden border border-zinc-800 bg-zinc-800 lg:grid-cols-4",
                className
            )}
        >
            {children}
        </div>
    );
}

export function Stat({
    icon: Icon,
    label,
    value,
    sub,
    valueClassName,
}: {
    icon?: LucideIcon;
    label: string;
    value: ReactNode;
    sub?: ReactNode;
    valueClassName?: string;
}) {
    return (
        <div className="bg-zinc-950 px-5 py-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                {Icon ? <Icon className="h-3 w-3" /> : null}
                {label}
            </div>
            <p className={cn("mt-2 font-mono text-2xl font-bold tabular-nums text-white", valueClassName)}>{value}</p>
            {sub ? <p className="mt-0.5 text-[10px] text-zinc-500">{sub}</p> : null}
        </div>
    );
}
