"use client";

import { useEffect, useState } from "react";
import { f1_2026_races } from "@/lib/constants/f1_races";

type Session = { name: string; startTime: Date; endTime: Date };
type Race = (typeof f1_2026_races)[number];

export type SessionPick = { race: Race; session: Session; live: boolean };

/** The session running right now, or else the next one, from the 2026 calendar. */
export function pickSession(now: Date): SessionPick | null {
  for (const r of f1_2026_races) {
    if (r.cancelled) continue;
    const live = (r.sessions as Session[]).find((s) => now >= s.startTime && now <= s.endTime);
    if (live) return { race: r, session: live, live: true };
  }
  for (const r of f1_2026_races) {
    if (r.cancelled) continue;
    const up = (r.sessions as Session[]).find((s) => now < s.startTime);
    if (up) return { race: r, session: up, live: false };
  }
  return null;
}

/**
 * Ticks every `intervalMs` and reports the live-or-next session. `now` is null
 * until the first client tick, so SSR and hydration render the same placeholder.
 */
export function useSessionClock(intervalMs = 1000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const first = requestAnimationFrame(() => setNow(new Date()));
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => {
      cancelAnimationFrame(first);
      clearInterval(id);
    };
  }, [intervalMs]);
  return { now, pick: now ? pickSession(now) : null };
}
