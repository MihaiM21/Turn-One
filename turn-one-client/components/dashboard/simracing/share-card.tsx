"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { Share2, Loader2, X } from "lucide-react";
import { exportChartAsBlob, triggerDownload, sanitizeFilenamePart } from "@/lib/export/chart-exporter";
import { OUTPUT_SIZES, OUTPUT_SIZE_ORDER, FOOTER_HEIGHT } from "@/lib/export/output-sizes";
import type { OutputSizeKey } from "@/types/export-types";
import { sectorMatrix, consistency } from "@/lib/simracing/analysis";
import { formatLapTime, type SimSession, type SimLap, type SimSessionSummary } from "@/lib/simracing/api";

interface ShareCardButtonProps {
    session: SimSession;
    summary: SimSessionSummary | null;
    laps: SimLap[];
}

/**
 * Exports a branded PNG summary of a session for socials/Discord.
 *
 * Reuses the existing export pipeline (`lib/export/chart-exporter.ts` + `OUTPUT_SIZES`) that the
 * admin graph exporter already uses, so branding and output presets stay consistent across the
 * product rather than diverging into a second implementation.
 */
export function ShareCardButton({ session, summary, laps }: ShareCardButtonProps) {
    const [open, setOpen] = useState(false);
    const [exporting, setExporting] = useState<OutputSizeKey | null>(null);
    const [renderSize, setRenderSize] = useState<OutputSizeKey | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleExport = async (key: OutputSizeKey) => {
        const size = OUTPUT_SIZES[key];
        setExporting(key);
        // Mount the off-screen card at the target size before rasterising it.
        setRenderSize(key);

        try {
            // Two frames: one to mount, one for layout to settle at the new dimensions.
            await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
            const node = cardRef.current;
            if (!node) throw new Error("card not mounted");

            const blob = await exportChartAsBlob({
                node,
                size,
                chartTitle: `${session.track} — ${formatLapTime(summary?.bestLapMs ?? session.bestLapMs)}`,
                branding: "footer",
                brandingMeta: {
                    eventName: session.track || "Sim session",
                    year: new Date(session.startedAt).getFullYear(),
                    sessionLabel: session.sessionType?.replace(/^AC_/, "") || "Session",
                    siteUrl: "https://t1f1.com",
                },
            });

            triggerDownload(
                blob,
                `turnone_${sanitizeFilenamePart(session.track)}_${sanitizeFilenamePart(size.shortLabel)}.png`
            );
            toast.success("Share card downloaded.");
            setOpen(false);
        } catch (err) {
            console.error("Share card export failed", err);
            toast.error("Couldn't generate the share card.");
        } finally {
            setExporting(null);
            setRenderSize(null);
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 border border-zinc-800 bg-zinc-900/60 px-3 text-xs text-zinc-300 transition-colors hover:border-primary/40 hover:text-primary"
            >
                <Share2 className="h-3.5 w-3.5" />
                Share
            </button>

            {open ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    role="dialog"
                    aria-modal="true"
                    onClick={e => e.target === e.currentTarget && setOpen(false)}
                >
                    <div className="w-full max-w-sm border border-zinc-800 bg-zinc-950">
                        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Share card</p>
                                <p className="mt-0.5 text-sm font-bold text-white">Pick a size</p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                aria-label="Close"
                                className="text-zinc-600 transition-colors hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="divide-y divide-zinc-800">
                            {OUTPUT_SIZE_ORDER.map(key => {
                                const size = OUTPUT_SIZES[key];
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleExport(key)}
                                        disabled={exporting !== null}
                                        className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-zinc-900 disabled:opacity-50"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-white">{size.label}</p>
                                            <p className="text-[11px] text-zinc-500">{size.description}</p>
                                        </div>
                                        {exporting === key ? (
                                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Off-screen render target. Positioned rather than hidden, since html-to-image
                cannot rasterise a node with display:none. */}
            {renderSize && typeof document !== "undefined"
                ? createPortal(
                      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }} aria-hidden>
                          <ShareCard
                              ref={cardRef}
                              session={session}
                              summary={summary}
                              laps={laps}
                              width={OUTPUT_SIZES[renderSize].width}
                              height={OUTPUT_SIZES[renderSize].height - FOOTER_HEIGHT}
                          />
                      </div>,
                      document.body
                  )
                : null}
        </>
    );
}

interface ShareCardProps {
    session: SimSession;
    summary: SimSessionSummary | null;
    laps: SimLap[];
    width: number;
    height: number;
    ref?: React.Ref<HTMLDivElement>;
}

/** The rendered card itself. Sized in px because it is rasterised, not laid out responsively. */
function ShareCard({ session, summary, laps, width, height, ref }: ShareCardProps) {
    const matrix = sectorMatrix(laps);
    const stats = consistency(laps);
    const scale = width / 1080;
    const px = (n: number) => `${Math.round(n * scale)}px`;

    const bestLapMs = summary?.bestLapMs ?? matrix.bestLapMs ?? session.bestLapMs;
    const validLaps = laps.filter(l => l.isValid).length;

    // Portrait formats get room for the lap list; landscape ones don't.
    const isTall = height / width > 1.1;

    return (
        <div
            ref={ref}
            style={{
                width,
                height,
                background: "#09090b",
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: px(70),
                fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
            }}
        >
            <p
                style={{
                    fontSize: px(20),
                    letterSpacing: px(6),
                    textTransform: "uppercase",
                    color: "#dc2626",
                    margin: 0,
                }}
            >
                {session.sessionType?.replace(/^AC_/, "") || "Session"}
            </p>

            <h1
                style={{
                    fontSize: px(isTall ? 86 : 70),
                    fontWeight: 900,
                    textTransform: "uppercase",
                    lineHeight: 1,
                    margin: `${px(14)} 0 0`,
                }}
            >
                {session.track}
            </h1>

            <p style={{ fontSize: px(26), color: "#a1a1aa", margin: `${px(12)} 0 0` }}>
                {session.carModel}
                {session.driverName ? ` · ${session.driverName}` : ""}
            </p>

            <div style={{ margin: `${px(48)} 0 0` }}>
                <p style={{ fontSize: px(20), letterSpacing: px(5), textTransform: "uppercase", color: "#71717a", margin: 0 }}>
                    Best lap
                </p>
                <p
                    style={{
                        fontSize: px(isTall ? 150 : 118),
                        fontWeight: 900,
                        fontVariantNumeric: "tabular-nums",
                        color: "#dc2626",
                        lineHeight: 1,
                        margin: `${px(8)} 0 0`,
                    }}
                >
                    {formatLapTime(bestLapMs)}
                </p>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: px(2),
                    background: "#27272a",
                    border: `${px(2)} solid #27272a`,
                    margin: `${px(48)} 0 0`,
                }}
            >
                {[
                    { label: "Laps", value: `${validLaps}/${laps.length || session.lapCount}` },
                    { label: "Theoretical", value: formatLapTime(summary?.theoreticalBestMs ?? matrix.theoreticalBestMs) },
                    {
                        label: "Consistency",
                        value: stats.stdDevMs != null ? `±${(stats.stdDevMs / 1000).toFixed(2)}s` : "—",
                    },
                ].map(stat => (
                    <div key={stat.label} style={{ background: "#09090b", padding: px(26) }}>
                        <p
                            style={{
                                fontSize: px(17),
                                letterSpacing: px(4),
                                textTransform: "uppercase",
                                color: "#71717a",
                                margin: 0,
                            }}
                        >
                            {stat.label}
                        </p>
                        <p
                            style={{
                                fontSize: px(42),
                                fontWeight: 900,
                                fontVariantNumeric: "tabular-nums",
                                margin: `${px(10)} 0 0`,
                            }}
                        >
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {isTall && matrix.bestSectors.some(s => s != null) ? (
                <div style={{ margin: `${px(48)} 0 0` }}>
                    <p
                        style={{
                            fontSize: px(20),
                            letterSpacing: px(5),
                            textTransform: "uppercase",
                            color: "#71717a",
                            margin: 0,
                        }}
                    >
                        Best sectors
                    </p>
                    <div style={{ display: "flex", gap: px(48), margin: `${px(18)} 0 0` }}>
                        {matrix.bestSectors.map((sector, i) => (
                            <div key={i}>
                                <p style={{ fontSize: px(20), color: "#a855f7", margin: 0 }}>S{i + 1}</p>
                                <p
                                    style={{
                                        fontSize: px(40),
                                        fontWeight: 700,
                                        fontVariantNumeric: "tabular-nums",
                                        margin: `${px(6)} 0 0`,
                                    }}
                                >
                                    {sector != null ? (sector / 1000).toFixed(3) : "—"}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            <p style={{ fontSize: px(20), color: "#52525b", margin: `${px(48)} 0 0` }}>
                {format(new Date(session.startedAt), "d MMMM yyyy")}
            </p>
        </div>
    );
}
