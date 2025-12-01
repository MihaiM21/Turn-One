using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services
{
    public class LeaderboardService : ILeaderboardService
    {
        private readonly TurnOneDbContext _context;

        public LeaderboardService(TurnOneDbContext context)
        {
            _context = context;
        }

        public async Task<List<LeaderboardDto>> GetGlobalLeaderboardAsync(int limit = 100)
        {
            var leaderboard = await _context.Leaderboards
                .Include(l => l.User)
                .OrderByDescending(l => l.TotalPointsEarned)
                .Take(limit)
                .Select(l => new LeaderboardDto
                {
                    UserId = l.UserId,
                    Username = l.User.Username,
                    AvatarUrl = l.User.AvatarUrl,
                    TotalPredictions = l.TotalPredictions,
                    CorrectPredictions = l.CorrectPredictions,
                    AccuracyPercentage = l.TotalPredictions > 0 ? (double)l.CorrectPredictions / l.TotalPredictions * 100 : 0,
                    TotalPointsEarned = l.TotalPointsEarned,
                    TotalCoinsEarned = l.TotalCoinsEarned,
                    CurrentStreak = l.CurrentStreak,
                    LongestStreak = l.LongestStreak,
                    GlobalRank = l.GlobalRank,
                    SeasonRank = l.SeasonRank,
                    Season = l.Season,
                    TriviaCorrect = l.TriviaCorrect,
                    TriviaAttempts = l.TriviaAttempts,
                    TriviaAccuracy = l.TriviaAttempts > 0 ? (double)l.TriviaCorrect / l.TriviaAttempts * 100 : 0,
                    LastUpdated = l.LastUpdated
                })
                .ToListAsync();

            // Update ranks
            for (int i = 0; i < leaderboard.Count; i++)
            {
                leaderboard[i].GlobalRank = i + 1;
            }

            return leaderboard;
        }

        public async Task<List<LeaderboardDto>> GetSeasonLeaderboardAsync(string season, int limit = 100)
        {
            var leaderboard = await _context.Leaderboards
                .Include(l => l.User)
                .Where(l => l.Season == season)
                .OrderByDescending(l => l.TotalPointsEarned)
                .Take(limit)
                .Select(l => new LeaderboardDto
                {
                    UserId = l.UserId,
                    Username = l.User.Username,
                    AvatarUrl = l.User.AvatarUrl,
                    TotalPredictions = l.TotalPredictions,
                    CorrectPredictions = l.CorrectPredictions,
                    AccuracyPercentage = l.TotalPredictions > 0 ? (double)l.CorrectPredictions / l.TotalPredictions * 100 : 0,
                    TotalPointsEarned = l.TotalPointsEarned,
                    TotalCoinsEarned = l.TotalCoinsEarned,
                    CurrentStreak = l.CurrentStreak,
                    LongestStreak = l.LongestStreak,
                    GlobalRank = l.GlobalRank,
                    SeasonRank = l.SeasonRank,
                    Season = l.Season,
                    TriviaCorrect = l.TriviaCorrect,
                    TriviaAttempts = l.TriviaAttempts,
                    TriviaAccuracy = l.TriviaAttempts > 0 ? (double)l.TriviaCorrect / l.TriviaAttempts * 100 : 0,
                    LastUpdated = l.LastUpdated
                })
                .ToListAsync();

            // Update season ranks
            for (int i = 0; i < leaderboard.Count; i++)
            {
                leaderboard[i].SeasonRank = i + 1;
            }

            return leaderboard;
        }

        public async Task<UserStatsDto> GetUserStatsAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            var leaderboard = await _context.Leaderboards
                .FirstOrDefaultAsync(l => l.UserId == userId);

            var totalEarned = await _context.CoinTransactions
                .Where(t => t.UserId == userId && t.Amount > 0)
                .SumAsync(t => t.Amount);

            var totalSpent = await _context.CoinTransactions
                .Where(t => t.UserId == userId && t.Amount < 0)
                .SumAsync(t => Math.Abs(t.Amount));

            return new UserStatsDto
            {
                TotalCoins = user.Coins,
                Level = user.Level,
                Experience = user.Experience,
                TotalPredictions = leaderboard?.TotalPredictions ?? 0,
                CorrectPredictions = leaderboard?.CorrectPredictions ?? 0,
                AccuracyPercentage = leaderboard != null && leaderboard.TotalPredictions > 0 
                    ? (double)leaderboard.CorrectPredictions / leaderboard.TotalPredictions * 100 
                    : 0,
                CurrentStreak = leaderboard?.CurrentStreak ?? 0,
                TotalCoinsEarned = totalEarned,
                TotalCoinsSpent = totalSpent,
                GlobalRank = leaderboard?.GlobalRank ?? 0
            };
        }

        public async Task UpdateLeaderboardAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return;
            }

            var currentSeason = DateTime.UtcNow.Year.ToString();
            var leaderboard = await _context.Leaderboards
                .FirstOrDefaultAsync(l => l.UserId == userId && l.Season == currentSeason);

            if (leaderboard == null)
            {
                leaderboard = new Leaderboard
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Season = currentSeason
                };
                _context.Leaderboards.Add(leaderboard);
            }

            // Calculate stats from predictions
            var predictions = await _context.Predictions
                .Where(p => p.UserId == userId && p.Season == currentSeason)
                .ToListAsync();

            leaderboard.TotalPredictions = predictions.Count;
            leaderboard.CorrectPredictions = predictions.Count(p => p.Status == PredictionStatus.WON);
            leaderboard.TotalPointsEarned = predictions.Sum(p => p.PointsEarned);
            leaderboard.TotalCoinsEarned = predictions.Sum(p => p.CoinsEarned);

            // Calculate streak
            var recentPredictions = predictions
                .OrderByDescending(p => p.SettledAt)
                .ToList();

            int currentStreak = 0;
            foreach (var pred in recentPredictions)
            {
                if (pred.Status == PredictionStatus.WON)
                {
                    currentStreak++;
                }
                else if (pred.Status == PredictionStatus.LOST)
                {
                    break;
                }
            }

            leaderboard.CurrentStreak = currentStreak;
            if (currentStreak > leaderboard.LongestStreak)
            {
                leaderboard.LongestStreak = currentStreak;
            }

            // Calculate trivia stats
            var triviaAttempts = await _context.TriviaAttempts
                .Where(t => t.UserId == userId)
                .ToListAsync();

            leaderboard.TriviaAttempts = triviaAttempts.Count;
            leaderboard.TriviaCorrect = triviaAttempts.Count(t => t.IsCorrect);

            leaderboard.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Update global ranks
            await UpdateAllRanksAsync();
        }

        private async Task UpdateAllRanksAsync()
        {
            var allLeaderboards = await _context.Leaderboards
                .OrderByDescending(l => l.TotalPointsEarned)
                .ToListAsync();

            for (int i = 0; i < allLeaderboards.Count; i++)
            {
                allLeaderboards[i].GlobalRank = i + 1;
            }

            await _context.SaveChangesAsync();
        }
    }
}
