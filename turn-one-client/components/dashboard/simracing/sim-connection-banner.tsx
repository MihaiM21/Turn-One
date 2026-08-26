"use client";

import Link from "next/link";
import { ConnectionStatus } from "@/lib/simTelemetryService";
import { WifiOff, Wifi, MonitorDot, Download } from "lucide-react";
import { ReactNode } from "react";

interface SimConnectionBannerProps {
    status: ConnectionStatus;
    isActive: boolean;
}

interface BannerConfig {
    icon: ReactNode;
    border: string;
    bg: string;
    title: string;
    message: string;
    showDownload: boolean;
}

export function SimConnectionBanner({ status, isActive }: SimConnectionBannerProps) {
    if (status === "connected" && isActive) return null;

    const configs: Record<string, BannerConfig> = {
        disconnected: {
            icon: <WifiOff className="w-10 h-10 text-primary" />,
            border: "border-primary/30",
            bg: "bg-primary/10",
            title: "Turn One Link Disconnected",
            message: "Start the Turn One Link desktop app and connect to your account to begin streaming telemetry.",
            showDownload: true,
        },
        connecting: {
            icon: <Wifi className="w-10 h-10 text-yellow-400 animate-pulse" />,
            border: "border-yellow-500/30",
            bg: "bg-yellow-500/10",
            title: "Connecting to Telemetry Server...",
            message: "Establishing connection. Please wait.",
            showDownload: false,
        },
        connected: {
            icon: <MonitorDot className="w-10 h-10 text-blue-400 animate-pulse" />,
            border: "border-blue-500/30",
            bg: "bg-blue-500/10",
            title: "Waiting for Data...",
            message: "Turn One Link is connected. Launch ACC and get on track!",
            showDownload: false,
        },
    };

    const cfg = configs[status] ?? configs.connecting;

    return (
        <div
            className="absolute inset-0 z-50 m-4 flex items-center justify-center"
            style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.85)" }}
        >
            <div className={`w-full max-w-md border ${cfg.border} ${cfg.bg} px-8 py-10 text-center`}>
                <div className="mb-4 flex justify-center">{cfg.icon}</div>
                <h2 className="mb-2 text-xl font-bold tracking-tight text-white">{cfg.title}</h2>
                <p className="text-sm leading-relaxed text-zinc-400">{cfg.message}</p>
                {cfg.showDownload && (
                    <Link
                        href="/simracing/download"
                        className="mt-6 inline-flex h-10 items-center gap-2 bg-primary px-6 text-xs font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <Download className="h-4 w-4" />
                        Get Turn One Link
                    </Link>
                )}
            </div>
        </div>
    );
}
