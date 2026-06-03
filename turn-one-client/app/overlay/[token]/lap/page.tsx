"use client";

import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useOverlayTelemetry } from "@/hooks/use-overlay-telemetry";

export default function LapOverlayPage() {
    const params = useParams();
    const token = params.token as string;
    const { graphics, error, status } = useOverlayTelemetry(token);

    if (error) {
        return <div className="p-3 text-red-300 text-xs font-bold">{error}</div>;
    }

    if (status !== "connected") {
        return (
            <div className="p-3 inline-block px-3 py-1 rounded-md bg-black/60 border border-primary/40 text-primary text-xs font-bold tracking-widest uppercase animate-pulse">
                Connecting...
            </div>
        );
    }

    const delta = graphics?.deltaLapTime ?? "—";
    const last = graphics?.lastTime ?? "—";
    const best = graphics?.bestTime ?? "—";
    const current = graphics?.currentTime ?? "—";
    const position = graphics?.position ?? "—";

    return (
        <div className="p-4 max-w-lg">
            <Card className="border-primary/30 bg-black/70 backdrop-blur-md">
                <CardContent className="p-4 grid grid-cols-3 gap-3">
                    <Cell label="Position" value={`P${position}`} />
                    <Cell label="Current" value={current} mono />
                    <Cell label="Delta" value={delta} mono valueClass={delta.startsWith("-") ? "text-emerald-400" : "text-red-400"} />
                    <Cell label="Last" value={last} mono />
                    <Cell label="Best" value={best} mono valueClass="text-primary" />
                    <Cell label="Laps" value={`${graphics?.completedLaps ?? 0}`} />
                </CardContent>
            </Card>
        </div>
    );
}

function Cell({
    label,
    value,
    valueClass = "text-white",
    mono = false,
}: {
    label: string;
    value: string | number;
    valueClass?: string;
    mono?: boolean;
}) {
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
            <p className={`text-lg font-bold ${mono ? "font-mono" : ""} ${valueClass}`}>{value}</p>
        </div>
    );
}
