'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { predictionService, coinService } from '@/lib/gameService';
import { CreatePrediction } from '@/types/game-types';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { f1_2025_races } from '@/lib/constants/f1_races';

interface PredictionGameProps {
  onPredictionCreated?: () => void;
}

export function PredictionGame({ onPredictionCreated }: PredictionGameProps) {
  const [loading, setLoading] = useState(false);
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [existingPredictions, setExistingPredictions] = useState<string[]>([]);
  const [coinsWagered, setCoinsWagered] = useState(100);
  const [selectedRaceIndex, setSelectedRaceIndex] = useState<number>(-1);
  const [prediction, setPrediction] = useState<Partial<CreatePrediction>>({
    raceId: '',
    raceName: '',
    season: '2025',
    coinsWagered: 100,
    raceDateTime: new Date()
  });

  // Load existing predictions on mount
  useEffect(() => {
    loadExistingPredictions();
  }, []);

  const loadExistingPredictions = async () => {
    try {
      const predictions = await predictionService.getPendingPredictions();
      const raceIds = predictions.map(p => p.raceId);
      setExistingPredictions(raceIds);
    } catch (error) {
      console.error('Failed to load predictions:', error);
    } finally {
      setLoadingPredictions(false);
    }
  };

  // Get upcoming races (races with race sessions in the future)
  const upcomingRaces = useMemo(() => {
    const now = new Date();
    return f1_2025_races
      .map((race, index) => ({
        ...race,
        index,
        raceSession: race.sessions.find(s => s.name === 'Race')
      }))
      .filter(race => race.raceSession && new Date(race.raceSession.startTime) > now)
      .slice(0, 5); // Only show next 5 races
  }, []);

  // When a race is selected, update the prediction data
  const handleRaceSelect = (raceIndexStr: string) => {
    const index = parseInt(raceIndexStr);
    setSelectedRaceIndex(index);
    const selectedRace = f1_2025_races[index];
    const raceSession = selectedRace.sessions.find(s => s.name === 'Race');
    
    if (selectedRace && raceSession) {
      const raceId = `2025-R${index + 1}`;
      
      // Check if prediction already exists
      if (existingPredictions.includes(raceId)) {
        toast({
          title: "Prediction Already Exists",
          description: "You've already made a prediction for this race.",
          variant: "destructive",
          action: (
            <ToastAction altText="View Prediction" onClick={() => window.location.href = '/predictions'}>
              View Prediction
            </ToastAction>
          )
        });
        setSelectedRaceIndex(-1);
        return;
      }
      
      setPrediction(prev => ({
        ...prev,
        raceId,
        raceName: selectedRace.grandPrix,
        raceDateTime: new Date(raceSession.startTime)
      }));
    }
  };

  const calculatePotentialPayout = () => {
    const predictionCount = [
      prediction.podiumP1,
      prediction.podiumP2,
      prediction.podiumP3,
      prediction.fastestLapDriver,
      prediction.polePositionDriver,
      prediction.firstRetirementLap,
      prediction.willThereBeASafetyCar,
      prediction.numberOfDnfs
    ].filter(p => p !== undefined && p !== null && p !== '').length;

    const multiplier = 1.5 + ((predictionCount - 1) * 0.3);
    return Math.floor(coinsWagered * multiplier);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate race selection
    if (selectedRaceIndex < 0) {
      toast({
        title: "Error",
        description: "Please select a Grand Prix to predict",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const predictionData: CreatePrediction = {
        raceId: prediction.raceId!,
        raceName: prediction.raceName!,
        season: '2025',
        podiumP1: prediction.podiumP1,
        podiumP2: prediction.podiumP2,
        podiumP3: prediction.podiumP3,
        fastestLapDriver: prediction.fastestLapDriver,
        polePositionDriver: prediction.polePositionDriver,
        firstRetirementLap: prediction.firstRetirementLap,
        willThereBeASafetyCar: prediction.willThereBeASafetyCar,
        numberOfDnfs: prediction.numberOfDnfs,
        coinsWagered,
        raceDateTime: prediction.raceDateTime!
      };

      const result = await predictionService.createPrediction(predictionData);
      
      toast({
        title: "Prediction Created!",
        description: `You've wagered ${coinsWagered} coins for ${prediction.raceName}. Good luck!`,
        action: (
          <ToastAction altText="View All Predictions" onClick={() => window.location.href = '/predictions'}>
            View All Predictions
          </ToastAction>
        )
      });

      // Reset form
      setSelectedRaceIndex(-1);
      setPrediction({
        raceId: '',
        raceName: '',
        season: '2025',
        coinsWagered: 100,
        raceDateTime: new Date()
      });
      setCoinsWagered(100);

      onPredictionCreated?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create prediction",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const drivers = [
    'Max Verstappen', 'Sergio Perez', 'Lewis Hamilton', 'George Russell',
    'Charles Leclerc', 'Carlos Sainz', 'Lando Norris', 'Oscar Piastri',
    'Fernando Alonso', 'Lance Stroll', 'Esteban Ocon', 'Pierre Gasly',
    'Valtteri Bottas', 'Zhou Guanyu', 'Kevin Magnussen', 'Nico Hulkenberg',
    'Yuki Tsunoda', 'Daniel Ricciardo', 'Alexander Albon', 'Logan Sargeant'
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Prediction Form */}
      <Card className="lg:col-span-2 border-primary/10 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Make Your Prediction
          </CardTitle>
          <CardDescription>
            Predict race outcomes and earn coins based on accuracy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Race Selection */}
            <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <h3 className="font-semibold text-sm">Select Grand Prix</h3>
              <Select 
                value={selectedRaceIndex >= 0 ? selectedRaceIndex.toString() : ''} 
                onValueChange={handleRaceSelect}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose upcoming race..." />
                </SelectTrigger>
                <SelectContent>
                  {upcomingRaces.length === 0 ? (
                    <SelectItem value="none" disabled>No upcoming races</SelectItem>
                  ) : (
                    upcomingRaces.map((race) => {
                      const raceId = `2025-R${race.index + 1}`;
                      const hasPrediction = existingPredictions.includes(raceId);
                      
                      return (
                        <SelectItem 
                          key={race.index} 
                          value={race.index.toString()}
                          disabled={hasPrediction}
                        >
                          {race.grandPrix} - {race.circuit}
                          <span className="text-xs text-muted-foreground ml-2">
                            ({new Date(race.raceSession!.startTime).toLocaleDateString()})
                            {hasPrediction && ' ✓ Predicted'}
                          </span>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              {selectedRaceIndex >= 0 && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Circuit:</strong> {f1_2025_races[selectedRaceIndex].circuit}</p>
                  <p><strong>Country:</strong> {f1_2025_races[selectedRaceIndex].country}</p>
                  <p><strong>Race Date:</strong> {new Date(f1_2025_races[selectedRaceIndex].sessions.find(s => s.name === 'Race')!.startTime).toLocaleString()}</p>
                  {f1_2025_races[selectedRaceIndex].hasSprint && (
                    <Badge variant="secondary" className="text-xs">Sprint Weekend</Badge>
                  )}
                </div>
              )}
            </div>

            {/* Podium Predictions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/30">
                  100 pts
                </Badge>
                Podium Predictions
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p1">1st Place</Label>
                  <Select value={prediction.podiumP1} onValueChange={(value) => setPrediction({...prediction, podiumP1: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map(driver => (
                        <SelectItem key={driver} value={driver}>{driver}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="p2">2nd Place</Label>
                  <Select value={prediction.podiumP2} onValueChange={(value) => setPrediction({...prediction, podiumP2: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map(driver => (
                        <SelectItem key={driver} value={driver}>{driver}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="p3">3rd Place</Label>
                  <Select value={prediction.podiumP3} onValueChange={(value) => setPrediction({...prediction, podiumP3: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map(driver => (
                        <SelectItem key={driver} value={driver}>{driver}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Additional Predictions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Additional Predictions (Optional)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fastest Lap</Label>
                  <Select value={prediction.fastestLapDriver} onValueChange={(value) => setPrediction({...prediction, fastestLapDriver: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map(driver => (
                        <SelectItem key={driver} value={driver}>{driver}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Pole Position</Label>
                  <Select value={prediction.polePositionDriver} onValueChange={(value) => setPrediction({...prediction, polePositionDriver: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map(driver => (
                        <SelectItem key={driver} value={driver}>{driver}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>First Retirement Lap</Label>
                  <Input 
                    type="number" 
                    placeholder="Lap number" 
                    min="1"
                    max="70"
                    value={prediction.firstRetirementLap || ''}
                    onChange={(e) => setPrediction({...prediction, firstRetirementLap: parseInt(e.target.value) || undefined})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Number of DNFs</Label>
                  <Input 
                    type="number" 
                    placeholder="Total DNFs" 
                    min="0"
                    max="20"
                    value={prediction.numberOfDnfs || ''}
                    onChange={(e) => setPrediction({...prediction, numberOfDnfs: parseInt(e.target.value) || undefined})}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/30">
                <Label htmlFor="safety-car" className="cursor-pointer">
                  Will there be a Safety Car?
                </Label>
                <Switch 
                  id="safety-car"
                  checked={prediction.willThereBeASafetyCar || false}
                  onCheckedChange={(checked) => setPrediction({...prediction, willThereBeASafetyCar: checked})}
                />
              </div>
            </div>

            {/* Wager Amount */}
            <div className="space-y-4 p-6 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between">
                <Label>Wager Amount</Label>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold text-lg">{coinsWagered}</span>
                </div>
              </div>
              
              <Slider
                value={[coinsWagered]}
                onValueChange={(values) => setCoinsWagered(values[0])}
                min={50}
                max={1000}
                step={50}
                className="py-4"
              />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Potential Payout:</span>
                <span className="font-bold text-green-500 flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  {calculatePotentialPayout()}
                </span>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading || selectedRaceIndex < 0}>
              {loading ? 'Creating Prediction...' : selectedRaceIndex < 0 ? 'Select a Race First' : 'Place Prediction'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Info Panel */}
      <div className="space-y-6">
        <Card className="border-primary/10 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Scoring
              </h4>
              <ul className="space-y-1 text-muted-foreground ml-6">
                <li>• 1st Place: 100 points</li>
                <li>• 2nd Place: 75 points</li>
                <li>• 3rd Place: 50 points</li>
                <li>• Fastest Lap: 60 points</li>
                <li>• Pole Position: 40 points</li>
                <li>• Safety Car: 50 points</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                Payouts
              </h4>
              <ul className="space-y-1 text-muted-foreground ml-6">
                <li>• 80%+ accuracy: Full payout</li>
                <li>• 40-79% accuracy: Partial payout</li>
                <li>• Below 40%: No payout</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Multipliers
              </h4>
              <p className="text-muted-foreground ml-6">
                Each additional prediction increases your potential payout by 30%!
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 backdrop-blur-md border-yellow-500/20">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <Clock className="w-12 h-12 text-yellow-500 mx-auto" />
              <h4 className="font-bold text-lg">Next Race</h4>
              <p className="text-sm text-muted-foreground">
                Grand Prix
              </p>
              <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/30">
                Predictions close at race start
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
