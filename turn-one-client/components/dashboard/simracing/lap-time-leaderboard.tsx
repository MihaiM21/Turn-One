"use client";

import { useEffect, useState } from "react";
import { useSimFilter } from "@/lib/simracing/sim-filter";
import { boardSimForFilter } from "@/lib/simracing/sims";
import Link from "next/link";
import { Timer } from "lucide-react";
import { SectionCard } from "@/components/dashboard/simracing/section-card";
import { formatLapTime } from "@/lib/simracing/api";
import {
    BOARD_SIMS,
    classesOf,
    getBoard,
    getCars,
    getMyVisibility,
    getTracks,
    setMyVisibility,
    type Board,
    type BoardPeriod,
    type BoardSim,
    type CatalogCar,
    type CatalogTrack,
    type LeaderboardVisibility,
} from "@/lib/simracing/leaderboards";

const RANK_STYLES = ["text-yellow-400 font-black", "text-foreground/85 font-black", "text-orange-500 font-black"];

const selectClass =
    "h-9 border border-border bg-card px-2 text-sm text-foreground/95 focus:border-primary focus:outline-none";

/**
 * Lap-time leaderboard (HCR-009): best valid lap per driver for a sim × track × car (or class),
 * all-time / month / week. Laps only rank when the sim marked them valid and they passed server checks.
 */
export function LapTimeLeaderboard({ signedIn }: { signedIn: boolean }) {
    const { filter: simFilter } = useSimFilter();
    const [sim, setSim] = useState<BoardSim>("acc");
    // Follow the dashboard sim filter; the local select still picks between F1 25 and F1 26.
    useEffect(() => {
        setSim(current => boardSimForFilter(simFilter, current));
    }, [simFilter]);
    const [tracks, setTracks] = useState<CatalogTrack[]>([]);
    const [cars, setCars] = useState<CatalogCar[]>([]);
    const [track, setTrack] = useState("");
    // "class:gt3" or a car slug
    const [carFilter, setCarFilter] = useState("");
    const [period, setPeriod] = useState<BoardPeriod>("all");
    const [board, setBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState(false);
    const [visibility, setVisibility] = useState<LeaderboardVisibility | null>(null);

    useEffect(() => {
        let cancelled = false;
        Promise.all([getTracks(sim), getCars(sim)])
            .then(([t, c]) => {
                if (cancelled) return;
                setTracks(t);
                setCars(c);
                setTrack(t[0]?.slug ?? "");
                const classes = classesOf(c);
                setCarFilter(classes.length ? `class:${classes[0]}` : c[0]?.slug ?? "");
            })
            .catch(() => {
                if (!cancelled) {
                    setTracks([]);
                    setCars([]);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [sim]);

    useEffect(() => {
        if (!track || !carFilter) {
            setBoard(null);
            return;
        }
        let cancelled = false;
        setLoading(true);
        const isClass = carFilter.startsWith("class:");
        getBoard({ sim, track, period, car: isClass ? null : carFilter, carClass: isClass ? carFilter.slice(6) : null })
            .then(b => !cancelled && setBoard(b))
            .catch(() => !cancelled && setBoard(null))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [sim, track, carFilter, period]);

    useEffect(() => {
        if (!signedIn) return;
        getMyVisibility()
            .then(v => setVisibility(v.mode))
            .catch(() => setVisibility(null));
    }, [signedIn]);

    const changeVisibility = async (mode: LeaderboardVisibility) => {
        const previous = visibility;
        setVisibility(mode);
        try {
            await setMyVisibility(mode);
        } catch {
            setVisibility(previous);
        }
    };

    const classes = classesOf(cars);

    return (
        <SectionCard
            label="Lap times"
            title={board ? `${board.trackName} · ${board.carName ?? board.classSlug?.toUpperCase() ?? ""}` : "Fastest laps"}
            icon={Timer}
            iconClassName="text-primary"
            actions={
                signedIn && visibility ? (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        Show me as
                        <select
                            className={selectClass}
                            value={visibility}
                            onChange={e => changeVisibility(e.target.value as LeaderboardVisibility)}
                            aria-label="How you appear on leaderboards"
                        >
                            <option value="public">my name</option>
                            <option value="anonymous">anonymous</option>
                            <option value="hidden">hidden</option>
                        </select>
                    </label>
                ) : null
            }
            flush
        >
            <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3">
                <select className={selectClass} value={sim} onChange={e => setSim(e.target.value as BoardSim)} aria-label="Sim">
                    {BOARD_SIMS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>
                <select className={selectClass} value={track} onChange={e => setTrack(e.target.value)} aria-label="Track">
                    {tracks.map(t => (
                        <option key={t.slug} value={t.slug}>{t.name}</option>
                    ))}
                </select>
                <select className={selectClass} value={carFilter} onChange={e => setCarFilter(e.target.value)} aria-label="Car or class">
                    {classes.length > 0 && (
                        <optgroup label="Class">
                            {classes.map(c => (
                                <option key={c} value={`class:${c}`}>All {c.toUpperCase()}</option>
                            ))}
                        </optgroup>
                    )}
                    <optgroup label="Car">
                        {cars.map(c => (
                            <option key={c.slug} value={c.slug}>{c.name}</option>
                        ))}
                    </optgroup>
                </select>
                <select className={selectClass} value={period} onChange={e => setPeriod(e.target.value as BoardPeriod)} aria-label="Period">
                    <option value="all">All time</option>
                    <option value="month">Last 30 days</option>
                    <option value="week">Last 7 days</option>
                </select>
            </div>

            {loading ? (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground">Loading…</p>
            ) : !board || board.entries.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No valid laps here yet. Drive one with Turn One Link and it shows up after processing.
                </p>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            <th className="px-5 py-2 font-normal">#</th>
                            <th className="px-2 py-2 font-normal">Driver</th>
                            <th className="px-2 py-2 text-right font-normal">Time</th>
                            <th className="hidden px-2 py-2 text-right font-normal sm:table-cell">Gap</th>
                            <th className="hidden px-5 py-2 text-right font-normal md:table-cell">Sectors</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...board.entries, ...(board.me && !board.entries.some(e => e.isViewer) ? [board.me] : [])].map(e => (
                            <tr
                                key={e.lapId}
                                className={`border-b border-border/60 ${e.isViewer ? "bg-primary/10" : ""}`}
                            >
                                <td className={`px-5 py-2 font-mono tabular-nums ${RANK_STYLES[e.rank - 1] ?? "text-muted-foreground"}`}>{e.rank}</td>
                                <td className="px-2 py-2 text-white">
                                    {e.driver.startsWith("Anonymous driver") ? (
                                        <span className="text-muted-foreground">{e.driver}</span>
                                    ) : (
                                        <Link href={`/simracing/drivers/${encodeURIComponent(e.driver)}`} className="hover:text-primary">
                                            {e.driver}
                                        </Link>
                                    )}
                                </td>
                                <td className="px-2 py-2 text-right font-mono tabular-nums text-white">{formatLapTime(e.lapTimeMs)}</td>
                                <td className="hidden px-2 py-2 text-right font-mono tabular-nums text-muted-foreground sm:table-cell">
                                    {e.gapMs > 0 ? `+${(e.gapMs / 1000).toFixed(3)}` : "—"}
                                </td>
                                <td className="hidden px-5 py-2 text-right font-mono text-xs tabular-nums text-muted-foreground md:table-cell">
                                    {e.sectorsMs.map(s => (s ? (s / 1000).toFixed(3) : "—")).join(" · ")}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </SectionCard>
    );
}
