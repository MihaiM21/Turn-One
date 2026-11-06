using System.Security.Claims;
using API.Security;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace API.Controllers;

/// <summary>
/// HCR-006 — Turn One Link signs in by pairing: it shows a code, the user approves it on the website
/// (/link), and Link receives a short-lived <c>scope=link</c> access token plus a rotating device token.
/// </summary>
[ApiController]
[Route("api/devices")]
public class DevicesController : ControllerBase
{
    private readonly IDeviceAuthService _devices;
    private readonly IConfiguration _config;

    public DevicesController(IDeviceAuthService devices, IConfiguration config)
    {
        _devices = devices;
        _config = config;
    }

    public sealed class StartRequest
    {
        public string DeviceName { get; set; } = "";
        public string Platform { get; set; } = "windows";
        public string? AppVersion { get; set; }
    }

    public sealed class PollRequest
    {
        public string DeviceCode { get; set; } = "";
    }

    public sealed class RefreshRequest
    {
        public string DeviceToken { get; set; } = "";
    }

    [HttpPost("pair/start")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimits.PairingStart)]
    public async Task<IActionResult> Start([FromBody] StartRequest body)
    {
        var started = await _devices.StartPairingAsync(body.DeviceName, body.Platform, body.AppVersion);
        var verifyUrl = _config["Devices:VerifyUrl"] ?? "https://turnonehub.com/link";
        return Ok(new
        {
            deviceCode = started.DeviceCode,
            userCode = started.UserCode,
            verifyUrl,
            verifyUrlComplete = $"{verifyUrl}?code={Uri.EscapeDataString(started.UserCode)}",
            expiresIn = (int)(started.ExpiresAt - DateTime.UtcNow).TotalSeconds,
            interval = started.IntervalSeconds,
        });
    }

    [HttpGet("pair/{userCode}")]
    [Authorize]
    public async Task<IActionResult> GetPairing(string userCode)
    {
        var pairing = await _devices.FindPairingAsync(userCode);
        if (pairing == null) return NotFound(new { message = "This code has expired or doesn't exist." });
        return Ok(new
        {
            userCode = pairing.UserCode,
            deviceName = pairing.DeviceName,
            platform = pairing.Platform,
            appVersion = pairing.AppVersion,
            createdAt = pairing.CreatedAt,
            approved = pairing.ApprovedByUserId != null,
        });
    }

    [HttpPost("pair/{userCode}/approve")]
    [Authorize]
    public async Task<IActionResult> Approve(string userCode)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        return await _devices.ApproveAsync(userCode, userId) switch
        {
            ApproveResult.Approved => NoContent(),
            ApproveResult.AlreadyApproved => Conflict(new { message = "This code was already approved." }),
            _ => NotFound(new { message = "This code has expired or doesn't exist." }),
        };
    }

    [HttpPost("pair/poll")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimits.DeviceTokens)]
    public async Task<IActionResult> Poll([FromBody] PollRequest body)
    {
        var result = await _devices.PollAsync(body.DeviceCode);
        return result.Status switch
        {
            PollStatus.Approved => Ok(TokensBody(result.Tokens!)),
            PollStatus.Pending => StatusCode(StatusCodes.Status428PreconditionRequired, new { status = "pending" }),
            PollStatus.SlowDown => StatusCode(StatusCodes.Status429TooManyRequests, new { status = "slow_down" }),
            _ => BadRequest(new { status = "expired" }),
        };
    }

    [HttpPost("token/refresh")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimits.DeviceTokens)]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest body)
    {
        var tokens = await _devices.RefreshAsync(body.DeviceToken);
        return tokens == null ? Unauthorized(new { message = "Device sign-in has ended." }) : Ok(TokensBody(tokens));
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> List()
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var devices = await _devices.ListAsync(userId);
        return Ok(devices.Select(d => new { d.Id, d.Name, d.Platform, d.AppVersion, d.CreatedAt, d.LastSeenAt }));
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Revoke(Guid id)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        return await _devices.RevokeAsync(id, userId) ? NoContent() : NotFound();
    }

    private static object TokensBody(DeviceTokens t) => new
    {
        deviceId = t.DeviceId,
        accessToken = t.AccessToken,
        accessTokenExpiresAt = t.AccessTokenExpiresAt,
        deviceToken = t.DeviceToken,
    };

    private bool TryGetUserId(out Guid userId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
}
