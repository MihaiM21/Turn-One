'use client';

/**
 * Hook to interact with the User API
 */

import { useState } from 'react';
import { useToast } from './use-toast';
import { getAuthToken } from '@/lib/auth-utils';

export function useUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend.t1f1.com';
  
  /**
   * Get the current user profile
   */
  const getUserProfile = async () => {
    const token = getAuthToken();
    
    if (!token) {
      setError('No authentication token found');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get user profile: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get user profile';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Add experience to the user
   */
  const addExperience = async (amount: number) => {
    const token = getAuthToken();
    
    if (!token) {
      setError('No authentication token found');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/levelsystem/add-experience`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ experience: amount })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add experience: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.levelsGained > 0) {
        toast({
          title: 'Level Up!',
          description: `You've reached level ${data.currentLevel}!`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Experience Added',
          description: `You've gained ${amount} experience points!`,
          variant: 'default',
        });
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add experience';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    getUserProfile,
    addExperience,
    isLoading,
    error
  };
}