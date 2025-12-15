using Application.DTOs;

namespace Application.Interfaces
{
    public interface ICoinService
    {
        Task<int> GetUserCoinsAsync(Guid userId);
        Task<bool> DeductCoinsAsync(Guid userId, int amount, string description, Guid? predictionId = null);
        Task<bool> AddCoinsAsync(Guid userId, int amount, string description, Guid? predictionId = null, Guid? triviaAttemptId = null);
        Task<List<CoinTransactionDto>> GetUserTransactionsAsync(Guid userId, int limit = 50);
    }
}
