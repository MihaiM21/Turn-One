namespace Application.DTOs
{
    public class SimpleLeaderboardDto
    {
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public int Level { get; set; }
        public int Value { get; set; }
        public int Rank { get; set; }
    }
    
    public class LeaderboardDto
    {
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        
        public int TotalPredictions { get; set; }
        public int CorrectPredictions { get; set; }
        public double AccuracyPercentage { get; set; }
        public int TotalPointsEarned { get; set; }
        public int TotalCoinsEarned { get; set; }
        public int CurrentStreak { get; set; }
        public int LongestStreak { get; set; }
        
        public int GlobalRank { get; set; }
        public int SeasonRank { get; set; }
        public string Season { get; set; } = string.Empty;
        
        public int TriviaCorrect { get; set; }
        public int TriviaAttempts { get; set; }
        public double TriviaAccuracy { get; set; }
        
        public DateTime LastUpdated { get; set; }
    }
    
    public class UserStatsDto
    {
        public int TotalCoins { get; set; }
        public int Level { get; set; }
        public int Experience { get; set; }
        public int TotalPredictions { get; set; }
        public int CorrectPredictions { get; set; }
        public double AccuracyPercentage { get; set; }
        public int CurrentStreak { get; set; }
        public int TotalCoinsEarned { get; set; }
        public int TotalCoinsSpent { get; set; }
        public int GlobalRank { get; set; }
    }
}
