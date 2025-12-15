namespace Domain.Entities
{
    public class Leaderboard
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        
        // Stats
        public int TotalPredictions { get; set; }
        public int CorrectPredictions { get; set; }
        public int TotalPointsEarned { get; set; }
        public int TotalCoinsEarned { get; set; }
        public int CurrentStreak { get; set; }
        public int LongestStreak { get; set; }
        
        // Rankings
        public int GlobalRank { get; set; }
        public int SeasonRank { get; set; }
        public string Season { get; set; } = string.Empty;
        
        // Achievements
        public int TriviaCorrect { get; set; }
        public int TriviaAttempts { get; set; }
        
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}
