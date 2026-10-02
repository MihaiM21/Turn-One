"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Globe2, Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlan } from "@/hooks/use-plan";
import { PlanBadge } from "@/components/dashboard/simracing/plan-gate";
import { lapColor } from "@/lib/simracing/lap-telemetry";
import { SIM_SOURCE_LABEL, type MyTrackDto, type SimSource, type TrackLapListItemDto } from "@/lib/simracing/protocol";
import { formatLapTime, getMyTrackLaps, getMyTracks, reprocessLap } from "@/lib/simracing/api";

const MAX_LAPS_PRO = 8;
const MAX_LAPS_BASIC = 2;

export interface LapPickerSelection {
    trackId: string | null;
    refLapId: string | null;
    lapIds: string[];
}

interface LapPickerProps {
    trackId: string | null;
    refLapId: string | null;
    lapIds: string[];
    onChange: (next: LapPickerSelection) => void;
}

/**
 * Left rail of the analysis workspace: pick a track, filter its laps, and build the overlay
 * selection. Selection state itself lives in the URL (owned by the page) — this component only
 * emits the next `{trackId, refLapId, lapIds}` trio.
 */
export function LapPicker({ trackId, refLapId, lapIds, onChange }: LapPickerProps) {
    const { atLeast } = usePlan();
    const isPro = atLeast("PRO");
    const maxLaps = isPro ? MAX_LAPS_PRO : MAX_LAPS_BASIC;

    const [tracks, setTracks] = useState<MyTrackDto[] | null>(null);
    const [tracksLoading, setTracksLoading] = useState(true);

    const [car, setCar] = useState("");
    const [validOnly, setValidOnly] = useState(true);
    const [includePublic, setIncludePublic] = useState(false);

    const [items, setItems] = useState<TrackLapListItemDto[]>([]);
    const [lapsLoading, setLapsLoading] = useState(false);
    const [reprocessing, setReprocessing] = useState<Set<string>>(new Set());

    useEffect(() => {
        getMyTracks()
            .then(setTracks)
            .catch(() => setTracks([]))
            .finally(() => setTracksLoading(false));
    }, []);

    const activeTrack = tracks?.find(t => t.profile.id === trackId) ?? null;

    const loadLaps = useCallback(() => {
        if (!trackId) {
            setItems([]);
            return;
        }
        setLapsLoading(true);
        getMyTrackLaps(trackId, {
            valid: validOnly || undefined,
            car: car || undefined,
            includePublic: isPro && includePublic,
            limit: 200,
        })
            .then(res => setItems(res.items))
            .catch(() => setItems([]))
            .finally(() => setLapsLoading(false));
    }, [trackId, validOnly, car, includePublic, isPro]);

    useEffect(() => {
        loadLaps();
    }, [loadLaps]);

    // Filters above cap out at 2 for BASIC — losing PRO shouldn't strand a selection above the cap,
    // so trim it down instead of leaving an inconsistent state.
    useEffect(() => {
        if (lapIds.length > maxLaps) {
            onChange({ trackId, refLapId, lapIds: lapIds.slice(0, maxLaps) });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxLaps]);

    const groups = useMemo(() => {
        const bySession = new Map<string, TrackLapListItemDto[]>();
        for (const item of items) {
            const arr = bySession.get(item.sessionId) ?? [];
            arr.push(item);
            bySession.set(item.sessionId, arr);
        }
        return [...bySession.values()]
            .map(laps => ({
                sessionId: laps[0].sessionId,
                startedAt: laps[0].sessionStartedAt,
                car: laps[0].car,
                kind: laps[0].sessionKind,
                laps: laps.sort((a, b) => a.lapNumber - b.lapNumber),
            }))
            .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    }, [items]);

    const toggleLap = (lapId: string) => {
        if (lapIds.includes(lapId)) {
            const nextLaps = lapIds.filter(id => id !== lapId);
            const nextRef = refLapId === lapId ? (nextLaps[0] ?? null) : refLapId;
            onChange({ trackId, refLapId: nextRef, lapIds: nextLaps });
            return;
        }
        if (lapIds.length >= maxLaps) return;
        const nextLaps = [...lapIds, lapId];
        onChange({ trackId, refLapId: refLapId ?? lapId, lapIds: nextLaps });
    };

    const makeReference = (lapId: string) => {
        if (lapIds.includes(lapId)) {
            onChange({ trackId, refLapId: lapId, lapIds });
            return;
        }
        if (lapIds.length >= maxLaps) return;
        onChange({ trackId, refLapId: lapId, lapIds: [...lapIds, lapId] });
    };

    const selectTrack = (id: string) => {
        onChange({ trackId: id || null, refLapId: null, lapIds: [] });
    };

    const handleReprocess = async (item: TrackLapListItemDto) => {
        setReprocessing(s => new Set(s).add(item.lapId));
        try {
            await reprocessLap(item.sessionId, item.lapNumber);
        } catch {
            // Swallow — the badge stays and the user can try again.
        } finally {
            setTimeout(() => {
                loadLaps();
                setReprocessing(s => {
                    const next = new Set(s);
                    next.delete(item.lapId);
                    return next;
                });
            }, 3000);
        }
    };

    if (!tracksLoading && tracks?.length === 0) {
        return (
            <div className="space-y-3 border border-zinc-800 bg-zinc-950 p-5 text-center">
                <p className="text-sm text-zinc-400">No tracks recorded yet.</p>
                <Link href="/simracing/download" className="inline-block text-xs font-bold text-primary hover:underline">
                    Get the Turn One link app
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col border border-zinc-800 bg-zinc-950">
            <div className="border-b border-zinc-800 p-3">
                <label className="mb-1.5 block text-[10px] uppercase tracking-[0.25em] text-zinc-500">Track</label>
                <select
                    value={trackId ?? ""}
                    onChange={e => selectTrack(e.target.value)}
                    className="h-9 w-full border border-zinc-800 bg-zinc-900 px-2 text-sm text-white focus:border-primary/40 focus:outline-none"
                >
                    <option value="">{tracksLoading ? "Loading…" : "Select a track…"}</option>
                    {tracks?.map(t => (
                        <option key={t.profile.id} value={t.profile.id}>
                            {t.profile.displayName} — {SIM_SOURCE_LABEL[t.profile.source as SimSource] ?? t.profile.source} ·{" "}
                            {t.lapCount} laps · {formatLapTime(t.bestLapMs)}
                        </option>
                    ))}
                </select>
            </div>

            {!trackId ? (
                <div className="p-5 text-center text-xs text-zinc-500">Pick a track to see its laps.</div>
            ) : (
                <>
                    <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-800 p-3">
                        {activeTrack?.cars.length ? (
                            <select
                                value={car}
                                onChange={e => setCar(e.target.value)}
                                className="h-7 border border-zinc-800 bg-zinc-900 px-1.5 text-[11px] text-white focus:border-primary/40 focus:outline-none"
                            >
                                <option value="">All cars</option>
                                {activeTrack.cars.map(c => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        ) : null}

                        <button
                            type="button"
                            aria-pressed={validOnly}
                            onClick={() => setValidOnly(v => !v)}
                            className={cn(
                                "h-7 border px-2 text-[11px] font-bold transition-colors",
                                validOnly
                                    ? "border-primary/50 bg-primary/15 text-primary"
                                    : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            Valid only
                        </button>

                        {isPro ? (
                            <button
                                type="button"
                                aria-pressed={includePublic}
                                onClick={() => setIncludePublic(v => !v)}
                                className={cn(
                                    "h-7 border px-2 text-[11px] font-bold transition-colors",
                                    includePublic
                                        ? "border-primary/50 bg-primary/15 text-primary"
                                        : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                Public laps
                            </button>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600">
                                Public laps <PlanBadge plan="PRO" />
                            </span>
                        )}
                    </div>

                    {!isPro ? (
                        <p className="border-b border-zinc-800 bg-primary/5 px-3 py-2 text-[11px] text-zinc-400">
                            BASIC plan: overlay up to {MAX_LAPS_BASIC} laps.{" "}
                            <Link href="/pricing" className="font-bold text-primary hover:underline">
                                Upgrade
                            </Link>{" "}
                            for up to {MAX_LAPS_PRO}.
                        </p>
                    ) : null}

                    <div className="max-h-[70vh] overflow-y-auto">
                        {lapsLoading ? (
                            <div className="p-5 text-center text-xs text-zinc-500">Loading laps…</div>
                        ) : groups.length === 0 ? (
                            <div className="p-5 text-center text-xs text-zinc-500">No laps match these filters.</div>
                        ) : (
                            groups.map(group => (
                                <div key={group.sessionId}>
                                    <div className="sticky top-0 border-b border-zinc-900 bg-zinc-950/95 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                                        {format(new Date(group.startedAt), "MMM d, yyyy")} · {group.car} · {group.kind}
                                    </div>
                                    {group.laps.map(item => {
                                        const selectedIndex = lapIds.indexOf(item.lapId);
                                        const selected = selectedIndex !== -1;
                                        const isRef = refLapId === item.lapId;
                                        const disabled = !item.hasTelemetry;
                                        const isReprocessing = reprocessing.has(item.lapId);

                                        return (
                                            <div
                                                key={item.lapId}
                                                role="button"
                                                tabIndex={disabled ? -1 : 0}
                                                aria-pressed={selected}
                                                onClick={() => !disabled && toggleLap(item.lapId)}
                                                onKeyDown={e => {
                                                    if (!disabled && (e.key === "Enter" || e.key === " ")) {
                                                        e.preventDefault();
                                                        toggleLap(item.lapId);
                                                    }
                                                }}
                                                className={cn(
                                                    "flex items-center gap-2 border-b border-zinc-900 px-3 py-2 text-xs transition-colors",
                                                    disabled
                                                        ? "cursor-not-allowed opacity-50"
                                                        : "cursor-pointer hover:bg-zinc-900/60",
                                                    selected && "bg-zinc-900"
                                                )}
                                            >
                                                <button
                                                    type="button"
                                                    aria-pressed={isRef}
                                                    aria-label={isRef ? "Reference lap" : "Make reference lap"}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        if (!disabled) makeReference(item.lapId);
                                                    }}
                                                    disabled={disabled}
                                                    className="shrink-0"
                                                >
                                                    <Star
                                                        className={cn(
                                                            "h-3.5 w-3.5",
                                                            isRef ? "fill-primary text-primary" : "text-zinc-700"
                                                        )}
                                                    />
                                                </button>

                                                <span
                                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                    style={selected ? { background: lapColor(selectedIndex) } : undefined}
                                                />

                                                <span className="w-9 shrink-0 font-mono text-zinc-400">L{item.lapNumber}</span>
                                                <span className="w-16 shrink-0 font-mono font-bold tabular-nums text-white">
                                                    {formatLapTime(item.lapTimeMs)}
                                                </span>

                                                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                                                    {item.sectorsMs.some(s => s != null) ? (
                                                        <span className="hidden gap-1 font-mono text-[10px] text-zinc-500 sm:flex">
                                                            {item.sectorsMs.map((s, i) => (
                                                                <span key={i}>{s != null ? (s / 1000).toFixed(3) : "—"}</span>
                                                            ))}
                                                        </span>
                                                    ) : null}
                                                    {item.kind !== "Flying" ? <Badge>{item.kind}</Badge> : null}
                                                    {item.quality === "legacy" ? <Badge>low-res</Badge> : null}
                                                    {!item.isMine ? (
                                                        <Badge>
                                                            <Globe2 className="mr-0.5 inline h-2.5 w-2.5" />
                                                            public
                                                        </Badge>
                                                    ) : null}
                                                    {disabled ? (
                                                        <span className="flex items-center gap-1">
                                                            <Badge>not processed</Badge>
                                                            <button
                                                                type="button"
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    handleReprocess(item);
                                                                }}
                                                                disabled={isReprocessing}
                                                                className="border border-zinc-700 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300 hover:border-primary/40 hover:text-primary disabled:opacity-50"
                                                            >
                                                                {isReprocessing ? (
                                                                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                                                ) : (
                                                                    "Process"
                                                                )}
                                                            </button>
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function Badge({ children }: { children: ReactNode }) {
    return (
        <span className="inline-flex items-center border border-zinc-700 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-400">
            {children}
        </span>
    );
}
