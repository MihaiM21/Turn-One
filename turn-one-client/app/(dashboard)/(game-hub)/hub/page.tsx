'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Clock,
  Calendar,
  ArrowRight,
  Gift,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { DashboardHeader } from "@/components/dashboard/live dashboard/dashboard-header";
import { leaderboardService, coinService, predictionService } from '@/lib/gameService';
import { UserStats, Prediction } from '@/types/game-types';
import { f1_2025_races } from '@/lib/constants/f1_races';

export default function GameHubPage() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [recentPredictions, setRecentPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  // Get upcoming races (next 4 races)
  const upcomingRaces = useMemo(() => {
    const now = new Date();
    return f1_2025_races
      .map((race, index) => ({
        ...race,
        index,
        raceSession: race.sessions.find(s => s.name === 'Race')
      }))
      .filter(race => race.raceSession && new Date(race.raceSession.startTime) > now)
      .slice(0, 4);
  }, []);

  // Get next race with time until
  const nextRace = upcomingRaces[0];
  const daysUntilNextRace = nextRace 
    ? Math.ceil((new Date(nextRace.raceSession!.startTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stats, balance, predictions] = await Promise.all([
        leaderboardService.getUserStats(),
        coinService.getBalance(),
        predictionService.getUserPredictions()
      ]);
      setUserStats(stats);
      setCoinBalance(balance);
      setRecentPredictions(predictions.slice(0, 5));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const gameCards = [
    {
      title: "Race Predictions",
      description: "Predict race outcomes and win coins",
      icon: Target,
      color: "from-blue-500/10 to-purple-500/10",
      borderColor: "border-blue-500/30",
      href: "/games",
      stats: `${userStats?.totalPredictions || 0} predictions made`,
      reward: "Up to 5x coins"
    },
    {
      title: "F1 Trivia",
      description: "Test your Formula 1 knowledge",
      icon: Brain,
      color: "from-green-500/10 to-emerald-500/10",
      borderColor: "border-green-500/30",
      href: "/games?tab=trivia",
      stats: "Daily challenges",
      reward: "Earn XP & Coins"
    },
    {
      title: "Leaderboards",
      description: "Compete for the top spot",
      icon: Trophy,
      color: "from-yellow-500/10 to-orange-500/10",
      borderColor: "border-yellow-500/30",
      href: "/games?tab=leaderboard",
      stats: `Rank #${userStats?.globalRank || '--'}`,
      reward: "Exclusive badges"
    },
    {
      title: "Prediction Store",
      description: "Spend coins on special predictions",
      icon: Gift,
      color: "from-purple-500/10 to-pink-500/10",
      borderColor: "border-purple-500/30",
      href: "/app/prediction-store",
      stats: "New items weekly",
      reward: "Premium rewards"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background/95 via-background to-background/98">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-10">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background/50 border border-primary/20 p-8 lg:p-12 mb-10">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-primary/20 backdrop-blur-md">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <Badge variant="outline" className="bg-primary/10 border-primary/30">
                Game Hub
              </Badge>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Welcome to the Game Hub
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-6">
              Compete with fans worldwide, make predictions, test your knowledge, and earn rewards!
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-background/50 backdrop-blur-md border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">Coins</span>
                </div>
                <p className="text-2xl font-bold">{coinBalance.toLocaleString()}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-background/50 backdrop-blur-md border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-muted-foreground">Level</span>
                </div>
                <p className="text-2xl font-bold">{userStats?.level || 1}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-background/50 backdrop-blur-md border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Rank</span>
                </div>
                <p className="text-2xl font-bold">#{userStats?.globalRank || '--'}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-background/50 backdrop-blur-md border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-muted-foreground">Streak</span>
                </div>
                <p className="text-2xl font-bold">{userStats?.currentStreak || 0}</p>
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
            <Trophy className="absolute top-10 right-10 w-32 h-32" />
            <Target className="absolute bottom-20 right-32 w-24 h-24" />
          </div>
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {gameCards.map((game, index) => (
            <Link key={index} href={game.href}>
              <Card className={`group cursor-pointer border bg-gradient-to-br ${game.color} ${game.borderColor} 
                              hover:shadow-xl hover:scale-105 transition-all duration-300 h-full`}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-full bg-background/50 backdrop-blur-md`}>
                      <game.icon className="w-6 h-6" />
                    </div>
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardTitle className="text-lg mb-2">{game.title}</CardTitle>
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{game.stats}</span>
                    </div>
                    <Badge variant="outline" className="bg-background/50">
                      {game.reward}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Activity & Upcoming */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Predictions */}
          <Card className="border-primary/10 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Recent Predictions
                </CardTitle>
                <Link href="/games">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {recentPredictions.length > 0 ? (
                    recentPredictions.map((prediction) => (
                      <div key={prediction.id} className="p-4 rounded-lg border border-border/50 bg-background/30">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{prediction.raceName}</p>
                            <p className="text-xs text-muted-foreground">
                              Wagered: {prediction.coinsWagered} coins
                            </p>
                          </div>
                          <Badge variant={
                            prediction.status === 'WON' ? 'default' :
                            prediction.status === 'PENDING' ? 'secondary' : 'destructive'
                          }>
                            {prediction.status}
                          </Badge>
                        </div>
                        {prediction.status === 'WON' && (
                          <div className="flex items-center gap-1 text-sm text-green-500">
                            <Coins className="w-4 h-4" />
                            <span>+{prediction.coinsEarned} coins</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No predictions yet</p>
                      <Link href="/games">
                        <Button variant="outline" size="sm" className="mt-3">
                          Make Your First Prediction
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Upcoming Races */}
          <Card className="border-primary/10 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Upcoming Races
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {nextRace ? (
                  <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-lg">{nextRace.grandPrix}</p>
                        <p className="text-sm text-muted-foreground">{nextRace.circuit}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(nextRace.raceSession!.startTime).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-primary/10">
                        <Clock className="w-3 h-3 mr-1" />
                        {daysUntilNextRace} days
                      </Badge>
                    </div>
                    <Link href="/games">
                      <Button className="w-full" size="sm">
                        Make Prediction
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground text-center">No upcoming races</p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Coming Soon</p>
                  {upcomingRaces.slice(1).map((race) => {
                    const daysUntil = Math.ceil((new Date(race.raceSession!.startTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={race.index} className="p-3 rounded-lg bg-background/50 border border-border/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{race.grandPrix}</p>
                            <p className="text-xs text-muted-foreground">{race.country}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {daysUntil}d
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
