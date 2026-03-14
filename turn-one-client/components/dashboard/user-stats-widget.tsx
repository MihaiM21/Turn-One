'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, AlertTriangle } from 'lucide-react';
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
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center p-5 text-sm">
          <div className="animate-pulse">Loading user stats...</div>
        </CardContent>
      </Card>
    );
  }
  
  // Show error state if no authentication or error fetching profile
  if (error || !authToken) {
    return (
      <Card className="border-red-500/30 bg-card/40 backdrop-blur-sm">
        <CardHeader className="pb-1.5 pt-5">
          <CardTitle className="flex items-center text-base">
            <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
            Authentication Required
          </CardTitle>
          <CardDescription className="text-xs">
            Please log in to view your stats
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            Your level progress and coins will be displayed here after you log in.
          </p>
        </CardContent>
      </Card>
    );
  }

  const xpToNextLevel = calculateXpToNextLevel(userProfile.level);
  const progressPercentage = (userProfile.experience / xpToNextLevel) * 100;

  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
      <CardHeader className="pb-0.5 pt-5">
        <CardTitle className="text-base">Your Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-2.5 rounded-full bg-primary/10 p-1.5">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium leading-tight">Level {userProfile.level}</p>
              <p className="text-xs text-muted-foreground">{userProfile.experience} / {xpToNextLevel} XP</p>
            </div>
          </div>
          <div className="text-sm font-medium">{Math.round(progressPercentage)}%</div>
        </div>
        <Progress value={progressPercentage} className="h-1.5" />

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