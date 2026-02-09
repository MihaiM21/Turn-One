'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Coins,
  TrendingUp,
  Calendar,
  Flag,
  Zap,
  Target,
  Activity,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { predictionService } from '@/lib/gameService';
import { Prediction, PredictionStatus } from '@/types/game-types';
import { toast } from '@/hooks/use-toast';

interface MyPredictionsProps {
  onMakePrediction?: () => void;
}

export function MyPredictions({ onMakePrediction }: MyPredictionsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'settled'>('all');

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const data = await predictionService.getUserPredictions();
      setPredictions(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load predictions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: PredictionStatus) => {
    switch (status) {
      case PredictionStatus.PENDING:
        return <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case PredictionStatus.WON:
        return <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400"><CheckCircle2 className="w-3 h-3 mr-1" />Won</Badge>;
      case PredictionStatus.LOST:
        return <Badge variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400"><XCircle className="w-3 h-3 mr-1" />Lost</Badge>;
      case PredictionStatus.PARTIAL:
        return <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400"><TrendingUp className="w-3 h-3 mr-1" />Partial</Badge>;
      case PredictionStatus.CANCELLED:
        return <Badge variant="outline" className="bg-muted/50 border-border text-muted-foreground">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredPredictions = predictions.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'pending') return p.status === PredictionStatus.PENDING;
    return p.status !== PredictionStatus.PENDING;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading your predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {predictions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-background/50 backdrop-blur-md hover:border-primary/30 transition-colors">
            <CardContent className="pt-6">
              <div className="text-center">
                <Trophy className="w-7 h-7 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold mb-1">{predictions.length}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-green-500/5 backdrop-blur-md hover:border-green-500/40 transition-colors">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="w-7 h-7 text-green-400 mx-auto mb-3" />
                <p className="text-3xl font-bold text-green-400 mb-1">
                  {predictions.filter(p => p.status === PredictionStatus.WON).length}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Won</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 bg-yellow-500/5 backdrop-blur-md hover:border-yellow-500/40 transition-colors">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="w-7 h-7 text-yellow-400 mx-auto mb-3" />
                <p className="text-3xl font-bold text-yellow-400 mb-1">
                  {predictions.filter(p => p.status === PredictionStatus.PARTIAL).length}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Partial</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-md hover:border-red-500/40 transition-colors">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingDown className="w-7 h-7 text-red-400 mx-auto mb-3" />
                <p className="text-3xl font-bold text-red-400 mb-1">
                  {predictions.filter(p => p.status === PredictionStatus.LOST).length}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Lost</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <Card className="border-border/50 bg-background/30 backdrop-blur-md">
        <CardContent className="pt-6">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-background/50">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Activity className="w-4 h-4 mr-2" />
                All <Badge variant="secondary" className="ml-2">{predictions.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Clock className="w-4 h-4 mr-2" />
                Pending <Badge variant="secondary" className="ml-2">{predictions.filter(p => p.status === PredictionStatus.PENDING).length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="settled" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Settled <Badge variant="secondary" className="ml-2">{predictions.filter(p => p.status !== PredictionStatus.PENDING).length}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Predictions List */}
      {filteredPredictions.length === 0 ? (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background/50 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Target className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No Predictions Yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md text-center">
              {filter === 'all' 
                ? "Start your prediction journey! Make your first race prediction and compete for rewards."
                : `No ${filter} predictions found. Try another filter.`
              }
            </p>
            {onMakePrediction && (
              <Button size="lg" className="gap-2" onClick={onMakePrediction}>
                <Sparkles className="w-4 h-4" />
                Make Your First Prediction
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPredictions.map((pred) => (
            <Card key={pred.id} className="border-border/50 bg-background/30 backdrop-blur-md hover:border-primary/40 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Flag className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{pred.raceName}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs">
                            <Calendar className="w-3 h-3" />
                            {new Date(pred.raceDateTime).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </span>
                          <Badge variant="outline" className="text-xs">{pred.season}</Badge>
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-3">
                    {getStatusBadge(pred.status)}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-semibold">{pred.coinsWagered}</span>
                      <span className="text-xs text-muted-foreground">wagered</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Podium Predictions */}
                  {(pred.podiumP1 || pred.podiumP2 || pred.podiumP3) && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-yellow-500/20">
                          <Trophy className="w-4 h-4 text-yellow-400" />
                        </div>
                        <h4 className="text-sm font-semibold">Podium</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        {pred.podiumP1 && <p className="flex items-center gap-2"><span className="text-lg">🥇</span><span className="font-medium">{pred.podiumP1}</span></p>}
                        {pred.podiumP2 && <p className="flex items-center gap-2"><span className="text-lg">🥈</span><span className="font-medium">{pred.podiumP2}</span></p>}
                        {pred.podiumP3 && <p className="flex items-center gap-2"><span className="text-lg">🥉</span><span className="font-medium">{pred.podiumP3}</span></p>}
                      </div>
                    </div>
                  )}

                  {/* Performance Predictions */}
                  {(pred.polePositionDriver || pred.fastestLapDriver) && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-blue-500/20">
                          <Zap className="w-4 h-4 text-blue-400" />
                        </div>
                        <h4 className="text-sm font-semibold">Performance</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        {pred.polePositionDriver && <p className="flex items-center justify-between"><span className="text-muted-foreground">Pole:</span><span className="font-medium">{pred.polePositionDriver}</span></p>}
                        {pred.fastestLapDriver && <p className="flex items-center justify-between"><span className="text-muted-foreground">Fastest Lap:</span><span className="font-medium">{pred.fastestLapDriver}</span></p>}
                      </div>
                    </div>
                  )}

                  {/* Race Stats */}
                  {(pred.numberOfDnfs !== undefined || pred.willThereBeASafetyCar !== undefined || pred.firstRetirementLap !== undefined) && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-primary/20">
                          <Activity className="w-4 h-4 text-primary" />
                        </div>
                        <h4 className="text-sm font-semibold">Race Stats</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        {pred.numberOfDnfs !== undefined && <p className="flex items-center justify-between"><span className="text-muted-foreground">DNFs:</span><span className="font-medium">{pred.numberOfDnfs}</span></p>}
                        {pred.willThereBeASafetyCar !== undefined && (
                          <p className="flex items-center justify-between"><span className="text-muted-foreground">Safety Car:</span><span className="font-medium">{pred.willThereBeASafetyCar ? 'Yes' : 'No'}</span></p>
                        )}
                        {pred.firstRetirementLap !== undefined && (
                          <p className="flex items-center justify-between"><span className="text-muted-foreground">First Retirement:</span><span className="font-medium">Lap {pred.firstRetirementLap}</span></p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Results Section for Settled Predictions */}
                {pred.status !== PredictionStatus.PENDING && (
                  <div className="mt-6 pt-6 border-t border-border/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Points Earned</p>
                        <p className="text-2xl font-bold">{pred.pointsEarned || 0} <span className="text-sm text-muted-foreground">pts</span></p>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Coins Earned</p>
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-yellow-500" />
                          <p className={`text-2xl font-bold ${pred.coinsEarned && pred.coinsEarned > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pred.coinsEarned && pred.coinsEarned > 0 ? '+' : ''}{pred.coinsEarned || 0}
                          </p>
                        </div>
                      </div>
                      
                      {pred.accuracyPercentage !== undefined && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Accuracy</p>
                          <p className="text-2xl font-bold text-primary">{pred.accuracyPercentage}<span className="text-sm">%</span></p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
