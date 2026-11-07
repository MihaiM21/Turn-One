/**
 * Lap-time leaderboards and the track/car catalog (HCR-008 / HCR-009).
 */

import { request } from "@/lib/simracing/api";

export type BoardSim = "acc" | "f1_25" | "f1_26" | "iracing" | "ac";
export type BoardPeriod = "all" | "month" | "week";
export type LeaderboardVisibility = "public" | "anonymous" | "hidden";

export const BOARD_SIMS: { value: BoardSim; label: string }[] = [
    { value: "acc", label: "ACC" },
    { value: "f1_25", label: "F1 25" },
    { value: "f1_26", label: "F1 26" },
    { value: "iracing", label: "iRacing" },
];

export interface CatalogTrack {
    slug: string;
    name: string;
    country: string | null;
    lengthM: number | null;
    curated: boolean;
}

export interface CatalogCar {
    slug: string;
    name: string;
    class: string | null;
}

export interface BoardEntry {
    rank: number;
    driver: string;
    avatarUrl: string | null;
    isViewer: boolean;
    lapId: string;
    lapTimeMs: number;
    sectorsMs: (number | null)[];
    gapMs: number;
    setAt: string;
}

export interface Board {
    trackSlug: string;
    trackName: string;
    carSlug: string | null;
    carName: string | null;
    classSlug: string | null;
    total: number;
    entries: BoardEntry[];
    me: BoardEntry | null;
}

export interface PersonalBest {
    source: BoardSim;
    trackSlug: string;
    trackName: string;
    carSlug: string | null;
    carName: string | null;
    lapId: string;
    lapTimeMs: number;
    rank: number;
    total: number;
}

export const getTracks = (sim: BoardSim) =>
    request<CatalogTrack[]>(`/api/simracing/catalog/tracks?source=${sim}`);

export const getCars = (sim: BoardSim) =>
    request<CatalogCar[]>(`/api/simracing/catalog/cars?source=${sim}`);

export function boardQuery(opts: { sim: BoardSim; track: string; car?: string | null; carClass?: string | null; period: BoardPeriod; page?: number }) {
    const params = new URLSearchParams({ source: opts.sim, track: opts.track, period: opts.period });
    if (opts.car) params.set("car", opts.car);
    else if (opts.carClass) params.set("class", opts.carClass);
    if (opts.page && opts.page > 1) params.set("page", String(opts.page));
    return params.toString();
}

export const getBoard = (opts: Parameters<typeof boardQuery>[0]) =>
    request<Board>(`/api/simracing/leaderboards?${boardQuery(opts)}`);

export const getPersonalBests = (username: string) =>
    request<PersonalBest[]>(`/api/simracing/drivers/${encodeURIComponent(username)}/pbs`);

export const getMyVisibility = () =>
    request<{ mode: LeaderboardVisibility }>("/api/simracing/me/leaderboard-visibility");

export const setMyVisibility = (mode: LeaderboardVisibility) =>
    request<void>("/api/simracing/me/leaderboard-visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
    });

/** Classes that actually appear among a sim's cars, for the class filter. */
export function classesOf(cars: CatalogCar[]): string[] {
    return [...new Set(cars.map(c => c.class).filter((c): c is string => !!c))].sort();
}

// ---------------------------------------------------------------------------
// Lap eligibility (session page) and AI dataset consent (HCR-015)
// ---------------------------------------------------------------------------

export interface LapEligibility {
    lapNumber: number;
    lapId: string;
    eligible: boolean;
    reasons: string[];
}

export const getSessionValidations = (sessionId: string) =>
    request<LapEligibility[]>(`/api/simracing/sessions/${encodeURIComponent(sessionId)}/validations`);

const REASONS: Record<string, string> = {
    not_processed: "not processed yet",
    sim_invalid: "invalid in the game (track limits / cut)",
    not_flying_lap: "not a flying lap (out-lap, in-lap or pit)",
    no_lap_time: "no lap time",
    sector_sum_mismatch: "sectors don't add up to the lap time",
    distance_short: "lap shorter than the track",
    distance_long: "lap longer than the track",
    speed_implausible: "implausible top speed",
    unknown_track: "unknown track",
    unknown_car: "unknown car",
    excluded_by_admin: "removed by a moderator",
};

/** Human wording for a validator reason code; unknown codes are shown as-is. */
export const reasonLabel = (code: string) => REASONS[code] ?? code.replace(/_/g, " ");

export interface AiConsent {
    granted: boolean;
    version: string;
    grantedAt: string | null;
}

export const getAiConsent = () => request<AiConsent>("/api/me/ai-consent");

export const setAiConsent = (granted: boolean, version: string) =>
    request<void>("/api/me/ai-consent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ granted, version }),
    });
