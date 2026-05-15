'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchUserProfile } from '@/lib/userService';
import { getAuthToken } from '@/lib/auth-utils';
import { Trophy, Gamepad2, Radio, ChartNoAxesCombined } from 'lucide-react';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

interface QuickAction {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const quickActions: QuickAction[] = [
  { href: '/predictions', label: 'Predictions', icon: Trophy },
  { href: '/games', label: 'Trivia & Games', icon: Gamepad2 },
  { href: '/live', label: 'Live Timing', icon: Radio },
  { href: '/generator', label: 'Plot Generator', icon: ChartNoAxesCombined },
];

export function WelcomeBanner() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await fetchUserProfile(token);
        setProfile(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const displayName: string =
    profile?.displayName || profile?.username || profile?.userName || profile?.name || 'Driver';

  const xpToNextLevel = 100 * (profile?.level ?? 1) + 100;
  const xpProgress = profile
    ? Math.min(100, Math.round(((profile.experience ?? 0) / xpToNextLevel) * 100))
    : 0;

  return (
    <section className="border-b border-zinc-800/70 pb-5 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Welcome back</p>
          {loading ? (
            <Skeleton className="mt-1 h-8 w-56 bg-zinc-800/60" />
          ) : (
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">
              {getGreeting()},{' '}
              <span className="text-primary">{displayName}</span>
            </h1>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {loading ? (
              <>
                <Skeleton className="h-3 w-10 bg-zinc-800/60" />
                <Skeleton className="h-1 w-32 bg-zinc-800/60" />
                <Skeleton className="h-3 w-24 bg-zinc-800/60" />
              </>
            ) : profile ? (
              <>
                <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                  Lv {profile.level ?? 1}
                </span>
                <div className="relative h-1 w-32 bg-zinc-800 sm:w-44">
                  <div
                    style={{ width: `${xpProgress}%` }}
                    className="absolute inset-y-0 left-0 bg-primary transition-all duration-700"
                  />
                </div>
                <span className="font-mono text-[11px] tabular-nums text-zinc-400">
                  {profile.experience ?? 0} / {xpToNextLevel} XP
                </span>
                {typeof profile.coins === 'number' && (
                  <span className="text-[11px] text-yellow-400/90">◈ {profile.coins}</span>
                )}
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickActions.map(({ href, label, icon: Icon }) => (
            <Button
              asChild
              key={href}
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-sm border-zinc-800 bg-zinc-900/60 px-3 text-xs text-zinc-300 transition-colors hover:border-primary/40 hover:bg-zinc-900 hover:text-primary"
            >
              <Link href={href}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
