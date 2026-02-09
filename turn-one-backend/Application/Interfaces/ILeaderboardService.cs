using Application.DTOs;

namespace Application.Interfaces
{
    public interface ILeaderboardService
    {
        Task<List<LeaderboardDto>> GetGlobalLeaderboardAsync(int limit = 100);
        Task<List<LeaderboardDto>> GetSeasonLeaderboardAsync(string season, int limit = 100);
        Task<List<SimpleLeaderboardDto>> GetPredictionsLeaderboardAsync(int limit = 100);
        Task<List<SimpleLeaderboardDto>> GetCoinsLeaderboardAsync(int limit = 100);
        Task<List<SimpleLeaderboardDto>> GetLevelLeaderboardAsync(int limit = 100);
        Task<UserStatsDto> GetUserStatsAsync(Guid userId);
        Task UpdateLeaderboardAsync(Guid userId);
    }
}
