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
    public class CoinController : ControllerBase
    {
        private readonly ICoinService _coinService;

        public CoinController(ICoinService coinService)
        {
            _coinService = coinService;
        }

        [HttpGet("balance")]
        public async Task<IActionResult> GetBalance()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var balance = await _coinService.GetUserCoinsAsync(userId);
                return Ok(new { success = true, data = new { coins = balance } });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetBalance: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions([FromQuery] int limit = 50)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var transactions = await _coinService.GetUserTransactionsAsync(userId, limit);
                return Ok(new { success = true, data = transactions });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetTransactions: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }
    }
}
