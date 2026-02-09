using Application.DTOs;

namespace Application.Interfaces
{
    public interface IPredictionService
    {
        Task<PredictionDto> CreatePredictionAsync(Guid userId, CreatePredictionDto predictionDto);
        Task<List<PredictionDto>> GetUserPredictionsAsync(Guid userId);
        Task<List<PredictionDto>> GetPendingPredictionsAsync(Guid userId);
        Task<PredictionDto?> GetPredictionByIdAsync(Guid predictionId);
        Task<bool> SettlePredictionAsync(Guid predictionId, PredictionDto actualResults);
        Task<List<PredictionDto>> GetAllPendingPredictionsAsync(); // Admin
        Task<RaceValidationResultDto> SettleRaceAsync(string raceId, RaceResultsDto raceResults); // Admin - Settle all predictions for a race
        Task<List<string>> GetPendingRacesAsync(); // Admin - Get unique race IDs with pending predictions
    }
}
