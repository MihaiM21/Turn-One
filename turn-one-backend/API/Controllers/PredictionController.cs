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
    public class PredictionController : ControllerBase
    {
        private readonly IPredictionService _predictionService;

        public PredictionController(IPredictionService predictionService)
        {
            _predictionService = predictionService;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePrediction([FromBody] CreatePredictionDto predictionDto)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var prediction = await _predictionService.CreatePredictionAsync(userId, predictionDto);
                return Ok(new { success = true, data = prediction });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while creating prediction" });
            }
        }

        [HttpGet("user")]
        public async Task<IActionResult> GetUserPredictions()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var predictions = await _predictionService.GetUserPredictionsAsync(userId);
                return Ok(new { success = true, data = predictions });
            }
            catch (Exception)
            {
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingPredictions()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var predictions = await _predictionService.GetPendingPredictionsAsync(userId);
                return Ok(new { success = true, data = predictions });
            }
            catch (Exception)
            {
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPredictionById(Guid id)
        {
            try
            {
                var prediction = await _predictionService.GetPredictionByIdAsync(id);
                if (prediction == null)
                {
                    return NotFound(new { success = false, message = "Prediction not found" });
                }
                return Ok(new { success = true, data = prediction });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [Authorize(Roles = "ADMIN")]
        [HttpPost("{id}/settle")]
        public async Task<IActionResult> SettlePrediction(Guid id, [FromBody] PredictionDto actualResults)
        {
            try
            {
                var success = await _predictionService.SettlePredictionAsync(id, actualResults);
                if (!success)
                {
                    return NotFound(new { success = false, message = "Prediction not found or already settled" });
                }
                return Ok(new { success = true, message = "Prediction settled successfully" });
            }
            catch (Exception)
            {
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [Authorize(Roles = "ADMIN")]
        [HttpGet("all/pending")]
        public async Task<IActionResult> GetAllPendingPredictions()
        {
            try
            {
                var predictions = await _predictionService.GetAllPendingPredictionsAsync();
                return Ok(new { success = true, data = predictions });
            }
            catch (Exception)
            {
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }
    }
}
