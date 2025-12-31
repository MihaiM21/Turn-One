using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class LeaderboardController : ControllerBase
    {
        private readonly ILeaderboardService _leaderboardService;

        public LeaderboardController(ILeaderboardService leaderboardService)
        {
            _leaderboardService = leaderboardService;
        }

        [HttpGet("global")]
        public async Task<IActionResult> GetGlobalLeaderboard([FromQuery] int limit = 100)
        {
            try
            {
                var leaderboard = await _leaderboardService.GetGlobalLeaderboardAsync(limit);
                return Ok(new { success = true, data = leaderboard });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetGlobalLeaderboard: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [HttpGet("season/{season}")]
        public async Task<IActionResult> GetSeasonLeaderboard(string season, [FromQuery] int limit = 100)
        {
            try
            {
                var leaderboard = await _leaderboardService.GetSeasonLeaderboardAsync(season, limit);
                return Ok(new { success = true, data = leaderboard });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetSeasonLeaderboard: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetUserStats()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var stats = await _leaderboardService.GetUserStatsAsync(userId);
                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetUserStats: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }
    }
}
