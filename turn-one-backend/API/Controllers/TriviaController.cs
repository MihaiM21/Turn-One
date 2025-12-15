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
    public class TriviaController : ControllerBase
    {
        private readonly ITriviaService _triviaService;

        public TriviaController(ITriviaService triviaService)
        {
            _triviaService = triviaService;
        }

        [HttpGet("random")]
        public async Task<IActionResult> GetRandomTrivia()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var trivia = await _triviaService.GetRandomTriviaAsync(userId);
                
                if (trivia == null)
                {
                    return Ok(new { success = false, message = "No available trivia questions at the moment" });
                }

                return Ok(new { success = true, data = trivia });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetRandomTrivia: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                return StatusCode(500, new { success = false, message = ex.Message, details = ex.StackTrace });
            }
        }

        [HttpPost("attempt")]
        public async Task<IActionResult> SubmitAttempt([FromBody] TriviaAttemptDto attemptDto)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var result = await _triviaService.SubmitTriviaAttemptAsync(userId, attemptDto);
                return Ok(new { success = true, data = result });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [Authorize(Roles = "ADMIN")]
        [HttpGet("all")]
        public async Task<IActionResult> GetAllTrivia()
        {
            try
            {
                var trivias = await _triviaService.GetAllTriviaAsync();
                return Ok(new { success = true, data = trivias });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [Authorize(Roles = "ADMIN")]
        [HttpPost]
        public async Task<IActionResult> CreateTrivia([FromBody] CreateTriviaDto triviaDto)
        {
            try
            {
                var trivia = await _triviaService.CreateTriviaAsync(triviaDto);
                return Ok(new { success = true, data = trivia });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [Authorize(Roles = "ADMIN")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTrivia(Guid id)
        {
            try
            {
                var success = await _triviaService.DeleteTriviaAsync(id);
                if (!success)
                {
                    return NotFound(new { success = false, message = "Trivia not found" });
                }
                return Ok(new { success = true, message = "Trivia deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }
    }
}
