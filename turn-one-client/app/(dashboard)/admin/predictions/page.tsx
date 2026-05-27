'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2, Trophy, Users, ArrowLeft, Calendar, Clock,
  AlertCircle, Coins, TrendingUp, Eye, Flag, Loader2,
  ChevronRight, Award, Target, Zap, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { getAuthToken } from '@/lib/auth-utils';
import { f1_2026_drivers } from '@/lib/constants/f1_2026_drivers_full';
import { f1_2026_races } from '@/lib/constants/f1_races';
import { DashboardHeader } from '@/components/dashboard/live dashboard/dashboard-header';
import { PageHeader } from '@/components/dashboard/page-header';

// --- Types ---

interface PredictionDto {
  id: string;
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
  coinsWagered: number;
  potentialPayout: number;
  status: string;
  pointsEarned: number;
  coinsEarned: number;
  createdAt: string;
  settledAt?: string;
  raceDateTime: string;
  username?: string;
}

interface RaceOption {
  raceId: string;
  raceName: string;
  circuit: string;
  country: string;
  raceDateTime: string;
  hasPendingPredictions: boolean;
  pendingCount: number;
  isPast: boolean;
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

// --- Helper ---

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// --- Component ---

export default function AdminPredictionsPage() {
  const [pendingRaceMap, setPendingRaceMap] = useState<Map<string, number>>(new Map());
  const [allPendingPredictions, setAllPendingPredictions] = useState<PredictionDto[]>([]);
  const [selectedRace, setSelectedRace] = useState<RaceOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [raceTab, setRaceTab] = useState<'pending' | 'all'>('pending');
  const { toast } = useToast();

  const [results, setResults] = useState<RaceResults>({
    raceId: '',
    raceName: '',
    season: '2026',
    podiumP1: '',
    podiumP2: '',
    podiumP3: '',
    fastestLapDriver: '',
    polePositionDriver: '',
    firstRetirementLap: undefined,
    willThereBeASafetyCar: undefined,
    numberOfDnfs: undefined,
  });

  // Build the full list of 2026 races from the local calendar
  const allRaces: RaceOption[] = useMemo(() => {
    const now = new Date();
    return f1_2026_races.map((race, index) => {
      const raceSession = race.sessions.find(s => s.name === 'Race');
      const raceId = `2026-R${index + 1}`;
      const raceDateTime = raceSession ? new Date(raceSession.startTime).toISOString() : '';
      const count = pendingRaceMap.get(raceId) || 0;
      return {
        raceId,
        raceName: race.grandPrix,
        circuit: race.circuit,
        country: race.country,
        raceDateTime,
        hasPendingPredictions: count > 0,
        pendingCount: count,
        isPast: raceDateTime ? new Date(raceDateTime) < now : false,
      };
    });
  }, [pendingRaceMap]);

  const racesWithPending = useMemo(() => allRaces.filter(r => r.hasPendingPredictions), [allRaces]);

  const displayedRaces = raceTab === 'pending' ? racesWithPending : allRaces;

  // Predictions for the selected race
  const selectedRacePredictions = useMemo(() => {
    if (!selectedRace) return [];
    return allPendingPredictions.filter(p => p.raceId === selectedRace.raceId);
  }, [selectedRace, allPendingPredictions]);

  // Stats
  const totalPendingPredictions = allPendingPredictions.length;
  const totalCoinsAtStake = allPendingPredictions.reduce((sum, p) => sum + p.coinsWagered, 0);
  const uniqueUsers = new Set(allPendingPredictions.map(p => p.username)).size;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingPredictions(true);
    await Promise.all([loadPendingRaces(), loadAllPendingPredictions()]);
    setLoadingPredictions(false);
  };

