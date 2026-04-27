"use client";

import { ConnectionStatus } from "@/lib/simTelemetryService";
import { WifiOff, Wifi, MonitorDot } from "lucide-react";
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
            className="absolute inset-0 z-50 flex items-center justify-center rounded-xl m-4"
            style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.85)" }}
        >
            <div className={`p-8 rounded-2xl border-2 max-w-md w-full text-center ${cfg.border} ${cfg.bg} shadow-2xl`}>
                <div className="flex justify-center mb-4">{cfg.icon}</div>
                <h2 className="text-2xl font-black mb-2 text-white">{cfg.title}</h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">{cfg.message}</p>
                {cfg.showDownload && (
                    <button className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold py-2.5 px-8 rounded-lg transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                        Download Turn One Link
                    </button>
                )}
            </div>
        </div>
    );
}
