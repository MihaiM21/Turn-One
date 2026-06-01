"use client";

import { useParams, useSearchParams } from "next/navigation";
import { SimVitalsCard } from "@/components/dashboard/simracing/sim-vitals-card";
import { SimPedalsCard } from "@/components/dashboard/simracing/sim-pedals-card";
import { useOverlayTelemetry } from "@/hooks/use-overlay-telemetry";

export default function CockpitOverlayPage() {
    const params = useParams();
    const search = useSearchParams();
    const token = params.token as string;
    const compact = search.get("compact") === "1";
    const accent = search.get("accent");

    const { physics, staticInfo, error, status } = useOverlayTelemetry(token);

    if (error) {
        return <OverlayError message={error} />;
    }

    if (status !== "connected") {
        return <OverlayConnecting />;
    }

    return (
        <div
            className={`p-4 ${compact ? "max-w-md" : "max-w-2xl"}`}
            style={accent ? { ["--overlay-accent" as never]: accent } : undefined}
        >
            <div className="grid grid-cols-12 gap-3">
                <div className="col-span-8">
                    <SimVitalsCard physics={physics} maxRpm={staticInfo?.maxRpm || 8500} />
                </div>
                <div className="col-span-4">
                    <SimPedalsCard physics={physics} />
                </div>
            </div>
        </div>
    );
}

function OverlayConnecting() {
    return (
        <div className="p-3">
            <div className="inline-block px-3 py-1 rounded-md bg-black/60 border border-primary/40 text-primary text-xs font-bold tracking-widest uppercase animate-pulse">
                Connecting...
            </div>
        </div>
    );
}

function OverlayError({ message }: { message: string }) {
    return (
        <div className="p-3">
            <div className="inline-block px-3 py-1 rounded-md bg-black/60 border border-red-500/40 text-red-300 text-xs font-bold">
                {message}
            </div>
        </div>
    );
}
