'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getLevelProgress, LevelProgress } from '@/lib/levelSystemService';
import { getAuthToken } from '@/lib/auth-utils';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';

export const UserLevelProgress: React.FC = () => {
  // We need to get the auth token from somewhere
  const [authToken, setAuthToken] = useState<string | null>(null);
  const { toast } = useToast();
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    // Use our auth utils to get the token
    const token = getAuthToken();
    console.log("UserLevelProgress - Auth token available:", !!token);
    setAuthToken(token);
  }, []);

  const fetchLevelProgress = async () => {
    if (!authToken) {
      console.log("No auth token available for level progress");
      setLoading(false);
      setError(true);
      return;
    }

    console.log("Fetching level progress with token", authToken.substring(0, 10) + "...");
    try {
      setLoading(true);
      setError(false);
      const progress = await getLevelProgress(authToken);
      console.log("Level progress received:", progress);
      setLevelProgress(progress);
    } catch (error) {
      console.error('Error fetching level progress:', error);
      setError(true);
      toast({
        title: 'Error',
        description: 'Failed to fetch level progress',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevelProgress();
  }, [authToken]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Level Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24">
            <div className="animate-pulse text-center">Loading level data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!levelProgress || error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {error && <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />}
            <span>Level Progress</span>
          </CardTitle>
          {error && (
            <CardDescription>
              Unable to load your level data
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                There was a problem loading your level progress.
              </p>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => fetchLevelProgress()}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-2 w-2/3 bg-muted rounded"></div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>Level {levelProgress.currentLevel}</span>
          <span>{Math.round(levelProgress.progressPercentage)}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={levelProgress.progressPercentage} className="h-2" />
        <div className="mt-2 text-sm text-muted-foreground flex justify-between">
          <span>XP: {levelProgress.currentExperience}</span>
          <span>Next Level: {levelProgress.experienceRequired} XP</span>
        </div>
      </CardContent>
    </Card>
  );
};