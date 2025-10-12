'use client';

import { getAuthToken } from './auth-utils';

// Use the same API URL as defined in .env.local
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5271/api';

export interface DailyGiftStatus {
  canClaimDailyGift: boolean;
}

export interface DailyGiftClaimResult {
  success: boolean;
  message: string;
  coins: number;
  experience: number;
}

/**
 * Check if the user can claim their daily gift
 * Adding cache-busting to prevent browser caching issues
 */
export const checkDailyGiftStatus = async (token: string): Promise<DailyGiftStatus> => {
  // Add timestamp to prevent caching between different users or sessions
  const cacheBuster = new Date().getTime();
  const url = `${API_URL}/dailygift/status?_=${cacheBuster}`;
  
  console.log(`Checking daily gift status from ${url}`);
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to check daily gift status: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Claim the daily gift
 */
export const claimDailyGift = async (token: string): Promise<DailyGiftClaimResult> => {
  // Add timestamp to prevent any caching issues
  const cacheBuster = new Date().getTime();
  const url = `${API_URL}/dailygift/claim?_=${cacheBuster}`;
  
  console.log(`Claiming daily gift from ${url}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to claim daily gift: ${response.status}`);
  }
  
  return response.json();
};