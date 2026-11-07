using System.Security.Claims;
using Domain.Entities;
using Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

/// <summary>
/// HCR-015 (consent part) — GET/PUT /api/me/ai-consent. Only the consent record for now; the dataset
/// export and coach feedback come with the coach in Phase 2.
/// </summary>
[ApiController]
[Route("api/me/ai-consent")]
[Authorize]
public class AiConsentController : ControllerBase
{
    private readonly TurnOneDbContext _db;

    public AiConsentController(TurnOneDbContext db)
    {
        _db = db;
    }

    public sealed class ConsentRequest
    {
        public bool Granted { get; set; }
        /// <summary>The version of the text the user saw; a stale one is refused so nobody agrees to an old purpose.</summary>
        public string Version { get; set; } = "";
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = UserId();
        var row = await _db.AiConsents.AsNoTracking().FirstOrDefaultAsync(c => c.UserId == userId);
        var granted = row is { Granted: true } && row.Version == AiConsent.CurrentVersion;
        return Ok(new { granted, version = AiConsent.CurrentVersion, grantedAt = granted ? row!.GrantedAt : null });
    }

    [HttpPut]
    public async Task<IActionResult> Put([FromBody] ConsentRequest body)
    {
        if (body.Version != AiConsent.CurrentVersion)
            return BadRequest(new { message = "The consent text has changed — reload the page.", version = AiConsent.CurrentVersion });

        var userId = UserId();
        var row = await _db.AiConsents.FirstOrDefaultAsync(c => c.UserId == userId);
        if (row == null)
        {
            row = new AiConsent { Id = Guid.NewGuid(), UserId = userId };
            _db.AiConsents.Add(row);
        }

        var now = DateTime.UtcNow;
        row.Version = AiConsent.CurrentVersion;
        row.UpdatedAt = now;
        if (body.Granted && !row.Granted) row.GrantedAt = now;
        if (!body.Granted && row.Granted) row.WithdrawnAt = now;
        row.Granted = body.Granted;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    private Guid UserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
