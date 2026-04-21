"use client";

import { ConnectionStatus } from "@/lib/simTelemetryService";

interface SimConnectionBannerProps {
    status: ConnectionStatus;
    isActive: boolean;
}

export function SimConnectionBanner({ status, isActive }: SimConnectionBannerProps) {
    if (status === "connected" && isActive) return null;

    let bannerColor = "bg-yellow-500/10 border-yellow-500/20 text-yellow-200 backdrop-blur-md shadow-xl";
    let title = "Connecting to Telemetry Server...";
    let message = "Please wait.";

    if (status === "disconnected") {
        bannerColor = "bg-primary/10 border-primary/20 text-primary-foreground backdrop-blur-md shadow-xl shadow-primary/20";
        title = "Turn One Link Disconnected";
        message = "Start the Turn One Link desktop app and connect to your account.";
    } else if (status === "connected" && !isActive) {
        bannerColor = "bg-blue-500/10 border-blue-500/20 text-blue-200 backdrop-blur-md shadow-xl";
        title = "Waiting for Data...";
        message = "Turn One Link is connected. Fire up ACC and get on track!";
    }

    return (
        <div className={`absolute inset-0 z-50 backdrop-blur-sm bg-black/80 flex items-center justify-center rounded-xl m-6`}>
            <div className={`p-8 rounded-2xl border-2 max-w-lg text-center ${bannerColor}`}>
                <h2 className="text-2xl font-black mb-2">{title}</h2>
                <p className="opacity-80 mb-6">{message}</p>
                {status === "disconnected" && (
                    <button className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold py-2 px-6 rounded-lg transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                        Download Turn One Link
                    </button>
                )}
            </div>
        </div>
    );
}
