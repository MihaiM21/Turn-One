'use client';

import React, { useState, useEffect } from 'react';
import { checkDailyGiftStatus, claimDailyGift } from '@/lib/dailyGiftService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Coins, TrendingUp } from 'lucide-react';

interface DailyGiftProps {
  authToken: string;
  onGiftClaimed?: () => void;
}

export function DailyGiftCard({ authToken, onGiftClaimed }: DailyGiftProps) {
  const [canClaim, setCanClaim] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkGiftStatus = async () => {
      if (!authToken) return;
      
      setIsChecking(true);
      try {
        const status = await checkDailyGiftStatus(authToken);
        setCanClaim(status.canClaimDailyGift);
      } catch (error) {
        console.error('Failed to check daily gift status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkGiftStatus();
  }, [authToken]);

  const handleClaimGift = async () => {
    if (!authToken || !canClaim) return;

    setIsLoading(true);
    try {
      const result = await claimDailyGift(authToken);
      
      if (result.success) {
        toast({
          title: 'Daily Gift Claimed!',
          description: (
            <div className="flex flex-col">
              <span>You received:</span>
              <span className="flex items-center gap-1"><Coins size={16} /> {result.coins} coins</span>
              <span className="flex items-center gap-1"><TrendingUp size={16} /> {result.experience} XP</span>
            </div>
          ),
          duration: 5000,
        });
        
        setCanClaim(false);
        if (onGiftClaimed) {
          onGiftClaimed();
        }
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to claim daily gift',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to claim daily gift',
        variant: 'destructive',
      });
      console.error('Error claiming daily gift:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Daily Gift
        </CardTitle>
        <CardDescription>
          Log in daily to claim your rewards
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isChecking ? (
          <div className="flex justify-center py-4">
            <div className="animate-pulse">Checking gift status...</div>
          </div>
        ) : canClaim ? (
          <div className="text-center py-4">
            <p className="mb-2">Your daily gift is ready!</p>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex flex-col items-center">
                <Coins className="h-8 w-8 text-yellow-500" />
                <p className="mt-2 font-semibold">50 Coins</p>
              </div>
              <div className="flex flex-col items-center">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <p className="mt-2 font-semibold">25 XP</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p>You've already claimed your daily gift.</p>
            <p className="text-sm text-muted-foreground mt-2">Come back tomorrow for more rewards!</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          onClick={handleClaimGift}
          disabled={isLoading || !canClaim}
          className="w-full"
        >
          {isLoading ? 'Claiming...' : canClaim ? 'Claim Gift' : 'Already Claimed'}
        </Button>
      </CardFooter>
    </Card>
  );
}