'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, CheckCircle2, XCircle, Coins, Zap, RefreshCw, Loader2 } from 'lucide-react';
import { triviaService } from '@/lib/gameService';
import { Trivia, TriviaResult } from '@/types/game-types';
import { toast } from '@/hooks/use-toast';

interface TriviaGameProps {
  onTriviaCompleted?: () => void;
}

function difficultyClasses(difficulty: string) {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'border-green-500/40 text-green-400';
    case 'medium':
      return 'border-yellow-500/40 text-yellow-400';
    case 'hard':
      return 'border-red-500/40 text-red-400';
    default:
      return 'border-zinc-700 text-zinc-400';
  }
}

export function TriviaGame({ onTriviaCompleted }: TriviaGameProps) {
  const [trivia, setTrivia] = useState<Trivia | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [result, setResult] = useState<TriviaResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTrivia();
  }, []);

  const loadTrivia = async () => {
    setLoading(true);
    setResult(null);
    setSelectedAnswer('');
    try {
      const newTrivia = await triviaService.getRandomTrivia();
      if (!newTrivia) {
        toast({
          title: 'No more questions',
          description: "You've answered all available trivia for today. Come back tomorrow.",
        });
      }
      setTrivia(newTrivia);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to load trivia', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAnswer || !trivia) return;
    setSubmitting(true);
    try {
      const triviaResult = await triviaService.submitAttempt({
        triviaId: trivia.id,
        selectedAnswer,
      });
      setResult(triviaResult);
      toast({
        title: triviaResult.isCorrect ? 'Correct' : 'Incorrect',
        description: triviaResult.message,
        variant: triviaResult.isCorrect ? 'default' : 'destructive',
      });
      onTriviaCompleted?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to submit answer', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const getOptionClasses = (letter: string) => {
    const base =
      'flex items-center gap-3 border bg-zinc-950 px-4 py-3 text-left transition-colors';
    if (result) {
      if (letter === result.correctAnswer) return `${base} border-green-500/50 bg-green-500/5`;
      if (letter === selectedAnswer && !result.isCorrect) return `${base} border-red-500/50 bg-red-500/5`;
      return `${base} border-zinc-800 opacity-50`;
    }
    if (selectedAnswer === letter) return `${base} border-primary/50 bg-primary/5`;
    return `${base} border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center border border-zinc-800 bg-zinc-950 px-5 py-20 text-sm text-zinc-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading question...
      </div>
    );
  }

  if (!trivia) {
    return (
      <div className="flex flex-col items-center gap-3 border border-zinc-800 bg-zinc-950 px-5 py-16 text-center">
        <Brain className="h-8 w-8 text-zinc-700" />
        <p className="font-bold">No questions available</p>
        <p className="text-xs text-zinc-500">Come back tomorrow for new challenges.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
      <section className="border border-zinc-800 bg-zinc-950">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-5 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Trivia</p>
            <p className="mt-0.5 font-bold text-sm">{trivia.category}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${difficultyClasses(trivia.difficulty)}`}
            >
              {trivia.difficulty}
            </span>
            <span className="flex items-center gap-1 border border-yellow-500/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-yellow-400">
              <Coins className="h-3 w-3" />
              <span className="font-mono tabular-nums">{trivia.coinsReward}</span>
            </span>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <p className="text-base leading-relaxed text-zinc-100">{trivia.question}</p>

          <div className="space-y-2">
            {['A', 'B', 'C', 'D'].map((letter) => {
              const optionKey = `option${letter}` as keyof Trivia;
              const optionText = trivia[optionKey] as string;
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => !result && setSelectedAnswer(letter)}
                  disabled={!!result || submitting}
                  className={getOptionClasses(letter)}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-zinc-800 bg-zinc-900 font-mono text-xs font-bold tabular-nums text-zinc-300">
                    {letter}
                  </span>
                  <span className="flex-1 text-sm">{optionText}</span>
                  {result && letter === result.correctAnswer && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                  )}
                  {result && letter === selectedAnswer && !result.isCorrect && (
                    <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                  )}
                </button>
              );
            })}
          </div>

          {result && (
            <div
              className={`border-l-4 border border-zinc-800 bg-zinc-950 px-4 py-3 ${
                result.isCorrect ? 'border-l-green-500' : 'border-l-red-500'
              }`}
            >
              <p className="text-sm font-medium text-zinc-200">{result.message}</p>
              <div className="mt-2 flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1 text-yellow-400">
                  <Coins className="h-3 w-3" />
                  <span className="font-mono tabular-nums">+{result.coinsEarned}</span>
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <Zap className="h-3 w-3" />
                  <span className="font-mono tabular-nums">+{result.experienceEarned} XP</span>
                </span>
              </div>
            </div>
          )}

          {!result ? (
            <Button
              onClick={handleSubmit}
              disabled={!selectedAnswer || submitting}
              className="w-full rounded-sm bg-primary text-xs font-semibold uppercase tracking-wider text-white hover:bg-primary/90"
            >
              {submitting ? 'Submitting...' : 'Submit answer'}
            </Button>
          ) : (
            <Button
              onClick={loadTrivia}
              variant="outline"
              className="w-full rounded-sm border-zinc-800 bg-zinc-900/60 text-xs font-semibold uppercase tracking-wider text-zinc-300 hover:border-primary/40 hover:text-primary"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Next question
            </Button>
          )}
        </div>
      </section>

      <aside className="space-y-3">
        <section className="border border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 px-5 py-3">
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Rewards</p>
            <p className="mt-0.5 font-bold text-sm">This question</p>
          </div>
          <ul className="divide-y divide-zinc-800/60">
            <li className="flex items-center justify-between px-5 py-3">
              <span className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
                <Coins className="h-3.5 w-3.5 text-yellow-400" /> Coins
              </span>
              <span className="font-mono text-sm font-bold tabular-nums text-yellow-400">{trivia.coinsReward}</span>
            </li>
            <li className="flex items-center justify-between px-5 py-3">
              <span className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
                <Zap className="h-3.5 w-3.5 text-blue-400" /> XP
              </span>
              <span className="font-mono text-sm font-bold tabular-nums text-blue-400">{trivia.experienceReward}</span>
            </li>
          </ul>
          <p className="border-t border-zinc-800/60 px-5 py-2.5 text-[11px] text-zinc-500">
            25% XP awarded even for wrong answers.
          </p>
        </section>

        <section className="border border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 px-5 py-3">
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Difficulty</p>
            <p className="mt-0.5 font-bold text-sm">Reward range</p>
          </div>
          <ul className="divide-y divide-zinc-800/60 text-[11px]">
            {[
              ['Easy', '50–100', 'text-green-400'],
              ['Medium', '100–200', 'text-yellow-400'],
              ['Hard', '200–500', 'text-red-400'],
            ].map(([label, range, color]) => (
              <li key={label} className="flex items-center justify-between px-5 py-2.5">
                <span className={`uppercase tracking-wider ${color}`}>{label}</span>
                <span className="font-mono tabular-nums text-zinc-400">{range} coins</span>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
