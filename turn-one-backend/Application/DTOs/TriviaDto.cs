namespace Application.DTOs
{
    public class TriviaDto
    {
        public Guid Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public string OptionA { get; set; } = string.Empty;
        public string OptionB { get; set; } = string.Empty;
        public string OptionC { get; set; } = string.Empty;
        public string OptionD { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public int CoinsReward { get; set; }
        public int ExperienceReward { get; set; }
        
        // Only include correct answer for admin or after attempt
        public string? CorrectAnswer { get; set; }
    }
    
    public class TriviaAttemptDto
    {
        public Guid TriviaId { get; set; }
        public string SelectedAnswer { get; set; } = string.Empty;
    }
    
    public class TriviaResultDto
    {
        public bool IsCorrect { get; set; }
        public string CorrectAnswer { get; set; } = string.Empty;
        public int CoinsEarned { get; set; }
        public int ExperienceEarned { get; set; }
        public string Message { get; set; } = string.Empty;
    }
    
    public class CreateTriviaDto
    {
        public string Question { get; set; } = string.Empty;
        public string OptionA { get; set; } = string.Empty;
        public string OptionB { get; set; } = string.Empty;
        public string OptionC { get; set; } = string.Empty;
        public string OptionD { get; set; } = string.Empty;
        public string CorrectAnswer { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public int CoinsReward { get; set; }
        public int ExperienceReward { get; set; }
    }
}
