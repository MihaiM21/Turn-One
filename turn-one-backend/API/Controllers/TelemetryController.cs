using Application.DTOs;
using Application.Interfaces;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TelemetryController : ControllerBase
{
    private readonly ITelemetrySessionService _sessionService;
    private readonly Infrastructure.TurnOneDbContext _db;

    public TelemetryController(ITelemetrySessionService sessionService, Infrastructure.TurnOneDbContext db)
    {
        _sessionService = sessionService;
        _db = db;
    }

    [HttpGet("me/stats")]
    public async Task<ActionResult> GetMyStats()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var sim = await _db.SimUsers.FirstOrDefaultAsync(u => u.UserId == userId);
        var totalSessions = await _db.TelemetrySessions.CountAsync(s => s.UserId == userId);
        var activeSessions = await _db.TelemetrySessions.CountAsync(s => s.UserId == userId && s.IsActive);
        var bestLap = await _db.TelemetryLaps
            .Where(l => l.Session.UserId == userId && l.IsValid && l.LapTimeMs != null && l.LapTimeMs > 0)
            .OrderBy(l => l.LapTimeMs)
            .Select(l => new { l.LapTimeMs, l.Session.Track, l.Session.CarModel, l.LapNumber, l.Session.Id })
            .FirstOrDefaultAsync();

        return Ok(new
        {
            totalSessions,
            activeSessions,
            totalLaps = sim?.TotalLaps ?? 0,
            totalDistanceKm = sim?.TotalDistanceKm ?? 0,
            totalPlayTimeSeconds = sim?.TotalPlayTimeSeconds ?? 0,
            highestSpeedKmh = sim?.HighestSpeedKmh ?? 0,
            lastSessionAt = sim?.LastSessionAt,
            bestLap = bestLap == null ? null : new
            {
                lapTimeMs = bestLap.LapTimeMs,
                track = bestLap.Track,
                carModel = bestLap.CarModel,
                lapNumber = bestLap.LapNumber,
                sessionId = bestLap.Id
            }
        });
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

    [HttpGet("sessions/{id}/chart")]
    public async Task<ActionResult> GetSessionChartData([FromServices] ITelemetryTickRepository tickRepo, Guid id)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var planStr = User.FindFirstValue("Plan");
        if (!Enum.TryParse<PlanType>(planStr, out var plan)) plan = PlanType.BASIC;

        var session = await _sessionService.GetSessionDetailAsync(id, userId);
        if (session == null) return NotFound();

        var chartData = await tickRepo.GetSessionPhysicsChartAsync(plan, id);
        return Ok(chartData);
    }

    [HttpGet("sessions/{id}/channels")]
    public async Task<ActionResult> GetSessionChannels(
        [FromServices] ITelemetryTickRepository tickRepo,
        Guid id,
        [FromQuery] string? channels)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var planStr = User.FindFirstValue("Plan");
        if (!Enum.TryParse<PlanType>(planStr, out var plan)) plan = PlanType.BASIC;

        var session = await _sessionService.GetSessionDetailAsync(id, userId);
        if (session == null) return NotFound();

        var requested = string.IsNullOrWhiteSpace(channels)
            ? TelemetryChannels.AllowedFor(plan)
            : channels.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var data = await tickRepo.GetSessionChannelsAsync(plan, id, requested.ToList());
        return Ok(data);
    }

    [HttpGet("sessions/{id}/laps/{lapNumber:int}/chart")]
    public async Task<ActionResult> GetLapChart(
        [FromServices] ITelemetryTickRepository tickRepo,
        Guid id,
        int lapNumber,
        [FromQuery] string? channels)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var planStr = User.FindFirstValue("Plan");
        if (!Enum.TryParse<PlanType>(planStr, out var plan)) plan = PlanType.BASIC;

        var session = await _sessionService.GetSessionDetailAsync(id, userId);
        if (session == null) return NotFound();

        var (start, end) = await tickRepo.GetLapBoundsAsync(plan, id, lapNumber);
        if (start == null || end == null) return Ok(new MultiChannelChart());

        var requested = string.IsNullOrWhiteSpace(channels)
            ? TelemetryChannels.AllowedFor(plan)
            : channels.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var data = await tickRepo.GetSessionChannelsAsync(plan, id, requested.ToList(), start, end);
        return Ok(data);
    }

    [HttpGet("sessions/{id}/laps")]
    public async Task<ActionResult<List<TelemetryLapDto>>> GetSessionLaps(Guid id)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var session = await _sessionService.GetSessionDetailAsync(id, userId);
        if (session == null) return NotFound();

        var laps = await _db.TelemetryLaps
            .Where(l => l.SessionId == id)
            .OrderBy(l => l.LapNumber)
            .Select(l => new TelemetryLapDto
            {
                Id = l.Id,
                SessionId = l.SessionId,
                LapNumber = l.LapNumber,
                LapTimeMs = l.LapTimeMs,
                Sector1Ms = l.Sector1Ms,
                Sector2Ms = l.Sector2Ms,
                Sector3Ms = l.Sector3Ms,
                IsValid = l.IsValid,
                MaxSpeedKmh = l.MaxSpeedKmh,
                MaxRpm = l.MaxRpm,
                AverageThrottle = l.AverageThrottle,
                AverageBrake = l.AverageBrake,
                FuelUsed = l.FuelUsed,
                BrakingScore = l.BrakingScore,
                ThrottleScore = l.ThrottleScore,
                ConsistencyScore = l.ConsistencyScore,
                RecordedAt = l.RecordedAt
            })
            .ToListAsync();

        return Ok(laps);
    }

    [HttpGet("sessions/{id}/metrics")]
    public async Task<ActionResult<List<LapMetrics>>> GetSessionMetrics(
        [FromServices] ILapAnalyticsService analytics,
        Guid id)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var planStr = User.FindFirstValue("Plan");
        if (!Enum.TryParse<PlanType>(planStr, out var plan)) plan = PlanType.BASIC;

        var session = await _sessionService.GetSessionDetailAsync(id, userId);
        if (session == null) return NotFound();

        var metrics = await analytics.ComputeSessionMetricsAsync(plan, id);
        return Ok(metrics);
    }

    [HttpGet("sessions/{id}/compare")]
    public async Task<ActionResult> CompareSessions(
        [FromServices] ITelemetryTickRepository tickRepo,
        Guid id,
        [FromQuery] Guid against,
        [FromQuery] int? lap = null,
        [FromQuery] int? againstLap = null,
        [FromQuery] string? channels = null)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var planStr = User.FindFirstValue("Plan");
        if (!Enum.TryParse<PlanType>(planStr, out var plan)) plan = PlanType.BASIC;
        if (plan == PlanType.BASIC) return Forbid("Session comparison requires PRO or ELITE plan.");

        var primary = await _sessionService.GetSessionDetailAsync(id, userId);
        var secondary = await _sessionService.GetSessionDetailAsync(against, userId);
        if (primary == null || secondary == null) return NotFound();

        var requested = string.IsNullOrWhiteSpace(channels)
            ? TelemetryChannels.AllowedFor(plan)
            : channels.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var primaryBounds = lap.HasValue
            ? await tickRepo.GetLapBoundsAsync(plan, id, lap.Value)
            : (null, null);
        var secondaryBounds = againstLap.HasValue
            ? await tickRepo.GetLapBoundsAsync(plan, against, againstLap.Value)
            : (null, null);

        var primaryData = await tickRepo.GetSessionChannelsAsync(plan, id, requested.ToList(), primaryBounds.Item1, primaryBounds.Item2);
        var secondaryData = await tickRepo.GetSessionChannelsAsync(plan, against, requested.ToList(), secondaryBounds.Item1, secondaryBounds.Item2);

        return Ok(new
        {
            primary = new { sessionId = id, lap, data = primaryData },
            secondary = new { sessionId = against, lap = againstLap, data = secondaryData }
        });
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
