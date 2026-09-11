using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class SubscriptionController : ControllerBase
{
    private readonly ISubscriptionService _subscriptionService;

    public SubscriptionController(ISubscriptionService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    // Plan changes grant paid entitlements, so they must never be driven by a
    // user-supplied PlanType. Until billing is wired up these are admin-only;
    // once a payment provider exists the webhook handler becomes the caller.
    [Authorize(Roles = "ADMIN")]
    [HttpPost("upgrade")]
    public async Task<ActionResult<User>> UpgradePlan([FromBody] PlanType newPlan)
    {
        try
        {
            var userId = GetUserId();
            var user = await _subscriptionService.UpgradePlanAsync(userId, newPlan);
            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (KeyNotFoundException)
        {
            return NotFound("User not found");
        }
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPost("downgrade")]
    public async Task<ActionResult<User>> DowngradePlan([FromBody] PlanType newPlan)
    {
        try
        {
            var userId = GetUserId();
            var user = await _subscriptionService.DowngradePlanAsync(userId, newPlan);
            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (KeyNotFoundException)
        {
            return NotFound("User not found");
        }
    }

    [HttpPost("refill")]
    public async Task<ActionResult<User>> RefillTokens()
    {
        try
        {
            var userId = GetUserId();
            var user = await _subscriptionService.RefillTokensAsync(userId);
            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (KeyNotFoundException)
        {
            return NotFound("User not found");
        }
    }

    [HttpGet("token-status")]
    public async Task<ActionResult<TokenStatusResponse>> GetTokenStatus()
    {
        try
        {
            var userId = GetUserId();
            var (tokensRemaining, daysUntilRefill) = await _subscriptionService.GetTokenStatusAsync(userId);
            
            return Ok(new TokenStatusResponse
            {
                TokensRemaining = tokensRemaining,
                DaysUntilRefill = daysUntilRefill
            });
        }
        catch (KeyNotFoundException)
        {
            return NotFound("User not found");
        }
    }

    // PurchaseTokensAsync credits tokens without taking anything in exchange —
    // no coins are deducted and there is no payment step — so this is admin-only
    // until it is fronted by a real transaction. Coin-funded token purchases go
    // through TokenController.Purchase instead.
    [Authorize(Roles = "ADMIN")]
    [HttpPost("purchase-tokens")]
    public async Task<ActionResult<User>> PurchaseTokens([FromBody] int amount)
    {
        try
        {
            var userId = GetUserId();
            var user = await _subscriptionService.PurchaseTokensAsync(userId, amount);
            return Ok(user);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (KeyNotFoundException)
        {
            return NotFound("User not found");
        }
    }

    [HttpPost("consume-token")]
    public async Task<ActionResult<User>> ConsumeToken()
    {
        try
        {
            var userId = GetUserId();
            var user = await _subscriptionService.ConsumeTokensAsync(userId, 1);
            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (KeyNotFoundException)
        {
            return NotFound("User not found");
        }
    }


    [HttpPost("consume-tokens")]
    public async Task<ActionResult<User>> ConsumeTokens([FromBody] int amount)
    {
        try
        {
            var userId = GetUserId();
            var user = await _subscriptionService.ConsumeTokensAsync(userId, amount);
            return Ok(user);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (KeyNotFoundException)
        {
            return NotFound("User not found");
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

public class TokenStatusResponse
{
    public int TokensRemaining { get; set; }
    public int DaysUntilRefill { get; set; }
}