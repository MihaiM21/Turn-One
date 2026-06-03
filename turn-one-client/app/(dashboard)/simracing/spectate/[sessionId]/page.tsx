"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    simTelemetryService,
    ConnectionStatus,
    SimPhysics,
    SimGraphics,
    SimStatic,
} from "@/lib/simTelemetryService";
import { SimVitalsCard } from "@/components/dashboard/simracing/sim-vitals-card";
import { SimPedalsCard } from "@/components/dashboard/simracing/sim-pedals-card";
import { SimTyreCard } from "@/components/dashboard/simracing/sim-tyre-card";
import { SimBrakesCard } from "@/components/dashboard/simracing/sim-brakes-card";
import { SimLapPanel } from "@/components/dashboard/simracing/sim-lap-panel";
import { SimSessionStatusCard } from "@/components/dashboard/simracing/sim-session-status-card";
import { SimConnectionBanner } from "@/components/dashboard/simracing/sim-connection-banner";
import { Eye, Users } from "lucide-react";

export default function SpectateSessionDashboard() {
    const params = useParams();
    const sessionId = params.sessionId as string;

    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    const [physics, setPhysics] = useState<SimPhysics | null>(null);
    const [graphics, setGraphics] = useState<SimGraphics | null>(null);
    const [staticInfo, setStaticInfo] = useState<SimStatic | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [viewerCount, setViewerCount] = useState<number | null>(null);

    useEffect(() => {
        if (!sessionId) return;

        const handleStatus = (s: ConnectionStatus) => {
            setStatus(s);
            if (s === "connected") {
                simTelemetryService.getViewerCount(sessionId).then(setViewerCount);
            }
        };
        const handlePhysics = (d: SimPhysics) => setPhysics(d);
        const handleGraphics = (d: SimGraphics) => {
            setGraphics(d);
            setIsActive(d.status !== "AC_OFF");
        };
        const handleStatic = (d: SimStatic) => setStaticInfo(d);
        const handleViewerCount = (incomingSessionId: string, count: number) => {
            if (incomingSessionId === sessionId) setViewerCount(count);
        };

        simTelemetryService.onStatusChange(handleStatus);
        simTelemetryService.onPhysics(handlePhysics);
        simTelemetryService.onGraphics(handleGraphics);
        simTelemetryService.onStatic(handleStatic);
        simTelemetryService.onViewerCount(handleViewerCount);
        simTelemetryService.connect(sessionId);

        return () => {
            simTelemetryService.offStatusChange(handleStatus);
            simTelemetryService.offPhysics(handlePhysics);
            simTelemetryService.offGraphics(handleGraphics);
            simTelemetryService.offStatic(handleStatic);
            simTelemetryService.offViewerCount(handleViewerCount);
            simTelemetryService.disconnect(sessionId);
        };
    }, [sessionId]);

    return (
        <div className="relative w-full min-h-screen p-6 bg-gradient-to-br from-black via-red-950/20 to-black font-sans text-white">
            <SimConnectionBanner status={status} isActive={isActive} />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Eye className="w-5 h-5 text-primary" />
                            <h1 className="text-3xl font-black italic tracking-tight">
                                SPECTATING:{" "}
                                <span className="text-primary">{staticInfo?.playerName || "---"}</span>
                            </h1>
                        </div>
                        <p className="text-muted-foreground text-sm ml-8">Read-only cockpit view</p>
                    </div>
                    <div className="text-right space-y-2">
                        <div className="flex items-center justify-end gap-2">
                            <div className="inline-block px-3 py-1 bg-black/60 border border-primary/40 text-primary font-bold tracking-widest text-xs rounded-md shadow-[0_0_15px_rgba(220,38,38,0.2)] uppercase">
                                Spectator View
                            </div>
                            {viewerCount != null ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/60 border border-white/15 text-white text-xs font-bold rounded-md">
                                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                    {viewerCount}
                                </div>
                            ) : null}
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {staticInfo?.carModel || "---"} · {staticInfo?.track || "---"}
                        </p>
                    </div>
                </div>

                {/* Telemetry Grid */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="col-span-12 md:col-span-8">
                            <SimVitalsCard physics={physics} maxRpm={staticInfo?.maxRpm || 8500} />
                        </div>
                        <div className="col-span-12 md:col-span-4">
                            <SimPedalsCard physics={physics} />
                        </div>
                    </div>

                    <SectionDivider label="Tyres & Brakes" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SimTyreCard physics={physics} />
                        <SimBrakesCard physics={physics} />
                    </div>

                    <SectionDivider label="Lap Info" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SimLapPanel graphics={graphics} />
                        <SimSessionStatusCard graphics={graphics} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function SectionDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
            <div className="flex-1 h-px bg-primary/10" />
            <span>{label}</span>
            <div className="flex-1 h-px bg-primary/10" />
        </div>
    );
}
