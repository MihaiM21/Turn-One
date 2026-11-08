'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Coins, Target, Zap } from 'lucide-react';
import { leaderboardService } from '@/lib/gameService';
import { SimpleLeaderboardEntry } from '@/types/game-types';

function rankAccent(rank: number) {
  switch (rank) {
    case 1:
      return 'border-l-yellow-500';
    case 2:
      return 'border-l-zinc-400';
    case 3:
      return 'border-l-amber-600';
    default:
      return 'border-l-transparent';
  }
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-foreground/85" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
  return <span className="font-mono text-xs tabular-nums text-muted-foreground">#{rank}</span>;
}

function LeaderboardTable({
  entries,
  valueLabel,
  valueFormatter,
}: {
  entries: SimpleLeaderboardEntry[];
  valueLabel: string;
  valueFormatter?: (value: number) => string;
}) {
  if (entries.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-muted-foreground">No data available yet.</p>;
  }
  return (
    <ul className="divide-y divide-border/60">
      {entries.map((entry) => (
        <li
          key={entry.userId}
          className={`flex items-center gap-3 border-l-2 ${rankAccent(entry.rank)} px-5 py-2.5`}
        >
          <div className="flex w-8 shrink-0 items-center justify-center">
            <RankIcon rank={entry.rank} />
          </div>
          <Avatar className="h-8 w-8 shrink-0 border border-border">
            <AvatarImage src={entry.avatarUrl} alt={entry.username} />
            <AvatarFallback className="bg-secondary text-[11px] font-semibold text-foreground/85">
              {entry.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{entry.username}</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Lv <span className="font-mono tabular-nums">{entry.level}</span>
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-mono text-sm font-bold tabular-nums">
              {valueFormatter ? valueFormatter(entry.value) : entry.value.toLocaleString()}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{valueLabel}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function LeaderboardView() {
  const [predictionsLeaderboard, setPredictionsLeaderboard] = useState<SimpleLeaderboardEntry[]>([]);
  const [coinsLeaderboard, setCoinsLeaderboard] = useState<SimpleLeaderboardEntry[]>([]);
  const [levelLeaderboard, setLevelLeaderboard] = useState<SimpleLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    setLoading(true);
    try {
      const [predictions, coins, level] = await Promise.all([
        leaderboardService.getPredictionsLeaderboard(50),
        leaderboardService.getCoinsLeaderboard(50),
        leaderboardService.getLevelLeaderboard(50),
      ]);
      setPredictionsLeaderboard(predictions);
      setCoinsLeaderboard(coins);
      setLevelLeaderboard(level);
    } catch (error) {
      console.error('Failed to load leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { value: 'predictions', label: 'Predictions', icon: Target },
    { value: 'coins', label: 'Coins', icon: Coins },
    { value: 'level', label: 'Level', icon: Zap },
  ];

  return (
    <section className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Leaderboards</p>
          <p className="mt-0.5 font-bold text-sm">Top performers</p>
        </div>
      </div>

      <Tabs defaultValue="predictions">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-none border-b border-border bg-transparent p-0">
          {tabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="gap-2 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground/95 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {loading ? (
          <div className="space-y-2 px-5 py-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 bg-border/60" />
            ))}
          </div>
        ) : (
          <>
            <TabsContent value="predictions" className="mt-0">
              <LeaderboardTable entries={predictionsLeaderboard} valueLabel="Correct" />
            </TabsContent>
            <TabsContent value="coins" className="mt-0">
              <LeaderboardTable entries={coinsLeaderboard} valueLabel="Coins" />
            </TabsContent>
            <TabsContent value="level" className="mt-0">
              <LeaderboardTable entries={levelLeaderboard} valueLabel="XP" />
            </TabsContent>
          </>
        )}
      </Tabs>
    </section>
  );
}
