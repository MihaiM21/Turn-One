export interface DailyGiftStatus {
  canClaimDailyGift: boolean;
}

export interface DailyGiftClaimResult {
  success: boolean;
  message: string;
  coins: number;
  experience: number;
}