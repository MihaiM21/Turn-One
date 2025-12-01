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
  Check
} from 'lucide-react';
import { DashboardHeader } from "@/components/dashboard/live dashboard/dashboard-header";
import { coinService } from '@/lib/gameService';
import { toast } from '@/hooks/use-toast';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'boost' | 'unlock' | 'cosmetic' | 'prediction-pack';
  icon: any;
  color: string;
  borderColor: string;
  benefit: string;
  duration?: string;
  available: boolean;
  popular?: boolean;
}

export default function PredictionStorePage() {
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const balance = await coinService.getBalance();
      setCoinBalance(balance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const storeItems: StoreItem[] = [
    {
      id: 'prediction-boost-1d',
      name: 'Prediction Multiplier',
      description: 'Double your prediction rewards for 24 hours',
      price: 500,
      type: 'boost',
      icon: TrendingUp,
      color: 'from-blue-500/10 to-purple-500/10',
      borderColor: 'border-blue-500/30',
      benefit: '2x Rewards',
      duration: '24 hours',
      available: true,
      popular: true
    },
    {
      id: 'prediction-boost-7d',
      name: 'Weekly Boost',
      description: '1.5x prediction rewards for 7 days',
      price: 2000,
      type: 'boost',
      icon: Zap,
      color: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/30',
      benefit: '1.5x Rewards',
      duration: '7 days',
      available: true
    },
    {
      id: 'premium-predictions',
      name: 'Premium Predictions',
      description: 'Access exclusive high-stakes prediction events',
      price: 1500,
      type: 'unlock',
      icon: Crown,
      color: 'from-yellow-500/10 to-orange-500/10',
      borderColor: 'border-yellow-500/30',
      benefit: 'Exclusive Access',
      available: true
    },
    {
      id: 'prediction-pack-small',
      name: 'Starter Pack',
      description: '1000 coins to boost your prediction game',
      price: 0, // Free or earned through achievements
      type: 'prediction-pack',
      icon: Gift,
      color: 'from-green-500/10 to-emerald-500/10',
      borderColor: 'border-green-500/30',
      benefit: '1000 Coins',
      available: true
    },
    {
      id: 'prediction-insurance',
      name: 'Prediction Insurance',
      description: 'Get 50% of your wager back on losses',
      price: 1000,
      type: 'boost',
      icon: Star,
      color: 'from-orange-500/10 to-red-500/10',
      borderColor: 'border-orange-500/30',
      benefit: '50% Refund',
      duration: '5 predictions',
      available: true,
      popular: true
    },
    {
      id: 'early-access',
      name: 'Early Predictions',
      description: 'Place predictions before everyone else',
      price: 2500,
      type: 'unlock',
      icon: Sparkles,
      color: 'from-pink-500/10 to-purple-500/10',
      borderColor: 'border-pink-500/30',
      benefit: '24h Early Access',
      available: true
    },
    {
      id: 'guaranteed-win',
      name: 'Guaranteed Win Streak',
      description: 'Start with a 3-win streak bonus',
      price: 3000,
      type: 'boost',
      icon: Crown,
      color: 'from-yellow-500/10 to-amber-500/10',
      borderColor: 'border-yellow-500/30',
      benefit: '+3 Streak',
      available: false
    },
    {
      id: 'vip-predictions',
      name: 'VIP Predictor',
      description: 'Unlock all premium features for a month',
      price: 5000,
      type: 'unlock',
      icon: Crown,
      color: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/30',
      benefit: 'All Features',
      duration: '30 days',
      available: false
    }
  ];

  const handlePurchase = async (item: StoreItem) => {
    if (coinBalance < item.price) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${item.price - coinBalance} more coins to purchase this item.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, this would call an API endpoint
      // await coinService.purchaseStoreItem(item.id);
      
      // Simulate purchase
      setCoinBalance(prev => prev - item.price);
      setPurchasedItems(prev => [...prev, item.id]);
      
      toast({
        title: "Purchase Successful!",
        description: `You've purchased ${item.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase item",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const StoreItemCard = ({ item }: { item: StoreItem }) => {
    const isPurchased = purchasedItems.includes(item.id);
    const canAfford = coinBalance >= item.price;

    return (
      <Card className={`border bg-gradient-to-br ${item.color} ${item.borderColor} 
                      ${item.available ? 'hover:shadow-xl transition-all' : 'opacity-60'} 
                      ${item.popular ? 'ring-2 ring-primary/30' : ''}`}>
        {item.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary shadow-lg">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Popular
            </Badge>
          </div>
        )}
        
        <CardHeader>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-full bg-background/50 backdrop-blur-md">
              <item.icon className="w-6 h-6" />
            </div>
            {!item.available && (
              <Badge variant="outline" className="bg-background/50">
                <Lock className="w-3 h-3 mr-1" />
                Soon
              </Badge>
            )}
            {isPurchased && (
              <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-500">
                <Check className="w-3 h-3 mr-1" />
                Owned
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg mb-2">{item.name}</CardTitle>
          <CardDescription>{item.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
            <span className="text-sm font-semibold">{item.benefit}</span>
            {item.duration && (
              <Badge variant="outline" className="text-xs">{item.duration}</Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold">{item.price.toLocaleString()}</span>
            </div>
            
            <Button 
              onClick={() => handlePurchase(item)}
              disabled={!item.available || isPurchased || !canAfford || loading}
              size="sm"
              className="gap-2"
            >
              {isPurchased ? (
                <>
                  <Check className="w-4 h-4" />
                  Owned
                </>
              ) : !item.available ? (
                <>
                  <Lock className="w-4 h-4" />
                  Soon
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Buy
                </>
              )}
            </Button>
          </div>

          {!canAfford && item.available && !isPurchased && (
            <p className="text-xs text-red-500">
              Need {(item.price - coinBalance).toLocaleString()} more coins
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  const boostItems = storeItems.filter(item => item.type === 'boost');
  const unlockItems = storeItems.filter(item => item.type === 'unlock');
  const packItems = storeItems.filter(item => item.type === 'prediction-pack');

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background/95 via-background to-background/98">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Badge variant="outline" 
                className="px-5 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-md 
                         border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 
                         shadow-lg shadow-purple-500/5 flex items-center gap-3">
                <ShoppingCart className="w-4 h-4 text-purple-500" />
                <span className="font-medium tracking-wide bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Prediction Store
                </span>
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Power Up Your Predictions</h1>
            <p className="text-muted-foreground">
              Unlock exclusive features and boost your earning potential
            </p>
          </div>

          {/* Coin Balance */}
          <Card className="border-primary/10 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-md border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/20">
                  <Coins className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Balance</p>
                  <p className="text-3xl font-bold">{coinBalance.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Store Tabs */}
        <Tabs defaultValue="boosts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid bg-background/50 backdrop-blur-md">
            <TabsTrigger value="boosts" className="gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Boosts</span>
            </TabsTrigger>
            <TabsTrigger value="unlocks" className="gap-2">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Unlocks</span>
            </TabsTrigger>
            <TabsTrigger value="packs" className="gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Packs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="boosts">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boostItems.map(item => (
                <StoreItemCard key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="unlocks">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unlockItems.map(item => (
                <StoreItemCard key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="packs">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packItems.map(item => (
                <StoreItemCard key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Info Banner */}
        <Card className="mt-10 border-primary/10 bg-gradient-to-br from-blue-500/5 to-purple-500/5 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">How to Earn More Coins</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Win predictions to earn up to 5x your wager</li>
                  <li>• Complete daily trivia challenges for bonus coins</li>
                  <li>• Maintain win streaks for multiplier bonuses</li>
                  <li>• Claim your daily gift for free coins and XP</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
