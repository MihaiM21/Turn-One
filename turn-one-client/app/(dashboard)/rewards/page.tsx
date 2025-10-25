'use client';

import React, { useState, useEffect } from 'react';
import { DailyGiftCard } from '@/components/dashboard/daily-gift-card';
import { UserLevelProgress } from '@/components/dashboard/user-level-progress';
import { UserStatsWidget } from '@/components/dashboard/user-stats-widget';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Gift, Trophy, Coins, TrendingUp } from 'lucide-react';

export default function DailyRewards() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  useEffect(() => {
    // In a real implementation, you would get this from a provider or context
    // For now, we'll try to get it from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setAuthToken(token);
  }, []);

  const handleGiftClaimed = () => {
    // Refresh the UI components that should update when a gift is claimed
    // This could trigger a re-fetch of user data
    window.location.reload();
  };

  return (
    <div className="container mx-auto p-4 pb-12">
      <div className="flex items-center mb-6">
        <Trophy className="h-8 w-8 mr-3 text-yellow-500" />
        <h1 className="text-3xl font-bold">Rewards & Leveling</h1>
      </div>
      
      {authToken ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <UserStatsWidget />
            <DailyGiftCard 
              authToken={authToken}
              onGiftClaimed={handleGiftClaimed} 
            />
          </div>
          
          <Separator className="my-8" />
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2" />
              Level System
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>How to Earn XP</CardTitle>
                  <CardDescription>Complete these actions to level up</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Daily login <span className="text-green-500 font-medium">+25 XP</span></li>
                    <li>Watch a live race <span className="text-green-500 font-medium">+50 XP</span></li>
                    <li>Analyze race data <span className="text-green-500 font-medium">+30 XP</span></li>
                    <li>View driver statistics <span className="text-green-500 font-medium">+10 XP</span></li>
                    <li>Complete your profile <span className="text-green-500 font-medium">+20 XP</span></li>
                    <li>Engage with the community <span className="text-green-500 font-medium">+15 XP</span></li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Level Benefits</CardTitle>
                  <CardDescription>Unlock new features as you level up</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Level 2: Advanced statistics</li>
                    <li>Level 5: Custom dashboard layouts</li>
                    <li>Level 10: Exclusive predictions</li>
                    <li>Level 15: Special badges</li>
                    <li>Level 20: VIP access</li>
                    <li>Level 25: Bonus coins multiplier</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Level Progress</CardTitle>
                  <CardDescription>Track your journey</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <UserLevelProgress />
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Coins className="h-6 w-6 mr-2" />
              Coin System
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>How to Earn Coins</CardTitle>
                  <CardDescription>Ways to collect coins</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Daily login <span className="text-yellow-500 font-medium">+50 coins</span></li>
                    <li>Level up <span className="text-yellow-500 font-medium">+100 coins</span></li>
                    <li>Correct race predictions <span className="text-yellow-500 font-medium">+20-200 coins</span></li>
                    <li>Participate in events <span className="text-yellow-500 font-medium">+25-500 coins</span></li>
                    <li>Referral bonuses <span className="text-yellow-500 font-medium">+250 coins</span></li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Spend Your Coins</CardTitle>
                  <CardDescription>Where to use your coins</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Custom avatars (100-500 coins)</li>
                    <li>Exclusive themes (200-1000 coins)</li>
                    <li>Special predictions (50-250 coins)</li>
                    <li>Data exports (150-500 coins)</li>
                    <li>Premium features (varies)</li>
                  </ul>
                  <div className="mt-4">
                    <a href="/store" className="text-primary hover:underline">
                      Visit Coin Store →
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex justify-center items-center p-12">
            <div className="text-center">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Please Log In</h3>
              <p className="text-muted-foreground">
                Log in to view your rewards and level progress
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}