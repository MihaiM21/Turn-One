using Application.DTOs;
using Application.Interfaces;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TelemetryController : ControllerBase
{
    private readonly ITelemetrySessionService _sessionService;

    public TelemetryController(ITelemetrySessionService sessionService)
    {
        _sessionService = sessionService;
    }

    [HttpGet("sessions/me")]
    public async Task<ActionResult<List<TelemetrySessionDto>>> GetMySessions()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var sessions = await _sessionService.GetUserSessionsAsync(userId);
        return Ok(sessions);
    }

    [HttpGet("leaderboards")]
    [AllowAnonymous]
    public async Task<ActionResult> GetLeaderboards()
    {
        var users = await _sessionService.GetLeaderboardsAsync(50);
        var result = users.Select(u => new
        {
            u.Id,
            u.UserId,
            Username = u.User.Username,
            u.TotalDistanceKm,
            u.TotalLaps,
            u.TotalSessions,
            u.HighestSpeedKmh,
            u.TotalPlayTimeSeconds,
            u.LastSessionAt
        });
        return Ok(result);
    }

    [HttpGet("sessions/public")]
    public async Task<ActionResult<List<TelemetrySessionDto>>> GetPublicSessions()
    {
        var planStr = User.FindFirstValue("Plan");
        if (Enum.TryParse<PlanType>(planStr, out var plan) && plan == PlanType.BASIC)
        {
            return Forbid("Public sessions require PRO or ELITE plan.");
        }

        var sessions = await _sessionService.GetPublicSessionsAsync();
        return Ok(sessions);
    }

    [HttpGet("live")]
    public async Task<ActionResult<List<TelemetrySessionDto>>> GetLiveSessions()
    {
        var planStr = User.FindFirstValue("Plan");
        if (Enum.TryParse<PlanType>(planStr, out var plan) && plan == PlanType.BASIC)
        {
            return Forbid("Spectating requires PRO or ELITE plan.");
        }

        var sessions = await _sessionService.GetPublicLiveSessionsAsync();
        return Ok(sessions);
    }

    [HttpGet("sessions/{id}")]
    public async Task<ActionResult<TelemetrySessionDto>> GetSession(Guid id)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var session = await _sessionService.GetSessionDetailAsync(id, userId);
        if (session == null) return NotFound();

        return Ok(session);
    }

    [HttpPatch("sessions/{id}/visibility")]
    public async Task<IActionResult> UpdateVisibility(Guid id, [FromBody] TelemetryVisibility visibility)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var planStr = User.FindFirstValue("Plan");
        if (Enum.TryParse<PlanType>(planStr, out var plan) && plan == PlanType.BASIC && visibility == TelemetryVisibility.Public)
        {
            return Forbid("Public sessions require PRO or ELITE plan.");
        }

        await _sessionService.UpdateVisibilityAsync(id, userId, visibility);
        return NoContent();
    }

    [HttpDelete("sessions/{id}")]
    public async Task<IActionResult> DeleteSession(Guid id)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        await _sessionService.DeleteSessionAsync(id, userId);
        return NoContent();
    }
}
