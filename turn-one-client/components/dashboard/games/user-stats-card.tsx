'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  Coins, 
  Trophy, 
  Flame,
  Activity,
  Award,
  Star
} from 'lucide-react';
import { UserStats } from '@/types/game-types';

interface UserStatsCardProps {
  stats: UserStats;
}

export function UserStatsCard({ stats }: UserStatsCardProps) {
  const experienceToNextLevel = 1000; // Example: 1000 XP per level
  const currentLevelProgress = (stats.experience % experienceToNextLevel) / experienceToNextLevel * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Coins & Level */}
      <Card className="border-primary/10 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 backdrop-blur-md border-yellow-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="w-5 h-5 text-yellow-500" />
            Coins & Level
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Coins</span>
              <span className="text-2xl font-bold text-yellow-500">{stats.totalCoins.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs mt-4">
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-muted-foreground mb-1">Earned</p>
                <p className="font-semibold text-green-500">+{stats.totalCoinsEarned.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-muted-foreground mb-1">Spent</p>
                <p className="font-semibold text-red-500">-{stats.totalCoinsSpent.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Level</span>
              <Badge variant="outline" className="bg-primary/10 border-primary/30">
                <Star className="w-3 h-3 mr-1" />
                Level {stats.level}
              </Badge>
            </div>
            <Progress value={currentLevelProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.experience % experienceToNextLevel} / {experienceToNextLevel} XP to next level
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Predictions Stats */}
      <Card className="border-primary/10 bg-gradient-to-br from-blue-500/5 to-purple-500/5 backdrop-blur-md border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-blue-500" />
            Prediction Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-6 rounded-lg bg-background/50 border border-border/50">
            <div className="text-4xl font-bold text-blue-500 mb-2">
              {stats.accuracyPercentage.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">Overall Accuracy</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-background/50 text-center">
              <p className="text-2xl font-bold mb-1">{stats.totalPredictions}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 text-center">
              <p className="text-2xl font-bold mb-1 text-green-500">{stats.correctPredictions}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium">Current Streak</span>
            </div>
            <Badge variant="outline" className="bg-orange-500/10 border-orange-500/30 text-orange-500">
              {stats.currentStreak} wins
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Rankings & Achievements */}
      <Card className="border-primary/10 bg-gradient-to-br from-purple-500/5 to-pink-500/5 backdrop-blur-md border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-purple-500" />
            Rankings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-6 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="text-4xl font-bold mb-2">
              #{stats.globalRank || '--'}
            </div>
            <p className="text-sm text-muted-foreground">Global Rank</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-sm">Activity Level</span>
              </div>
              <Badge variant="outline" className="bg-primary/10">
                {stats.totalPredictions > 50 ? 'Very Active' : 
                 stats.totalPredictions > 20 ? 'Active' : 
                 stats.totalPredictions > 5 ? 'Moderate' : 'Beginner'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-sm">Skill Level</span>
              </div>
              <Badge variant="outline" className="bg-primary/10">
                {stats.accuracyPercentage >= 75 ? 'Expert' :
                 stats.accuracyPercentage >= 60 ? 'Advanced' :
                 stats.accuracyPercentage >= 45 ? 'Intermediate' : 'Learning'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm">Earnings</span>
              </div>
              <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-500">
                +{stats.totalCoinsEarned.toLocaleString()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
