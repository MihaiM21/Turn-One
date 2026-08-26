"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Flag } from "lucide-react";
import {
    simTelemetryService,
    ConnectionStatus,
    SimPhysics,
    SimGraphics,
    SimStatic,
} from "@/lib/simTelemetryService";
import { PageHeader } from "@/components/dashboard/page-header";
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
    const [viewerCount, setViewerCount] = useState<number | null>(null);

    useEffect(() => {
        if (!sessionId) return;

        const handleStatus = (s: ConnectionStatus) => {
            setStatus(s);
            if (s === "connected") simTelemetryService.getViewerCount(sessionId).then(setViewerCount);
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
        <main className="relative w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <SimConnectionBanner status={status} isActive={isActive} />

            <Link
                href="/simracing/spectate"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:text-primary"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                All live streams
            </Link>

            <PageHeader
                label="Spectating"
                title={staticInfo?.playerName || "Live session"}
                description={
                    staticInfo
                        ? `${staticInfo.carModel || "—"} · ${staticInfo.track || "—"} · read-only cockpit`
                        : "Connecting to the live feed…"
                }
                stats={[
                    { icon: Flag, label: "Position", value: graphics?.position ? `P${graphics.position}` : "—" },
                    { icon: Users, label: "Watching", value: viewerCount ?? "—" },
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
