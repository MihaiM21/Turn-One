'use client';

import React, { useState, useEffect } from 'react';
import { checkDailyGiftStatus, claimDailyGift } from '@/lib/dailyGiftService';
import { useToast } from '@/hooks/use-toast';
import { getAuthToken } from '@/lib/auth-utils';
import { notifyBalanceChanged } from '@/lib/balance-events';
import { Button } from '@/components/ui/button';
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

  const checkGiftStatus = async (token: string) => {
    setIsChecking(true);
    try {
      const status = await checkDailyGiftStatus(token);
      setCanClaim(status.canClaimDailyGift);
      setHasError(false);
    } catch {
      setHasError(true);
      setCanClaim(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    setAuthToken(token);
    if (!token) { setIsChecking(false); setHasError(true); return; }
    checkGiftStatus(token);
    const handleFocus = () => { if (token) checkGiftStatus(token); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleClaimGift = async () => {
    if (!authToken || !canClaim) return;
    setIsLoading(true);
    try {
      const result = await claimDailyGift(authToken);
      if (result.success) {
        notifyBalanceChanged();
        toast({
          title: '🎁 Daily Gift Claimed!',
          description: `You received ${result.coins} coins and ${result.experience} XP!`,
          duration: 5000,
        });
        await checkGiftStatus(authToken);
        onGiftClaimed?.();
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to claim daily gift', variant: 'destructive' });
        await checkGiftStatus(authToken);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to claim daily gift', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex h-full min-h-[120px] items-center justify-center border border-border bg-card px-5 py-6 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking...
      </div>
    );
  }

  if (!authToken) {
    return (
      <div className="border border-border bg-card px-5 py-5">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Daily Reward</p>
        <div className="mt-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground/70" />
          <p className="text-sm font-semibold text-muted-foreground">Login to claim</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground/70">50 coins + 25 XP daily</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="border border-border bg-card px-5 py-5">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Daily Reward</p>
        <div className="mt-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500/70" />
          <p className="text-sm font-semibold">Connection error</p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          size="sm"
          variant="outline"
          className="mt-3 w-full rounded-sm border-muted-foreground/30 text-xs hover:border-muted-foreground/40"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={`h-full border border-border bg-card transition-colors ${
      canClaim ? 'border-l-4 border-l-yellow-500' : ''
    }`}>
      <div className="flex h-full flex-col px-5 py-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Daily Reward</p>
            <p className="mt-0.5 font-bold">{canClaim ? 'Available' : 'Claimed'}</p>
          </div>
          <Gift className={`h-5 w-5 ${canClaim ? 'text-yellow-400' : 'text-muted-foreground/50'}`} />
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {canClaim ? '50 coins + 25 XP waiting for you' : 'Come back tomorrow for your next reward'}
        </p>

        <div className="mt-auto space-y-2 pt-4">
          <Button
            onClick={handleClaimGift}
            disabled={isLoading || !canClaim}
            size="sm"
            className={`w-full rounded-sm text-xs font-semibold ${
              canClaim
                ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                : 'bg-border text-muted-foreground cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Claiming...</>
            ) : canClaim ? (
              <><Gift className="mr-1.5 h-3.5 w-3.5" />Claim Gift</>
            ) : (
              <><Check className="mr-1.5 h-3.5 w-3.5" />Claimed</>
            )}
          </Button>
          <div className="text-center">
            <a href="/rewards" className="text-[11px] text-muted-foreground/70 transition-colors hover:text-muted-foreground">
              View all rewards →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
