'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { fetchTokenStatus, fetchUserProfile } from '@/lib/userService';
import { useBalanceRefresh } from '@/lib/balance-events';
import type { TokenStatus } from '@/types/user-types';

interface BalanceContextType {
  coins: number;
  tokens: number;
  tokenStatus: TokenStatus | null;
  loading: boolean;
  /** Re-reads coins/tokens from the server. */
  refetch: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | null>(null);

/**
 * The single source of coins/tokens state under the dashboard: nothing else
 * should hold its own copy. `notifyBalanceChanged()` (lib/balance-events.ts)
 * is how any action that earns/spends a balance tells this provider to refetch —
 * call sites keep using that function directly rather than importing this file.
 */
export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [coins, setCoins] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBalance = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem('token') || '';
      const profile = await fetchUserProfile(token);
      setCoins(profile.coins);
      setTokens(profile.tokens);
      try {
        setTokenStatus(await fetchTokenStatus(token));
      } catch {
        // token status optional
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  useBalanceRefresh(loadBalance);

  const value = useMemo<BalanceContextType>(
    () => ({ coins, tokens, tokenStatus, loading, refetch: loadBalance }),
    [coins, tokens, tokenStatus, loading, loadBalance],
  );

  return <BalanceContext.Provider value={value}>{children}</BalanceContext.Provider>;
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
}
