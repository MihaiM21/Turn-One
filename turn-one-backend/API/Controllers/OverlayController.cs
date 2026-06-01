using Application.Interfaces;
using Domain;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/simracing/overlay")]
public class OverlayController : ControllerBase
{
    private readonly IOverlayTokenService _tokens;

    public OverlayController(IOverlayTokenService tokens)
    {
        _tokens = tokens;
    }

    public class CreateTokenRequest
    {
        public string? Label { get; set; }
        public string? Scopes { get; set; }
        public int? LifetimeHours { get; set; }
    }

    public class TokenDto
    {
        public Guid Id { get; set; }
        public string Token { get; set; } = "";
        public string? Label { get; set; }
        public string? Scopes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }

    public class ExchangeRequest
    {
        public string Token { get; set; } = "";
    }

    public class ExchangeResponse
    {
        public string Jwt { get; set; } = "";
        public Guid OwnerUserId { get; set; }
        public string? OwnerUsername { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    [HttpPost("tokens")]
    [Authorize]
    public async Task<ActionResult<TokenDto>> Create([FromBody] CreateTokenRequest body)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var planStr = User.FindFirstValue("Plan");
        if (!Enum.TryParse<PlanType>(planStr, out var plan)) plan = PlanType.BASIC;
        if (!PlanFeatures.SimRacing(plan).OverlayTokens)
            return Forbid("Overlay tokens require PRO or ELITE plan.");

        var lifetime = body.LifetimeHours.HasValue ? TimeSpan.FromHours(body.LifetimeHours.Value) : (TimeSpan?)null;
        var token = await _tokens.CreateAsync(userId, body.Label, body.Scopes, lifetime);

        return Ok(Map(token));
    }

    [HttpGet("tokens")]
    [Authorize]
    public async Task<ActionResult<List<TokenDto>>> List()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var tokens = await _tokens.ListAsync(userId);
        return Ok(tokens.Select(Map).ToList());
    }

    [HttpDelete("tokens/{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Revoke(Guid id)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        await _tokens.RevokeAsync(id, userId);
        return NoContent();
    }

    [HttpPost("exchange")]
    [AllowAnonymous]
    public async Task<ActionResult<ExchangeResponse>> Exchange([FromBody] ExchangeRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Token)) return BadRequest();

        var record = await _tokens.ResolveAsync(body.Token);
        if (record == null) return NotFound();

        var jwt = _tokens.IssueShortLivedJwt(record);
        return Ok(new ExchangeResponse
        {
            Jwt = jwt,
            OwnerUserId = record.UserId,
            OwnerUsername = record.User?.Username,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30)
        });
    }

    private static TokenDto Map(Domain.Entities.OverlayShareToken t) => new()
    {
        Id = t.Id,
        Token = t.Token,
        Label = t.Label,
        Scopes = t.Scopes,
        CreatedAt = t.CreatedAt,
        ExpiresAt = t.ExpiresAt,
    };
}
