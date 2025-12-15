using Domain.Enums;

namespace Domain.Entities
{
    public class CoinTransaction
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        
        public int Amount { get; set; } // Positive for earnings, negative for spending
        public CoinTransactionType Type { get; set; }
        public string Description { get; set; } = string.Empty;
        
        // Reference IDs
        public Guid? PredictionId { get; set; }
        public Guid? TriviaAttemptId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
