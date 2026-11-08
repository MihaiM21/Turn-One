using System.Security.Claims;
using Domain.Entities;
using Infrastructure;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

/// <summary>
/// HCR-008 catalog + HCR-009 lap-time leaderboards. Public reads never expose user ids or e-mails;
/// drivers who chose "anonymous" appear under a stable pseudonym, "hidden" ones not at all.
/// </summary>
[ApiController]
[Route("api/simracing")]
public class SimLeaderboardsController : ControllerBase
{
    private readonly SimLeaderboardService _boards;
    private readonly TurnOneDbContext _db;

    public SimLeaderboardsController(SimLeaderboardService boards, TurnOneDbContext db)
    {
        _boards = boards;
        _db = db;
    }

    /// <summary>?source=acc&amp;track=spa&amp;car=acc:ferrari_296_gt3 (or class=gt3)&amp;period=all|month|week&amp;page=1&amp;size=50</summary>
    [HttpGet("leaderboards")]
    [AllowAnonymous]
    public async Task<IActionResult> Board(
        [FromQuery] string source, [FromQuery] string track, [FromQuery] string? car, [FromQuery(Name = "class")] string? carClass,
        [FromQuery] string period = "all", [FromQuery] int page = 1, [FromQuery] int size = 50)
    {
        if (CatalogService.ParseSource(source) is not { } sim) return BadRequest(new { message = "Unknown source." });
        if (string.IsNullOrWhiteSpace(track)) return BadRequest(new { message = "track is required." });
        if (period is not ("all" or "month" or "week")) return BadRequest(new { message = "period must be all, month or week." });

        var board = await _boards.GetBoardAsync(new SimLeaderboardService.BoardQuery(
            sim, track.Trim().ToLowerInvariant(), car?.Trim().ToLowerInvariant(), carClass?.Trim().ToLowerInvariant(),
            period, Math.Max(1, page), Math.Clamp(size, 1, 100), ViewerId()));
        return board == null ? NotFound(new { message = "No such board." }) : Ok(board);
    }

    [HttpGet("laps/{lapId:guid}/validation")]
    [AllowAnonymous]
    public async Task<IActionResult> Validation(Guid lapId)
    {
        var v = await _boards.GetValidationAsync(lapId);
        if (v == null) return NotFound();

        // A private session's lap is only visible to its owner.
        var isPublic = await _db.TelemetryLaps.Where(l => l.Id == lapId)
            .Select(l => l.Session.Visibility == Domain.Enums.TelemetryVisibility.Public).FirstOrDefaultAsync();
        if (!isPublic && v.UserId != ViewerId() && !v.Eligible) return NotFound();

        return Ok(new
        {
            eligible = v.Eligible,
            reasons = v.Reasons.Split(',', StringSplitOptions.RemoveEmptyEntries),
            validatorVersion = v.ValidatorVersion,
            checkedAt = v.CheckedAt,
        });
    }

    /// <summary>Per-lap leaderboard eligibility for a whole session (session page, HF-02/HF-04).</summary>
    [HttpGet("sessions/{sessionId:guid}/validations")]
    [AllowAnonymous]
    public async Task<IActionResult> SessionValidations(Guid sessionId)
    {
        var session = await _db.TelemetrySessions.AsNoTracking()
            .Where(s => s.Id == sessionId).Select(s => new { s.UserId, s.Visibility }).FirstOrDefaultAsync();
        if (session == null) return NotFound();
        if (session.Visibility != Domain.Enums.TelemetryVisibility.Public && session.UserId != ViewerId()) return NotFound();

        var rows = await _db.LapValidations.AsNoTracking()
            .Where(v => v.Lap.SessionId == sessionId)
            .Select(v => new { v.Lap.LapNumber, v.LapId, v.Eligible, v.Reasons })
            .OrderBy(v => v.LapNumber)
            .ToListAsync();

        return Ok(rows.Select(v => new
        {
            lapNumber = v.LapNumber,
            lapId = v.LapId,
            eligible = v.Eligible,
            reasons = v.Reasons.Split(',', StringSplitOptions.RemoveEmptyEntries),
        }));
    }

    [HttpGet("drivers/{username}/pbs")]
    [AllowAnonymous]
    public async Task<IActionResult> PersonalBests(string username)
    {
        var pbs = await _boards.GetPersonalBestsAsync(username, ViewerId());
        return pbs == null ? NotFound() : Ok(pbs);
    }

    public sealed class VisibilityRequest
    {
        public string Mode { get; set; } = "public";
    }

    [HttpGet("me/leaderboard-visibility")]
    [Authorize]
    public async Task<IActionResult> GetVisibility()
    {
        var id = ViewerId()!.Value;
        var mode = await _db.SimUsers.Where(s => s.UserId == id).Select(s => (LeaderboardVisibility?)s.LeaderboardVisibility).FirstOrDefaultAsync()
                   ?? LeaderboardVisibility.Public;
        return Ok(new { mode = mode.ToString().ToLowerInvariant() });
    }

    [HttpPut("me/leaderboard-visibility")]
    [Authorize]
    public async Task<IActionResult> SetVisibility([FromBody] VisibilityRequest body)
    {
        if (!Enum.TryParse<LeaderboardVisibility>(body.Mode, ignoreCase: true, out var mode))
            return BadRequest(new { message = "mode must be public, anonymous or hidden." });
        await _boards.SetVisibilityAsync(ViewerId()!.Value, mode);
        return NoContent();
    }

    [HttpGet("catalog/tracks")]
    [AllowAnonymous]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> Tracks([FromQuery] string? source)
    {
        var sim = CatalogService.ParseSource(source);
        var query = _db.TrackAliases.AsNoTracking().AsQueryable();
        if (sim != null) query = query.Where(a => a.Source == sim);
        var layouts = await query.Select(a => a.TrackLayout).Distinct()
            .OrderBy(t => t.Name)
            .Select(t => new { t.Slug, t.Name, t.Country, t.LengthM, curated = t.Status == CatalogStatus.Curated })
            .ToListAsync();
        return Ok(layouts);
    }

    [HttpGet("catalog/cars")]
    [AllowAnonymous]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> Cars([FromQuery] string? source, [FromQuery(Name = "class")] string? carClass)
    {
        var sim = CatalogService.ParseSource(source);
        var query = _db.CarAliases.AsNoTracking().AsQueryable();
        if (sim != null) query = query.Where(a => a.Source == sim);
        var cars = query.Select(a => a.Car).Distinct();
        if (!string.IsNullOrWhiteSpace(carClass)) cars = cars.Where(c => c.CarClass != null && c.CarClass.Slug == carClass);
        return Ok(await cars.OrderBy(c => c.Name)
            .Select(c => new { c.Slug, c.Name, @class = c.CarClass == null ? null : c.CarClass.Slug, curated = c.Status == CatalogStatus.Curated })
            .ToListAsync());
    }

    [HttpPost("admin/laps/{lapId:guid}/exclude")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Exclude(Guid lapId) =>
        await _boards.ExcludeAsync(lapId) ? NoContent() : NotFound();

    [HttpPost("admin/leaderboards/backfill")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Backfill() => Ok(new { validated = await _boards.BackfillAsync() });

    private Guid? ViewerId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
}
