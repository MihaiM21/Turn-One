using System.Security.Claims;
using API.Filters;
using Application.DTOs;
using Application.Interfaces;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

/// <summary>
/// Distance-indexed lap telemetry: decoded channel arrays, corner analysis, overlays and track profiles.
/// All query/mapping logic lives in <see cref="ILapTelemetryQueryService"/>; this controller only
/// resolves the caller's identity/plan and translates <see cref="LapQueryError"/> into HTTP statuses.
/// </summary>
[ApiController]
[Route("api/telemetry")]
[Authorize]
public class LapTelemetryController : ControllerBase
{
    private readonly ILapTelemetryQueryService _query;
    private readonly ILapReprocessService _reprocess;
    private readonly Infrastructure.TurnOneDbContext _db;

    private static readonly int[] AllowedSteps = { 2, 4, 6, 10 };
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<Guid, DateTime> LastReprocessAt = new();

    public LapTelemetryController(ILapTelemetryQueryService query, ILapReprocessService reprocess, Infrastructure.TurnOneDbContext db)
    {
        _query = query;
        _reprocess = reprocess;
        _db = db;
    }

    private bool TryGetIdentity(out Guid userId, out PlanType plan)
    {
        userId = Guid.Empty;
        plan = PlanType.BASIC;
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(idStr) || !Guid.TryParse(idStr, out userId)) return false;
        var planStr = User.FindFirst("Plan")?.Value;
        Enum.TryParse(planStr, out plan);
        return true;
    }

    private ActionResult FromError<T>(Application.Interfaces.LapQueryResult<T> result) => result.Error switch
    {
        LapQueryError.NotFound => NotFound(new { message = result.Message ?? "not found", processingStatus = result.ProcessingStatus?.ToString() }),
        LapQueryError.Forbidden => StatusCode(403, new { message = result.Message ?? "forbidden" }),
        LapQueryError.BadRequest => BadRequest(new { message = result.Message ?? "bad request" }),
        _ => StatusCode(500),
    };

    private static string[]? ParseChannels(string? channels) =>
        string.IsNullOrWhiteSpace(channels) ? null : channels.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    // ------------------------------------------------------------------------------------- lap telemetry

    [HttpGet("laps/{lapId:guid}/telemetry")]
    public async Task<ActionResult<LapTelemetryDto>> GetLapTelemetry(Guid lapId, [FromQuery] string? channels, [FromQuery] int step = 2)
    {
        if (!TryGetIdentity(out var userId, out var plan)) return Unauthorized();
        var result = await _query.GetLapTelemetryAsync(userId, plan, lapId, ParseChannels(channels), step);
        return result.Error == LapQueryError.None ? Ok(result.Value) : FromError(result);
    }

    [HttpGet("sessions/{sessionId:guid}/laps/{lapNumber:int}/telemetry")]
    public async Task<ActionResult<LapTelemetryDto>> GetLapTelemetryBySessionLap(Guid sessionId, int lapNumber, [FromQuery] string? channels, [FromQuery] int step = 2)
    {
        if (!TryGetIdentity(out var userId, out var plan)) return Unauthorized();
        var result = await _query.GetLapTelemetryAsync(userId, plan, sessionId, lapNumber, ParseChannels(channels), step);
        return result.Error == LapQueryError.None ? Ok(result.Value) : FromError(result);
    }

    // ------------------------------------------------------------------------------------- overlay

    // Not gated by RequiresSimFeature: BASIC gets a two-lap overlay of its own laps; the query
    // service enforces that cap and the PRO rules for cross-session / public laps.
    [HttpGet("laps/overlay")]
    public async Task<ActionResult<LapOverlayDto>> GetOverlay([FromQuery] string laps, [FromQuery(Name = "ref")] Guid? refLap, [FromQuery] string? channels, [FromQuery] int step = 2)
    {
        if (!TryGetIdentity(out var userId, out var plan)) return Unauthorized();
        var lapIds = (laps ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(s => Guid.TryParse(s, out var g) ? g : (Guid?)null)
            .Where(g => g != null).Select(g => g!.Value).ToArray();

        var result = await _query.GetOverlayAsync(userId, plan, lapIds, refLap, ParseChannels(channels), step);
        return result.Error == LapQueryError.None ? Ok(result.Value) : FromError(result);
    }

    // ------------------------------------------------------------------------------------- corners

    [HttpGet("laps/{lapId:guid}/corners")]
    public async Task<ActionResult<LapCornerDto[]>> GetLapCorners(Guid lapId)
    {
        if (!TryGetIdentity(out var userId, out var plan)) return Unauthorized();
        var result = await _query.GetLapCornersAsync(userId, plan, lapId);
        return result.Error == LapQueryError.None ? Ok(result.Value) : FromError(result);
    }

    [HttpGet("laps/corners/compare")]
    [RequiresSimFeature("Comparison")]
    public async Task<ActionResult<CornerCompareDto>> CompareCorners([FromQuery] string laps)
    {
        if (!TryGetIdentity(out var userId, out var plan)) return Unauthorized();
        var lapIds = (laps ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(s => Guid.TryParse(s, out var g) ? g : (Guid?)null)
            .Where(g => g != null).Select(g => g!.Value).ToArray();

        var result = await _query.CompareCornersAsync(userId, plan, lapIds);
        return result.Error == LapQueryError.None ? Ok(result.Value) : FromError(result);
    }

    // ------------------------------------------------------------------------------------- tracks

    [HttpGet("tracks/me")]
    public async Task<ActionResult<MyTrackDto[]>> GetMyTracks()
    {
        if (!TryGetIdentity(out var userId, out _)) return Unauthorized();
        return Ok(await _query.GetMyTracksAsync(userId));
    }

    [HttpGet("tracks/{profileId:guid}")]
    public async Task<ActionResult<TrackProfileDto>> GetTrackProfile(Guid profileId)
    {
        var result = await _query.GetTrackProfileAsync(profileId);
        return result.Error == LapQueryError.None ? Ok(result.Value) : FromError(result);
    }

    [HttpGet("tracks")]
    public async Task<ActionResult<TrackProfileDto>> GetTrackProfileBySourceAndId([FromQuery] string source, [FromQuery] string trackId)
    {
        if (string.IsNullOrWhiteSpace(source) || string.IsNullOrWhiteSpace(trackId)) return BadRequest(new { message = "source and trackId are required" });
        var result = await _query.GetTrackProfileAsync(source, trackId);
        return result.Error == LapQueryError.None ? Ok(result.Value) : FromError(result);
    }

    [HttpGet("tracks/{profileId:guid}/laps/me")]
    public async Task<ActionResult> GetTrackLaps(
        Guid profileId,
        [FromQuery] bool? valid,
        [FromQuery] string? kind,
        [FromQuery] string? car,
        [FromQuery] int limit = 200,
        [FromQuery] string? cursor = null,
        [FromQuery] bool includePublic = false)
    {
        if (!TryGetIdentity(out var userId, out var plan)) return Unauthorized();
        var result = await _query.GetTrackLapsAsync(userId, plan, profileId, valid, kind, car, limit, cursor, includePublic);
        if (result.Error != LapQueryError.None) return FromError(result);
        return Ok(new { items = result.Value!.Items, nextCursor = result.Value.NextCursor });
    }

    // ------------------------------------------------------------------------------------- reprocess

    [HttpPost("sessions/{sessionId:guid}/laps/{lapNumber:int}/reprocess")]
    public async Task<ActionResult> ReprocessLap(Guid sessionId, int lapNumber)
    {
        if (!TryGetIdentity(out var userId, out _)) return Unauthorized();
        var owns = await _db.TelemetrySessions.AnyAsync(s => s.Id == sessionId && s.UserId == userId);
        if (!owns) return NotFound();
        if (IsRateLimited(userId)) return StatusCode(429, new { message = "one reprocess request per minute" });

        var jobId = _reprocess.Enqueue(new ReprocessRequestDto { SessionIds = new[] { sessionId }, OnlyLegacy = false, Force = true }, userId);
        return AcceptedAtAction(nameof(GetReprocessStatusAdmin), new { jobId }, new { jobId });
    }

    /// <summary>Re-runs the lap processor over a session from the raw Influx archive. <c>force=true</c> also redoes laps that already have telemetry (after a processor / Link fix).</summary>
    [HttpPost("sessions/{sessionId:guid}/reprocess")]
    public async Task<ActionResult> ReprocessSession(Guid sessionId, [FromQuery] bool force = false)
    {
        if (!TryGetIdentity(out var userId, out _)) return Unauthorized();
        var owns = await _db.TelemetrySessions.AnyAsync(s => s.Id == sessionId && s.UserId == userId);
        if (!owns) return NotFound();
        if (IsRateLimited(userId)) return StatusCode(429, new { message = "one reprocess request per minute" });

        var jobId = _reprocess.Enqueue(new ReprocessRequestDto { SessionIds = new[] { sessionId }, OnlyLegacy = false, Force = force }, userId);
        return AcceptedAtAction(nameof(GetReprocessStatusAdmin), new { jobId }, new { jobId });
    }

    private static bool IsRateLimited(Guid userId)
    {
        var now = DateTime.UtcNow;
        var last = LastReprocessAt.GetOrAdd(userId, DateTime.MinValue);
        if (now - last < TimeSpan.FromMinutes(1)) return true;
        LastReprocessAt[userId] = now;
        return false;
    }

    // ------------------------------------------------------------------------------------- admin reprocess

    [HttpPost("admin/telemetry/reprocess")]
    [Authorize(Roles = "ADMIN")]
    public ActionResult AdminReprocess([FromBody] ReprocessRequestDto request)
    {
        var jobId = _reprocess.Enqueue(request, restrictToUser: null);
        return AcceptedAtAction(nameof(GetReprocessStatusAdmin), new { jobId }, new { jobId });
    }

    [HttpGet("admin/telemetry/reprocess/{jobId:guid}")]
    [Authorize(Roles = "ADMIN")]
    public ActionResult<ReprocessStatusDto> GetReprocessStatusAdmin(Guid jobId)
    {
        var status = _reprocess.GetStatus(jobId);
        return status == null ? NotFound() : Ok(status);
    }
}
