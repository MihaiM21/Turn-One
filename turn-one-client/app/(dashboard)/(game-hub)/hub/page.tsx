'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Coins,
  Target,
  Brain,
  Medal,
  Star,
  Flame,
  ArrowRight,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/live dashboard/dashboard-header';
import { PageHeader } from '@/components/dashboard/page-header';
import { NextRaceHero } from '@/components/dashboard/live dashboard/next-race-hero';
import { ExploreMoreLinks } from '@/components/dashboard/explore-more-links';
import { leaderboardService, coinService, predictionService } from '@/lib/gameService';
import { UserStats, Prediction, PredictionStatus } from '@/types/game-types';

interface QuickAction {
  href: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const quickActions: QuickAction[] = [
  {
    href: '/games?tab=predictions',
    label: 'Race predictions',
    title: 'Make a prediction',
    description: 'Predict podium, fastest lap and more.',
    icon: Target,
  },
  {
    href: '/games?tab=trivia',
    label: 'F1 trivia',
    title: 'Test your knowledge',
    description: 'Daily trivia challenges with coin rewards.',
    icon: Brain,
  },
  {
    href: '/games?tab=leaderboard',
    label: 'Leaderboard',
    title: 'See where you stand',
    description: 'Compete with players worldwide.',
    icon: Medal,
  },
  {
    href: '/store',
    label: 'Token store',
    title: 'Spend your coins',
    description: 'Tokens, boosts and the starter pack.',
    icon: ShoppingBag,
  },
];

function QuickActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon;
  return (
    <Link href={action.href} className="group block">
      <div className="relative h-full overflow-hidden border border-zinc-800 border-l-4 border-l-primary bg-zinc-950 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-primary/30 bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{action.label}</p>
            <h3 className="mt-0.5 truncate text-base font-bold tracking-tight">{action.title}</h3>
            <p className="mt-0.5 truncate text-xs text-zinc-400">{action.description}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
}

function statusBadgeClasses(status: PredictionStatus) {
  switch (status) {
    case PredictionStatus.WON:
      return 'border-green-500/40 text-green-400';
    case PredictionStatus.LOST:
      return 'border-red-500/40 text-red-400';
    case PredictionStatus.PARTIAL:
      return 'border-yellow-500/40 text-yellow-400';
    case PredictionStatus.CANCELLED:
      return 'border-zinc-700 text-zinc-500';
    case PredictionStatus.PENDING:
    default:
      return 'border-blue-500/40 text-blue-400';
  }
}

export default function GameHubPage() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [recentPredictions, setRecentPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stats, balance, predictions] = await Promise.all([
        leaderboardService.getUserStats(),
        coinService.getBalance(),
        predictionService.getUserPredictions(),
      ]);
      setUserStats(stats);
      setCoinBalance(balance);
      setRecentPredictions(predictions.slice(0, 5));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader />

      <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-4">
        <PageHeader
          label="Game hub"
          title="Your race week"
          description="Predictions, trivia, leaderboards and rewards — in one place."
          stats={[
            { icon: Star, label: 'Level', value: userStats?.level ?? 1, iconClassName: 'text-purple-400' },
            { icon: Coins, label: 'Coins', value: coinBalance.toLocaleString(), iconClassName: 'text-yellow-400' },
            { icon: Trophy, label: 'Rank', value: userStats?.globalRank ? `#${userStats.globalRank}` : '—', iconClassName: 'text-blue-400' },
            { icon: Flame, label: 'Streak', value: userStats?.currentStreak ?? 0, iconClassName: 'text-orange-400' },
          ]}
        />

        <NextRaceHero />

        <section className="border border-zinc-800 bg-zinc-950 animate-in fade-in duration-500">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Recent activity</p>
              <p className="mt-0.5 font-bold">Your predictions</p>
            </div>
            <Link
              href="/games?tab=my-predictions"
              className="flex h-7 items-center rounded-sm px-2 text-xs text-zinc-400 transition-colors hover:text-primary"
            >
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>

          {recentPredictions.length > 0 ? (
            <div className="divide-y divide-zinc-800/60">
              {recentPredictions.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <Target className="h-4 w-4 shrink-0 text-zinc-600" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.raceName}</span>
                  <span className="hidden text-[11px] text-zinc-500 sm:inline">
                    Wager <span className="font-mono tabular-nums text-zinc-400">{p.coinsWagered}</span>
                  </span>
                  {p.status === PredictionStatus.WON && (
                    <span className="hidden font-mono text-xs tabular-nums text-green-400 sm:inline">
                      +{p.coinsEarned}
                    </span>
                  )}
                  <span
                    className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusBadgeClasses(p.status)}`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
              <Target className="h-8 w-8 text-zinc-700" />
              <p className="text-sm text-zinc-400">No predictions yet</p>
              <Link
                href="/games?tab=predictions"
                className="rounded-sm border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-primary/40 hover:text-primary"
              >
                Make your first prediction
              </Link>
            </div>
          )}
        </section>

        <ExploreMoreLinks currentPage="/hub" />
      </main>
    </div>
  );
}
