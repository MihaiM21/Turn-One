'use client';

import { useState, useEffect, useCallback } from 'react';
import { Coins, Star, TrendingUp, Gift, Clock3, Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/live dashboard/dashboard-header';
import { PageHeader } from '@/components/dashboard/page-header';
import { DailyGiftWidget } from '@/components/dashboard/daily-gift-widget';
import { ExploreMoreLinks } from '@/components/dashboard/explore-more-links';
import { getAuthToken } from '@/lib/auth-utils';
import { fetchUserProfile } from '@/lib/userService';
import { getLevelProgress, type LevelProgress } from '@/lib/levelSystemService';
import { checkDailyGiftStatus } from '@/lib/dailyGiftService';
import { useBalanceRefresh } from '@/lib/balance-events';

interface RewardsProfile {
  coins: number;
  level: number;
  experience: number;
  canClaimDailyGift: boolean;
  lastDailyGiftDate?: string | null;
}

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="border-b border-zinc-800 px-5 py-3">
      <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      <p className="mt-0.5 font-bold text-sm">{title}</p>
    </div>
  );
}

function formatLastClaim(value?: string | null) {
  if (!value) return 'No claim recorded yet';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RewardsPage() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<RewardsProfile | null>(null);
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(false);

  const loadLiveRewardsData = useCallback(async (token: string) => {
    setIsLoadingSummary(true);
    setSummaryError(false);
    try {
      const [profileData, progressData, giftStatus] = await Promise.all([
        fetchUserProfile(token),
        getLevelProgress(token),
        checkDailyGiftStatus(token),
      ]);
      setProfile({
        coins: profileData.coins ?? 0,
        level: profileData.level ?? 1,
        experience: profileData.experience ?? 0,
        canClaimDailyGift: giftStatus.canClaimDailyGift,
        lastDailyGiftDate: profileData.lastDailyGiftDate ?? null,
      });
      setLevelProgress(progressData);
    } catch (error) {
      console.error('Failed to load rewards summary:', error);
      setSummaryError(true);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    setAuthToken(token);
    if (token) loadLiveRewardsData(token);
  }, [loadLiveRewardsData]);

  const refresh = useCallback(() => {
    if (authToken) loadLiveRewardsData(authToken);
  }, [authToken, loadLiveRewardsData]);

  useBalanceRefresh(refresh);

  const xpRemaining = levelProgress
    ? Math.max(levelProgress.experienceRequired - levelProgress.currentExperience, 0)
    : 0;
  const xpProgressPct = levelProgress
    ? Math.min(100, Math.round((levelProgress.currentExperience / levelProgress.experienceRequired) * 100))
    : 0;

  return (
    <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-4">
      <PageHeader
        label="Rewards"
        title="Daily rewards & level"
        description="Claim your gift, track XP and watch your coin balance grow."
        stats={[
          { icon: Coins, label: 'Coins', value: (profile?.coins ?? 0).toLocaleString(), iconClassName: 'text-yellow-400' },
          { icon: Star, label: 'Level', value: levelProgress?.currentLevel ?? profile?.level ?? 1, iconClassName: 'text-purple-400' },
          { icon: TrendingUp, label: 'XP', value: `${xpProgressPct}%`, iconClassName: 'text-primary' },
        ]}
      />

      {!authToken ? (
        <section className="flex flex-col items-center gap-3 border border-zinc-800 bg-zinc-950 px-5 py-12 text-center">
          <Gift className="h-8 w-8 text-zinc-700" />
          <div>
            <p className="font-bold">Please log in</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Log in to view your rewards and level progress.
            </p>
          </div>
        </section>
      ) : isLoadingSummary && !profile ? (
        <div className="flex items-center justify-center border border-zinc-800 bg-zinc-950 px-5 py-12 text-sm text-zinc-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading rewards data...
        </div>
      ) : summaryError || !profile || !levelProgress ? (
        <section className="border border-zinc-800 bg-zinc-950">
          <SectionHeader label="Error" title="Could not load rewards" />
          <div className="px-5 py-5">
            <button
              type="button"
              onClick={refresh}
              className="rounded-sm border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs uppercase tracking-wider text-zinc-300 transition-colors hover:border-primary/40 hover:text-primary"
            >
              Retry
            </button>
          </div>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
            {/* Level progress panel */}
            <section className="border border-zinc-800 border-l-4 border-l-primary bg-zinc-950">
              <SectionHeader label="Progression" title={`Level ${levelProgress.currentLevel}`} />
              <div className="space-y-4 px-5 py-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-500">XP this level</span>
                  <span className="font-mono text-sm font-bold tabular-nums">
                    {levelProgress.currentExperience}
                    <span className="text-zinc-600"> / </span>
                    {levelProgress.experienceRequired}
                  </span>
                </div>
                <div className="relative h-1 w-full bg-zinc-800">
                  <div
                    style={{ width: `${xpProgressPct}%` }}
                    className="absolute inset-y-0 left-0 bg-primary transition-all duration-700"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-zinc-800/60 pt-3 text-[11px]">
                  <span className="uppercase tracking-wider text-zinc-500">XP to next level</span>
                  <span className="font-mono tabular-nums text-zinc-300">{xpRemaining}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="uppercase tracking-wider text-zinc-500">Formula</span>
                  <span className="font-mono tabular-nums text-zinc-400">
                    100 × level + 100 ={' '}
                    <span className="text-zinc-300">{100 * profile.level + 100}</span>
                  </span>
                </div>
              </div>
            </section>

            {/* Daily gift widget */}
            <DailyGiftWidget onGiftClaimed={refresh} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="border border-zinc-800 bg-zinc-950">
              <SectionHeader label="Rules" title="How rewards work" />
              <ul className="divide-y divide-zinc-800/60 text-sm">
                <li className="flex items-start gap-3 px-5 py-3">
                  <Gift className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                  <div>
                    <p className="text-zinc-200">Daily gift</p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      +<span className="font-mono tabular-nums text-zinc-300">50</span> coins and{' '}
                      +<span className="font-mono tabular-nums text-zinc-300">25</span> XP, once per UTC day.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 px-5 py-3">
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-zinc-200">Level XP</p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      Required XP scales as <span className="font-mono tabular-nums text-zinc-300">100 × level + 100</span>.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 px-5 py-3">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                  <div>
                    <p className="text-zinc-200">Last claim</p>
                    <p className="mt-0.5 font-mono text-[11px] tabular-nums text-zinc-400">
                      {formatLastClaim(profile.lastDailyGiftDate)}
                    </p>
                  </div>
                </li>
              </ul>
            </section>

            <section className="border border-zinc-800 bg-zinc-950">
              <SectionHeader label="Status" title="Daily gift" />
              <ul className="divide-y divide-zinc-800/60">
                <li className="flex items-center justify-between px-5 py-3">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-500">Availability</span>
                  <span
                    className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                      profile.canClaimDailyGift
                        ? 'border-yellow-500/40 text-yellow-400'
                        : 'border-zinc-700 text-zinc-500'
                    }`}
                  >
                    {profile.canClaimDailyGift ? 'Available now' : 'Claimed today'}
                  </span>
                </li>
                <li className="flex items-center justify-between px-5 py-3">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-500">Coins balance</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-yellow-400">
                    {profile.coins.toLocaleString()}
                  </span>
                </li>
                <li className="flex items-center justify-between px-5 py-3">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-500">Current XP</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-zinc-200">
                    {profile.experience.toLocaleString()}
                  </span>
                </li>
              </ul>
            </section>
          </div>
        </>
      )}

      <ExploreMoreLinks currentPage="/rewards" />
    </main>
  );
}
