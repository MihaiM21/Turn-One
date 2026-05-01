// THIS MIGHT NOT BE USED AT ALL, BUT IT'S A START FOR ANY TOKEN-RELATED API CALLS WE MIGHT NEED TO MAKE IN THE FUTURE
// CHECK IF IT IS USED ANYWHERE ELSE IN THE CODEBASE BEFORE DELETING

import { getAuthToken } from './auth-utils';
import { TokenStatus } from '@/types/user-types';
import { fetchWithAuth } from './data-fetcher';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5271/api';

export const tokenService = {
  async getTokenBalance(): Promise<number> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/User/profile`, {
      headers: {
        'Authorization': token || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch token balance');
    }

    const data = await response.json();
    return data.data.tokens;
  },

  async getTokenStatus(): Promise<TokenStatus> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/Subscription/token-status`, {
      headers: {
        'Authorization': token || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch token status');
    }

    const data = await response.json();
    return data.data;
  },

  async purchaseTokens(amount: number, coinCost: number): Promise<{ success: boolean; newTokenBalance: number; newCoinBalance: number }> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/Token/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token || '',
      },
      body: JSON.stringify({ amount, coinCost }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to purchase tokens');
    }

    const data = await response.json();
    return data.data;
  },
};
