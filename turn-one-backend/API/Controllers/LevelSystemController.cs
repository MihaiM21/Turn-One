using System.Security.Claims;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class LevelSystemController : ControllerBase
    {
        private readonly ILevelSystemService _levelSystemService;

        public LevelSystemController(ILevelSystemService levelSystemService)
        {
            _levelSystemService = levelSystemService;
        }
        
        [HttpGet("progress")]
        public async Task<ActionResult> GetUserProgress()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized("Invalid user ID in token");
            }
            
            try
            {
                var (currentLevel, currentExperience, experienceToNextLevel) = 
                    await _levelSystemService.GetUserProgressAsync(userGuid);
                
                return Ok(new 
                {
                    CurrentLevel = currentLevel,
                    CurrentExperience = currentExperience,
                    ExperienceRequired = experienceToNextLevel,
                    ProgressPercentage = (currentExperience * 100.0) / experienceToNextLevel
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }
        
        [HttpPost("add-experience")]
        public async Task<ActionResult> AddExperience([FromBody] AddExperienceRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized("Invalid user ID in token");
            }
            
            if (request.Experience <= 0)
            {
                return BadRequest("Experience points must be greater than zero");
            }
            
            try
            {
                var levelsGained = await _levelSystemService.AddExperienceAsync(userGuid, request.Experience);
                var (currentLevel, currentExperience, experienceToNextLevel) = 
                    await _levelSystemService.GetUserProgressAsync(userGuid);
                
                return Ok(new 
                {
                    LevelsGained = levelsGained,
                    CurrentLevel = currentLevel,
                    CurrentExperience = currentExperience,
                    ExperienceRequired = experienceToNextLevel,
                    ProgressPercentage = (currentExperience * 100.0) / experienceToNextLevel
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }
    }
    
    public class AddExperienceRequest
    {
        public int Experience { get; set; }
    }
}