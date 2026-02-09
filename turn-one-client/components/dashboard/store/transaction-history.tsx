'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter
} from 'lucide-react';
import { coinService } from '@/lib/gameService';
import { CoinTransaction } from '@/types/game-types';
import { toast } from '@/hooks/use-toast';

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earned' | 'spent'>('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await coinService.getTransactions(50);
      setTransactions(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load transactions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'earned') return t.amount > 0;
    if (filter === 'spent') return t.amount < 0;
    return true;
  });

  const totalEarned = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = Math.abs(transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading transactions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Earned</p>
                <div className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <p className="text-2xl font-bold text-green-500">
                    {totalEarned.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-500/10">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <div className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <p className="text-2xl font-bold text-red-500">
                    {totalSpent.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Badge 
          variant={filter === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilter('all')}
        >
          All ({transactions.length})
        </Badge>
        <Badge 
          variant={filter === 'earned' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilter('earned')}
        >
          <TrendingUp className="w-3 h-3 mr-1" />
          Earned ({transactions.filter(t => t.amount > 0).length})
        </Badge>
        <Badge 
          variant={filter === 'spent' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilter('spent')}
        >
          <TrendingDown className="w-3 h-3 mr-1" />
          Spent ({transactions.filter(t => t.amount < 0).length})
        </Badge>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Your coin activity history</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-full ${
                        transaction.amount > 0 
                          ? 'bg-green-500/10' 
                          : 'bg-red-500/10'
                      }`}>
                        <Coins className={`w-4 h-4 ${
                          transaction.amount > 0 
                            ? 'text-green-500' 
                            : 'text-red-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className={`text-right font-bold ${
                      transaction.amount > 0 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
                      <div className="flex items-center gap-1">
                        {transaction.amount > 0 ? '+' : ''}
                        {transaction.amount.toLocaleString()}
                        <Coins className="w-4 h-4 text-yellow-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
