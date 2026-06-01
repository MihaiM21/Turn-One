using Application.Interfaces;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CoachingController : ControllerBase
{
    private readonly ICoachingService _coaching;
    private readonly ITelemetrySessionService _sessionService;

    public CoachingController(ICoachingService coaching, ITelemetrySessionService sessionService)
    {
        _coaching = coaching;
        _sessionService = sessionService;
    }

    [HttpGet("sessions/{id}/tips")]
    public async Task<ActionResult<List<CoachingTip>>> GetTips(Guid id, [FromQuery] int? lap = null)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var planStr = User.FindFirstValue("Plan");
        if (!Enum.TryParse<PlanType>(planStr, out var plan)) plan = PlanType.BASIC;
        if (plan == PlanType.BASIC) return Forbid("AI tips require PRO or ELITE plan.");

        var session = await _sessionService.GetSessionDetailAsync(id, userId);
        if (session == null) return NotFound();

        var tips = await _coaching.GenerateTipsAsync(plan, id, lap);
        return Ok(tips);
    }

    public class ChatRequest
    {
        public string Message { get; set; } = "";
        public List<CoachingChatMessage>? History { get; set; }
    }

    [HttpPost("sessions/{id}/chat")]
    public async Task<ActionResult<CoachingChatReply>> Chat(Guid id, [FromBody] ChatRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Message)) return BadRequest("Message is required.");

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var planStr = User.FindFirstValue("Plan");
        if (!Enum.TryParse<PlanType>(planStr, out var plan)) plan = PlanType.BASIC;
        if (plan != PlanType.ELITE) return Forbid("Coaching chat requires ELITE plan.");

        var session = await _sessionService.GetSessionDetailAsync(id, userId);
        if (session == null) return NotFound();

        var reply = await _coaching.ChatAsync(plan, id, body.Message, body.History);
        return Ok(reply);
    }
}
