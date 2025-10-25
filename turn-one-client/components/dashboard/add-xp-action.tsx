'use client';

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { addExperience, ExperienceResult } from '@/lib/levelSystemService';

interface AddXpProps {
  authToken: string;
  onXpAdded?: (result: ExperienceResult) => void;
}

export function AddXpAction({ authToken, onXpAdded }: AddXpProps) {
  const [xpAmount, setXpAmount] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddXp = async () => {
    if (xpAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'XP amount must be greater than zero',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await addExperience(authToken, xpAmount);
      
      toast({
        title: 'XP Added',
        description: `Added ${xpAmount} XP${result.levelsGained > 0 ? `. Gained ${result.levelsGained} level(s)!` : ''}`,
      });
      
      if (onXpAdded) {
        onXpAdded(result);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add XP',
        variant: 'destructive',
      });
      console.error('Error adding XP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Experience</CardTitle>
        <CardDescription>Grant XP for completing actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            value={xpAmount}
            onChange={(e) => setXpAmount(Number(e.target.value))}
            min={1}
            max={1000}
            className="w-24"
          />
          <span>XP</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleAddXp} 
          disabled={isLoading}
        >
          {isLoading ? 'Adding...' : 'Add XP'}
        </Button>
      </CardFooter>
    </Card>
  );
}