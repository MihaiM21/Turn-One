"use client";

import { useEffect, useState } from "react";
import { compareCorners, getLapOverlay, SimApiError } from "@/lib/simracing/api";
import type { CornerCompareDto, LapOverlayDto } from "@/lib/simracing/protocol";

export interface UseAnalysisDataResult {
    overlay: LapOverlayDto | null;
    corners: CornerCompareDto | null;
    loading: boolean;
    error: string | null;
    isPlanGated: boolean;
}

const DEBOUNCE_MS = 250;

/**
 * Fetches the lap overlay + corner comparison for the analysis workspace.
 *
 * `lapIds` must have the reference lap first — both `getLapOverlay`'s array order and
 * `compareCorners`'s implicit "delta against the first lap" behaviour depend on it, and this hook
 * doesn't reorder for callers.
 *
 * Debounced by 250ms so rapid lap-picker clicks (toggling several laps in quick succession) don't
 * fire a request per click; only the settled selection is fetched.
 */
export function useAnalysisData(
    trackId: string | null,
    refLapId: string | null,
    lapIds: string[]
): UseAnalysisDataResult {
    const [overlay, setOverlay] = useState<LapOverlayDto | null>(null);
    const [corners, setCorners] = useState<CornerCompareDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPlanGated, setIsPlanGated] = useState(false);

    // Stable key so the effect doesn't refire on array identity alone.
    const key = lapIds.join(",");

    useEffect(() => {
        if (!refLapId || lapIds.length < 2) {
            setOverlay(null);
            setCorners(null);
            setError(null);
            setIsPlanGated(false);
            setLoading(false);
            return;
        }

        let cancelled = false;
        const timer = setTimeout(() => {
            setLoading(true);
            setError(null);
            setIsPlanGated(false);

            const step = lapIds.length > 4 ? 4 : 2;

            Promise.allSettled([getLapOverlay(lapIds, refLapId, { step }), compareCorners(lapIds)]).then(
                ([overlayRes, cornersRes]) => {
                    if (cancelled) return;

                    if (overlayRes.status === "fulfilled") {
                        setOverlay(overlayRes.value);
                    } else {
                        setOverlay(null);
                        const err = overlayRes.reason;
                        if (err instanceof SimApiError) {
                            if (err.isPlanGated) setIsPlanGated(true);
                            else if (err.status === 400)
                                setError("These laps aren't on the same track and can't be overlaid.");
                            else setError("Couldn't load the lap overlay.");
                        } else {
                            setError("Couldn't load the lap overlay.");
                        }
                    }

                    if (cornersRes.status === "fulfilled") {
                        setCorners(cornersRes.value);
                    } else {
                        // The corner comparison is PRO-only and the page already gates that panel;
                        // a 403 here must not read as "the overlay is gated".
                        setCorners(null);
                    }

                    setLoading(false);
                }
            );
        }, DEBOUNCE_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
        // `trackId` isn't used directly, but a track switch changes `lapIds`/`refLapId` anyway;
        // keeping it in deps guards against a stale fetch racing a track change with the same ids.
    }, [trackId, refLapId, key, lapIds]);

    return { overlay, corners, loading, error, isPlanGated };
}
