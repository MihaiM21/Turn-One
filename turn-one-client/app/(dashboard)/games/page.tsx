'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Coins,
  Target,
  Brain,
  Medal,
  Star,
  Activity,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/live dashboard/dashboard-header';
import { PageHeader } from '@/components/dashboard/page-header';
import { ExploreMoreLinks } from '@/components/dashboard/explore-more-links';
import {
  PredictionGame,
  TriviaGame,
  LeaderboardView,
  UserStatsCard,
  MyPredictions,
} from '@/components/dashboard/games';
import { leaderboardService, coinService } from '@/lib/gameService';
import { UserStats } from '@/types/game-types';

const tabs = [
  { value: 'predictions', label: 'Predict', longLabel: 'Make Prediction', icon: Target },
  { value: 'my-predictions', label: 'Mine', longLabel: 'My Predictions', icon: Trophy },
  { value: 'trivia', label: 'Trivia', longLabel: 'Trivia', icon: Brain },
  { value: 'leaderboard', label: 'Ranks', longLabel: 'Leaderboard', icon: Medal },
  { value: 'stats', label: 'Stats', longLabel: 'My Stats', icon: Activity },
];

export default function GameHubPage() {
  const searchParams = useSearchParams();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [activeTab, setActiveTab] = useState('predictions');

  useEffect(() => {
    loadUserData();
    const tabParam = searchParams?.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  const loadUserData = async () => {
    try {
      const [stats, balance] = await Promise.all([
        leaderboardService.getUserStats(),
        coinService.getBalance(),
      ]);
      setUserStats(stats);
      setCoinBalance(balance);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const refreshStats = () => {
    loadUserData();
  };

  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader />

      <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-4">
        <PageHeader
          label="Games"
          title="Play"
          description="Predictions, trivia and the global leaderboard."
          stats={[
            { icon: Star, label: 'Level', value: userStats?.level ?? 1, iconClassName: 'text-purple-400' },
            { icon: Coins, label: 'Coins', value: coinBalance.toLocaleString(), iconClassName: 'text-yellow-400' },
            { icon: Trophy, label: 'Rank', value: userStats?.globalRank ? `#${userStats.globalRank}` : '—', iconClassName: 'text-blue-400' },
          ]}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-5 rounded-none border border-zinc-800 bg-zinc-950 p-0 lg:inline-grid lg:w-auto">
            {tabs.map(({ value, label, longLabel, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-2 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2.5 text-[11px] uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-200 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{longLabel}</span>
                <span className="sm:hidden">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="predictions" className="mt-0">
            <PredictionGame onPredictionCreated={refreshStats} />
          </TabsContent>

          <TabsContent value="my-predictions" className="mt-0">
            <MyPredictions onMakePrediction={() => setActiveTab('predictions')} />
          </TabsContent>

          <TabsContent value="trivia" className="mt-0">
            <TriviaGame onTriviaCompleted={refreshStats} />
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-0">
            <LeaderboardView />
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            {userStats && <UserStatsCard stats={userStats} />}
          </TabsContent>
        </Tabs>

        <ExploreMoreLinks currentPage="/games" />
      </main>
    </div>
  );
}
