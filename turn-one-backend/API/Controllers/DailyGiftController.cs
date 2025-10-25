using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DailyGiftController : ControllerBase
    {
        private readonly IDailyGiftService _dailyGiftService;

        public DailyGiftController(IDailyGiftService dailyGiftService)
        {
            _dailyGiftService = dailyGiftService;
        }

        [HttpGet("status")]
        public async Task<ActionResult> CheckDailyGiftStatus()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized("Invalid user ID in token");
            }

            bool canClaim = await _dailyGiftService.CanClaimDailyGiftAsync(userGuid);
            
            return Ok(new { 
                CanClaimDailyGift = canClaim 
            });
        }

        [HttpPost("claim")]
        public async Task<ActionResult> ClaimDailyGift()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized("Invalid user ID in token");
            }
            
            try
            {
                var (awarded, coins, experience) = await _dailyGiftService.ClaimDailyGiftAsync(userGuid);
                
                if (!awarded)
                {
                    return BadRequest(new { 
                        Success = false, 
                        Message = "Daily gift already claimed today" 
                    });
                }
                
                return Ok(new { 
                    Success = true, 
                    Message = $"Daily gift claimed! You received {coins} coins and {experience} XP", 
                    Coins = coins, 
                    Experience = experience 
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = $"An error occurred: {ex.Message}" });
            }
        }
    }
}