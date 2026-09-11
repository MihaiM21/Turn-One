'use client';
import React from "react";
import { DiamondLoader } from "@/components/ui/diamond-loader";


export function LoadingPlot() {
    return (
        <div className="flex flex-col items-center justify-center h-[700px] text-muted-foreground">
            <DiamondLoader
                size={48}
                label="Generating track comparison…"
                sublabel="Processing telemetry data, this may take a moment"
            />
        </div>
    )
}