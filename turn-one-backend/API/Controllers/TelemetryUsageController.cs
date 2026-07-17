using System.Security.Claims;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize]
[Route("api/telemetry-usage")]
public class TelemetryUsageController : ControllerBase
{
    private readonly ITelemetryUsageService _usageService;

    public TelemetryUsageController(ITelemetryUsageService usageService)
    {
        _usageService = usageService;
    }

    /// <summary>
    /// Records a telemetry plot-generation attempt for the current user.
    /// Called fire-and-forget by the client after each generation (success or failure);
    /// decoupled from token deduction so a logging failure never blocks generation.
    /// </summary>
    [HttpPost("log")]
    public async Task<ActionResult> Log([FromBody] LogTelemetryRequestDto dto)
    {
        try
        {
            var userId = GetUserId();
            await _usageService.LogRequestAsync(userId, dto);
            return Ok(new { message = "Logged" });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to log telemetry request", error = ex.Message });
        }
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null)
            throw new UnauthorizedAccessException("User ID not found in claims");
        return Guid.Parse(userIdClaim);
    }
}
