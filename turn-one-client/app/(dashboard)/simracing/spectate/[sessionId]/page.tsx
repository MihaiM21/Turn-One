"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { simTelemetryService, ConnectionStatus, SimPhysics, SimGraphics, SimStatic } from "@/lib/simTelemetryService";
import { SimVitalsCard } from "@/components/dashboard/simracing/sim-vitals-card";
import { SimPedalsCard } from "@/components/dashboard/simracing/sim-pedals-card";
import { SimTyreCard } from "@/components/dashboard/simracing/sim-tyre-card";
import { SimBrakesCard } from "@/components/dashboard/simracing/sim-brakes-card";
import { SimLapPanel } from "@/components/dashboard/simracing/sim-lap-panel";
import { SimSessionStatusCard } from "@/components/dashboard/simracing/sim-session-status-card";
import { SimConnectionBanner } from "@/components/dashboard/simracing/sim-connection-banner";

export default function SpectateSessionDashboard() {
    const params = useParams();
    const sessionId = params.sessionId as string;

    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    const [physics, setPhysics] = useState<SimPhysics | null>(null);
    const [graphics, setGraphics] = useState<SimGraphics | null>(null);
    const [staticInfo, setStaticInfo] = useState<SimStatic | null>(null);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (!sessionId) return;

        const handleStatus = (s: ConnectionStatus) => setStatus(s);
        const handlePhysics = (d: SimPhysics) => setPhysics(d);
        const handleGraphics = (d: SimGraphics) => {
            setGraphics(d);
            setIsActive(d.status !== "AC_OFF");
        };
        const handleStatic = (d: SimStatic) => setStaticInfo(d);
        const handleSessionEnd = (endSessionId: string) => {
            if (endSessionId === sessionId) setIsActive(false);
        };

        simTelemetryService.onStatusChange(handleStatus);
        simTelemetryService.onPhysics(handlePhysics);
        simTelemetryService.onGraphics(handleGraphics);
        simTelemetryService.onStatic(handleStatic);
        simTelemetryService.connect(sessionId);

        return () => {
            simTelemetryService.offStatusChange(handleStatus);
            simTelemetryService.offPhysics(handlePhysics);
            simTelemetryService.offGraphics(handleGraphics);
            simTelemetryService.offStatic(handleStatic);
            simTelemetryService.disconnect(sessionId);
        };
    }, [sessionId]);

    return (
        <div className="relative w-full min-h-screen p-6 bg-gradient-to-br from-black via-red-950/20 to-black font-sans text-white">
            <SimConnectionBanner status={status} isActive={isActive} />

            <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tight text-white">
                            SPECTATING: <span className="text-primary">{staticInfo?.playerName || "---"}</span>
                        </h1>
                    </div>
                    <div className="text-right">
                        <div className="inline-block px-3 py-1 bg-black/60 border border-primary/40 text-primary font-bold tracking-widest text-xs rounded-md shadow-[0_0_15px_rgba(220,38,38,0.2)] uppercase">
                            Spectator View
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">{staticInfo?.carModel || "---"} @ {staticInfo?.track || "---"}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-8">
                    <SimVitalsCard physics={physics} maxRpm={staticInfo?.maxRpm || 8500} />
                </div>
                <div className="col-span-12 md:col-span-4 h-full min-h-[160px]">
                    <SimPedalsCard physics={physics} />
                </div>

                <div className="col-span-12 md:col-span-6">
                    <SimTyreCard physics={physics} />
                </div>
                <div className="col-span-12 md:col-span-6">
                    <SimBrakesCard physics={physics} />
                </div>

                <div className="col-span-12 md:col-span-6 h-full">
                    <SimLapPanel graphics={graphics} />
                </div>
                <div className="col-span-12 md:col-span-6 h-full">
                    <SimSessionStatusCard graphics={graphics} />
                </div>
                </div>
            </div>
        </div>
    );
}
