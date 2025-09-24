'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserProfile, TokenStatus } from '@/types/user-types';
import { fetchUserProfile, fetchTokenStatus, consumeToken } from '@/lib/userService';

export function useTokens(authToken: string | null) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile and token status
  const refreshTokenData = useCallback(async () => {
    if (!authToken) return;

    setLoading(true);
    setError(null);
    
    try {
      const [profile, status] = await Promise.all([
        fetchUserProfile(authToken),
        fetchTokenStatus(authToken)
      ]);
      
      setUserProfile(profile);
      setTokenStatus(status);
    } catch (err) {
      setError('Failed to fetch token data');
      console.error('Error fetching token data:', err);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  // Deduct a single token (for graph generation)
  const deductToken = useCallback(async (): Promise<boolean> => {
    if (!authToken) {
      setError('No authentication token');
      return false;
    }

    if (!userProfile || userProfile.tokens <= 0) {
      setError('Insufficient tokens');
      return false;
    }

    try {
      const updatedUser = await consumeToken(authToken);
      setUserProfile(updatedUser);
      
      // Also refresh token status to get updated days until refill
      const status = await fetchTokenStatus(authToken);
      setTokenStatus(status);
      
      return true;
    } catch (err) {
      setError('Failed to deduct token');
      console.error('Error deducting token:', err);
      return false;
    }
  }, [authToken, userProfile]);

  // Check if user has sufficient tokens
  const hasTokens = useCallback(() => {
    return userProfile ? userProfile.tokens > 0 : false;
  }, [userProfile]);

  // Get current token count
  const getTokenCount = useCallback(() => {
    return userProfile ? userProfile.tokens : 0;
  }, [userProfile]);

  // Initial load
  useEffect(() => {
    if (authToken) {
      refreshTokenData();
    }
  }, [authToken, refreshTokenData]);

  return {
    userProfile,
    tokenStatus,
    loading,
    error,
    refreshTokenData,
    deductToken,
    hasTokens,
    getTokenCount,
  };
}