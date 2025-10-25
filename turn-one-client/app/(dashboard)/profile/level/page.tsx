'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UserLevelProgress } from '@/components/dashboard/user-level-progress';
import { AddXpAction } from '@/components/dashboard/add-xp-action';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExperienceResult } from '@/lib/levelSystemService';

export default function UserProfilePage() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const { toast } = useToast();
  const [levelUpdated, setLevelUpdated] = useState(false);
  
  useEffect(() => {
    // In a real implementation, you would get this from a provider or context
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    setAuthToken(token);
  }, []);
  
  const handleXpAdded = (result: ExperienceResult) => {
    // If the user leveled up, show a celebratory message
    if (result.levelsGained > 0) {
      toast({
        title: '🎉 Level Up!',
        description: `Congratulations! You've reached Level ${result.currentLevel}!`,
        variant: 'default',
        duration: 5000,
      });
    }
    
    // Trigger UI refresh
    setLevelUpdated(prev => !prev);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User level progress component */}
        <div className="col-span-1">
          <UserLevelProgress key={`level-${levelUpdated}`} />
        </div>
        
        {/* Add XP component (only for demo/testing or admin use) */}
        {authToken && (
          <div className="col-span-1">
            <AddXpAction authToken={authToken} onXpAdded={handleXpAdded} />
          </div>
        )}
        
        <div className="col-span-1 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>How to Earn XP</CardTitle>
              <CardDescription>Complete these actions to level up</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>Watch a live race (+50 XP)</li>
                <li>Analyze race data (+30 XP)</li>
                <li>View driver statistics (+10 XP)</li>
                <li>Complete your profile (+20 XP)</li>
                <li>Daily login streak (+5 XP per day, +25 XP for 5 consecutive days)</li>
                <li>Engage with the community (+15 XP)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}