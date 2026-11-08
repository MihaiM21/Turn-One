using System.Security.Claims;
using API.Security;
using Application.DTOs;
using Application.Telemetry;
using Domain.Entities;
using Domain.Enums;
using Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

/// <summary>
/// Sim-racing closed beta (Jan 2027). Drivers apply once and may edit their answers; admins
/// pick pilots by accepting or declining. A driver can never set their own status.
/// </summary>
[ApiController]
[Route("api/simracing/beta")]
[Authorize]
public class BetaController : ControllerBase
{
    private readonly TurnOneDbContext _db;

    public BetaController(TurnOneDbContext db)
    {
        _db = db;
    }

    /// <summary>The caller's application, or 404 if they haven't applied.</summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMine()
    {
        var userId = UserId();
        var row = await _db.BetaApplications.AsNoTracking().FirstOrDefaultAsync(a => a.UserId == userId);
        if (row == null) return NotFound(new { message = "No beta application yet." });
        return Ok(ToDto(row, new BetaApplicationDto()));
    }

    /// <summary>Create or update the caller's application. Status is kept as it is (new rows start pending).</summary>
    [HttpPut("me")]
    [EnableRateLimiting(RateLimits.Beta)]
    public async Task<IActionResult> PutMine([FromBody] BetaApplicationRequest body)
    {
        if (!TryParse(body, out var sims, out var platform, out var input, out var note, out var error))
            return BadRequest(new { message = error });

        var userId = UserId();
        var row = await _db.BetaApplications.FirstOrDefaultAsync(a => a.UserId == userId);
        var now = DateTime.UtcNow;
        if (row == null)
        {
            row = new BetaApplication
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Status = BetaApplicationStatus.Pending,
                CreatedAt = now,
            };
            _db.BetaApplications.Add(row);
        }

        row.Sims = sims;
        row.Platform = platform;
        row.Input = input;
        row.Note = note;
        row.UpdatedAt = now;

        await _db.SaveChangesAsync();
        return Ok(ToDto(row, new BetaApplicationDto()));
    }

    /// <summary>Admin: every application, newest first, optionally filtered by status, with per-status counts.</summary>
    [HttpGet]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> List([FromQuery] string? status = null)
    {
        var query = _db.BetaApplications.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!TryParseStatus(status, out var filter))
                return BadRequest(new { message = "status must be pending, accepted or declined." });
            query = query.Where(a => a.Status == filter);
        }

        var rows = await query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new { App = a, a.User.Username, a.User.Email })
            .ToListAsync();

        var counts = await _db.BetaApplications.AsNoTracking()
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();
        int Count(BetaApplicationStatus s) => counts.FirstOrDefault(c => c.Status == s)?.Count ?? 0;

        return Ok(new AdminBetaApplicationListDto
        {
            Items = rows.Select(r => ToAdminDto(r.App, r.Username, r.Email)).ToList(),
            Pending = Count(BetaApplicationStatus.Pending),
            Accepted = Count(BetaApplicationStatus.Accepted),
            Declined = Count(BetaApplicationStatus.Declined),
        });
    }

    /// <summary>Admin: accept, decline, or move back to pending.</summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] BetaStatusRequest body)
    {
        if (!TryParseStatus(body.Status, out var status))
            return BadRequest(new { message = "status must be pending, accepted or declined." });

        var row = await _db.BetaApplications.Include(a => a.User).FirstOrDefaultAsync(a => a.Id == id);
        if (row == null) return NotFound(new { message = "Application not found." });

        row.Status = status;
        row.ReviewedAt = status == BetaApplicationStatus.Pending ? null : DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(ToAdminDto(row, row.User.Username, row.User.Email));
    }

    // ---- mapping / parsing ----

    private static readonly SimSource[] BetaSims =
        { SimSource.Acc, SimSource.Ac, SimSource.IRacing, SimSource.F1_25, SimSource.F1_26 };

    private static bool TryParse(
        BetaApplicationRequest body,
        out List<SimSource> sims, out BetaPlatform platform, out BetaInput input, out string? note, out string error)
    {
        sims = new List<SimSource>();
        platform = default;
        input = default;
        note = null;
        error = "";

        foreach (var raw in body.Sims ?? new List<string>())
        {
            var sim = WireEnums.ParseSource(raw);
            if (!BetaSims.Contains(sim)) { error = $"Unknown sim '{raw}'."; return false; }
            if (!sims.Contains(sim)) sims.Add(sim);
        }
        if (sims.Count == 0) { error = "Pick at least one sim."; return false; }

        switch (body.Platform?.Trim().ToLowerInvariant())
        {
            case "pc": platform = BetaPlatform.Pc; break;
            case "ps5": platform = BetaPlatform.Ps5; break;
            case "xbox": platform = BetaPlatform.Xbox; break;
            default: error = "platform must be pc, ps5 or xbox."; return false;
        }

        switch (body.Input?.Trim().ToLowerInvariant())
        {
            case "wheel": input = BetaInput.Wheel; break;
            case "pad": input = BetaInput.Pad; break;
            default: error = "input must be wheel or pad."; return false;
        }

        var trimmed = body.Note?.Trim();
        if (trimmed is { Length: > BetaApplication.NoteMaxLength })
        {
            error = $"Note is limited to {BetaApplication.NoteMaxLength} characters.";
            return false;
        }
        note = string.IsNullOrEmpty(trimmed) ? null : trimmed;
        return true;
    }

    private static bool TryParseStatus(string? raw, out BetaApplicationStatus status)
    {
        switch (raw?.Trim().ToLowerInvariant())
        {
            case "pending": status = BetaApplicationStatus.Pending; return true;
            case "accepted": status = BetaApplicationStatus.Accepted; return true;
            case "declined": status = BetaApplicationStatus.Declined; return true;
            default: status = default; return false;
        }
    }

    private static string PlatformName(BetaPlatform p) => p switch
    {
        BetaPlatform.Ps5 => "ps5",
        BetaPlatform.Xbox => "xbox",
        _ => "pc",
    };

    private static string InputName(BetaInput i) => i == BetaInput.Pad ? "pad" : "wheel";

    private static string StatusName(BetaApplicationStatus s) => s switch
    {
        BetaApplicationStatus.Accepted => "accepted",
        BetaApplicationStatus.Declined => "declined",
        _ => "pending",
    };

    private static T ToDto<T>(BetaApplication a, T dto) where T : BetaApplicationDto
    {
        dto.Id = a.Id;
        dto.Sims = a.Sims.Select(WireEnums.SourceName).ToList();
        dto.Platform = PlatformName(a.Platform);
        dto.Input = InputName(a.Input);
        dto.Note = a.Note;
        dto.Status = StatusName(a.Status);
        dto.CreatedAt = a.CreatedAt;
        dto.UpdatedAt = a.UpdatedAt;
        dto.ReviewedAt = a.ReviewedAt;
        return dto;
    }

    private static AdminBetaApplicationDto ToAdminDto(BetaApplication a, string username, string email) =>
        ToDto(a, new AdminBetaApplicationDto { UserId = a.UserId, Username = username, Email = email });

    private Guid UserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
