'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SessionTimerProps {
  /** Remaining time string from ExtrapolatedClock, e.g. "1:23:45" or "45:00" */
  timeRemaining: string;
  /** UTC timestamp when timeRemaining was recorded — used for live-accuracy countdown */
  clockUtc?: string;
  /** Whether the session clock is actively counting down */
  isRunning: boolean;
  /** Q1/Q2/Q3 badge for qualifying sessions */
  qualiSegment?: 'Q1' | 'Q2' | 'Q3';
  className?: string;
}

function parseSeconds(ts: string): number {
  const parts = ts.split(':').map(Number);
  if (parts.length === 3) return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  return 0;
}

function formatSeconds(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  return `${m}:${String(rem).padStart(2, '0')}`;
}

function computeSecondsLeft(timeRemaining: string, clockUtc?: string): number {
  const base = parseSeconds(timeRemaining || '0:00');
  if (clockUtc) {
    const elapsed = (Date.now() - new Date(clockUtc).getTime()) / 1000;
    return Math.max(0, base - elapsed);
  }
  return Math.max(0, base);
}

const QUALI_COLORS = {
  Q1: { bg: '#22c55e20', text: '#22c55e', border: '#22c55e40' },
  Q2: { bg: '#eab30820', text: '#eab308', border: '#eab30840' },
  Q3: { bg: '#ef444420', text: '#ef4444', border: '#ef444440' },
};

export function SessionTimer({ timeRemaining, clockUtc, isRunning, qualiSegment, className }: SessionTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    computeSecondsLeft(timeRemaining, clockUtc)
  );

  // Sync from server data whenever timeRemaining or clockUtc updates
  useEffect(() => {
    setSecondsLeft(computeSecondsLeft(timeRemaining, clockUtc));
  }, [timeRemaining, clockUtc]);

  // Live countdown tick when session is running
  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, secondsLeft <= 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const isCritical = isRunning && secondsLeft > 0 && secondsLeft <= 60;
  const isEnded = secondsLeft === 0;
  const qualiStyle = qualiSegment ? QUALI_COLORS[qualiSegment] : null;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Q1/Q2/Q3 badge */}
      {qualiStyle && qualiSegment && (
        <span
          className="text-[11px] font-black px-2 py-1 rounded-md tracking-wider uppercase"
          style={{ backgroundColor: qualiStyle.bg, color: qualiStyle.text, border: `1px solid ${qualiStyle.border}` }}
        >
          {qualiSegment}
        </span>
      )}

      {/* Timer display */}
      <div className="flex items-center gap-2">
        {/* Live indicator dot */}
        {isRunning && !isEnded && (
          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              isCritical ? 'bg-red-500 animate-ping' : 'bg-green-400 animate-pulse'
            )}
          />
        )}
        <span
          className={cn(
            'font-mono font-black tabular-nums leading-none',
            isEnded
              ? 'text-muted-foreground text-base'
              : isCritical
              ? 'text-red-400 text-2xl animate-pulse'
              : 'text-foreground text-2xl'
          )}
        >
          {isEnded ? 'Ended' : formatSeconds(secondsLeft)}
        </span>
      </div>
    </div>
  );
}
