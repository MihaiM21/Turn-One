export enum PredictionStatus {
  PENDING = 'PENDING',
  WON = 'WON',
  LOST = 'LOST',
  PARTIAL = 'PARTIAL',
  CANCELLED = 'CANCELLED'
}

export enum CoinTransactionType {
  DAILY_GIFT = 'DAILY_GIFT',
  PREDICTION_WAGER = 'PREDICTION_WAGER',
  PREDICTION_WIN = 'PREDICTION_WIN',
  TRIVIA_REWARD = 'TRIVIA_REWARD',
  LEVEL_UP_BONUS = 'LEVEL_UP_BONUS',
  ACHIEVEMENT_REWARD = 'ACHIEVEMENT_REWARD',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
  PURCHASE = 'PURCHASE',
  REFUND = 'REFUND'
}

export interface Prediction {
  id?: string;
  raceId: string;
  raceName: string;
  season: string;
  
  podiumP1?: string;
  podiumP2?: string;
  podiumP3?: string;
  fastestLapDriver?: string;
  polePositionDriver?: string;
  firstRetirementLap?: number;
  willThereBeASafetyCar?: boolean;
  numberOfDnfs?: number;
  
  coinsWagered: number;
  potentialPayout: number;
  status: PredictionStatus;
  pointsEarned: number;
  coinsEarned: number;
  accuracyPercentage?: number;
  
  createdAt: Date;
  settledAt?: Date;
  raceDateTime: Date;
  
  username?: string;
}

export interface CreatePrediction {
  raceId: string;
  raceName: string;
  season: string;
  
  podiumP1?: string;
  podiumP2?: string;
  podiumP3?: string;
  fastestLapDriver?: string;
  polePositionDriver?: string;
  firstRetirementLap?: number;
  willThereBeASafetyCar?: boolean;
  numberOfDnfs?: number;
  
  coinsWagered: number;
  raceDateTime: Date;
}

export interface Trivia {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  category: string;
  difficulty: string;
  coinsReward: number;
  experienceReward: number;
  correctAnswer?: string;
}

export interface TriviaAttempt {
  triviaId: string;
  selectedAnswer: string;
}

export interface TriviaResult {
  isCorrect: boolean;
  correctAnswer: string;
  coinsEarned: number;
  experienceEarned: number;
  message: string;
}

export interface SimpleLeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl?: string;
  level: number;
  value: number;
  rank: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl?: string;
  
  totalPredictions: number;
  correctPredictions: number;
  accuracyPercentage: number;
  totalPointsEarned: number;
  totalCoinsEarned: number;
  currentStreak: number;
  longestStreak: number;
  
  globalRank: number;
  seasonRank: number;
  season: string;
  
  triviaCorrect: number;
  triviaAttempts: number;
  triviaAccuracy: number;
  
  lastUpdated: Date;
}

export interface UserStats {
  totalCoins: number;
  level: number;
  experience: number;
  totalPredictions: number;
  correctPredictions: number;
  accuracyPercentage: number;
  currentStreak: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  globalRank: number;
}

export interface CoinTransaction {
  id: string;
  amount: number;
  type: CoinTransactionType;
  description: string;
  createdAt: Date;
}

export interface Race {
  id: string;
  name: string;
  season: string;
  round: number;
  circuitName: string;
  country: string;
  dateTime: Date;
  hasQualifying: boolean;
  hasSprint: boolean;
}
