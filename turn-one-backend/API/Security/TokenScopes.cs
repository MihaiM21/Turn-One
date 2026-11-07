using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace API.Security;

/// <summary>
/// Scoped tokens (e.g. the 30-minute JWT an OBS overlay gets from <c>POST overlay/exchange</c>)
/// carry the owner's user id, so without a check they would pass every <c>[Authorize]</c>.
/// A token with a scope claim is accepted only on the paths its scope names; everything else
/// treats it as unauthenticated.
/// </summary>
public static class TokenScopes
{
    public const string ClaimType = "Scope";
    public const string Overlay = "overlay";
    public const string Link = "link";

    // What a Turn One Link device token may do (HCR-006): upload and stream its own telemetry,
    // read its own sessions and profile, use setups and the release feed. Not profile edits,
    // password, billing or admin.
    private static readonly string[] LinkPaths =
    {
        "/api/ws/telemetry",
        "/api/simracing/uploads",
        "/api/simracing/link",
        "/api/setups",
        "/api/telemetry/sessions/me",
        "/api/auth/me",
    };

    // JWT handlers may remap or lower-case the claim type on the way in; accept all spellings.
    private static readonly string[] ClaimTypes =
    {
        ClaimType,
        "scope",
        "http://schemas.microsoft.com/identity/claims/scope",
    };

    public static string? GetScope(ClaimsPrincipal principal)
    {
        foreach (var type in ClaimTypes)
        {
            var value = principal.FindFirst(type)?.Value;
            if (!string.IsNullOrEmpty(value)) return value;
        }
        return null;
    }

    public static bool IsScoped(ClaimsPrincipal principal) => GetScope(principal) != null;

    /// <summary>True when a token with <paramref name="scope"/> may be used on <paramref name="path"/>.</summary>
    public static bool IsAllowedPath(string scope, PathString path) => scope switch
    {
        // The overlay only connects to the sim telemetry hub and subscribes to the owner's feed.
        Overlay => path.StartsWithSegments("/api/hubs/simtelemetry"),
        Link => LinkPaths.Any(p => path.StartsWithSegments(p)),
        _ => false,
    };
}
