'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Activity,
  Sparkles
} from 'lucide-react';
import { DashboardHeader } from "@/components/dashboard/live dashboard/dashboard-header";
import { ExploreMoreLinks } from "@/components/dashboard/explore-more-links";
import { 
  PredictionGame, 
  TriviaGame, 
  LeaderboardView, 
  UserStatsCard,
  MyPredictions 
} from '@/components/dashboard/games';
import { leaderboardService, coinService } from '@/lib/gameService';
import { UserStats } from '@/types/game-types';

export default function GameHubPage() {
  const searchParams = useSearchParams();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('predictions');

  useEffect(() => {
    loadUserData();
    
    // Check if there's a tab query parameter
    const tabParam = searchParams?.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
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
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
              Compete & Earn
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Make predictions, test your knowledge, and climb the leaderboards
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:flex gap-3 lg:gap-4">
            <Card className="border-primary/10 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-yellow-500/10 ring-1 ring-yellow-500/20">
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
                <Card className="border-primary/10 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-purple-500/10 ring-1 ring-purple-500/20">
                        <Star className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Level</p>
                        <p className="text-2xl font-bold">{userStats.level}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/10 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md hover:shadow-lg transition-all duration-300 col-span-2 lg:col-span-1">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
                        <Trophy className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Global Rank</p>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="relative">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid bg-background/50 backdrop-blur-md border border-border/50 p-1">
              <TabsTrigger value="predictions" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Make Prediction</span>
                <span className="sm:hidden">Predict</span>
              </TabsTrigger>
              <TabsTrigger value="my-predictions" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">My Predictions</span>
                <span className="sm:hidden">Mine</span>
              </TabsTrigger>
              <TabsTrigger value="trivia" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Trivia</span>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Medal className="w-4 h-4" />
                <span className="hidden sm:inline">Leaderboard</span>
                <span className="sm:hidden">Ranks</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">My Stats</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="predictions" className="space-y-6">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background/50 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Make a Prediction</CardTitle>
                    <CardDescription>
                      Predict race outcomes and earn coins & points
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <PredictionGame onPredictionCreated={() => {
              refreshStats();
              // Refresh the my-predictions tab if it's been viewed
            }} />
          </TabsContent>

          <TabsContent value="my-predictions" className="space-y-6">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background/50 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>My Predictions</CardTitle>
                    <CardDescription>
                      Track your predictions and performance
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => setActiveTab('predictions')}
                  >
                    <Sparkles className="w-4 h-4" />
                    Make New Prediction
                  </Button>
                </div>
              </CardHeader>
            </Card>
            <MyPredictions onMakePrediction={() => setActiveTab('predictions')} />
          </TabsContent>

          <TabsContent value="trivia" className="space-y-6">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background/50 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>F1 Trivia Challenge</CardTitle>
                    <CardDescription>
                      Test your Formula 1 knowledge and earn rewards
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <TriviaGame onTriviaCompleted={refreshStats} />
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background/50 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Medal className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Global Leaderboard</CardTitle>
                    <CardDescription>
                      See how you rank against other players
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <LeaderboardView />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background/50 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>My Statistics</CardTitle>
                    <CardDescription>
                      View your performance metrics and achievements
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            {userStats && <UserStatsCard stats={userStats} />}
          </TabsContent>
        </Tabs>

        <ExploreMoreLinks currentPage="/games" />
      </div>
    </div>
  );
}
