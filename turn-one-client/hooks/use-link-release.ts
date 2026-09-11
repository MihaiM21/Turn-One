"use client";

import { useEffect, useState } from "react";
import { getLinkRelease, type LinkReleaseInfo } from "@/lib/simracing/api";

/**
 * Turn One Link release metadata. Until an installer is published the backend reports
 * `available: false` and the download surfaces render a "coming soon" state, so the page
 * never shows a dead download button.
 */
export function useLinkRelease() {
    const [release, setRelease] = useState<LinkReleaseInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getLinkRelease()
            .then(data => {
                if (!cancelled) setRelease(data);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return { release, loading, error, available: !!release?.available };
}

/**
 * Turn One Link is Windows-only (it reads ACC's Windows shared memory), so non-Windows
 * visitors get told that up front instead of downloading something that cannot run.
 */
export function useIsWindows() {
    const [isWindows, setIsWindows] = useState<boolean | null>(null);

    useEffect(() => {
        if (typeof navigator === "undefined") return;
        const ua = navigator.userAgent;
        setIsWindows(/Windows|Win32|Win64|WOW64/i.test(ua));
    }, []);

    return isWindows;
}
