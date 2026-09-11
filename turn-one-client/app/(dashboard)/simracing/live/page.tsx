"use client";

import { useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";
import { simTelemetryService, ConnectionStatus, SimPhysics, SimGraphics, SimStatic } from "@/lib/simTelemetryService";
import { PageHeader } from "@/components/dashboard/page-header";
import { SimVitalsCard } from "@/components/dashboard/simracing/sim-vitals-card";
import { SimPedalsCard } from "@/components/dashboard/simracing/sim-pedals-card";
import { SimTyreCard } from "@/components/dashboard/simracing/sim-tyre-card";
import { SimBrakesCard } from "@/components/dashboard/simracing/sim-brakes-card";
import { SimLapPanel } from "@/components/dashboard/simracing/sim-lap-panel";
import { SimSessionStatusCard } from "@/components/dashboard/simracing/sim-session-status-card";
import { SimConnectionBanner } from "@/components/dashboard/simracing/sim-connection-banner";
import { LiveInputTrace } from "@/components/dashboard/simracing/live-input-trace";
import { usePageMaintenance } from "@/hooks/usePageMaintenance";
import { MaintenanceScreen } from "@/components/dashboard/maintenance-screen";

export default function SimracingLiveDashboard() {
    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    const [physics, setPhysics] = useState<SimPhysics | null>(null);
    const [graphics, setGraphics] = useState<SimGraphics | null>(null);
    const [staticInfo, setStaticInfo] = useState<SimStatic | null>(null);
    const [isActive, setIsActive] = useState(false);

    // Latest physics frame, sampled on a timer by the trace rather than on every
    // frame — ACC pushes ~100 Hz and re-rendering a chart that often is wasteful.
    const latestPhysics = useRef<SimPhysics | null>(null);

    const { isDisabled, message, loading: maintenanceLoading } = usePageMaintenance("simracing");

    useEffect(() => {
        const handleStatus = (s: ConnectionStatus) => setStatus(s);
        const handlePhysics = (d: SimPhysics) => {
            latestPhysics.current = d;
            setPhysics(d);
        };
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

    if (maintenanceLoading) return null;
    if (isDisabled) return <MaintenanceScreen slug="simracing" message={message} />;

    const statusLabel =
        status === "disconnected"
            ? { color: "bg-red-500", label: "Disconnected" }
            : status === "connecting"
              ? { color: "bg-yellow-400 animate-pulse", label: "Connecting" }
              : isActive
                ? { color: "bg-green-500", label: "Live" }
                : { color: "bg-blue-400 animate-pulse", label: "Idle" };

    return (
        <main className="relative w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <SimConnectionBanner status={status} isActive={isActive} />

            <PageHeader
                label="Sim racing"
                title="Live cockpit"
                description={
                    staticInfo
                        ? `${staticInfo.playerName || "Driver"} · ${staticInfo.carModel || "—"} · ${staticInfo.track || "—"}`
                        : "Waiting for Turn One Link…"
                }
                actions={
                    <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-3 py-1.5">
                        <span className={`h-2 w-2 rounded-full ${statusLabel.color}`} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                            {statusLabel.label}
                        </span>
                    </div>
                }
                stats={[
                    { icon: Activity, label: "Position", value: graphics?.position ? `P${graphics.position}` : "—" },
                ]}
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8">
                    <SimVitalsCard physics={physics} maxRpm={staticInfo?.maxRpm || 8500} />
                </div>
                <div className="lg:col-span-4">
                    <SimPedalsCard physics={physics} />
                </div>
            </div>

            <LiveInputTrace latest={latestPhysics} isActive={isActive} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SimLapPanel graphics={graphics} />
                <SimSessionStatusCard graphics={graphics} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SimTyreCard physics={physics} />
                <SimBrakesCard physics={physics} />
            </div>
        </main>
    );
}
