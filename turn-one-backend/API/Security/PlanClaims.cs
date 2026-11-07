using System.Security.Claims;
using Domain.Enums;
using Infrastructure;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace API.Security;

/// <summary>
/// H-12 — the user's plan as it is in the database now, cached for a minute. The JWT's "Plan" claim
/// is only what the plan was at sign-in (7 days ago at worst), so upgrades and downgrades lagged.
/// </summary>
public sealed class PlanLookup
{
    private static readonly TimeSpan CacheFor = TimeSpan.FromSeconds(60);

    private readonly IMemoryCache _cache;
    private readonly IServiceScopeFactory _scopes;

    public PlanLookup(IMemoryCache cache, IServiceScopeFactory scopes)
    {
        _cache = cache;
        _scopes = scopes;
    }

    /// <summary>The current plan, or null when the user doesn't exist (deleted account).</summary>
    public async Task<PlanType?> GetAsync(Guid userId)
    {
        if (_cache.TryGetValue(CacheKey(userId), out PlanType? cached)) return cached;

        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TurnOneDbContext>();
        var plan = await db.Users.AsNoTracking().Where(u => u.Id == userId)
            .Select(u => (PlanType?)u.Plan).FirstOrDefaultAsync();

        _cache.Set(CacheKey(userId), plan, CacheFor);
        return plan;
    }

    /// <summary>Call after changing a user's plan so the next request sees it immediately.</summary>
    public void Forget(Guid userId) => _cache.Remove(CacheKey(userId));

    private static string CacheKey(Guid userId) => $"plan:{userId}";
}

/// <summary>
/// Replaces the token's "Plan" claim with <see cref="PlanLookup"/>'s value on every authenticated
/// request, so every existing <c>User.FindFirstValue("Plan")</c> check uses the current plan.
/// </summary>
public sealed class PlanClaimsTransformation : IClaimsTransformation
{
    private const string PlanClaim = "Plan";
    private const string MarkerClaim = "PlanFromDatabase";

    private readonly PlanLookup _plans;

    public PlanClaimsTransformation(PlanLookup plans)
    {
        _plans = plans;
    }

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.HasClaim(c => c.Type == MarkerClaim)) return principal; // already done this request
        if (!Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return principal;

        var plan = await _plans.GetAsync(userId);
        if (plan == null) return principal;

        return WithPlan(principal, plan.Value);
    }

    public static ClaimsPrincipal WithPlan(ClaimsPrincipal principal, PlanType plan)
    {
        var copy = principal.Clone();
        var identity = (ClaimsIdentity)copy.Identity!;
        foreach (var old in identity.FindAll(PlanClaim).ToList()) identity.RemoveClaim(old);
        identity.AddClaim(new Claim(PlanClaim, plan.ToString()));
        identity.AddClaim(new Claim(MarkerClaim, "1"));
        return copy;
    }
}
