'use client';

import { Coins, Target, Trophy, Flame, Activity, Award, TrendingUp } from 'lucide-react';
import { UserStats } from '@/types/game-types';

interface UserStatsCardProps {
  stats: UserStats;
}

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="border-b border-zinc-800 px-5 py-3">
      <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      <p className="mt-0.5 font-bold text-sm">{title}</p>
    </div>
  );
}

function Row({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-2.5">
      <span className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</span>
      <span className={`font-mono text-sm font-bold tabular-nums ${valueClassName ?? 'text-zinc-200'}`}>
        {value}
      </span>
    </div>
  );
}

export function UserStatsCard({ stats }: UserStatsCardProps) {
  const experienceToNextLevel = 1000;
  const currentLevelXp = stats.experience % experienceToNextLevel;
  const currentLevelProgress = (currentLevelXp / experienceToNextLevel) * 100;

  const activity =
    stats.totalPredictions > 50
      ? 'Very active'
      : stats.totalPredictions > 20
        ? 'Active'
        : stats.totalPredictions > 5
          ? 'Moderate'
          : 'Beginner';

  const skill =
    stats.accuracyPercentage >= 75
      ? 'Expert'
      : stats.accuracyPercentage >= 60
        ? 'Advanced'
        : stats.accuracyPercentage >= 45
          ? 'Intermediate'
          : 'Learning';

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      <section className="border border-zinc-800 bg-zinc-950">
        <SectionHeader label="Coins & level" title="Economy" />
        <ul className="divide-y divide-zinc-800/60">
          <Row label="Total coins" value={stats.totalCoins.toLocaleString()} valueClassName="text-yellow-400" />
          <Row label="Earned" value={`+${stats.totalCoinsEarned.toLocaleString()}`} valueClassName="text-green-400" />
          <Row label="Spent" value={`-${stats.totalCoinsSpent.toLocaleString()}`} valueClassName="text-red-400" />
        </ul>
        <div className="space-y-2 border-t border-zinc-800/60 px-5 py-4">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-zinc-500">
              <Trophy className="h-3.5 w-3.5 text-primary" /> Level
            </span>
            <span className="font-mono tabular-nums text-zinc-200">{stats.level}</span>
          </div>
          <div className="relative h-1 w-full bg-zinc-800">
            <div
              style={{ width: `${currentLevelProgress}%` }}
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-700"
            />
          </div>
          <p className="font-mono text-[10px] tabular-nums text-zinc-500">
            {currentLevelXp} / {experienceToNextLevel} XP to next level
          </p>
        </div>
      </section>

      <section className="border border-zinc-800 bg-zinc-950">
        <SectionHeader label="Predictions" title="Performance" />
        <div className="border-b border-zinc-800/60 px-5 py-5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Overall accuracy</p>
          <p className="mt-1 font-mono text-4xl font-black tabular-nums leading-none text-primary">
            {stats.accuracyPercentage.toFixed(1)}
            <span className="text-xl text-zinc-500">%</span>
          </p>
        </div>
        <ul className="divide-y divide-zinc-800/60">
          <Row label="Total" value={stats.totalPredictions} />
          <Row label="Correct" value={stats.correctPredictions} valueClassName="text-green-400" />
          <li className="flex items-center justify-between px-5 py-2.5">
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500">
              <Flame className="h-3.5 w-3.5 text-orange-400" /> Current streak
            </span>
            <span className="font-mono text-sm font-bold tabular-nums text-orange-400">
              {stats.currentStreak}
            </span>
          </li>
        </ul>
      </section>

      <section className="border border-zinc-800 bg-zinc-950">
        <SectionHeader label="Standing" title="Rankings" />
        <div className="border-b border-zinc-800/60 px-5 py-5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Global rank</p>
          <p className="mt-1 font-mono text-4xl font-black tabular-nums leading-none text-foreground">
            #{stats.globalRank || '--'}
          </p>
        </div>
        <ul className="divide-y divide-zinc-800/60">
          <li className="flex items-center justify-between px-5 py-2.5">
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500">
              <Activity className="h-3.5 w-3.5 text-primary" /> Activity
            </span>
            <span className="text-sm font-medium text-zinc-200">{activity}</span>
          </li>
          <li className="flex items-center justify-between px-5 py-2.5">
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500">
              <Award className="h-3.5 w-3.5 text-primary" /> Skill
            </span>
            <span className="text-sm font-medium text-zinc-200">{skill}</span>
          </li>
          <li className="flex items-center justify-between px-5 py-2.5">
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500">
              <TrendingUp className="h-3.5 w-3.5 text-green-400" /> Earnings
            </span>
            <span className="font-mono text-sm font-bold tabular-nums text-green-400">
              +{stats.totalCoinsEarned.toLocaleString()}
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
