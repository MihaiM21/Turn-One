using Application.DTOs;

namespace Application.Interfaces
{
    public interface ITriviaService
    {
        Task<TriviaDto?> GetRandomTriviaAsync(Guid userId);
        Task<TriviaResultDto> SubmitTriviaAttemptAsync(Guid userId, TriviaAttemptDto attemptDto);
        Task<List<TriviaDto>> GetAllTriviaAsync(); // Admin
        Task<TriviaDto> CreateTriviaAsync(CreateTriviaDto triviaDto); // Admin
        Task<bool> DeleteTriviaAsync(Guid triviaId); // Admin
    }
}
