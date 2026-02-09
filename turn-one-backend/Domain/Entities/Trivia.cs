namespace Domain.Entities
{
    public class Trivia
    {
        public Guid Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public string OptionA { get; set; } = string.Empty;
        public string OptionB { get; set; } = string.Empty;
        public string OptionC { get; set; } = string.Empty;
        public string OptionD { get; set; } = string.Empty;
        public string CorrectAnswer { get; set; } = string.Empty; // A, B, C, or D
        public string Category { get; set; } = string.Empty; // History, Rules, Drivers, etc.
        public string Difficulty { get; set; } = string.Empty; // Easy, Medium, Hard
        public int CoinsReward { get; set; }
        public int ExperienceReward { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastModifiedAt { get; set; }
        public bool IsActive { get; set; } = true;
        
        // Navigation
        public ICollection<TriviaAttempt> Attempts { get; set; } = new List<TriviaAttempt>();
    }
    
    public class TriviaAttempt
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public Guid TriviaId { get; set; }
        public Trivia Trivia { get; set; } = null!;
        public string SelectedAnswer { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public int CoinsEarned { get; set; }
        public int ExperienceEarned { get; set; }
        public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;
    }
}
