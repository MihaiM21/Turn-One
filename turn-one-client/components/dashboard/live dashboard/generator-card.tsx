'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight, ChartNoAxesCombined } from "lucide-react";
import Link from "next/link";

export function GeneratorCard() {
  return (
    <Link href="/generator" className="group block">
      <div className="relative overflow-hidden border border-zinc-800 border-l-4 border-l-primary bg-zinc-950 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60">
        <div className="flex items-center gap-5 px-6 py-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-primary/30 bg-primary/10">
            <ChartNoAxesCombined className="h-6 w-6 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Featured tool</p>
            <h3 className="mt-0.5 text-xl font-bold tracking-tight">Telemetry Plot Generator</h3>
            <p className="mt-0.5 truncate text-sm text-zinc-400">
              Create beautiful F1 telemetry visualizations in seconds. Multiple plot types, fully customizable.
            </p>
          </div>

          <Button
            variant="default"
            size="sm"
            className="hidden shrink-0 rounded-sm bg-primary text-white hover:bg-primary/90 sm:flex"
          >
            Open
            <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Button>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform duration-200 group-hover:translate-x-0.5 sm:hidden" />
        </div>
      </div>
    </Link>
  );
}
