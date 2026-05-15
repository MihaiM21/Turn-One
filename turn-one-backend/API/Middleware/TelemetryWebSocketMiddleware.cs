using API.Services;
using Domain.Enums;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net.WebSockets;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace API.Middleware;

public class TelemetryWebSocketMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TelemetryWebSocketMiddleware> _logger;

    public TelemetryWebSocketMiddleware(RequestDelegate next, IConfiguration configuration, ILogger<TelemetryWebSocketMiddleware> logger)
    {
        _next = next;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, TelemetryIngestionService ingestionService)
    {
        if (context.Request.Path == "/api/ws/telemetry")
        {
            if (context.WebSockets.IsWebSocketRequest)
            {
                var authHeader = context.Request.Headers["Authorization"].ToString();
                if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                {
                    context.Response.StatusCode = 401;
                    return;
                }

                var token = authHeader.Substring("Bearer ".Length).Trim();
                var principal = ValidateToken(token);
                if (principal == null)
                {
                    context.Response.StatusCode = 401;
                    return;
                }

                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                {
                    context.Response.StatusCode = 401;
                    return;
                }

                var planClaim = principal.FindFirst("Plan")?.Value;
                var plan = Enum.TryParse<PlanType>(planClaim, out var p) ? p : PlanType.BASIC;

                var modeQuery = context.Request.Query["mode"].ToString().ToLower();
                var mode = modeQuery == "live" ? TelemetryMode.ExtremeLive : TelemetryMode.Normal;

                using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
                await HandleWebSocketAsync(webSocket, userId, plan, mode, ingestionService);
            }
            else
            {
                context.Response.StatusCode = 400;
            }
        }
        else
        {
            await _next(context);
        }
    }

    private ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["JWT:Key"]!);
            return tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _configuration["JWT:Issuer"],
                ValidateAudience = true,
                ValidAudience = _configuration["JWT:Audience"],
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);
        }
        catch
        {
            return null;
        }
    }

    private async Task HandleWebSocketAsync(WebSocket webSocket, Guid userId, PlanType plan, TelemetryMode mode, TelemetryIngestionService ingestionService)
    {
        var buffer = new byte[1024 * 64];
        try
        {
            while (webSocket.State == WebSocketState.Open)
            {
                var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

                if (result.MessageType == WebSocketMessageType.Text)
                {
                    var messageStr = Encoding.UTF8.GetString(buffer, 0, result.Count);

                    try
                    {
                        using var doc = JsonDocument.Parse(messageStr);
                        var root = doc.RootElement;

                        if (!root.TryGetProperty("type", out var typeProp)) continue;
                        var msgType = typeProp.GetString() ?? "";

                        // Parse client-supplied sessionId (32-char hex Guid "N" format)
                        Guid? sessionId = null;
                        if (root.TryGetProperty("sessionId", out var sidProp) && sidProp.ValueKind == JsonValueKind.String)
                        {
                            var sidStr = sidProp.GetString();
                            if (!string.IsNullOrEmpty(sidStr) && Guid.TryParseExact(sidStr, "N", out var sid))
                                sessionId = sid;
                        }

                        // Use client timestamp when provided
                        long clientTs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                        if (root.TryGetProperty("timestamp", out var tsProp) && tsProp.ValueKind == JsonValueKind.Number)
                            clientTs = tsProp.GetInt64();

                        root.TryGetProperty("data", out var dataProp);
                        var data = dataProp.ValueKind != JsonValueKind.Undefined ? dataProp.Clone() : default;

                        await ingestionService.ProcessFrameAsync(userId, plan, mode, sessionId, msgType, data, clientTs);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to parse telemetry JSON");
                    }
                }
                else if (result.MessageType == WebSocketMessageType.Close)
                {
                    await webSocket.CloseAsync(result.CloseStatus ?? WebSocketCloseStatus.NormalClosure, result.CloseStatusDescription, CancellationToken.None);
                }
            }
        }
        catch (WebSocketException)
        {
            // Client disconnected abruptly; session stays open for reconnect
        }
        // No EndSessionAsync here — the sweeper closes orphaned sessions after heartbeat timeout
    }
}
