using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services
{
    public class CoinService : ICoinService
    {
        private readonly TurnOneDbContext _context;

        public CoinService(TurnOneDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetUserCoinsAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            return user?.Coins ?? 0;
        }

        public async Task<bool> DeductCoinsAsync(Guid userId, int amount, string description, Guid? predictionId = null)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null || user.Coins < amount)
            {
                return false;
            }

            user.Coins -= amount;

            var transaction = new CoinTransaction
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Amount = -amount,
                Type = predictionId.HasValue ? CoinTransactionType.PREDICTION_WAGER : CoinTransactionType.PURCHASE,
                Description = description,
                PredictionId = predictionId,
                CreatedAt = DateTime.UtcNow
            };

            _context.CoinTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> AddCoinsAsync(Guid userId, int amount, string description, Guid? predictionId = null, Guid? triviaAttemptId = null)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return false;
            }

            user.Coins += amount;

            CoinTransactionType type = CoinTransactionType.ADMIN_ADJUSTMENT;
            if (predictionId.HasValue)
            {
                type = CoinTransactionType.PREDICTION_WIN;
            }
            else if (triviaAttemptId.HasValue)
            {
                type = CoinTransactionType.TRIVIA_REWARD;
            }

            var transaction = new CoinTransaction
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Amount = amount,
                Type = type,
                Description = description,
                PredictionId = predictionId,
                TriviaAttemptId = triviaAttemptId,
                CreatedAt = DateTime.UtcNow
            };

            _context.CoinTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<CoinTransactionDto>> GetUserTransactionsAsync(Guid userId, int limit = 50)
        {
            var transactions = await _context.CoinTransactions
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .Take(limit)
                .Select(t => new CoinTransactionDto
                {
                    Id = t.Id,
                    Amount = t.Amount,
                    Type = t.Type,
                    Description = t.Description,
                    CreatedAt = t.CreatedAt
                })
                .ToListAsync();

            return transactions;
        }
    }
}
