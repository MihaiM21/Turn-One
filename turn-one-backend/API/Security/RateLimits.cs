using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;

namespace API.Security;

/// <summary>
/// Per-client-IP rate limits for the endpoints that are worth brute-forcing or spamming
/// (login, registration, password reset, contact forms, device pairing) and for telemetry WebSocket connects.
/// </summary>
public static class RateLimits
{
    public const string Auth = "auth";
    public const string PasswordReset = "password-reset";
    public const string Forms = "forms";
    public const string PairingStart = "pairing-start";
    public const string DeviceTokens = "device-tokens";

    private const string TelemetrySocketPath = "/api/ws/telemetry";

    /// <summary>
    /// The API sits behind Cloudflare, so the TCP peer is a Cloudflare edge. Use the client IP
    /// Cloudflare reports, then X-Forwarded-For, then the peer address.
    /// </summary>
    public static string ClientIp(HttpContext context)
    {
        var cf = context.Request.Headers["CF-Connecting-IP"].ToString();
        if (!string.IsNullOrWhiteSpace(cf)) return cf.Trim();

        var forwarded = context.Request.Headers["X-Forwarded-For"].ToString();
        if (!string.IsNullOrWhiteSpace(forwarded)) return forwarded.Split(',')[0].Trim();

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    public static IServiceCollection AddTurnOneRateLimits(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (ctx, token) =>
            {
                if (ctx.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    ctx.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
                await ctx.HttpContext.Response.WriteAsJsonAsync(new { message = "Too many requests — try again later." }, token);
            };

            options.AddPolicy(Auth, ctx => Window(ClientIp(ctx), permits: 10, TimeSpan.FromMinutes(1)));
            options.AddPolicy(PasswordReset, ctx => Window(ClientIp(ctx), permits: 5, TimeSpan.FromMinutes(15)));
            options.AddPolicy(Forms, ctx => Window(ClientIp(ctx), permits: 5, TimeSpan.FromHours(1)));
            options.AddPolicy(PairingStart, ctx => Window(ClientIp(ctx), permits: 10, TimeSpan.FromHours(1)));
            // Link polls every 5 s while a code is shown and refreshes every ~15 min.
            options.AddPolicy(DeviceTokens, ctx => Window(ClientIp(ctx), permits: 30, TimeSpan.FromMinutes(1)));

            // The telemetry socket is plain middleware (no endpoint), so it is limited globally by path.
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
                ctx.Request.Path.StartsWithSegments(TelemetrySocketPath)
                    ? Window("ws:" + ClientIp(ctx), permits: 30, TimeSpan.FromMinutes(1))
                    : RateLimitPartition.GetNoLimiter("none"));
        });
        return services;
    }

    private static RateLimitPartition<string> Window(string key, int permits, TimeSpan window) =>
        RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = permits,
            Window = window,
            QueueLimit = 0,
        });
}
