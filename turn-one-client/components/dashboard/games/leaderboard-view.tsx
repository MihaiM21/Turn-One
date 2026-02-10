'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Coins, Target, Zap } from 'lucide-react';
import { leaderboardService } from '@/lib/gameService';
import { SimpleLeaderboardEntry } from '@/types/game-types';

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
        leaderboardService.getLevelLeaderboard(50)
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

  const SimpleLeaderboardTable = ({ 
    entries, 
    valueLabel, 
    valueFormatter 
  }: { 
    entries: SimpleLeaderboardEntry[]; 
    valueLabel: string;
    valueFormatter?: (value: number) => string;
  }) => (
    <div className="space-y-2">
      {entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No data available yet</p>
        </div>
      ) : (
        entries.map((entry) => (
          <div
            key={entry.userId}
            className={`p-4 rounded-lg border transition-all hover:shadow-lg ${getRankClassName(entry.rank)}`}
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex-shrink-0 w-12 flex items-center justify-center">
                {getRankIcon(entry.rank)}
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
                    Level {entry.level}
                  </p>
                </div>
              </div>

              {/* Value */}
              <div className="text-center">
                <p className="font-bold text-lg">{valueFormatter ? valueFormatter(entry.value) : entry.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{valueLabel}</p>
              </div>
            </div>
          </div>
        ))
      )}
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
        <Tabs defaultValue="predictions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-background/50">
            <TabsTrigger value="predictions" className="gap-2">
              <Target className="w-4 h-4" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="coins" className="gap-2">
              <Coins className="w-4 h-4" />
              Coins
            </TabsTrigger>
            <TabsTrigger value="level" className="gap-2">
              <Zap className="w-4 h-4" />
              Level
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-4">
            <SimpleLeaderboardTable 
              entries={predictionsLeaderboard} 
              valueLabel="Correct Predictions"
            />
          </TabsContent>

          <TabsContent value="coins" className="space-y-4">
            <SimpleLeaderboardTable 
              entries={coinsLeaderboard} 
              valueLabel="Coins"
            />
          </TabsContent>

          <TabsContent value="level" className="space-y-4">
            <SimpleLeaderboardTable 
              entries={levelLeaderboard} 
              valueLabel="Experience"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
