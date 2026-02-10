using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services
{
    public class PredictionService : IPredictionService
    {
        private readonly TurnOneDbContext _context;
        private readonly ICoinService _coinService;
        private readonly ILeaderboardService _leaderboardService;

        public PredictionService(
            TurnOneDbContext context, 
            ICoinService coinService,
            ILeaderboardService leaderboardService)
        {
            _context = context;
            _coinService = coinService;
            _leaderboardService = leaderboardService;
        }

        public async Task<PredictionDto> CreatePredictionAsync(Guid userId, CreatePredictionDto predictionDto)
        {
            // Check if user already has a prediction for this race
            var existingPrediction = await _context.Predictions
                .FirstOrDefaultAsync(p => p.UserId == userId && p.RaceId == predictionDto.RaceId);
            
            if (existingPrediction != null)
            {
                throw new InvalidOperationException("You have already made a prediction for this race. View your predictions to see details.");
            }

            // Validate user has enough coins
            var userCoins = await _coinService.GetUserCoinsAsync(userId);
            if (userCoins < predictionDto.CoinsWagered)
            {
                throw new InvalidOperationException("Insufficient coins");
            }

            // Check if race hasn't started yet
            if (predictionDto.RaceDateTime <= DateTime.UtcNow)
            {
                throw new InvalidOperationException("Cannot place prediction for a race that has already started");
            }

            // Calculate potential payout based on odds
            int potentialPayout = CalculatePayout(predictionDto);

            var prediction = new Prediction
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                RaceId = predictionDto.RaceId,
                RaceName = predictionDto.RaceName,
                Season = predictionDto.Season,
                PodiumP1 = predictionDto.PodiumP1,
                PodiumP2 = predictionDto.PodiumP2,
                PodiumP3 = predictionDto.PodiumP3,
                FastestLapDriver = predictionDto.FastestLapDriver,
                PolePositionDriver = predictionDto.PolePositionDriver,
                FirstRetirementLap = predictionDto.FirstRetirementLap,
                WillThereBeASafetyCar = predictionDto.WillThereBeASafetyCar,
                NumberOfDnfs = predictionDto.NumberOfDnfs,
                CoinsWagered = predictionDto.CoinsWagered,
                PotentialPayout = potentialPayout,
                Status = PredictionStatus.PENDING,
                RaceDateTime = predictionDto.RaceDateTime,
                CreatedAt = DateTime.UtcNow
            };

            _context.Predictions.Add(prediction);
            await _context.SaveChangesAsync();

            // Deduct coins
            await _coinService.DeductCoinsAsync(
                userId, 
                predictionDto.CoinsWagered, 
                $"Prediction wager for {predictionDto.RaceName}",
                prediction.Id);

            return MapToDto(prediction);
        }

        public async Task<List<PredictionDto>> GetUserPredictionsAsync(Guid userId)
        {
            var predictions = await _context.Predictions
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return predictions.Select(MapToDto).ToList();
        }

        public async Task<List<PredictionDto>> GetPendingPredictionsAsync(Guid userId)
        {
            var predictions = await _context.Predictions
                .Where(p => p.UserId == userId && p.Status == PredictionStatus.PENDING)
                .OrderBy(p => p.RaceDateTime)
                .ToListAsync();

            return predictions.Select(MapToDto).ToList();
        }

        public async Task<PredictionDto?> GetPredictionByIdAsync(Guid predictionId)
        {
            var prediction = await _context.Predictions
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == predictionId);

            return prediction != null ? MapToDto(prediction) : null;
        }

        public async Task<bool> SettlePredictionAsync(Guid predictionId, PredictionDto actualResults)
        {
            var prediction = await _context.Predictions.FindAsync(predictionId);
            if (prediction == null || prediction.Status != PredictionStatus.PENDING)
            {
                return false;
            }

            // Calculate points based on correctness
            int pointsEarned = CalculatePoints(prediction, actualResults);
            double accuracyPercentage = CalculateAccuracy(prediction, actualResults);

            // Determine winnings
            int coinsEarned = 0;
            PredictionStatus status;

            if (accuracyPercentage >= 0.8) // 80%+ accuracy = win
            {
                status = PredictionStatus.WON;
                coinsEarned = prediction.PotentialPayout;
            }
            else if (accuracyPercentage >= 0.4) // 40-79% = partial
            {
                status = PredictionStatus.PARTIAL;
                coinsEarned = (int)(prediction.CoinsWagered * (1 + accuracyPercentage));
            }
            else // Less than 40% = loss
            {
                status = PredictionStatus.LOST;
                coinsEarned = 0;
            }

            prediction.Status = status;
            prediction.PointsEarned = pointsEarned;
            prediction.CoinsEarned = coinsEarned;
            prediction.SettledAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Award coins if won
            if (coinsEarned > 0)
            {
                await _coinService.AddCoinsAsync(
                    prediction.UserId,
                    coinsEarned,
                    $"Prediction winnings for {prediction.RaceName}",
                    predictionId);
            }

            // Update leaderboard
            await _leaderboardService.UpdateLeaderboardAsync(prediction.UserId);

            return true;
        }

        public async Task<List<PredictionDto>> GetAllPendingPredictionsAsync()
        {
            var predictions = await _context.Predictions
                .Include(p => p.User)
                .Where(p => p.Status == PredictionStatus.PENDING)
                .OrderBy(p => p.RaceDateTime)
                .ToListAsync();

            return predictions.Select(MapToDto).ToList();
        }

        public async Task<List<string>> GetPendingRacesAsync()
        {
            var races = await _context.Predictions
                .Where(p => p.Status == PredictionStatus.PENDING)
                .Select(p => new { p.RaceId, p.RaceName, p.RaceDateTime })
                .Distinct()
                .OrderBy(r => r.RaceDateTime)
                .Select(r => $"{r.RaceId}|{r.RaceName}|{r.RaceDateTime:yyyy-MM-dd}")
                .ToListAsync();

            return races;
        }

        public async Task<RaceValidationResultDto> SettleRaceAsync(string raceId, RaceResultsDto raceResults)
        {
            // Get all pending predictions for this race
            var predictions = await _context.Predictions
                .Include(p => p.User)
                .Where(p => p.RaceId == raceId && p.Status == PredictionStatus.PENDING)
                .ToListAsync();

            var result = new RaceValidationResultDto
            {
                TotalPredictions = predictions.Count
            };

            // Convert RaceResultsDto to PredictionDto format for reuse
            var actualResults = new PredictionDto
            {
                RaceId = raceResults.RaceId,
                RaceName = raceResults.RaceName,
                Season = raceResults.Season,
                PodiumP1 = raceResults.PodiumP1,
                PodiumP2 = raceResults.PodiumP2,
                PodiumP3 = raceResults.PodiumP3,
                FastestLapDriver = raceResults.FastestLapDriver,
                PolePositionDriver = raceResults.PolePositionDriver,
                FirstRetirementLap = raceResults.FirstRetirementLap,
                WillThereBeASafetyCar = raceResults.WillThereBeASafetyCar,
                NumberOfDnfs = raceResults.NumberOfDnfs
            };

            foreach (var prediction in predictions)
            {
                // Calculate points based on correctness
                int pointsEarned = CalculatePoints(prediction, actualResults);
                double accuracyPercentage = CalculateAccuracy(prediction, actualResults);

                // Determine winnings
                int coinsEarned = 0;
                PredictionStatus status;

                if (accuracyPercentage >= 0.8) // 80%+ accuracy = win
                {
                    status = PredictionStatus.WON;
                    coinsEarned = prediction.PotentialPayout;
                    result.WinnersCount++;
                }
                else if (accuracyPercentage >= 0.4) // 40-79% = partial
                {
                    status = PredictionStatus.PARTIAL;
                    coinsEarned = (int)(prediction.CoinsWagered * (1 + accuracyPercentage));
                    result.PartialWinnersCount++;
                }
                else // Less than 40% = loss
                {
                    status = PredictionStatus.LOST;
                    coinsEarned = 0;
                    result.LosersCount++;
                }

                prediction.Status = status;
                prediction.PointsEarned = pointsEarned;
                prediction.CoinsEarned = coinsEarned;
                prediction.SettledAt = DateTime.UtcNow;

                result.TotalCoinsAwarded += coinsEarned;
                result.TotalPointsAwarded += pointsEarned;
                result.SettledCount++;
                result.SettledUsernames.Add(prediction.User.Username);

                // Award coins if won
                if (coinsEarned > 0)
                {
                    await _coinService.AddCoinsAsync(
                        prediction.UserId,
                        coinsEarned,
                        $"Prediction winnings for {prediction.RaceName}",
                        prediction.Id);
                }

                // Update leaderboard
                await _leaderboardService.UpdateLeaderboardAsync(prediction.UserId);
            }

            await _context.SaveChangesAsync();

            return result;
        }

        private int CalculatePayout(CreatePredictionDto prediction)
        {
            // Base multiplier
            double multiplier = 1.5;

            // Increase multiplier based on number of predictions made
            int predictionCount = 0;
            if (!string.IsNullOrEmpty(prediction.PodiumP1)) predictionCount++;
            if (!string.IsNullOrEmpty(prediction.PodiumP2)) predictionCount++;
            if (!string.IsNullOrEmpty(prediction.PodiumP3)) predictionCount++;
            if (!string.IsNullOrEmpty(prediction.FastestLapDriver)) predictionCount++;
            if (!string.IsNullOrEmpty(prediction.PolePositionDriver)) predictionCount++;
            if (prediction.FirstRetirementLap.HasValue) predictionCount++;
            if (prediction.WillThereBeASafetyCar.HasValue) predictionCount++;
            if (prediction.NumberOfDnfs.HasValue) predictionCount++;

            multiplier += (predictionCount - 1) * 0.3; // Each additional prediction adds 30% to multiplier

            return (int)(prediction.CoinsWagered * multiplier);
        }

        private int CalculatePoints(Prediction prediction, PredictionDto actual)
        {
            int points = 0;

            if (prediction.PodiumP1 == actual.PodiumP1) points += 100;
            if (prediction.PodiumP2 == actual.PodiumP2) points += 75;
            if (prediction.PodiumP3 == actual.PodiumP3) points += 50;
            if (prediction.FastestLapDriver == actual.FastestLapDriver) points += 60;
            if (prediction.PolePositionDriver == actual.PolePositionDriver) points += 40;
            
            if (prediction.FirstRetirementLap.HasValue && actual.FirstRetirementLap.HasValue)
            {
                int diff = Math.Abs(prediction.FirstRetirementLap.Value - actual.FirstRetirementLap.Value);
                if (diff == 0) points += 80;
                else if (diff <= 2) points += 40;
            }

            if (prediction.WillThereBeASafetyCar == actual.WillThereBeASafetyCar) points += 50;
            
            if (prediction.NumberOfDnfs.HasValue && actual.NumberOfDnfs.HasValue)
            {
                int diff = Math.Abs(prediction.NumberOfDnfs.Value - actual.NumberOfDnfs.Value);
                if (diff == 0) points += 70;
                else if (diff == 1) points += 35;
            }

            return points;
        }

        private double CalculateAccuracy(Prediction prediction, PredictionDto actual)
        {
            int correct = 0;
            int total = 0;

            if (!string.IsNullOrEmpty(prediction.PodiumP1)) { total++; if (prediction.PodiumP1 == actual.PodiumP1) correct++; }
            if (!string.IsNullOrEmpty(prediction.PodiumP2)) { total++; if (prediction.PodiumP2 == actual.PodiumP2) correct++; }
            if (!string.IsNullOrEmpty(prediction.PodiumP3)) { total++; if (prediction.PodiumP3 == actual.PodiumP3) correct++; }
            if (!string.IsNullOrEmpty(prediction.FastestLapDriver)) { total++; if (prediction.FastestLapDriver == actual.FastestLapDriver) correct++; }
            if (!string.IsNullOrEmpty(prediction.PolePositionDriver)) { total++; if (prediction.PolePositionDriver == actual.PolePositionDriver) correct++; }
            if (prediction.WillThereBeASafetyCar.HasValue) { total++; if (prediction.WillThereBeASafetyCar == actual.WillThereBeASafetyCar) correct++; }

            return total > 0 ? (double)correct / total : 0;
        }

        private PredictionDto MapToDto(Prediction prediction)
        {
            return new PredictionDto
            {
                Id = prediction.Id,
                RaceId = prediction.RaceId,
                RaceName = prediction.RaceName,
                Season = prediction.Season,
                PodiumP1 = prediction.PodiumP1,
                PodiumP2 = prediction.PodiumP2,
                PodiumP3 = prediction.PodiumP3,
                FastestLapDriver = prediction.FastestLapDriver,
                PolePositionDriver = prediction.PolePositionDriver,
                FirstRetirementLap = prediction.FirstRetirementLap,
                WillThereBeASafetyCar = prediction.WillThereBeASafetyCar,
                NumberOfDnfs = prediction.NumberOfDnfs,
                CoinsWagered = prediction.CoinsWagered,
                PotentialPayout = prediction.PotentialPayout,
                Status = prediction.Status,
                PointsEarned = prediction.PointsEarned,
                CoinsEarned = prediction.CoinsEarned,
                CreatedAt = prediction.CreatedAt,
                SettledAt = prediction.SettledAt,
                RaceDateTime = prediction.RaceDateTime,
                Username = prediction.User?.Username
            };
        }
    }
}
