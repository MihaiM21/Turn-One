'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Trophy, TrendingUp, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getAuthToken } from '@/lib/auth-utils';

interface PendingRace {
  raceId: string;
  raceName: string;
  raceDateTime: string;
}

interface RaceResults {
  raceId: string;
  raceName: string;
  season: string;
  podiumP1?: string;
  podiumP2?: string;
  podiumP3?: string;
  fastestLapDriver?: string;
  polePositionDriver?: string;
  firstRetirementLap?: number;
  willThereBeASafetyCar?: boolean;
  numberOfDnfs?: number;
}

interface ValidationResult {
  totalPredictions: number;
  settledCount: number;
  winnersCount: number;
  partialWinnersCount: number;
  losersCount: number;
  totalCoinsAwarded: number;
  totalPointsAwarded: number;
  settledUsernames: string[];
}

export default function AdminPredictionsPage() {
  const [pendingRaces, setPendingRaces] = useState<PendingRace[]>([]);
  const [selectedRace, setSelectedRace] = useState<PendingRace | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { toast } = useToast();

  const [results, setResults] = useState<RaceResults>({
    raceId: '',
    raceName: '',
    season: new Date().getFullYear().toString(),
    podiumP1: '',
    podiumP2: '',
    podiumP3: '',
    fastestLapDriver: '',
    polePositionDriver: '',
    firstRetirementLap: undefined,
    willThereBeASafetyCar: undefined,
    numberOfDnfs: undefined,
  });

  useEffect(() => {
    loadPendingRaces();
  }, []);

  const loadPendingRaces = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Prediction/races/pending`, {
        headers: {
          'Authorization': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const races = data.data.map((raceString: string) => {
          const [raceId, raceName, raceDateTime] = raceString.split('|');
          return { raceId, raceName, raceDateTime };
        });
        setPendingRaces(races);
      }
    } catch (error) {
      console.error('Failed to load pending races:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending races',
        variant: 'destructive',
      });
    }
  };

  const handleRaceSelect = (raceString: string) => {
    const race = pendingRaces.find(r => `${r.raceId}|${r.raceName}` === raceString);
    if (race) {
      setSelectedRace(race);
      setResults({
        ...results,
        raceId: race.raceId,
        raceName: race.raceName,
      });
      setValidationResult(null);
    }
  };

  const handleValidate = async () => {
    if (!selectedRace) return;

    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Prediction/race/${selectedRace.raceId}/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
          },
          body: JSON.stringify(results),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setValidationResult(data.data);
        toast({
          title: 'Success! 🎉',
          description: data.message,
        });
        
        // Reload pending races
        await loadPendingRaces();
        setSelectedRace(null);
      } else {
        throw new Error(data.message || 'Failed to validate race');
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      toast({
        title: 'Validation Failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Validate Race Predictions</h1>
            <p className="text-muted-foreground mt-1">
              Enter the actual race results to validate all user predictions
            </p>
          </div>
          <Trophy className="w-12 h-12 text-primary opacity-20" />
        </div>

        {/* Stats Cards */}
        {validationResult && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Settled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{validationResult.settledCount}</div>
                <p className="text-xs text-muted-foreground mt-1">predictions validated</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Winners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">
                  {validationResult.winnersCount + validationResult.partialWinnersCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {validationResult.winnersCount} full, {validationResult.partialWinnersCount} partial
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Coins Awarded</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{validationResult.totalCoinsAwarded.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">{validationResult.totalPointsAwarded.toLocaleString()} points</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Race Selection & Results</CardTitle>
            <CardDescription>
              Select a race with pending predictions and enter the actual results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Race Selection */}
            <div className="space-y-2">
              <Label htmlFor="race">Select Race</Label>
              <Select onValueChange={handleRaceSelect} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a race to validate" />
                </SelectTrigger>
                <SelectContent>
                  {pendingRaces.map((race) => (
                    <SelectItem key={race.raceId} value={`${race.raceId}|${race.raceName}`}>
                      {race.raceName} ({new Date(race.raceDateTime).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {pendingRaces.length === 0 && (
                <p className="text-sm text-muted-foreground">No races with pending predictions</p>
              )}
            </div>

            {selectedRace && (
              <>
                {/* Podium */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Podium Positions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="p1">🥇 1st Place</Label>
                      <Input
                        id="p1"
                        placeholder="Driver name/code"
                        value={results.podiumP1}
                        onChange={(e) => setResults({ ...results, podiumP1: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="p2">🥈 2nd Place</Label>
                      <Input
                        id="p2"
                        placeholder="Driver name/code"
                        value={results.podiumP2}
                        onChange={(e) => setResults({ ...results, podiumP2: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="p3">🥉 3rd Place</Label>
                      <Input
                        id="p3"
                        placeholder="Driver name/code"
                        value={results.podiumP3}
                        onChange={(e) => setResults({ ...results, podiumP3: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Other Results */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Race Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fastest">⚡ Fastest Lap Driver</Label>
                      <Input
                        id="fastest"
                        placeholder="Driver name/code"
                        value={results.fastestLapDriver}
                        onChange={(e) => setResults({ ...results, fastestLapDriver: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pole">🏁 Pole Position</Label>
                      <Input
                        id="pole"
                        placeholder="Driver name/code"
                        value={results.polePositionDriver}
                        onChange={(e) => setResults({ ...results, polePositionDriver: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retirement">First Retirement Lap</Label>
                      <Input
                        id="retirement"
                        type="number"
                        placeholder="Lap number"
                        value={results.firstRetirementLap || ''}
                        onChange={(e) => setResults({ ...results, firstRetirementLap: e.target.value ? parseInt(e.target.value) : undefined })}
                      />
                    </div>
                   <div className="space-y-2">
                      <Label htmlFor="dnfs">Number of DNFs</Label>
                      <Input
                        id="dnfs"
                        type="number"
                        placeholder="Total DNFs"
                        value={results.numberOfDnfs || ''}
                        onChange={(e) => setResults({ ...results, numberOfDnfs: e.target.value ? parseInt(e.target.value) : undefined })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="safety">🚗 Safety Car?</Label>
                      <Select 
                        value={results.willThereBeASafetyCar?.toString() || 'undefined'} 
                        onValueChange={(value) => setResults({ ...results, willThereBeASafetyCar: value === 'undefined' ? undefined : value === 'true' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="undefined">Not specified</SelectItem>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleValidate} 
                  disabled={loading} 
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Validate Predictions
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
