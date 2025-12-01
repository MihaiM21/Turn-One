'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, CheckCircle2, XCircle, Coins, Zap, RefreshCw } from 'lucide-react';
import { triviaService } from '@/lib/gameService';
import { Trivia, TriviaResult } from '@/types/game-types';
import { toast } from '@/hooks/use-toast';

interface TriviaGameProps {
  onTriviaCompleted?: () => void;
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
          title: "No More Questions",
          description: "You've answered all available trivia questions for today. Come back tomorrow!",
        });
      }
      setTrivia(newTrivia);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load trivia",
        variant: "destructive"
      });
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
        selectedAnswer
      });

      setResult(triviaResult);
      
      toast({
        title: triviaResult.isCorrect ? "Correct!" : "Incorrect",
        description: triviaResult.message,
        variant: triviaResult.isCorrect ? "default" : "destructive"
      });

      onTriviaCompleted?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit answer",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-500/10 border-green-500/30 text-green-500';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500';
      case 'hard': return 'bg-red-500/10 border-red-500/30 text-red-500';
      default: return 'bg-primary/10 border-primary/30 text-primary';
    }
  };

  const getOptionClassName = (option: string) => {
    const baseClass = "p-4 rounded-lg border-2 transition-all cursor-pointer text-left";
    
    if (result) {
      if (option === result.correctAnswer) {
        return `${baseClass} border-green-500 bg-green-500/10`;
      }
      if (option === selectedAnswer && !result.isCorrect) {
        return `${baseClass} border-red-500 bg-red-500/10`;
      }
      return `${baseClass} border-border/50 bg-background/30 opacity-50`;
    }
    
    if (selectedAnswer === option) {
      return `${baseClass} border-primary bg-primary/10`;
    }
    
    return `${baseClass} border-border/50 bg-background/30 hover:border-primary/50 hover:bg-primary/5`;
  };

  if (loading) {
    return (
      <Card className="border-primary/10 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md">
        <CardContent className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground">Loading trivia question...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trivia) {
    return (
      <Card className="border-primary/10 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md">
        <CardContent className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Brain className="w-16 h-16 text-primary mx-auto opacity-50" />
            <div>
              <h3 className="text-xl font-bold mb-2">No Questions Available</h3>
              <p className="text-muted-foreground mb-4">
                You've completed all trivia questions for today!
              </p>
              <p className="text-sm text-muted-foreground">
                Come back tomorrow for new challenges.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Trivia Question */}
      <Card className="lg:col-span-2 border-primary/10 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">F1 Trivia Challenge</CardTitle>
                <CardDescription>{trivia.category}</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className={getDifficultyColor(trivia.difficulty)}>
                {trivia.difficulty}
              </Badge>
              <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/30">
                <Coins className="w-3 h-3 mr-1" />
                {trivia.coinsReward}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question */}
          <div className="p-6 rounded-lg bg-primary/5 border border-primary/10">
            <h3 className="text-lg font-medium leading-relaxed">{trivia.question}</h3>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((letter) => {
              const optionKey = `option${letter}` as keyof Trivia;
              const optionText = trivia[optionKey] as string;
              
              return (
                <button
                  key={letter}
                  onClick={() => !result && setSelectedAnswer(letter)}
                  disabled={!!result || submitting}
                  className={getOptionClassName(letter)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border border-border/50 flex items-center justify-center font-bold">
                      {letter}
                    </div>
                    <span className="flex-1">{optionText}</span>
                    {result && letter === result.correctAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                    {result && letter === selectedAnswer && !result.isCorrect && (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Result Message */}
          {result && (
            <div className={`p-4 rounded-lg border-2 ${
              result.isCorrect 
                ? 'border-green-500 bg-green-500/10' 
                : 'border-red-500 bg-red-500/10'
            }`}>
              <div className="flex items-start gap-3">
                {result.isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium mb-1">{result.message}</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      +{result.coinsEarned}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-blue-500" />
                      +{result.experienceEarned} XP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!result ? (
              <Button 
                onClick={handleSubmit} 
                disabled={!selectedAnswer || submitting}
                className="flex-1"
                size="lg"
              >
                {submitting ? 'Submitting...' : 'Submit Answer'}
              </Button>
            ) : (
              <Button 
                onClick={loadTrivia} 
                className="flex-1"
                size="lg"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Next Question
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Panel */}
      <div className="space-y-6">
        <Card className="border-primary/10 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Rewards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Coins Reward</span>
                <div className="flex items-center gap-1 font-bold text-lg text-yellow-500">
                  <Coins className="w-5 h-5" />
                  {trivia.coinsReward}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Earned for correct answers
              </p>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Experience</span>
                <div className="flex items-center gap-1 font-bold text-lg text-blue-500">
                  <Zap className="w-5 h-5" />
                  {trivia.experienceReward}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                25% XP even for wrong answers
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Difficulty Levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-500">
                Easy
              </Badge>
              <span className="text-sm text-muted-foreground">50-100 coins</span>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-500">
                Medium
              </Badge>
              <span className="text-sm text-muted-foreground">100-200 coins</span>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-red-500/10 border-red-500/30 text-red-500">
                Hard
              </Badge>
              <span className="text-sm text-muted-foreground">200-500 coins</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
