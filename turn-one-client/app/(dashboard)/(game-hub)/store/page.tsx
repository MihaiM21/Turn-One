'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  ShoppingCart,
  Coins,
  Star,
  Gift,
  Lock,
  Check,
  History,
  ArrowRight,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/live dashboard/dashboard-header';
import { PageHeader } from '@/components/dashboard/page-header';
import { ExploreMoreLinks } from '@/components/dashboard/explore-more-links';
import { coinService } from '@/lib/gameService';
import {
  fetchTokenStatus,
  purchaseTokens,
  claimStarterPack,
  getStarterPackStatus,
} from '@/lib/userService';
import { getAuthToken } from '@/lib/auth-utils';
import { toast } from '@/hooks/use-toast';
import { PurchaseDialog } from '@/components/dashboard/store/purchase-dialog';
import { TransactionHistory } from '@/components/dashboard/store/transaction-history';
import { StoreItem, storeItems } from '@/lib/constants/store_items';
import { notifyBalanceChanged } from '@/lib/balance-events';

export default function StorePage() {
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    loadBalances();
    loadPurchasedItems();
  }, []);

  const loadBalances = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const [coins, tokenStatus, starterPackStatus] = await Promise.all([
        coinService.getBalance(),
        fetchTokenStatus(token),
        getStarterPackStatus(token),
      ]);
      setCoinBalance(coins ?? 0);
      setTokenBalance(tokenStatus?.tokensRemaining ?? 0);

      if (starterPackStatus?.data?.hasClaimed) {
        setPurchasedItems((prev) =>
          prev.includes('starter-pack-free') ? prev : [...prev, 'starter-pack-free'],
        );
      }
    } catch (error) {
      console.error('Failed to load balances:', error);
      setCoinBalance(0);
      setTokenBalance(0);
    }
  };

  const loadPurchasedItems = () => {
    const purchased = localStorage.getItem('purchasedItems');
    if (purchased) {
      const items = JSON.parse(purchased);
      setPurchasedItems(items.filter((id: string) => id !== 'starter-pack-free'));
    }
  };

  const handlePurchase = (item: StoreItem) => {
    if (item.price > 0 && coinBalance < item.price) {
      toast({
        title: 'Insufficient Coins',
        description: `You need ${item.price - coinBalance} more coins to purchase this item.`,
        variant: 'destructive',
      });
      return;
    }
    setSelectedItem(item);
    setPurchaseDialogOpen(true);
  };

  const confirmPurchase = async () => {
    if (!selectedItem) return;

    setLoading(true);
    setPurchaseDialogOpen(false);

    try {
      if (selectedItem.id === 'starter-pack-free' && selectedItem.price === 0) {
        try {
          const token = getAuthToken();
          if (!token) {
            toast({
              title: 'Authentication Required',
              description: 'Please log in to claim the starter pack.',
              variant: 'destructive',
            });
            setLoading(false);
            setSelectedItem(null);
            return;
          }

          const result = await claimStarterPack(token);

          if (result.success) {
            setCoinBalance(result.data.newCoinBalance);
            setTokenBalance(result.data.newTokenBalance);
            setPurchasedItems((prev) => [...prev, selectedItem.id]);
            notifyBalanceChanged();
            toast({
              title: 'Welcome Gift Claimed! 🎉',
              description: `You've received 500 coins and 50 tokens to get started!`,
            });
          } else {
            toast({
              title: 'Already Claimed',
              description: result.message || 'You have already claimed the starter pack.',
              variant: 'destructive',
            });
          }
        } catch (error: any) {
          toast({
            title: 'Claim Failed',
            description: error.message || 'Failed to claim starter pack. Please try again.',
            variant: 'destructive',
          });
        }
        setLoading(false);
        setSelectedItem(null);
        return;
      }

      if (selectedItem.type === 'token-pack' && selectedItem.tokenAmount) {
        try {
          const token = getAuthToken();
          if (!token) {
            toast({
              title: 'Authentication Required',
              description: 'Please log in to purchase tokens.',
              variant: 'destructive',
            });
            return;
          }

          const result = await purchaseTokens(token, selectedItem.tokenAmount, selectedItem.price);

          if (result.success && result.data) {
            setCoinBalance(result.data.newCoinBalance);
            setTokenBalance(result.data.newTokenBalance);
            notifyBalanceChanged();
            toast({
              title: 'Tokens Purchased! 🎉',
              description: `You've bought ${selectedItem.tokenAmount} tokens. New token balance: ${result.data.newTokenBalance}`,
            });
          } else {
            throw new Error(result.message || 'Purchase failed');
          }
        } catch (error: any) {
          if (error.message.includes('Failed to fetch') || error.message.includes('404')) {
            const newCoinBalance = coinBalance - selectedItem.price;
            const newTokenBalance = tokenBalance + selectedItem.tokenAmount;
            setCoinBalance(newCoinBalance);
            setTokenBalance(newTokenBalance);
            localStorage.setItem('tokenBalance', newTokenBalance.toString());
            notifyBalanceChanged();
            toast({
              title: 'Tokens Purchased! 🎉',
              description: `You've bought ${selectedItem.tokenAmount} tokens. New token balance: ${newTokenBalance}`,
            });
          } else {
            throw error;
          }
        }
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const newBalance = coinBalance - selectedItem.price;
      setCoinBalance(newBalance);

      const newPurchased = [...purchasedItems, selectedItem.id];
      setPurchasedItems(newPurchased);
      localStorage.setItem('purchasedItems', JSON.stringify(newPurchased));
      notifyBalanceChanged();

      const transaction = {
        id: Date.now().toString(),
        amount: -selectedItem.price,
        type: 'PURCHASE' as const,
        description: `Purchased ${selectedItem.name}`,
        createdAt: new Date(),
      };
      const existingTransactions = localStorage.getItem('coinTransactions');
      const transactions = existingTransactions ? JSON.parse(existingTransactions) : [];
      transactions.unshift(transaction);
      localStorage.setItem('coinTransactions', JSON.stringify(transactions.slice(0, 50)));

      toast({
        title: 'Purchase Successful! 🎉',
        description: `You've purchased ${selectedItem.name}. Your new balance is ${newBalance.toLocaleString()} coins.`,
      });
    } catch (error: any) {
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Failed to purchase item. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setSelectedItem(null);
    }
  };

  const starterPack = storeItems.find((i) => i.id === 'starter-pack-free');
  const tokenPacks = storeItems.filter((i) => i.id !== 'starter-pack-free');
  const starterClaimed = starterPack ? purchasedItems.includes(starterPack.id) : true;

  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader />

      <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-4">
        <PageHeader
          label="Token store"
          title="Store"
          description="Spend coins on tokens and boosts."
          stats={[
            { icon: Coins, label: 'Coins', value: coinBalance.toLocaleString(), iconClassName: 'text-yellow-400' },
            { icon: Star, label: 'Tokens', value: tokenBalance.toLocaleString(), iconClassName: 'text-primary' },
          ]}
          actions={
            <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-sm border-zinc-800 bg-zinc-900/60 px-3 text-xs text-zinc-300 transition-colors hover:border-primary/40 hover:bg-zinc-900 hover:text-primary"
                >
                  <History className="h-3.5 w-3.5" />
                  History
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md border-zinc-800 bg-zinc-950 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <span className="block text-[10px] uppercase tracking-[0.3em] text-zinc-500">Transactions</span>
                    <span className="mt-0.5 block text-xl font-bold tracking-tight">History</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <TransactionHistory />
                </div>
              </SheetContent>
            </Sheet>
          }
        />

        {starterPack && !starterClaimed && (
          <StarterPackBanner
            item={starterPack}
            onClaim={() => handlePurchase(starterPack)}
            disabled={loading}
          />
        )}

        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Token packs</p>
              <h2 className="mt-0.5 text-lg font-bold tracking-tight">Top up your tokens</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tokenPacks.map((item) => (
              <StoreItemCard
                key={item.id}
                item={item}
                isPurchased={purchasedItems.includes(item.id)}
                canAfford={coinBalance >= item.price}
                onPurchase={() => handlePurchase(item)}
                disabled={loading}
              />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <InfoPanel
            label="About tokens"
            title="What are tokens?"
            bullets={[
              'Use tokens to access advanced AI predictions',
              'Unlock exclusive prediction features and analytics',
              'Refills automatically each month based on your plan',
              'Buy more anytime with coins earned from predictions',
            ]}
          />
          <InfoPanel
            label="Earn coins"
            title="How to earn more coins"
            bullets={[
              'Win predictions to earn up to 5x your wager back',
              'Complete daily trivia challenges for bonus coins',
              'Maintain win streaks for multiplier bonuses',
              'Claim your daily gift for free coins and XP',
            ]}
          />
        </section>

        <ExploreMoreLinks currentPage="/store" />
      </main>

      {selectedItem && (
        <PurchaseDialog
          open={purchaseDialogOpen}
          onOpenChange={setPurchaseDialogOpen}
          onConfirm={confirmPurchase}
          itemName={selectedItem.name}
          itemPrice={selectedItem.price}
          currentBalance={coinBalance}
        />
      )}
    </div>
  );
}

function StarterPackBanner({
  item,
  onClaim,
  disabled,
}: {
  item: StoreItem;
  onClaim: () => void;
  disabled: boolean;
}) {
  const Icon = item.icon;
  return (
    <section className="border border-zinc-800 border-l-4 border-l-yellow-500 bg-zinc-950 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-yellow-500/40 bg-yellow-500/10">
          <Icon className="h-6 w-6 text-yellow-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Welcome gift</p>
          <h3 className="mt-0.5 text-xl font-bold tracking-tight">{item.name}</h3>
          <p className="mt-0.5 text-sm text-zinc-400">{item.benefit} — claim once to get started.</p>
        </div>
        <Button
          onClick={onClaim}
          disabled={disabled}
          size="sm"
          className="rounded-sm bg-yellow-500 text-xs font-semibold text-black hover:bg-yellow-400"
        >
          <Gift className="mr-1.5 h-3.5 w-3.5" />
          Claim free
        </Button>
      </div>
    </section>
  );
}

function StoreItemCard({
  item,
  isPurchased,
  canAfford,
  onPurchase,
  disabled,
}: {
  item: StoreItem;
  isPurchased: boolean;
  canAfford: boolean;
  onPurchase: () => void;
  disabled: boolean;
}) {
  const Icon = item.icon;
  const unavailable = !item.available;
  const cannotBuy = !item.available || isPurchased || (item.price > 0 && !canAfford) || disabled;

  return (
    <div
      className={`relative flex h-full flex-col border border-zinc-800 bg-zinc-950 transition-colors hover:border-zinc-700 ${
        item.popular ? 'border-l-4 border-l-primary' : ''
      } ${unavailable ? 'opacity-60' : ''}`}
    >
      {item.popular && (
        <div className="absolute right-3 top-3">
          <span className="border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
            Popular
          </span>
        </div>
      )}

      <div className="flex items-start gap-4 px-5 pt-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-primary/30 bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1 pr-16">
          <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Token pack</p>
          <h3 className="mt-0.5 truncate text-base font-bold tracking-tight">{item.name}</h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{item.description}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-800/60 px-5 py-3">
        <span className="text-[11px] uppercase tracking-wider text-zinc-500">Includes</span>
        <span className="font-mono text-xs font-semibold tabular-nums text-foreground">{item.benefit}</span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-800 px-5 py-4">
        <div className="flex items-baseline gap-1.5">
          {item.price === 0 ? (
            <span className="text-xl font-black tracking-tight text-primary">FREE</span>
          ) : (
            <>
              <Coins className="h-4 w-4 text-yellow-400" />
              <span className="font-mono text-xl font-black tabular-nums">{item.price.toLocaleString()}</span>
            </>
          )}
        </div>

        <Button
          onClick={onPurchase}
          disabled={cannotBuy}
          size="sm"
          variant={isPurchased ? 'outline' : 'default'}
          className={`gap-1.5 rounded-sm text-xs font-semibold ${
            isPurchased
              ? 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
              : unavailable
                ? ''
                : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {isPurchased ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Owned
            </>
          ) : unavailable ? (
            <>
              <Lock className="h-3.5 w-3.5" />
              Soon
            </>
          ) : item.price === 0 ? (
            <>
              <Gift className="h-3.5 w-3.5" />
              Claim
            </>
          ) : (
            <>
              <ShoppingCart className="h-3.5 w-3.5" />
              Buy
            </>
          )}
        </Button>
      </div>

      {!canAfford && item.available && !isPurchased && item.price > 0 && (
        <p className="border-t border-zinc-800/60 px-5 py-2 text-center text-[11px] text-red-400/80">
          Not enough coins
        </p>
      )}
    </div>
  );
}

function InfoPanel({
  label,
  title,
  bullets,
}: {
  label: string;
  title: string;
  bullets: string[];
}) {
  return (
    <div className="border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-5 py-4">
        <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{label}</p>
        <p className="mt-0.5 font-bold">{title}</p>
      </div>
      <ul className="divide-y divide-zinc-800/60">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-3 px-5 py-3 text-sm text-zinc-400">
            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-700" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
