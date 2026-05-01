"use client";

import { useEffect, useState } from "react";
import { simTelemetryService, ConnectionStatus, SimPhysics, SimGraphics, SimStatic } from "@/lib/simTelemetryService";
import { SimVitalsCard } from "@/components/dashboard/simracing/sim-vitals-card";
import { SimPedalsCard } from "@/components/dashboard/simracing/sim-pedals-card";
import { SimTyreCard } from "@/components/dashboard/simracing/sim-tyre-card";
import { SimBrakesCard } from "@/components/dashboard/simracing/sim-brakes-card";
import { SimLapPanel } from "@/components/dashboard/simracing/sim-lap-panel";
import { SimSessionStatusCard } from "@/components/dashboard/simracing/sim-session-status-card";
import { SimConnectionBanner } from "@/components/dashboard/simracing/sim-connection-banner";
import { Activity } from "lucide-react";

export default function SimracingLiveDashboard() {
    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    const [physics, setPhysics] = useState<SimPhysics | null>(null);
    const [graphics, setGraphics] = useState<SimGraphics | null>(null);
    const [staticInfo, setStaticInfo] = useState<SimStatic | null>(null);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        const handleStatus = (s: ConnectionStatus) => setStatus(s);
        const handlePhysics = (d: SimPhysics) => setPhysics(d);
        const handleGraphics = (d: SimGraphics) => {
            setGraphics(d);
            setIsActive(d.status !== "AC_OFF");
        };
        const handleStatic = (d: SimStatic) => setStaticInfo(d);

        simTelemetryService.onStatusChange(handleStatus);
        simTelemetryService.onPhysics(handlePhysics);
        simTelemetryService.onGraphics(handleGraphics);
        simTelemetryService.onStatic(handleStatic);
        simTelemetryService.connect();

        return () => {
            simTelemetryService.offStatusChange(handleStatus);
            simTelemetryService.offPhysics(handlePhysics);
            simTelemetryService.offGraphics(handleGraphics);
            simTelemetryService.offStatic(handleStatic);
            simTelemetryService.disconnect();
        };
    }, []);

    const statusDot =
        status === "disconnected"
            ? { color: "bg-red-500", label: "Disconnected" }
            : status === "connecting"
            ? { color: "bg-yellow-400 animate-pulse", label: "Connecting" }
            : isActive
            ? { color: "bg-green-500", label: "Live" }
            : { color: "bg-blue-400 animate-pulse", label: "Idle" };

    return (
        <div className="relative w-full min-h-screen p-6 bg-gradient-to-br from-black via-red-950/20 to-black font-sans text-white">
            <SimConnectionBanner status={status} isActive={isActive} />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Activity className="w-5 h-5 text-primary" />
                            <h1 className="text-3xl font-black italic tracking-tight">LIVE COCKPIT</h1>
                        </div>
                        <p className="text-muted-foreground text-sm ml-8">
                            Driver:{" "}
                            <span className="text-white font-semibold">{staticInfo?.playerName || "---"}</span>
                        </p>
                    </div>
                    <div className="text-right space-y-2">
                        <div className="flex items-center justify-end gap-2">
                            <div className={`w-2 h-2 rounded-full ${statusDot.color}`} />
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                {statusDot.label}
                            </span>
                        </div>
                        <div className="inline-block px-3 py-1 bg-primary text-primary-foreground font-bold tracking-widest text-xs rounded-md shadow-[0_0_15px_rgba(220,38,38,0.4)] uppercase">
                            Extreme Live
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {staticInfo?.carModel || "---"} · {staticInfo?.track || "---"}
                        </p>
                    </div>
                </div>

                {/* Telemetry Grid */}
                <div className="space-y-6">
                    {/* Row 1: Vitals + Pedals */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="col-span-12 md:col-span-8">
                            <SimVitalsCard physics={physics} maxRpm={staticInfo?.maxRpm || 8500} />
                        </div>
                        <div className="col-span-12 md:col-span-4">
                            <SimPedalsCard physics={physics} />
                        </div>
                    </div>

                    <SectionDivider label="Tyres & Brakes" />

                    {/* Row 2: Tyres + Brakes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SimTyreCard physics={physics} />
                        <SimBrakesCard physics={physics} />
                    </div>

                    <SectionDivider label="Lap Info" />

                    {/* Row 3: Laps + Session */}
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
