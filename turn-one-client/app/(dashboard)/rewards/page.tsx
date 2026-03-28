'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DailyGiftCard } from '@/components/dashboard/daily-gift-card';
import { UserLevelProgress } from '@/components/dashboard/user-level-progress';
import { UserStatsWidget } from '@/components/dashboard/user-stats-widget';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Gift, Trophy, Coins, TrendingUp, Clock3, RefreshCw } from 'lucide-react';
import { ExploreMoreLinks } from '@/components/dashboard/explore-more-links';
import { getAuthToken } from '@/lib/auth-utils';
import { fetchUserProfile } from '@/lib/userService';
import { getLevelProgress, type LevelProgress } from '@/lib/levelSystemService';
import { checkDailyGiftStatus } from '@/lib/dailyGiftService';

interface RewardsProfile {
  coins: number;
  level: number;
  experience: number;
  canClaimDailyGift: boolean;
  lastDailyGiftDate?: string | null;
}

export default function DailyRewards() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<RewardsProfile | null>(null);
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadLiveRewardsData = useCallback(async (token: string) => {
    setIsLoadingSummary(true);
    setSummaryError(false);

    try {
      const [profileData, progressData, giftStatus] = await Promise.all([
        fetchUserProfile(token),
        getLevelProgress(token),
        checkDailyGiftStatus(token),
      ]);

      setProfile({
        coins: profileData.coins ?? 0,
        level: profileData.level ?? 1,
        experience: profileData.experience ?? 0,
        canClaimDailyGift: giftStatus.canClaimDailyGift,
        lastDailyGiftDate: profileData.lastDailyGiftDate ?? null,
      });
      setLevelProgress(progressData);
    } catch (error) {
      console.error('Failed to load rewards summary:', error);
      setSummaryError(true);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    setAuthToken(token);

    if (token) {
      loadLiveRewardsData(token);
    }
  }, [loadLiveRewardsData, refreshKey]);

  const refreshAllWidgets = () => {
    setRefreshKey((current) => current + 1);
  };

  const formatLastClaim = (value?: string | null) => {
    if (!value) return 'No claim recorded yet';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Unknown';

    return parsed.toLocaleString();
  };

  const levelFormulaPreview = profile ? 100 * profile.level + 100 : null;

  const handleGiftClaimed = () => {
    refreshAllWidgets();
  };

  const renderLiveSummary = () => {
    if (isLoadingSummary) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <div className="inline-flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading live rewards data...
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!profile || !levelProgress || summaryError) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Live Rewards Summary</CardTitle>
            <CardDescription>Could not load live reward data.</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              onClick={refreshAllWidgets}
              className="text-sm font-medium text-primary hover:underline"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Coins</p>
              <p className="mt-1 text-2xl font-semibold">{profile.coins}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Level</p>
              <p className="mt-1 text-2xl font-semibold">{levelProgress.currentLevel}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">XP Progress</p>
              <p className="mt-1 text-2xl font-semibold">
                {levelProgress.currentExperience}/{levelProgress.experienceRequired}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Daily Gift</p>
              <div className="mt-2">
                <Badge variant={profile.canClaimDailyGift ? 'default' : 'secondary'}>
                  {profile.canClaimDailyGift ? 'Available now' : 'Already claimed today'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 text-sm font-semibold">Current reward rules</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Daily gift gives +50 coins and +25 XP (once per UTC day).
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  XP required for next level uses 100 x level + 100.
                </li>
                <li className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  Last gift claim: {formatLastClaim(profile.lastDailyGiftDate)}
                </li>
              </ul>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-2 text-sm font-semibold">Next milestone</h3>
              <p className="text-sm text-muted-foreground">
                You are {Math.max(levelProgress.experienceRequired - levelProgress.currentExperience, 0)} XP away from your next level.
              </p>
              {levelFormulaPreview !== null && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {levelFormulaPreview} XP required.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 pb-12">
      <div className="mb-6 flex items-center">
        <Trophy className="mr-3 h-8 w-8 text-yellow-500" />
        <div>
          <h1 className="text-3xl font-bold">Rewards</h1>
        </div>
      </div>

      {authToken ? (
        <>
          {renderLiveSummary()}

          <Separator className="my-8" />

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <UserStatsWidget key={`stats-${refreshKey}`} />
            <DailyGiftCard
              key={`gift-${refreshKey}`}
              authToken={authToken}
              onGiftClaimed={handleGiftClaimed}
            />
          </div>

          <Separator className="my-8" />


          
        </>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <Gift className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <h3 className="mb-2 text-xl font-semibold">Please Log In</h3>
              <p className="text-muted-foreground">Log in to view your rewards and level progress</p>
            </div>
          </CardContent>
        </Card>
      )}

      <ExploreMoreLinks currentPage="/rewards" />
    </div>
  );
}
