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
    public class TokenController : ControllerBase
    {
        private readonly ITokenService _tokenService;
        private readonly ICoinService _coinService;

        public TokenController(ITokenService tokenService, ICoinService coinService)
        {
            _tokenService = tokenService;
            _coinService = coinService;
        }

        [HttpPost("purchase")]
        public async Task<IActionResult> PurchaseTokens([FromBody] PurchaseTokensDto dto)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                
                // Validate the purchase
                var userCoins = await _coinService.GetUserCoinsAsync(userId);
                if (userCoins < dto.CoinCost)
                {
                    return BadRequest(new { success = false, message = "Insufficient coins" });
                }

                // Deduct coins
                await _coinService.DeductCoinsAsync(userId, dto.CoinCost, $"Purchased {dto.Amount} tokens");

                // Add tokens
                var newTokenBalance = await _tokenService.AddTokensAsync(userId, dto.Amount);
                var newCoinBalance = await _coinService.GetUserCoinsAsync(userId);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        newTokenBalance,
                        newCoinBalance
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in PurchaseTokens: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [HttpGet("balance")]
        public async Task<IActionResult> GetTokenBalance()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var balance = await _tokenService.GetTokenBalanceAsync(userId);
                return Ok(new { success = true, data = new { tokens = balance } });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetTokenBalance: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [HttpPost("claim-starter-pack")]
        public async Task<IActionResult> ClaimStarterPack()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                
                // Check if user has already claimed
                var hasClaimed = await _tokenService.HasClaimedStarterPackAsync(userId);
                if (hasClaimed)
                {
                    return BadRequest(new { success = false, message = "Starter pack already claimed" });
                }

                // Give 500 coins and 50 tokens
                await _coinService.AddCoinsAsync(userId, 500, "Welcome Starter Pack");
                var newTokenBalance = await _tokenService.AddTokensAsync(userId, 50);
                
                // Mark as claimed
                await _tokenService.MarkStarterPackClaimedAsync(userId);
                
                var newCoinBalance = await _coinService.GetUserCoinsAsync(userId);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        newTokenBalance,
                        newCoinBalance
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in ClaimStarterPack: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [HttpGet("starter-pack-status")]
        public async Task<IActionResult> GetStarterPackStatus()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var hasClaimed = await _tokenService.HasClaimedStarterPackAsync(userId);
                return Ok(new { success = true, data = new { hasClaimed } });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetStarterPackStatus: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }
    }
}
