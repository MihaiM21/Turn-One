'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  Coins, 
  Zap, 
  Star, 
  Crown,
  Gift,
  Sparkles,
  TrendingUp,
  Lock,
  Check,
  History,
  Shield,
  Rocket,
  Target
} from 'lucide-react';
import { DashboardHeader } from "@/components/dashboard/live dashboard/dashboard-header";
import { coinService } from '@/lib/gameService';
import { fetchTokenStatus, purchaseTokens, claimStarterPack, getStarterPackStatus } from '@/lib/userService';
import { getAuthToken } from '@/lib/auth-utils';
import { toast } from '@/hooks/use-toast';
import { PurchaseDialog } from '@/components/dashboard/store/purchase-dialog';
import { TransactionHistory } from '@/components/dashboard/store/transaction-history';
import { StoreItem, storeItems  } from '@/lib/constants/store_items';

export default function StorePage() {
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

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
        getStarterPackStatus(token)
      ]);
      setCoinBalance(coins ?? 0);
      setTokenBalance(tokenStatus?.tokensRemaining ?? 0);
      
      // Update purchased items if starter pack has been claimed
      if (starterPackStatus?.data?.hasClaimed) {
        setPurchasedItems(prev => {
          if (!prev.includes('starter-pack-free')) {
            return [...prev, 'starter-pack-free'];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Failed to load balances:', error);
      // Ensure balances are set to 0 on error
      setCoinBalance(0);
      setTokenBalance(0);
    }
  };

  const loadPurchasedItems = () => {
    // Purchased items will be loaded from the API in loadBalances
    // Keep this for backward compatibility with other items if needed
    const purchased = localStorage.getItem('purchasedItems');
    if (purchased) {
      const items = JSON.parse(purchased);
      // Filter out starter-pack-free as it's now tracked in DB
      setPurchasedItems(items.filter((id: string) => id !== 'starter-pack-free'));
    }
  };

  const handlePurchase = async (item: StoreItem) => {
    // Free items can be claimed without balance check
    if (item.price > 0 && coinBalance < item.price) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${item.price - coinBalance} more coins to purchase this item.`,
        variant: "destructive"
      });
      return;
    }

    // Open confirmation dialog
    setSelectedItem(item);
    setPurchaseDialogOpen(true);
  };

  const confirmPurchase = async () => {
    if (!selectedItem) return;

    setLoading(true);
    setPurchaseDialogOpen(false);

    try {
      // Handle free starter pack
      if (selectedItem.id === 'starter-pack-free' && selectedItem.price === 0) {
        try {
          const token = getAuthToken();
          if (!token) {
            toast({
              title: "Authentication Required",
              description: "Please log in to claim the starter pack.",
              variant: "destructive"
            });
            setLoading(false);
            setSelectedItem(null);
            return;
          }
          
          const result = await claimStarterPack(token);
          
          if (result.success) {
            setCoinBalance(result.data.newCoinBalance);
            setTokenBalance(result.data.newTokenBalance);
            
            // Mark as purchased
            setPurchasedItems(prev => [...prev, selectedItem.id]);
            
            toast({
              title: "Welcome Gift Claimed! 🎉",
              description: `You've received 500 coins and 50 tokens to get started!`,
            });
          } else {
            toast({
              title: "Already Claimed",
              description: result.message || "You have already claimed the starter pack.",
              variant: "destructive"
            });
          }
        } catch (error: any) {
          toast({
            title: "Claim Failed",
            description: error.message || "Failed to claim starter pack. Please try again.",
            variant: "destructive"
          });
        }
        setLoading(false);
        setSelectedItem(null);
        return;
      }

      // Handle token purchases differently
      if (selectedItem.type === 'token-pack' && selectedItem.tokenAmount) {
        try {
          const token = getAuthToken();
          if (!token) {
            toast({
              title: "Authentication Required",
              description: "Please log in to purchase tokens.",
              variant: "destructive"
            });
            return;
          }
          
          const result = await purchaseTokens(token, selectedItem.tokenAmount, selectedItem.price);
          
          if (result.success && result.data) {
            setCoinBalance(result.data.newCoinBalance);
            setTokenBalance(result.data.newTokenBalance);
            
            toast({
              title: "Tokens Purchased! 🎉",
              description: `You've bought ${selectedItem.tokenAmount} tokens. New token balance: ${result.data.newTokenBalance}`,
            });
          } else {
            throw new Error(result.message || "Purchase failed");
          }
        } catch (error: any) {
          // Fallback to simulated purchase if API not implemented yet
          if (error.message.includes('Failed to fetch') || error.message.includes('404')) {
            const newCoinBalance = coinBalance - selectedItem.price;
            const newTokenBalance = tokenBalance + selectedItem.tokenAmount;
            
            setCoinBalance(newCoinBalance);
            setTokenBalance(newTokenBalance);
            
            // Store in localStorage
            localStorage.setItem('tokenBalance', newTokenBalance.toString());
            
            toast({
              title: "Tokens Purchased! 🎉",
              description: `You've bought ${selectedItem.tokenAmount} tokens. New token balance: ${newTokenBalance}`,
            });
          } else {
            throw error;
          }
        }
        return;
      }

      // Regular item purchase (existing logic)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newBalance = coinBalance - selectedItem.price;
      setCoinBalance(newBalance);
      
      const newPurchased = [...purchasedItems, selectedItem.id];
      setPurchasedItems(newPurchased);
      localStorage.setItem('purchasedItems', JSON.stringify(newPurchased));
      
      // Create a simulated transaction
      const transaction = {
        id: Date.now().toString(),
        amount: -selectedItem.price,
        type: 'PURCHASE' as const,
        description: `Purchased ${selectedItem.name}`,
        createdAt: new Date()
      };
      
      // Store transaction in localStorage for history
      const existingTransactions = localStorage.getItem('coinTransactions');
      const transactions = existingTransactions ? JSON.parse(existingTransactions) : [];
      transactions.unshift(transaction);
      localStorage.setItem('coinTransactions', JSON.stringify(transactions.slice(0, 50)));
      
      toast({
        title: "Purchase Successful! 🎉",
        description: `You've purchased ${selectedItem.name}. Your new balance is ${newBalance.toLocaleString()} coins.`,
      });
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setSelectedItem(null);
    }
  };

  const StoreItemCard = ({ item }: { item: StoreItem }) => {
    const isPurchased = purchasedItems.includes(item.id);
    const canAfford = coinBalance >= item.price;

    return (
      <Card className={`relative border bg-gradient-to-br ${item.color} ${item.borderColor} 
                      ${item.available ? 'hover:shadow-xl hover:scale-105 transition-all duration-300' : 'opacity-60'} 
                      ${item.popular ? 'ring-2 ring-primary/40' : ''}`}>
        {item.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <Badge className="bg-primary shadow-lg px-3">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Popular
            </Badge>
          </div>
        )}
        
        <CardHeader>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-background/50 backdrop-blur-md ring-1 ring-border">
              <item.icon className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-2">
              {!item.available && (
                <Badge variant="outline" className="bg-background/50 border-muted">
                  <Lock className="w-3 h-3 mr-1" />
                  Coming Soon
                </Badge>
              )}
              {isPurchased && (
                <Badge className="bg-green-500/15 border-green-500/30 text-green-500 border">
                  <Check className="w-3 h-3 mr-1" />
                  Owned
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-lg mb-2">{item.name}</CardTitle>
          <CardDescription className="text-sm">{item.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/60 backdrop-blur-sm border border-border/50">
            <span className="text-sm font-semibold text-primary">{item.benefit}</span>
            {item.duration && (
              <Badge variant="secondary" className="text-xs">{item.duration}</Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {item.price === 0 ? (
                <span className="text-2xl font-bold text-primary">FREE</span>
              ) : (
                <>
                  <Coins className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">{item.price.toLocaleString()}</span>
                </>
              )}
            </div>
            
            <Button 
              onClick={() => handlePurchase(item)}
              disabled={!item.available || isPurchased || (item.price > 0 && !canAfford) || loading}
              size="lg"
              className="gap-2 min-w-[100px]"
              variant={isPurchased ? "outline" : "default"}
            >
              {isPurchased ? (
                <>
                  <Check className="w-4 h-4" />
                  {item.price === 0 ? 'Claimed' : 'Owned'}
                </>
              ) : !item.available ? (
                <>
                  <Lock className="w-4 h-4" />
                  Soon
                </>
              ) : item.price === 0 ? (
                <>
                  <Gift className="w-4 h-4" />
                  Claim Free
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Buy Now
                </>
              )}
            </Button>
          </div>

          {!canAfford && item.available && !isPurchased && item.price > 0 && (
            <p className="text-xs text-red-400 text-center pt-1">
              Need {(item.price - coinBalance).toLocaleString()} more coins
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background/95 via-background to-background/98">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Badge variant="outline" 
                className="px-5 py-2 bg-primary/5 backdrop-blur-md 
                         border-primary/20 hover:border-primary/30 transition-all duration-300 
                         flex items-center gap-3">
                <Star className="w-4 h-4 text-primary" />
                <span className="font-medium tracking-wide text-primary">
                  Token Store
                </span>
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
              Get Tokens for Premium Features
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Claim your free starter pack or purchase tokens with earned coins
            </p>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="border-primary/10 bg-primary/5 backdrop-blur-md hover:shadow-lg hover:border-primary/20 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 ring-1 ring-primary/20">
                    <Coins className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Coins</p>
                    <p className="text-3xl font-bold text-foreground">
                      {(coinBalance ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Token Balance */}
            <Card className="border-primary/10 bg-primary/5 backdrop-blur-md hover:shadow-lg hover:border-primary/20 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 ring-1 ring-primary/20">
                    <Star className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Tokens</p>
                    <p className="text-3xl font-bold text-foreground">
                      {(tokenBalance ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Store Tabs */}
          <Tabs defaultValue="store" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid bg-background/50 backdrop-blur-md border border-border/50 p-1">
              <TabsTrigger value="store" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">Store</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="store">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Tokens & Starter Pack</h2>
              <p className="text-sm text-muted-foreground">Claim your free starter pack or purchase tokens using your coins</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {storeItems.map(item => (
                <StoreItemCard key={item.id} item={item} />
              ))}
            </div>
            <Card className="mt-6 border-primary/10 bg-primary/5 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10 ring-1 ring-primary/20">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">What are Tokens?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                        <p className="text-sm text-muted-foreground">Use tokens to access advanced AI predictions</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                        <p className="text-sm text-muted-foreground">Unlock exclusive prediction features and analytics</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                        <p className="text-sm text-muted-foreground">Refills automatically each month based on your plan</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                        <p className="text-sm text-muted-foreground">Buy more anytime with coins earned from predictions</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <TransactionHistory />
          </TabsContent>
        </Tabs>

        {/* Info Banner */}
        <Card className="mt-10 border-primary/10 bg-primary/5 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10 ring-1 ring-primary/20">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-3">How to Earn More Coins</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                    <p className="text-sm text-muted-foreground">Win predictions to earn up to 5x your wager back</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                    <p className="text-sm text-muted-foreground">Complete daily trivia challenges for bonus coins</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                    <p className="text-sm text-muted-foreground">Maintain win streaks for multiplier bonuses</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                    <p className="text-sm text-muted-foreground">Claim your daily gift for free coins and XP</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Confirmation Dialog */}
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
