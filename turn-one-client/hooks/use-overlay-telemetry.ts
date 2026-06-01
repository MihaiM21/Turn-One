"use client";

import { useEffect, useState } from "react";
import {
    simTelemetryService,
    type ConnectionStatus,
    type SimPhysics,
    type SimGraphics,
    type SimStatic,
} from "@/lib/simTelemetryService";

interface ExchangeResponse {
    jwt: string;
    ownerUserId: string;
    ownerUsername?: string;
    expiresAt: string;
}

function apiBase() {
    return (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5271/api").replace(/\/api\/?$/, "");
}

export function useOverlayTelemetry(overlayToken: string | undefined) {
    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    const [physics, setPhysics] = useState<SimPhysics | null>(null);
    const [graphics, setGraphics] = useState<SimGraphics | null>(null);
    const [staticInfo, setStaticInfo] = useState<SimStatic | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [ownerUsername, setOwnerUsername] = useState<string | null>(null);

    useEffect(() => {
        if (!overlayToken) return;
        let cancelled = false;

        const onStatus = (s: ConnectionStatus) => setStatus(s);
        const onPhysics = (d: SimPhysics) => setPhysics(d);
        const onGraphics = (d: SimGraphics) => setGraphics(d);
        const onStatic = (d: SimStatic) => setStaticInfo(d);

        simTelemetryService.onStatusChange(onStatus);
        simTelemetryService.onPhysics(onPhysics);
        simTelemetryService.onGraphics(onGraphics);
        simTelemetryService.onStatic(onStatic);

        (async () => {
            try {
                const res = await fetch(`${apiBase()}/api/simracing/overlay/exchange`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: overlayToken }),
                });
                if (!res.ok) {
                    setError(res.status === 404 ? "Overlay token is invalid or revoked." : "Failed to authenticate overlay.");
                    return;
                }
                const data: ExchangeResponse = await res.json();
                if (cancelled) return;
                setOwnerUsername(data.ownerUsername ?? null);
                await simTelemetryService.connect(undefined, data.jwt);
                await simTelemetryService.subscribeOwnerById();
            } catch {
                if (!cancelled) setError("Network error while connecting overlay.");
            }
        })();

        return () => {
            cancelled = true;
            simTelemetryService.offStatusChange(onStatus);
            simTelemetryService.offPhysics(onPhysics);
            simTelemetryService.offGraphics(onGraphics);
            simTelemetryService.offStatic(onStatic);
            simTelemetryService.disconnect();
        };
    }, [overlayToken]);

    return { status, physics, graphics, staticInfo, error, ownerUsername };
}
