using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services
{
    public class TriviaService : ITriviaService
    {
        private readonly TurnOneDbContext _context;
        private readonly ICoinService _coinService;
        private readonly ILevelSystemService _levelSystemService;

        public TriviaService(
            TurnOneDbContext context, 
            ICoinService coinService,
            ILevelSystemService levelSystemService)
        {
            _context = context;
            _coinService = coinService;
            _levelSystemService = levelSystemService;
        }

        public async Task<TriviaDto?> GetRandomTriviaAsync(Guid userId)
        {
            // Get trivia questions the user hasn't answered today
            var today = DateTime.UtcNow.Date;
            var answeredTodayIds = await _context.TriviaAttempts
                .Where(t => t.UserId == userId && t.AttemptedAt >= today)
                .Select(t => t.TriviaId)
                .ToListAsync();

            // Get all available trivia into memory, then randomize
            var availableTrivias = await _context.Trivias
                .Where(t => t.IsActive && !answeredTodayIds.Contains(t.Id))
                .ToListAsync();

            if (!availableTrivias.Any())
            {
                return null;
            }

            // Randomize in memory
            var random = new Random();
            var availableTrivia = availableTrivias[random.Next(availableTrivias.Count)];

            return new TriviaDto
            {
                Id = availableTrivia.Id,
                Question = availableTrivia.Question,
                OptionA = availableTrivia.OptionA,
                OptionB = availableTrivia.OptionB,
                OptionC = availableTrivia.OptionC,
                OptionD = availableTrivia.OptionD,
                Category = availableTrivia.Category,
                Difficulty = availableTrivia.Difficulty,
                CoinsReward = availableTrivia.CoinsReward,
                ExperienceReward = availableTrivia.ExperienceReward
            };
        }

        public async Task<TriviaResultDto> SubmitTriviaAttemptAsync(Guid userId, TriviaAttemptDto attemptDto)
        {
            var trivia = await _context.Trivias.FindAsync(attemptDto.TriviaId);
            if (trivia == null)
            {
                throw new InvalidOperationException("Trivia question not found");
            }

            // Check if user already answered this today
            var today = DateTime.UtcNow.Date;
            var alreadyAnswered = await _context.TriviaAttempts
                .AnyAsync(t => t.UserId == userId && t.TriviaId == attemptDto.TriviaId && t.AttemptedAt >= today);

            if (alreadyAnswered)
            {
                throw new InvalidOperationException("You have already answered this question today");
            }

            bool isCorrect = attemptDto.SelectedAnswer.Equals(trivia.CorrectAnswer, StringComparison.OrdinalIgnoreCase);
            int coinsEarned = isCorrect ? trivia.CoinsReward : 0;
            int experienceEarned = isCorrect ? trivia.ExperienceReward : trivia.ExperienceReward / 4; // Partial XP for trying

            var attempt = new TriviaAttempt
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                TriviaId = attemptDto.TriviaId,
                SelectedAnswer = attemptDto.SelectedAnswer,
                IsCorrect = isCorrect,
                CoinsEarned = coinsEarned,
                ExperienceEarned = experienceEarned,
                AttemptedAt = DateTime.UtcNow
            };

            _context.TriviaAttempts.Add(attempt);
            await _context.SaveChangesAsync();

            // Award coins and experience
            if (coinsEarned > 0)
            {
                await _coinService.AddCoinsAsync(
                    userId,
                    coinsEarned,
                    $"Trivia reward: {trivia.Question.Substring(0, Math.Min(50, trivia.Question.Length))}...",
                    triviaAttemptId: attempt.Id);
            }

            if (experienceEarned > 0)
            {
                await _levelSystemService.AddExperienceAsync(userId, experienceEarned);
            }

            string message = isCorrect 
                ? $"Correct! You earned {coinsEarned} coins and {experienceEarned} XP!" 
                : $"Incorrect. The correct answer was {trivia.CorrectAnswer}. You earned {experienceEarned} XP for trying.";

            return new TriviaResultDto
            {
                IsCorrect = isCorrect,
                CorrectAnswer = trivia.CorrectAnswer,
                CoinsEarned = coinsEarned,
                ExperienceEarned = experienceEarned,
                Message = message
            };
        }

        public async Task<List<TriviaDto>> GetAllTriviaAsync()
        {
            var trivias = await _context.Trivias
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new TriviaDto
                {
                    Id = t.Id,
                    Question = t.Question,
                    OptionA = t.OptionA,
                    OptionB = t.OptionB,
                    OptionC = t.OptionC,
                    OptionD = t.OptionD,
                    CorrectAnswer = t.CorrectAnswer,
                    Category = t.Category,
                    Difficulty = t.Difficulty,
                    CoinsReward = t.CoinsReward,
                    ExperienceReward = t.ExperienceReward
                })
                .ToListAsync();

            return trivias;
        }

        public async Task<TriviaDto> CreateTriviaAsync(CreateTriviaDto triviaDto)
        {
            var trivia = new Trivia
            {
                Id = Guid.NewGuid(),
                Question = triviaDto.Question,
                OptionA = triviaDto.OptionA,
                OptionB = triviaDto.OptionB,
                OptionC = triviaDto.OptionC,
                OptionD = triviaDto.OptionD,
                CorrectAnswer = triviaDto.CorrectAnswer,
                Category = triviaDto.Category,
                Difficulty = triviaDto.Difficulty,
                CoinsReward = triviaDto.CoinsReward,
                ExperienceReward = triviaDto.ExperienceReward,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Trivias.Add(trivia);
            await _context.SaveChangesAsync();

            return new TriviaDto
            {
                Id = trivia.Id,
                Question = trivia.Question,
                OptionA = trivia.OptionA,
                OptionB = trivia.OptionB,
                OptionC = trivia.OptionC,
                OptionD = trivia.OptionD,
                CorrectAnswer = trivia.CorrectAnswer,
                Category = trivia.Category,
                Difficulty = trivia.Difficulty,
                CoinsReward = trivia.CoinsReward,
                ExperienceReward = trivia.ExperienceReward
            };
        }

        public async Task<bool> DeleteTriviaAsync(Guid triviaId)
        {
            var trivia = await _context.Trivias.FindAsync(triviaId);
            if (trivia == null)
            {
                return false;
            }

            trivia.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