  const loadPendingRaces = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/Prediction/races/pending`, {
        headers: { 'Authorization': token },
      });

      if (response.ok) {
        const data = await response.json();
        const map = new Map<string, number>();
        data.data.forEach((raceString: string) => {
          const [raceId] = raceString.split('|');
          map.set(raceId, (map.get(raceId) || 0) + 1);
        });
        setPendingRaceMap(map);
      }
    } catch (error) {
      console.error('Failed to load pending races:', error);
    }
  };

  const loadAllPendingPredictions = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/Prediction/all/pending`, {
        headers: { 'Authorization': token },
      });

      if (response.ok) {
        const data = await response.json();
        setAllPendingPredictions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load predictions:', error);
    }
  };

  const handleRaceSelect = (race: RaceOption) => {
    setSelectedRace(race);
    setResults({
      raceId: race.raceId,
      raceName: race.raceName,
      season: '2026',
      podiumP1: '',
      podiumP2: '',
      podiumP3: '',
      fastestLapDriver: '',
      polePositionDriver: '',
      firstRetirementLap: undefined,
      willThereBeASafetyCar: undefined,
      numberOfDnfs: undefined,
    });
    setValidationResult(null);
  };

  const handleValidate = async () => {
    if (!selectedRace) return;
    setShowConfirmDialog(false);
    setLoading(true);

    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/Prediction/race/${selectedRace.raceId}/validate`,
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
          title: 'Race Validated Successfully',
          description: `Settled ${data.data.settledCount} predictions for ${selectedRace.raceName}`,
        });
        // Reload data
        await loadData();
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

  const filledFieldsCount = [
    results.podiumP1, results.podiumP2, results.podiumP3,
    results.fastestLapDriver, results.polePositionDriver,
  ].filter(Boolean).length +
    (results.firstRetirementLap !== undefined ? 1 : 0) +
    (results.willThereBeASafetyCar !== undefined ? 1 : 0) +
    (results.numberOfDnfs !== undefined ? 1 : 0);

  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader />
      <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to admin
        </Link>

        <PageHeader
          label="Admin · Predictions"
          title="Prediction validation"
          description="Review pending predictions, enter race results and settle outcomes."
          actions={
            <span className="border border-zinc-700 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400 tabular-nums">
              2026 Season
            </span>
          }
        />

        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Pending</p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums leading-none text-primary">
                  {totalPendingPredictions}
                </p>
              </div>
              <Clock className="h-4 w-4 shrink-0 text-primary" />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">predictions</p>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">At stake</p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums leading-none text-yellow-400">
                  {totalCoinsAtStake.toLocaleString()}
                </p>
              </div>
              <Coins className="h-4 w-4 shrink-0 text-yellow-400" />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">coins wagered</p>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Players</p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums leading-none text-blue-400">{uniqueUsers}</p>
              </div>
              <Users className="h-4 w-4 shrink-0 text-blue-400" />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">active predictors</p>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Races</p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums leading-none text-green-400">
                  {racesWithPending.length}
                </p>
              </div>
              <Flag className="h-4 w-4 shrink-0 text-green-400" />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">need validation</p>
          </div>
        </div>

        {/* ===== Main Content: Two Column Layout ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left: Race List (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-primary/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Race Calendar</CardTitle>
                  <Tabs value={raceTab} onValueChange={(v) => setRaceTab(v as 'pending' | 'all')}>
                    <TabsList className="h-8">
                      <TabsTrigger value="pending" className="text-xs px-3 h-7">
                        Pending ({racesWithPending.length})
                      </TabsTrigger>
                      <TabsTrigger value="all" className="text-xs px-3 h-7">
                        All (24)
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <CardDescription className="text-xs">
                  {raceTab === 'pending'
                    ? 'Races with user predictions awaiting validation'
                    : 'Full 2026 F1 calendar'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingPredictions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : displayedRaces.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No races with pending predictions</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Switch to "All" to view the full calendar</p>
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto">
                    {displayedRaces.map((race) => {
                      const isSelected = selectedRace?.raceId === race.raceId;
                      const raceDate = new Date(race.raceDateTime);
                      return (
                        <button
                          key={race.raceId}
                          onClick={() => handleRaceSelect(race)}
                          className={`w-full text-left p-4 border-b border-border/40 transition-all hover:bg-accent/50
                            ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm truncate">{race.raceName}</span>
                                {race.hasPendingPredictions && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-orange-500/10 text-orange-500 border-orange-500/20">
                                    {race.pendingCount} pending
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{race.circuit}, {race.country}</p>
                              <p className="text-xs text-muted-foreground/60 mt-0.5">
                                {raceDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                {race.isPast && (
                                  <span className="ml-2 text-green-500">Race completed</span>
                                )}
                              </p>
                            </div>
                            <ChevronRight className={`w-4 h-4 mt-1 flex-shrink-0 transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground/30'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Details + Form (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            {!selectedRace ? (
              <Card className="border-dashed border-2 border-muted-foreground/20">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <Target className="w-12 h-12 text-muted-foreground/20 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground/60">Select a race</p>
                  <p className="text-sm text-muted-foreground/40 mt-1">Choose a race from the calendar to enter results</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Race Info Banner */}
                <Card className="border-primary/10 bg-gradient-to-r from-primary/5 via-transparent to-transparent overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Flag className="w-4 h-4 text-primary" />
                          <span className="text-xs font-mono text-muted-foreground">{selectedRace.raceId}</span>
                          {selectedRace.isPast && (
                            <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-xl font-bold">{selectedRace.raceName}</h2>
                        <p className="text-sm text-muted-foreground">{selectedRace.circuit}, {selectedRace.country}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {new Date(selectedRace.raceDateTime).toLocaleDateString('en-US', { 
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">{selectedRacePredictions.length}</p>
                        <p className="text-xs text-muted-foreground">predictions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Predictions for this race */}
                {selectedRacePredictions.length > 0 && (
                  <Card className="border-orange-500/10">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Eye className="w-4 h-4 text-orange-500" />
                          User Predictions
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">{selectedRacePredictions.length} predictions</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="text-xs w-[100px]">User</TableHead>
                              <TableHead className="text-xs">P1</TableHead>
                              <TableHead className="text-xs">P2</TableHead>
                              <TableHead className="text-xs">P3</TableHead>
                              <TableHead className="text-xs">Fastest</TableHead>
                              <TableHead className="text-xs">Pole</TableHead>
                              <TableHead className="text-xs text-right">Wager</TableHead>
                              <TableHead className="text-xs text-right">Payout</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedRacePredictions.map((pred) => (
                              <TableRow key={pred.id} className="text-xs">
                                <TableCell className="font-medium">{pred.username || 'Unknown'}</TableCell>
                                <TableCell className="text-muted-foreground">{pred.podiumP1 || '—'}</TableCell>
                                <TableCell className="text-muted-foreground">{pred.podiumP2 || '—'}</TableCell>
                                <TableCell className="text-muted-foreground">{pred.podiumP3 || '—'}</TableCell>
                                <TableCell className="text-muted-foreground">{pred.fastestLapDriver || '—'}</TableCell>
                                <TableCell className="text-muted-foreground">{pred.polePositionDriver || '—'}</TableCell>
                                <TableCell className="text-right font-mono">{pred.coinsWagered}</TableCell>
                                <TableCell className="text-right font-mono text-green-500">{pred.potentialPayout}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="px-4 py-3 border-t border-border/40 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Total wagered: <strong className="text-foreground">{selectedRacePredictions.reduce((s, p) => s + p.coinsWagered, 0).toLocaleString()} coins</strong></span>
                        <span>Max potential payout: <strong className="text-green-500">{selectedRacePredictions.reduce((s, p) => s + p.potentialPayout, 0).toLocaleString()} coins</strong></span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Results Entry Form */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          Enter Race Results
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Fill in the actual race outcomes to settle predictions
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{filledFieldsCount}/8 fields</span>
                        <Progress value={(filledFieldsCount / 8) * 100} className="w-16 h-1.5" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Podium */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        Podium
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { label: '1st Place', emoji: '🥇', key: 'podiumP1' as const },
                          { label: '2nd Place', emoji: '🥈', key: 'podiumP2' as const },
                          { label: '3rd Place', emoji: '🥉', key: 'podiumP3' as const },
                        ].map(({ label, emoji, key }) => (
                          <div key={key} className="space-y-1.5">
                            <Label className="text-xs">{emoji} {label}</Label>
                            <Select
                              value={results[key] || ''}
                              onValueChange={(value) => setResults({ ...results, [key]: value })}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Select driver" />
                              </SelectTrigger>
                              <SelectContent>
                                {f1_2026_drivers.map(driver => (
                                  <SelectItem key={driver} value={driver}>{driver}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Performance */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-500" />
                        Performance
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">⚡ Fastest Lap</Label>
                          <Select
                            value={results.fastestLapDriver || ''}
                            onValueChange={(value) => setResults({ ...results, fastestLapDriver: value })}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Select driver" />
                            </SelectTrigger>
                            <SelectContent>
                              {f1_2026_drivers.map(driver => (
                                <SelectItem key={driver} value={driver}>{driver}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">🏁 Pole Position</Label>
                          <Select
                            value={results.polePositionDriver || ''}
                            onValueChange={(value) => setResults({ ...results, polePositionDriver: value })}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Select driver" />
                            </SelectTrigger>
                            <SelectContent>
                              {f1_2026_drivers.map(driver => (
                                <SelectItem key={driver} value={driver}>{driver}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Race Stats */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        Race Statistics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">First Retirement Lap</Label>
                          <Input
                            type="number"
                            placeholder="Lap #"
                            className="h-9 text-sm"
                            min="1" max="70"
                            value={results.firstRetirementLap ?? ''}
                            onChange={(e) => setResults({ ...results, firstRetirementLap: e.target.value ? parseInt(e.target.value) : undefined })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Number of DNFs</Label>
                          <Input
                            type="number"
                            placeholder="Total"
                            className="h-9 text-sm"
                            min="0" max="20"
                            value={results.numberOfDnfs ?? ''}
                            onChange={(e) => setResults({ ...results, numberOfDnfs: e.target.value ? parseInt(e.target.value) : undefined })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">🚗 Safety Car</Label>
                          <Select
                            value={results.willThereBeASafetyCar?.toString() || 'undefined'}
                            onValueChange={(value) => setResults({ ...results, willThereBeASafetyCar: value === 'undefined' ? undefined : value === 'true' })}
                          >
                            <SelectTrigger className="h-9 text-sm">
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

                    {/* Submit */}
                    <div className="pt-2">
                      <Button
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={loading || filledFieldsCount === 0}
                        className="w-full"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Validating...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Validate {selectedRacePredictions.length} Prediction{selectedRacePredictions.length !== 1 ? 's' : ''}
                          </>
                        )}
                      </Button>
                      {filledFieldsCount === 0 && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Fill in at least one result field to validate
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Validation Results */}
                {validationResult && (
                  <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        Validation Complete
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Result stats grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center p-3 bg-background/80 rounded-lg border border-border/50">
                          <p className="text-2xl font-bold">{validationResult.settledCount}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Settled</p>
                        </div>
                        <div className="text-center p-3 bg-background/80 rounded-lg border border-green-500/20">
                          <p className="text-2xl font-bold text-green-500">{validationResult.winnersCount}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Winners</p>
                        </div>
                        <div className="text-center p-3 bg-background/80 rounded-lg border border-yellow-500/20">
                          <p className="text-2xl font-bold text-yellow-500">{validationResult.partialWinnersCount}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Partial</p>
                        </div>
                        <div className="text-center p-3 bg-background/80 rounded-lg border border-red-500/20">
                          <p className="text-2xl font-bold text-red-500">{validationResult.losersCount}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Lost</p>
                        </div>
                      </div>

                      {/* Outcome distribution bar */}
                      {validationResult.settledCount > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs text-muted-foreground">Outcome Distribution</p>
                          <div className="flex h-3 rounded-full overflow-hidden">
                            <div
                              className="bg-green-500 transition-all"
                              style={{ width: `${(validationResult.winnersCount / validationResult.settledCount) * 100}%` }}
                            />
                            <div
                              className="bg-yellow-500 transition-all"
                              style={{ width: `${(validationResult.partialWinnersCount / validationResult.settledCount) * 100}%` }}
                            />
                            <div
                              className="bg-red-500 transition-all"
                              style={{ width: `${(validationResult.losersCount / validationResult.settledCount) * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Won</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Partial</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Lost</span>
                          </div>
                        </div>
                      )}

                      {/* Coins & Points */}
                      <div className="flex items-center gap-4 p-3 bg-background/80 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm"><strong>{validationResult.totalCoinsAwarded.toLocaleString()}</strong> coins awarded</span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-primary" />
                          <span className="text-sm"><strong>{validationResult.totalPointsAwarded.toLocaleString()}</strong> points awarded</span>
                        </div>
                      </div>

                      {/* Settled users */}
                      {validationResult.settledUsernames.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Affected Users</p>
                          <div className="flex flex-wrap gap-1.5">
                            {validationResult.settledUsernames.map((username, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{username}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* ===== Confirmation Dialog ===== */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Confirm Validation
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are about to settle <strong>{selectedRacePredictions.length}</strong> prediction{selectedRacePredictions.length !== 1 ? 's' : ''} for{' '}
                  <strong>{selectedRace?.raceName}</strong>. This action cannot be undone.
                </p>

                {/* Results summary */}
                <div className="rounded-lg border p-3 space-y-2 text-sm">
                  <p className="font-semibold text-foreground text-xs uppercase tracking-wide">Results Being Applied:</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {results.podiumP1 && <span>🥇 P1: <strong className="text-foreground">{results.podiumP1}</strong></span>}
                    {results.podiumP2 && <span>🥈 P2: <strong className="text-foreground">{results.podiumP2}</strong></span>}
                    {results.podiumP3 && <span>🥉 P3: <strong className="text-foreground">{results.podiumP3}</strong></span>}
                    {results.fastestLapDriver && <span>⚡ Fastest: <strong className="text-foreground">{results.fastestLapDriver}</strong></span>}
                    {results.polePositionDriver && <span>🏁 Pole: <strong className="text-foreground">{results.polePositionDriver}</strong></span>}
                    {results.firstRetirementLap !== undefined && <span>🔧 Retirement: Lap <strong className="text-foreground">{results.firstRetirementLap}</strong></span>}
                    {results.numberOfDnfs !== undefined && <span>❌ DNFs: <strong className="text-foreground">{results.numberOfDnfs}</strong></span>}
                    {results.willThereBeASafetyCar !== undefined && <span>🚗 Safety Car: <strong className="text-foreground">{results.willThereBeASafetyCar ? 'Yes' : 'No'}</strong></span>}
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleValidate} className="bg-primary">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirm & Validate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
