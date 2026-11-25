"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { DiamondLoader } from "@/components/ui/diamond-loader";

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
    /**
     * `card` (default) is the boxed surface: use it for the one element a page leads with.
     * `quiet` drops the box, the icon and the header rule and sits under a hairline, so
     * supporting content stays readable without competing (PBI-072). The eyebrow shows only
     * when there is no title, since the title already says what the block is.
     */
    variant?: "card" | "quiet";
}

/**
 * The single card primitive for the simracing section.
 *
 * t1-style: card surface, hairline border, condensed eyebrow. Prefer it over the
 * blurred shadcn `Card` these pages used to reach for.
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
    variant = "card",
}: SectionCardProps) {
    const hasHeader = label || title || actions || Icon;

    if (variant === "quiet") {
        return (
            <section className={cn("border-t border-border", className)}>
                {label || title || actions ? (
                    <div className="flex items-center justify-between gap-3 px-5 pb-1 pt-4">
                        <div className="min-w-0">
                            {title ? (
                                <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                            ) : label ? (
                                <p className="eyebrow text-[10px]">{label}</p>
                            ) : null}
                        </div>
                        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
                    </div>
                ) : null}
                <SectionBody loading={loading} empty={empty} emptyIcon={EmptyIcon} flush={flush} bodyClassName={bodyClassName}>
                    {children}
                </SectionBody>
            </section>
        );
    }

    return (
        <section className={cn("rounded-lg border border-border bg-card", className)}>
            {hasHeader ? (
                <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                        {Icon ? <Icon className={cn("h-4 w-4 shrink-0 text-primary", iconClassName)} /> : null}
                        <div className="min-w-0">
                            {label ? (
                                <p className="eyebrow text-[10px]">{label}</p>
                            ) : null}
                            {title ? <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{title}</p> : null}
                        </div>
                    </div>
                    {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
                </div>
            ) : null}

            <SectionBody loading={loading} empty={empty} emptyIcon={EmptyIcon} flush={flush} bodyClassName={bodyClassName}>
                {children}
            </SectionBody>
        </section>
    );
}

function SectionBody({
    loading,
    empty,
    emptyIcon: EmptyIcon,
    flush,
    bodyClassName,
    children,
}: Pick<SectionCardProps, "loading" | "empty" | "emptyIcon" | "flush" | "bodyClassName" | "children">) {
    if (loading) {
        return (
            <div className="px-5 py-12">
                <DiamondLoader size={40} tone="flat" label="Loading" />
            </div>
        );
    }
    if (empty) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 px-5 py-12 text-center">
                {EmptyIcon ? <EmptyIcon className="h-8 w-8 text-muted-foreground/50" /> : null}
                <div className="text-sm text-muted-foreground">{empty}</div>
            </div>
        );
    }
    return <div className={cn(!flush && "px-5 py-4", bodyClassName)}>{children}</div>;
}

/** Divided stat strip — the mono/tabular metric row used across the dashboard. */
export function StatStrip({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                "grid grid-cols-2 gap-px overflow-hidden border border-border bg-border lg:grid-cols-4",
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
        <div className="bg-card px-5 py-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {Icon ? <Icon className="h-3 w-3" /> : null}
                {label}
            </div>
            <p className={cn("mt-2 font-mono text-2xl font-bold tabular-nums text-white", valueClassName)}>{value}</p>
            {sub ? <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p> : null}
        </div>
    );
}
