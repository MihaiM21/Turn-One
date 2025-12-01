'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, TrendingUp, Award, Flame } from 'lucide-react';
import { leaderboardService } from '@/lib/gameService';
import { LeaderboardEntry } from '@/types/game-types';

export function LeaderboardView() {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [seasonLeaderboard, setSeasonLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    setLoading(true);
    try {
      const [global, season] = await Promise.all([
        leaderboardService.getGlobalLeaderboard(50),
        leaderboardService.getSeasonLeaderboard('2025', 50)
      ]);
      setGlobalLeaderboard(global);
      setSeasonLeaderboard(season);
    } catch (error) {
      console.error('Failed to load leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-semibold">#{rank}</span>;
    }
  };

  const getRankClassName = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/10 to-amber-700/10 border-amber-600/30';
      default:
        return 'bg-background/50 border-border/50';
    }
  };

  const LeaderboardTable = ({ entries }: { entries: LeaderboardEntry[] }) => (
    <div className="space-y-2">
      {entries.map((entry, index) => (
        <div
          key={entry.userId}
          className={`p-4 rounded-lg border transition-all hover:shadow-lg ${getRankClassName(entry.globalRank)}`}
        >
          <div className="flex items-center gap-4">
            {/* Rank */}
            <div className="flex-shrink-0 w-12 flex items-center justify-center">
              {getRankIcon(entry.globalRank)}
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={entry.avatarUrl} alt={entry.username} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {entry.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{entry.username}</p>
                <p className="text-xs text-muted-foreground">
                  Level {Math.floor(entry.totalPointsEarned / 1000) + 1}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="font-bold text-lg">{entry.totalPointsEarned.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{entry.accuracyPercentage.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  {entry.currentStreak}
                </p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
            </div>

            {/* Mobile Stats */}
            <div className="md:hidden flex flex-col items-end gap-1">
              <Badge variant="outline" className="bg-primary/10">
                {entry.totalPointsEarned.toLocaleString()} pts
              </Badge>
              <span className="text-xs text-muted-foreground">
                {entry.accuracyPercentage.toFixed(0)}% accuracy
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <Card className="border-primary/10 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md">
        <CardContent className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground">Loading leaderboards...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/10 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-500/10">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <CardTitle>Leaderboards</CardTitle>
              <p className="text-sm text-muted-foreground">Top performers across the platform</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="global" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-background/50">
            <TabsTrigger value="global" className="gap-2">
              <Award className="w-4 h-4" />
              Global
            </TabsTrigger>
            <TabsTrigger value="season" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              2025 Season
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-4">
            <LeaderboardTable entries={globalLeaderboard} />
          </TabsContent>

          <TabsContent value="season" className="space-y-4">
            <LeaderboardTable entries={seasonLeaderboard} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
