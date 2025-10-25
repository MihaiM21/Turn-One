// Based on backend User entity structure
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  plan: 'BASIC' | 'PRO' | 'ELITE';
  planStartDate: string;
  planEndDate?: string;
  autoRenew: boolean;
  tokens: number;
  coins: number;
  lastTokenRefillDate: string;
  createdAt: string;
  lastLogin?: string;
}

// Based on backend TokenStatusResponse
export interface TokenStatus {
  tokensRemaining: number;
  daysUntilRefill: number;
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  dataUpdates: boolean;
  marketingEmails: boolean;
  darkMode: boolean;
  language: string;
  timezone: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}