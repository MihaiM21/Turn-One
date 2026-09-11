"use client";

import Link from "next/link";
import { Download, MonitorX, Loader2, MessageCircle } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/social-links";
import { formatBytes } from "@/lib/simracing/api";
import { useLinkRelease, useIsWindows } from "@/hooks/use-link-release";
import { cn } from "@/lib/utils";

interface DownloadButtonProps {
    size?: "sm" | "lg";
    className?: string;
    /** Show version / size / checksum beneath the button. */
    showMeta?: boolean;
}

/**
 * The single Turn One Link download CTA, shared by the public `/download` page and the
 * in-dashboard `/simracing/download` page.
 *
 * Three states, all real: loading, "coming soon" (no installer published yet) and a live
 * download link. There is deliberately no dead-button state.
 */
export function LinkDownloadButton({ size = "lg", className, showMeta = true }: DownloadButtonProps) {
    const { release, loading } = useLinkRelease();
    const isWindows = useIsWindows();

    const base = cn(
        "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wide transition-colors",
        size === "lg" ? "h-12 px-8 text-sm" : "h-9 px-5 text-xs",
        className
    );

    if (loading) {
        return (
            <span className={cn(base, "cursor-wait border border-zinc-800 bg-zinc-900 text-zinc-500")}>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking for updates
            </span>
        );
    }

    if (!release?.available || !release.downloadUrl) {
        return (
            <div className="space-y-3">
                <span className={cn(base, "cursor-default border border-zinc-800 bg-zinc-900 text-zinc-400")}>
                    <Download className="h-4 w-4" />
                    Launching soon
                </span>
                <p className="max-w-md text-xs text-zinc-500">
                    Turn One Link is in final testing. Join the Discord and we&apos;ll ping you the moment the
                    installer goes live.
                </p>
                <a
                    href={SOCIAL_LINKS.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-2 border border-zinc-700 px-4 text-xs font-bold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-900"
                >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Get notified on Discord
                </a>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <a href={release.downloadUrl} className={cn(base, "bg-primary text-primary-foreground hover:bg-primary/90")}>
                <Download className="h-4 w-4" />
                Download for Windows
            </a>

            {showMeta ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-zinc-500">
                    {release.version ? <span>v{release.version}</span> : null}
                    {release.sizeBytes ? <span>{formatBytes(release.sizeBytes)}</span> : null}
                    {release.releasedAt ? (
                        <span>{new Date(release.releasedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                    ) : null}
                    {release.sha256 ? (
                        <span className="break-all" title={release.sha256}>
                            SHA-256 {release.sha256.slice(0, 12)}…
                        </span>
                    ) : null}
                </div>
            ) : null}

            {isWindows === false ? (
                <p className="flex items-start gap-2 text-xs text-yellow-400">
                    <MonitorX className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    You&apos;re not on Windows. Turn One Link reads Assetto Corsa Competizione&apos;s Windows shared
                    memory, so it only runs on Windows 10/11.
                </p>
            ) : null}
        </div>
    );
}

/** Compact link to the full download guide, for use inside the dashboard. */
export function DownloadGuideLink({ className }: { className?: string }) {
    return (
        <Link
            href="/download"
            className={cn(
                "inline-flex h-8 items-center gap-1.5 border border-zinc-800 bg-zinc-900/60 px-3 text-xs text-zinc-300 transition-colors hover:border-primary/40 hover:text-primary",
                className
            )}
        >
            <Download className="h-3.5 w-3.5" />
            Full setup guide
        </Link>
    );
}
