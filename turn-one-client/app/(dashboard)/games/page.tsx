'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trophy, 
  Coins, 
  Target, 
  Brain, 
  TrendingUp, 
  Medal,
  Zap,
  Star,
  Award,
  Flame,
  Activity
} from 'lucide-react';
import { DashboardHeader } from "@/components/dashboard/live dashboard/dashboard-header";
import { 
  PredictionGame, 
  TriviaGame, 
  LeaderboardView, 
  UserStatsCard 
} from '@/components/dashboard/games';
import { leaderboardService, coinService } from '@/lib/gameService';
import { UserStats } from '@/types/game-types';

export default function GameHubPage() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [stats, balance] = await Promise.all([
        leaderboardService.getUserStats(),
        coinService.getBalance()
      ]);
      setUserStats(stats);
      setCoinBalance(balance);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = () => {
    loadUserData();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background/95 via-background to-background/98">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Badge variant="outline" 
                className="px-5 py-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-md 
                         border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-300 
                         shadow-lg shadow-yellow-500/5 flex items-center gap-3">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-medium tracking-wide bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  Game Hub
                </span>
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Compete & Earn</h1>
            <p className="text-muted-foreground">
              Make predictions, test your knowledge, and climb the leaderboards
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <Card className="border-primary/10 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-yellow-500/10">
                    <Coins className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Coins</p>
                    <p className="text-2xl font-bold">{coinBalance.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {userStats && (
              <>
                <Card className="border-primary/10 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-purple-500/10">
                        <Star className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Level</p>
                        <p className="text-2xl font-bold">{userStats.level}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/10 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-500/10">
                        <Trophy className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rank</p>
                        <p className="text-2xl font-bold">#{userStats.globalRank || '--'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="predictions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid bg-background/50 backdrop-blur-md">
            <TabsTrigger value="predictions" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Predictions</span>
            </TabsTrigger>
            <TabsTrigger value="trivia" className="gap-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Trivia</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <Medal className="w-4 h-4" />
              <span className="hidden sm:inline">Leaderboard</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">My Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-6">
            <PredictionGame onPredictionCreated={refreshStats} />
          </TabsContent>

          <TabsContent value="trivia" className="space-y-6">
            <TriviaGame onTriviaCompleted={refreshStats} />
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <LeaderboardView />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            {userStats && <UserStatsCard stats={userStats} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
