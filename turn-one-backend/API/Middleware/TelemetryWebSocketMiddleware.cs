using API.Services;
using Domain.Enums;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net.WebSockets;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace API.Middleware;

public class TelemetryWebSocketMiddleware
{
    /// <summary>Cap on a reassembled multi-frame message; beyond this the whole message is dropped (with a warning) rather than buffered unbounded.</summary>
    private const int MaxMessageBytes = 1024 * 1024;

    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TelemetryWebSocketMiddleware> _logger;
    private readonly IHostApplicationLifetime _lifetime;

    public TelemetryWebSocketMiddleware(RequestDelegate next, IConfiguration configuration, ILogger<TelemetryWebSocketMiddleware> logger, IHostApplicationLifetime lifetime)
    {
        _next = next;
        _configuration = configuration;
        _logger = logger;
        _lifetime = lifetime;
    }

    public async Task InvokeAsync(HttpContext context, TelemetryIngestionService ingestionService)
    {
        if (context.Request.Path == "/api/ws/telemetry")
        {
            if (context.WebSockets.IsWebSocketRequest)
            {
                using var webSocket = await context.WebSockets.AcceptWebSocketAsync();

                // Bearer header (the Link) or ?access_token= (browser WebSocket API and scripts
                // can't set headers — same convention SignalR uses on the hub).
                var authHeader = context.Request.Headers["Authorization"].ToString();
                var token = !string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ")
                    ? authHeader.Substring("Bearer ".Length).Trim()
                    : context.Request.Query["access_token"].ToString();
                if (string.IsNullOrEmpty(token))
                {
                    await CloseUnauthorizedAsync(webSocket);
                    return;
                }

                var principal = ValidateToken(token);
                if (principal == null)
                {
                    await CloseUnauthorizedAsync(webSocket);
                    return;
                }

                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                {
                    await CloseUnauthorizedAsync(webSocket);
                    return;
                }

                var planClaim = principal.FindFirst("Plan")?.Value;
                var plan = Enum.TryParse<PlanType>(planClaim, out var p) ? p : PlanType.BASIC;

                var modeQuery = context.Request.Query["mode"].ToString().ToLower();
                var mode = modeQuery == "live" ? TelemetryMode.ExtremeLive : TelemetryMode.Normal;

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

    private static async Task CloseUnauthorizedAsync(WebSocket webSocket)
    {
        if (webSocket.State == WebSocketState.Open)
        {
            try
            {
                await webSocket.CloseAsync(WebSocketCloseStatus.PolicyViolation, "unauthorized", CancellationToken.None);
            }
            catch (WebSocketException)
            {
                // Client already gone; nothing to do.
            }
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
        var shutdownToken = _lifetime.ApplicationStopping;

        try
        {
            while (webSocket.State == WebSocketState.Open)
            {
                using var ms = new MemoryStream();
                WebSocketReceiveResult result;
                var overflowed = false;

                // Reassemble multi-frame messages: keep receiving until EndOfMessage.
                do
                {
                    result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), shutdownToken);

                    if (result.MessageType == WebSocketMessageType.Close)
                        break;

                    if (!overflowed)
                    {
                        if (ms.Length + result.Count > MaxMessageBytes)
                        {
                            overflowed = true;
                            _logger.LogWarning("Telemetry message from user {UserId} exceeded the {MaxBytes}-byte cap across frames — dropping", userId, MaxMessageBytes);
                        }
                        else
                        {
                            ms.Write(buffer, 0, result.Count);
                        }
                    }
                } while (!result.EndOfMessage);

                if (result.MessageType == WebSocketMessageType.Close)
                {
                    await webSocket.CloseAsync(result.CloseStatus ?? WebSocketCloseStatus.NormalClosure, result.CloseStatusDescription, CancellationToken.None);
                    break;
                }

                if (overflowed || result.MessageType != WebSocketMessageType.Text || ms.Length == 0)
                    continue;

                var messageStr = Encoding.UTF8.GetString(ms.ToArray());

                try
                {
                    using var doc = JsonDocument.Parse(messageStr);
                    var root = doc.RootElement;

                    if (!root.TryGetProperty("type", out var typeProp)) continue;
                    var msgType = typeProp.GetString() ?? "";

                    var schemaVersion = root.TryGetProperty("v", out var vProp) && vProp.ValueKind == JsonValueKind.Number
                        ? vProp.GetInt32()
                        : 1;

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

                    await ingestionService.ProcessFrameAsync(userId, plan, mode, sessionId, msgType, data, clientTs, schemaVersion);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse telemetry JSON");
                }
            }
        }
        catch (OperationCanceledException) when (shutdownToken.IsCancellationRequested)
        {
            try
            {
                if (webSocket.State == WebSocketState.Open)
                    await webSocket.CloseAsync(WebSocketCloseStatus.EndpointUnavailable, "shutting down", CancellationToken.None);
            }
            catch (WebSocketException)
            {
                // Client already gone; nothing to do.
            }
        }
        catch (WebSocketException)
        {
            // Client disconnected abruptly; session stays open for reconnect
        }
        // No EndSessionAsync here — the sweeper closes orphaned sessions after heartbeat timeout
    }
}
