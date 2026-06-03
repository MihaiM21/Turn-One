'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Coins } from 'lucide-react';
import { predictionService } from '@/lib/gameService';
import { CreatePrediction } from '@/types/game-types';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { f1_2026_races } from '@/lib/constants/f1_races';
import { f1_2026_drivers } from '@/lib/constants/f1_2026_drivers_full';
import { notifyBalanceChanged } from '@/lib/balance-events';

interface PredictionGameProps {
  onPredictionCreated?: () => void;
}

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="border-b border-zinc-800 px-5 py-3">
      <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      <p className="mt-0.5 font-bold text-sm">{title}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      {children}
    </div>
  );
}

export function PredictionGame({ onPredictionCreated }: PredictionGameProps) {
  const [loading, setLoading] = useState(false);
  const [existingPredictions, setExistingPredictions] = useState<string[]>([]);
  const [coinsWagered, setCoinsWagered] = useState(100);
  const [selectedRaceIndex, setSelectedRaceIndex] = useState<number>(-1);
  const [prediction, setPrediction] = useState<Partial<CreatePrediction>>({
    raceId: '',
    raceName: '',
    season: '2026',
    coinsWagered: 100,
    raceDateTime: new Date(),
  });

  useEffect(() => {
    loadExistingPredictions();
  }, []);

  const loadExistingPredictions = async () => {
    try {
      const predictions = await predictionService.getPendingPredictions();
      setExistingPredictions(predictions.map((p) => p.raceId));
    } catch (error) {
      console.error('Failed to load predictions:', error);
    }
  };

  const upcomingRaces = useMemo(() => {
    const now = new Date();
    return f1_2026_races
      .map((race, index) => ({
        ...race,
        index,
        raceSession: race.sessions.find((s) => s.name === 'Race'),
      }))
      .filter((race) => race.raceSession && new Date(race.raceSession.startTime) > now)
      .slice(0, 5);
  }, []);

  const handleRaceSelect = (raceIndexStr: string) => {
    const index = parseInt(raceIndexStr);
    setSelectedRaceIndex(index);
    const selectedRace = f1_2026_races[index];
    const raceSession = selectedRace.sessions.find((s) => s.name === 'Race');

    if (selectedRace && raceSession) {
      const raceId = `2026-R${index + 1}`;
      if (existingPredictions.includes(raceId)) {
        toast({
          title: 'Prediction Already Exists',
          description: "You've already made a prediction for this race.",
          variant: 'destructive',
          action: (
            <ToastAction altText="View Prediction" onClick={() => (window.location.href = '/predictions')}>
              View Prediction
            </ToastAction>
          ),
        });
        setSelectedRaceIndex(-1);
        return;
      }

      setPrediction((prev) => ({
        ...prev,
        raceId,
        raceName: selectedRace.grandPrix,
        raceDateTime: new Date(raceSession.startTime),
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
      prediction.numberOfDnfs,
    ].filter((p) => p !== undefined && p !== null && p !== '').length;
    const multiplier = 1.5 + (predictionCount - 1) * 0.3;
    return Math.floor(coinsWagered * multiplier);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRaceIndex < 0) {
      toast({ title: 'Error', description: 'Please select a Grand Prix to predict', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const predictionData: CreatePrediction = {
        raceId: prediction.raceId!,
        raceName: prediction.raceName!,
        season: '2026',
        podiumP1: prediction.podiumP1,
        podiumP2: prediction.podiumP2,
        podiumP3: prediction.podiumP3,
        fastestLapDriver: prediction.fastestLapDriver,
        polePositionDriver: prediction.polePositionDriver,
        firstRetirementLap: prediction.firstRetirementLap,
        willThereBeASafetyCar: prediction.willThereBeASafetyCar,
        numberOfDnfs: prediction.numberOfDnfs,
        coinsWagered,
        raceDateTime: prediction.raceDateTime!,
      };

      await predictionService.createPrediction(predictionData);
      notifyBalanceChanged();

      toast({
        title: 'Prediction Created',
        description: `Wagered ${coinsWagered} coins on ${prediction.raceName}. Good luck.`,
        action: (
          <ToastAction altText="View All Predictions" onClick={() => (window.location.href = '/predictions')}>
            View
          </ToastAction>
        ),
      });

      setSelectedRaceIndex(-1);
      setPrediction({ raceId: '', raceName: '', season: '2026', coinsWagered: 100, raceDateTime: new Date() });
      setCoinsWagered(100);
      onPredictionCreated?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create prediction', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const drivers = [...f1_2026_drivers];
  const selectedRace = selectedRaceIndex >= 0 ? f1_2026_races[selectedRaceIndex] : null;
  const selectedRaceSession = selectedRace?.sessions.find((s) => s.name === 'Race');

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-3">
        {/* Race selection */}
        <section className="border border-zinc-800 bg-zinc-950">
          <SectionHeader label="Step 1" title="Select Grand Prix" />
          <div className="space-y-3 px-5 py-4">
            <Select
              value={selectedRaceIndex >= 0 ? selectedRaceIndex.toString() : ''}
              onValueChange={handleRaceSelect}
            >
              <SelectTrigger className="rounded-sm border-zinc-800 bg-zinc-900/60">
                <SelectValue placeholder="Choose upcoming race..." />
              </SelectTrigger>
              <SelectContent>
                {upcomingRaces.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No upcoming races
                  </SelectItem>
                ) : (
                  upcomingRaces.map((race) => {
                    const raceId = `2026-R${race.index + 1}`;
                    const hasPrediction = existingPredictions.includes(raceId);
                    return (
                      <SelectItem key={race.index} value={race.index.toString()} disabled={hasPrediction}>
                        {race.grandPrix} — {race.circuit}
                        {hasPrediction && ' ✓'}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            {selectedRace && selectedRaceSession && (
              <div className="grid grid-cols-1 gap-y-1 text-[11px] sm:grid-cols-3">
                <span className="text-zinc-500">
                  <span className="uppercase tracking-wider">Circuit</span>
                  <span className="ml-2 text-zinc-300">{selectedRace.circuit}</span>
                </span>
                <span className="text-zinc-500">
                  <span className="uppercase tracking-wider">Country</span>
                  <span className="ml-2 text-zinc-300">{selectedRace.country}</span>
                </span>
                <span className="text-zinc-500">
                  <span className="uppercase tracking-wider">Race</span>
                  <span className="ml-2 font-mono tabular-nums text-zinc-300">
                    {new Date(selectedRaceSession.startTime).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Podium */}
        <section className="border border-zinc-800 bg-zinc-950">
          <SectionHeader label="100 pts each" title="Podium predictions" />
          <div className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-3">
            <Field label="1st place">
              <Select
                value={prediction.podiumP1}
                onValueChange={(value) => setPrediction({ ...prediction, podiumP1: value })}
              >
                <SelectTrigger className="rounded-sm border-zinc-800 bg-zinc-900/60">
                  <SelectValue placeholder="Driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="2nd place">
              <Select
                value={prediction.podiumP2}
                onValueChange={(value) => setPrediction({ ...prediction, podiumP2: value })}
              >
                <SelectTrigger className="rounded-sm border-zinc-800 bg-zinc-900/60">
                  <SelectValue placeholder="Driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="3rd place">
              <Select
                value={prediction.podiumP3}
                onValueChange={(value) => setPrediction({ ...prediction, podiumP3: value })}
              >
                <SelectTrigger className="rounded-sm border-zinc-800 bg-zinc-900/60">
                  <SelectValue placeholder="Driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </section>

        {/* Optional */}
        <section className="border border-zinc-800 bg-zinc-950">
          <SectionHeader label="Optional" title="Additional predictions" />
          <div className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-2">
            <Field label="Fastest lap">
              <Select
                value={prediction.fastestLapDriver}
                onValueChange={(value) => setPrediction({ ...prediction, fastestLapDriver: value })}
              >
                <SelectTrigger className="rounded-sm border-zinc-800 bg-zinc-900/60">
                  <SelectValue placeholder="Driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Pole position">
              <Select
                value={prediction.polePositionDriver}
                onValueChange={(value) => setPrediction({ ...prediction, polePositionDriver: value })}
              >
                <SelectTrigger className="rounded-sm border-zinc-800 bg-zinc-900/60">
                  <SelectValue placeholder="Driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="First retirement lap">
              <Input
                type="number"
                placeholder="Lap number"
                min="1"
                max="70"
                value={prediction.firstRetirementLap || ''}
                onChange={(e) =>
                  setPrediction({ ...prediction, firstRetirementLap: parseInt(e.target.value) || undefined })
                }
                className="rounded-sm border-zinc-800 bg-zinc-900/60 font-mono tabular-nums"
              />
            </Field>
            <Field label="Number of DNFs">
              <Input
                type="number"
                placeholder="Total DNFs"
                min="0"
                max="20"
                value={prediction.numberOfDnfs || ''}
                onChange={(e) =>
                  setPrediction({ ...prediction, numberOfDnfs: parseInt(e.target.value) || undefined })
                }
                className="rounded-sm border-zinc-800 bg-zinc-900/60 font-mono tabular-nums"
              />
            </Field>
            <div className="flex items-center justify-between border border-zinc-800 bg-zinc-900/40 px-3 py-2.5 md:col-span-2">
              <span className="text-sm text-zinc-300">Will there be a safety car?</span>
              <Switch
                checked={prediction.willThereBeASafetyCar || false}
                onCheckedChange={(checked) => setPrediction({ ...prediction, willThereBeASafetyCar: checked })}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <div className="space-y-3">
        <section className="border border-zinc-800 border-l-4 border-l-primary bg-zinc-950">
          <SectionHeader label="Step 2" title="Set wager" />
          <div className="space-y-4 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">Wager</span>
              <span className="flex items-center gap-1.5 font-mono text-lg font-black tabular-nums">
                <Coins className="h-4 w-4 text-yellow-400" />
                {coinsWagered}
              </span>
            </div>
            <Slider
              value={[coinsWagered]}
              onValueChange={(values) => setCoinsWagered(values[0])}
              min={50}
              max={1000}
              step={50}
            />
            <div className="flex items-center justify-between border-t border-zinc-800/60 pt-3">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">Potential payout</span>
              <span className="font-mono text-sm font-bold tabular-nums text-green-400">
                +{calculatePotentialPayout()}
              </span>
            </div>
            <Button
              type="submit"
              className="w-full rounded-sm bg-primary text-xs font-semibold uppercase tracking-wider text-white hover:bg-primary/90"
              disabled={loading || selectedRaceIndex < 0}
            >
              {loading ? 'Submitting...' : selectedRaceIndex < 0 ? 'Select a race' : 'Place prediction'}
            </Button>
          </div>
        </section>

        <section className="border border-zinc-800 bg-zinc-950">
          <SectionHeader label="How it works" title="Scoring & payout" />
          <ul className="divide-y divide-zinc-800/60 text-[11px]">
            {[
              ['1st place', '100 pts'],
              ['2nd place', '75 pts'],
              ['3rd place', '50 pts'],
              ['Fastest lap', '60 pts'],
              ['Pole position', '40 pts'],
              ['Safety car', '50 pts'],
            ].map(([label, value]) => (
              <li key={label} className="flex items-center justify-between px-5 py-2">
                <span className="text-zinc-400">{label}</span>
                <span className="font-mono tabular-nums text-zinc-300">{value}</span>
              </li>
            ))}
            <li className="px-5 py-2.5 text-[11px] text-zinc-500">
              Each extra pick raises payout by <span className="font-mono tabular-nums text-zinc-300">30%</span>.
            </li>
          </ul>
        </section>
      </div>
    </form>
  );
}
