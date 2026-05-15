'use client';

type F1Session = {
  name: string;
  startTime: Date;
  endTime: Date;
};

import React, { useEffect, useMemo, useState } from 'react';
import { f1_2026_races } from '@/lib/constants/f1_races';
import { Calendar, MapPin, Flag } from 'lucide-react';

function formatClockUnits(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  return {
    days: Math.floor(safe / 86400),
    hours: String(Math.floor((safe % 86400) / 3600)).padStart(2, '0'),
    minutes: String(Math.floor((safe % 3600) / 60)).padStart(2, '0'),
    seconds: String(safe % 60).padStart(2, '0'),
  };
}

export function NextRaceHero() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const getStatus = (s: F1Session): 'live' | 'passed' | 'upcoming' => {
    if (now >= s.startTime && now <= s.endTime) return 'live';
    if (now > s.endTime) return 'passed';
    return 'upcoming';
  };

  const selection = useMemo(() => {
    let raceIdx = -1;
    let sessionIdx = -1;
    for (let i = 0; i < f1_2026_races.length; i++) {
      const r = f1_2026_races[i];
      if (r.cancelled) continue;
      const liveIdx = r.sessions.findIndex((s: F1Session) => getStatus(s) === 'live');
      if (liveIdx !== -1) { raceIdx = i; sessionIdx = liveIdx; break; }
    }
    if (raceIdx === -1) {
      for (let i = 0; i < f1_2026_races.length; i++) {
        const r = f1_2026_races[i];
        if (r.cancelled) continue;
        const upIdx = r.sessions.findIndex((s: F1Session) => getStatus(s) === 'upcoming');
        if (upIdx !== -1) { raceIdx = i; sessionIdx = upIdx; break; }
      }
    }
    return { raceIdx, sessionIdx };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  const race = selection.raceIdx !== -1 ? f1_2026_races[selection.raceIdx] : null;
  const session = race && selection.sessionIdx !== -1 ? race.sessions[selection.sessionIdx] : null;
  const status = session ? getStatus(session) : null;
  const secondsToTarget = session
    ? Math.max(0, Math.floor(((status === 'live' ? session.endTime : session.startTime).getTime() - now.getTime()) / 1000))
    : 0;
  const c = formatClockUnits(secondsToTarget);
  const targetLabel = status === 'live' ? 'Session ends in' : 'Lights out in';
  const isLive = status === 'live';

  if (!race) {
    return (
      <section className="border border-zinc-800 bg-zinc-950 px-6 py-8 text-center text-sm text-zinc-500">
        No upcoming races scheduled.
      </section>
    );
  }

  const sessionDate = session
    ? session.startTime.toLocaleString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';
  const sessionUtc = session
    ? session.startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
    : '';

  return (
    <section
      className={`relative overflow-hidden border border-zinc-800 bg-zinc-950 animate-in fade-in slide-in-from-bottom-2 duration-500 ${
        isLive ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-primary'
      }`}
    >
      <div className="grid gap-0 lg:grid-cols-[1fr_auto] lg:items-stretch">
        {/* Race info */}
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em]">
            <Flag className="h-3 w-3 text-primary" />
            {isLive ? (
              <span className="text-red-400 font-medium">● Live now</span>
            ) : (
              <span className="text-zinc-500">Next on the calendar</span>
            )}
          </div>

          <h2 className="text-4xl font-black uppercase tracking-tight leading-none sm:text-5xl">
            {race.grandPrix}
          </h2>

          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <MapPin className="h-3.5 w-3.5 text-primary/60 shrink-0" />
            <span>{race.circuit}</span>
            <span className="text-zinc-700">·</span>
            <span>{race.country}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {race.sessions.map((s: F1Session) => {
              const st = getStatus(s);
              const isNext =
                st !== 'live' &&
                race.sessions.findIndex((x: F1Session) => getStatus(x) === 'live') === -1 &&
                race.sessions.findIndex((x: F1Session) => getStatus(x) === 'upcoming') === race.sessions.indexOf(s);
              const highlight = st === 'live' || isNext;
              return (
                <span
                  key={s.name}
                  className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider transition ${
                    st === 'passed'
                      ? 'border-zinc-800 text-zinc-700 line-through'
                      : highlight
                        ? 'border-primary text-primary'
                        : 'border-zinc-700 text-zinc-400'
                  }`}
                >
                  {s.name}
                </span>
              );
            })}
          </div>
        </div>

        {/* Countdown */}
        {session && (
          <div className="border-t border-zinc-800 px-6 py-5 lg:border-l lg:border-t-0 lg:min-w-[320px]">
            <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-zinc-500">{targetLabel}</p>
            <div className="flex items-end gap-4">
              {[
                { v: c.days, l: 'Days' },
                { v: c.hours, l: 'Hours' },
                { v: c.minutes, l: 'Mins' },
                { v: c.seconds, l: 'Secs' },
              ].map((u) => (
                <div key={u.l} className="text-center">
                  <div className="font-mono text-5xl font-black tabular-nums leading-none text-foreground sm:text-6xl">
                    {typeof u.v === 'number' ? String(u.v).padStart(2, '0') : u.v}
                  </div>
                  <div className="mt-1.5 text-[9px] uppercase tracking-[0.3em] text-zinc-600">{u.l}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-zinc-500">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>{sessionDate}</span>
              <span className="text-zinc-700">·</span>
              <span className="font-mono">UTC {sessionUtc}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
