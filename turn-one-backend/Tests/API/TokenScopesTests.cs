using System.Security.Claims;
using API.Security;
using FluentAssertions;
using Microsoft.AspNetCore.Http;

namespace Tests.API;

public class TokenScopesTests
{
    private static ClaimsPrincipal Principal(params Claim[] claims) =>
        new(new ClaimsIdentity(claims, "test"));

    [Fact]
    public void User_Token_Is_Not_Scoped()
    {
        var user = Principal(new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()));

        TokenScopes.IsScoped(user).Should().BeFalse();
    }

    [Theory]
    [InlineData("Scope")]
    [InlineData("scope")]
    [InlineData("http://schemas.microsoft.com/identity/claims/scope")]
    public void Overlay_Scope_Is_Read_Under_Any_Claim_Spelling(string claimType)
    {
        var overlay = Principal(new Claim(claimType, TokenScopes.Overlay));

        TokenScopes.GetScope(overlay).Should().Be(TokenScopes.Overlay);
    }

    [Theory]
    [InlineData("/api/hubs/simtelemetry", true)]
    [InlineData("/api/hubs/simtelemetry/negotiate", true)]
    [InlineData("/api/telemetry/sessions/me", false)]
    [InlineData("/api/users/me", false)]
    [InlineData("/api/ws/telemetry", false)]
    [InlineData("/api/simracing/overlay/tokens", false)]
    public void Overlay_Token_Only_Allowed_On_The_Sim_Telemetry_Hub(string path, bool allowed)
    {
        TokenScopes.IsAllowedPath(TokenScopes.Overlay, new PathString(path)).Should().Be(allowed);
    }

    [Fact]
    public void Unknown_Scope_Is_Allowed_Nowhere()
    {
        TokenScopes.IsAllowedPath("something-else", new PathString("/api/hubs/simtelemetry")).Should().BeFalse();
    }
}
