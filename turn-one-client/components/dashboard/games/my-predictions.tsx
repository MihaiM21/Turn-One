'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Coins, Calendar, Target } from 'lucide-react';
import { predictionService } from '@/lib/gameService';
import { Prediction, PredictionStatus } from '@/types/game-types';
import { toast } from '@/hooks/use-toast';

interface MyPredictionsProps {
  onMakePrediction?: () => void;
}

type Filter = 'all' | 'pending' | 'settled';

function statusBadgeClasses(status: PredictionStatus) {
  switch (status) {
    case PredictionStatus.WON:
      return 'border-green-500/40 text-green-400';
    case PredictionStatus.LOST:
      return 'border-red-500/40 text-red-400';
    case PredictionStatus.PARTIAL:
      return 'border-yellow-500/40 text-yellow-400';
    case PredictionStatus.CANCELLED:
      return 'border-zinc-700 text-zinc-500';
    case PredictionStatus.PENDING:
    default:
      return 'border-blue-500/40 text-blue-400';
  }
}

function StatTile({ label, value, valueClassName }: { label: string; value: number | string; valueClassName?: string }) {
  return (
    <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      <p className={`mt-0.5 font-mono text-2xl font-black tabular-nums leading-none ${valueClassName ?? ''}`}>
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12px]">
      <span className="text-zinc-500">{label}</span>
      <span className="truncate font-medium text-zinc-200">{value}</span>
    </div>
  );
}

export function MyPredictions({ onMakePrediction }: MyPredictionsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

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
        title: 'Error',
        description: error.message || 'Failed to load predictions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPredictions = predictions.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return p.status === PredictionStatus.PENDING;
    return p.status !== PredictionStatus.PENDING;
  });

  const counts = {
    all: predictions.length,
    pending: predictions.filter((p) => p.status === PredictionStatus.PENDING).length,
    settled: predictions.filter((p) => p.status !== PredictionStatus.PENDING).length,
  };
  const won = predictions.filter((p) => p.status === PredictionStatus.WON).length;
  const partial = predictions.filter((p) => p.status === PredictionStatus.PARTIAL).length;
  const lost = predictions.filter((p) => p.status === PredictionStatus.LOST).length;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 bg-zinc-800/60" />
          ))}
        </div>
        <Skeleton className="h-32 bg-zinc-800/60" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {predictions.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Total" value={predictions.length} />
          <StatTile label="Won" value={won} valueClassName="text-green-400" />
          <StatTile label="Partial" value={partial} valueClassName="text-yellow-400" />
          <StatTile label="Lost" value={lost} valueClassName="text-red-400" />
        </div>
      )}

      {/* Filter row */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800/70 pb-3">
        {(['all', 'pending', 'settled'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`flex items-center gap-2 rounded-sm border px-3 py-1.5 text-[11px] uppercase tracking-wider transition-colors ${
              filter === f
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {f}
            <span className="font-mono tabular-nums text-zinc-500">{counts[f]}</span>
          </button>
        ))}
      </div>

      {filteredPredictions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-zinc-800 bg-zinc-950 px-5 py-12 text-center">
          <Target className="h-8 w-8 text-zinc-700" />
          <div>
            <p className="font-bold">No predictions {filter !== 'all' ? `(${filter})` : ''}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {filter === 'all' ? 'Start your prediction journey.' : 'Try another filter.'}
            </p>
          </div>
          {onMakePrediction && filter === 'all' && (
            <Button
              size="sm"
              onClick={onMakePrediction}
              className="rounded-sm bg-primary text-xs font-semibold uppercase tracking-wider text-white hover:bg-primary/90"
            >
              Make your first prediction
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-zinc-800 bg-zinc-950 divide-y divide-zinc-800/60">
          {filteredPredictions.map((pred) => (
            <article key={pred.id} className="px-5 py-4">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{pred.season}</p>
                  <h3 className="mt-0.5 truncate text-base font-bold tracking-tight">{pred.raceName}</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <Calendar className="h-3 w-3" />
                    <span className="font-mono tabular-nums">
                      {new Date(pred.raceDateTime).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusBadgeClasses(pred.status)}`}
                  >
                    {pred.status}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                    <Coins className="h-3 w-3 text-yellow-400" />
                    <span className="font-mono tabular-nums">{pred.coinsWagered}</span>
                    <span className="text-zinc-600">wagered</span>
                  </span>
                </div>
              </header>

              <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {pred.podiumP1 && <DetailRow label="P1" value={pred.podiumP1} />}
                {pred.podiumP2 && <DetailRow label="P2" value={pred.podiumP2} />}
                {pred.podiumP3 && <DetailRow label="P3" value={pred.podiumP3} />}
                {pred.polePositionDriver && <DetailRow label="Pole" value={pred.polePositionDriver} />}
                {pred.fastestLapDriver && <DetailRow label="Fastest lap" value={pred.fastestLapDriver} />}
                {pred.firstRetirementLap !== undefined && (
                  <DetailRow label="First retirement" value={`Lap ${pred.firstRetirementLap}`} />
                )}
                {pred.numberOfDnfs !== undefined && <DetailRow label="DNFs" value={pred.numberOfDnfs} />}
                {pred.willThereBeASafetyCar !== undefined && (
                  <DetailRow label="Safety car" value={pred.willThereBeASafetyCar ? 'Yes' : 'No'} />
                )}
              </div>

              {pred.status !== PredictionStatus.PENDING && (
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-zinc-800/60 pt-3 text-[11px]">
                  <div>
                    <span className="uppercase tracking-wider text-zinc-500">Points</span>
                    <span className="ml-2 font-mono tabular-nums text-zinc-200">{pred.pointsEarned || 0}</span>
                  </div>
                  <div>
                    <span className="uppercase tracking-wider text-zinc-500">Coins</span>
                    <span
                      className={`ml-2 font-mono tabular-nums ${
                        pred.coinsEarned && pred.coinsEarned > 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {pred.coinsEarned && pred.coinsEarned > 0 ? '+' : ''}
                      {pred.coinsEarned || 0}
                    </span>
                  </div>
                  {pred.accuracyPercentage !== undefined && (
                    <div>
                      <span className="uppercase tracking-wider text-zinc-500">Accuracy</span>
                      <span className="ml-2 font-mono tabular-nums text-primary">{pred.accuracyPercentage}%</span>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
