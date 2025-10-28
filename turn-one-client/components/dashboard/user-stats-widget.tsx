'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Coins, TrendingUp, AlertTriangle } from 'lucide-react';
import { fetchUserProfile } from '@/lib/userService';
import { getAuthToken } from '@/lib/auth-utils';

export function UserStatsWidget() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // Get token from auth utils
    const token = getAuthToken();
    setAuthToken(token);
    
    if (!token) {
      // If no token is available, we can't fetch the profile
      setLoading(false);
      setError(true);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const profile = await fetchUserProfile(token);
        setUserProfile(profile);
        setError(false);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Calculate XP to next level (based on formula in LevelSystemService: 100 * currentLevel + 100)
  const calculateXpToNextLevel = (level: number) => {
    return 100 * level + 100;
  };

  if (loading || !userProfile) {
    return (
      <Card className="bg-background/60 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-pulse">Loading user stats...</div>
        </CardContent>
      </Card>
    );
  }
  
  // Show error state if no authentication or error fetching profile
  if (error || !authToken) {
    return (
      <Card className="bg-background/60 backdrop-blur-sm border-red-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            Authentication Required
          </CardTitle>
          <CardDescription>
            Please log in to view your stats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your level progress and coins will be displayed here after you log in.
          </p>
        </CardContent>
      </Card>
    );
  }

  const xpToNextLevel = calculateXpToNextLevel(userProfile.level);
  const progressPercentage = (userProfile.experience / xpToNextLevel) * 100;

  return (
    <Card className="bg-background/60 backdrop-blur-sm">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg">Your Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-3 p-2 rounded-full bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Level {userProfile.level}</p>
              <p className="text-xs text-muted-foreground">{userProfile.experience} / {xpToNextLevel} XP</p>
            </div>
          </div>
          <div className="text-sm font-medium">{Math.round(progressPercentage)}%</div>
        </div>
        <Progress value={progressPercentage} className="h-2" />

        {/* <div className="flex items-center pt-2">
          <div className="mr-3 p-2 rounded-full bg-yellow-500/10">
            <Coins className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Coins</p>
            <p className="text-xs text-muted-foreground">{userProfile.coins} available</p>
          </div>
        </div> */}
      </CardContent>
    </Card>
  );
}