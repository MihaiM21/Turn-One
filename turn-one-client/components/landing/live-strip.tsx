"use client";

import Link from "next/link";
import { useSessionClock } from "@/hooks/use-session-clock";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * The trust signal next to the CTA: either "● LIVE · Race · ends in 01:12:04"
 * or "Next · Qualifying · Singapore · in 2d 04:12:07". Real calendar data.
 */
export function LiveStrip({ className = "" }: { className?: string }) {
  const { now, pick } = useSessionClock();

  if (!now || !pick) {
    return <div className={`h-9 ${className}`} aria-hidden />;
  }

  const target = pick.live ? pick.session.endTime : pick.session.startTime;
  const secs = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const d = Math.floor(secs / 86400);
  const clock = `${pad(Math.floor((secs % 86400) / 3600))}:${pad(Math.floor((secs % 3600) / 60))}:${pad(secs % 60)}`;
  const country = (pick.race as { country?: string }).country ?? "";

  return (
    <Link
      href="/live"
      className={`inline-flex max-w-full items-center gap-3 border border-zinc-800 bg-black/70 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-zinc-300 backdrop-blur-sm transition-colors hover:border-zinc-600 ${className}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {pick.live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${pick.live ? "bg-red-500" : "bg-zinc-500"}`} />
      </span>
      <span className={pick.live ? "text-red-400" : "text-zinc-500"}>{pick.live ? "Live" : "Next"}</span>
      <span className="truncate">{pick.session.name}</span>
      <span className="hidden truncate text-zinc-500 sm:inline">{country}</span>
      <span className="font-mono tabular-nums text-white">
        {d > 0 ? `${d}d ` : ""}
        {clock}
      </span>
    </Link>
  );
}
