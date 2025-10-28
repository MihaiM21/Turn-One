'use client';

import React, { useState, useEffect } from 'react';
import { checkDailyGiftStatus, claimDailyGift } from '@/lib/dailyGiftService';
import { useToast } from '@/hooks/use-toast';
import { getAuthToken } from '@/lib/auth-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Check, Loader2, AlertTriangle } from 'lucide-react';

interface DailyGiftWidgetProps {
  onGiftClaimed?: () => void;
}

export function DailyGiftWidget({ onGiftClaimed }: DailyGiftWidgetProps) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [canClaim, setCanClaim] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  // Function to check gift status
  const checkGiftStatus = async (token: string) => {
    setIsChecking(true);
    try {
      const status = await checkDailyGiftStatus(token);
      setCanClaim(status.canClaimDailyGift);
      setHasError(false);
    } catch (error) {
      setHasError(true);
      setCanClaim(false);
    } finally {
      setIsChecking(false);
    }
  };
  
  useEffect(() => {
    // Get token from auth utils
    const token = getAuthToken();
    setAuthToken(token);
    
    if (!token) {
      setIsChecking(false);
      setHasError(true);
      return;
    }

    // Check gift status for this specific user
    checkGiftStatus(token);
    
    // Re-check status when component gains focus (user might switch between accounts in different tabs)
    const handleFocus = () => {
      if (token) {
        checkGiftStatus(token);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleClaimGift = async () => {
    if (!authToken || !canClaim) return;

    setIsLoading(true);
    try {
      const result = await claimDailyGift(authToken);
      
      if (result.success) {
        toast({
          title: '🎁 Daily Gift Claimed!',
          description: `You received ${result.coins} coins and ${result.experience} XP!`,
          duration: 5000,
        });
        
        // Re-check the gift status with the server to ensure it's properly updated
        await checkGiftStatus(authToken);
        
        // Notify parent component if needed
        if (onGiftClaimed) {
          onGiftClaimed();
        }
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to claim daily gift',
          variant: 'destructive',
        });
        
        // Re-check status in case the backend status has changed
        await checkGiftStatus(authToken);
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

  if (isChecking) {
    return (
      <Card className="bg-background/60 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span>Checking daily gift status...</span>
        </CardContent>
      </Card>
    );
  }

  // If there's no auth token, show a message
  if (!authToken) {
    return (
      <Card className="bg-background/60 backdrop-blur-sm border-red-500/30">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center text-lg">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Auth Required
            </CardTitle>
          </div>
          <CardDescription>
            Please log in to claim daily gifts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Log in to receive 50 coins and 25 XP daily!
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Show error state when API connection fails
  if (hasError) {
    return (
      <Card className="bg-background/60 backdrop-blur-sm border-red-500/30">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center text-lg">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Connection Error
            </CardTitle>
          </div>
          <CardDescription>
            Unable to check gift status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => window.location.reload()}
            size="sm"
            className="w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-background/60 backdrop-blur-sm ${canClaim ? 'border-yellow-500/50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-lg">
            <Gift className="h-5 w-5 mr-2" />
            Daily Gift
          </CardTitle>
          {canClaim && (
            <Badge variant="secondary" className="bg-yellow-500/50 text-yellow-200">
              Available!
            </Badge>
          )}
        </div>
        <CardDescription>
          {canClaim 
            ? "Claim your daily 50 coins and 25 XP!" 
            : "You've already claimed your gift today. Come back tomorrow!"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-center">
          <Button
            onClick={handleClaimGift}
            disabled={isLoading || !canClaim}
            size="sm"
            className={`w-full ${canClaim ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-muted'}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claiming...
              </>
            ) : canClaim ? (
              <>
                <Gift className="mr-2 h-4 w-4" />
                Claim Gift
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Claimed
              </>
            )}
          </Button>
        </div>
        
        <div className="text-center pt-1">
          <a href="/rewards" className="text-xs text-primary hover:underline">
            View all rewards
          </a>
        </div>
      </CardContent>
    </Card>
  );
}