import { getAuthToken } from './auth-utils';
import { 
  Prediction, 
  CreatePrediction, 
  Trivia, 
  TriviaAttempt, 
  TriviaResult,
  LeaderboardEntry,
  UserStats,
  CoinTransaction
} from '@/types/game-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5271/api';

// Prediction Service
export const predictionService = {
  async createPrediction(prediction: CreatePrediction): Promise<Prediction> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/Prediction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token || '',
      },
      body: JSON.stringify(prediction),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create prediction');
    }

    const data = await response.json();
    return data.data;
  },

  async getUserPredictions(): Promise<Prediction[]> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/Prediction/user`, {
      headers: {
        'Authorization': token || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch predictions');
    }

    const data = await response.json();
    return data.data;
  },

  async getPendingPredictions(): Promise<Prediction[]> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/Prediction/pending`, {
      headers: {
        'Authorization': token || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pending predictions');
    }

    const data = await response.json();
    return data.data;
  },

  async getPredictionById(id: string): Promise<Prediction> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/Prediction/${id}`, {
      headers: {
        'Authorization': token || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch prediction');
    }

    const data = await response.json();
    return data.data;
  },
};

// Trivia Service
export const triviaService = {
  async getRandomTrivia(): Promise<Trivia | null> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/Trivia/random`, {
      headers: {
        'Authorization': token || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch trivia');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  async submitAttempt(attempt: TriviaAttempt): Promise<TriviaResult> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/Trivia/attempt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token || '',
      },
      body: JSON.stringify(attempt),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit trivia attempt');
    }

    const data = await response.json();
    return data.data;
  },
};

// Leaderboard Service
export const leaderboardService = {
  async getGlobalLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/Leaderboard/global?limit=${limit}`, {
      headers: {
        'Authorization': token || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch global leaderboard');
    }

    const data = await response.json();
    return data.data;
  },

  async getSeasonLeaderboard(season: string, limit: number = 100): Promise<LeaderboardEntry[]> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/Leaderboard/season/${season}?limit=${limit}`, {
      headers: {
        'Authorization': token || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch season leaderboard');
    }

    const data = await response.json();
    return data.data;
  },

  async getUserStats(): Promise<UserStats> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/Leaderboard/stats`, {
      headers: {
        'Authorization': token || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user stats');
    }

    const data = await response.json();
    return data.data;
  },
};

// Coin Service
export const coinService = {
  async getBalance(): Promise<number> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/Coin/balance`, {
      headers: {
        'Authorization': token || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch coin balance');
    }

    const data = await response.json();
    return data.data.coins;
  },

  async getTransactions(limit: number = 50): Promise<CoinTransaction[]> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/Coin/transactions?limit=${limit}`, {
      headers: {
        'Authorization': token || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    const data = await response.json();
    return data.data;
  },
};
