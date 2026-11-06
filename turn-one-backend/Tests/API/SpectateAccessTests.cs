using System.Security.Claims;
using API.Hubs;
using API.Security;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Infrastructure;
using Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Tests.API;

/// <summary>H-09: SpectateSession checks visibility and plan; H-07: client IP behind Cloudflare.</summary>
public class SpectateAccessTests
{
    private sealed class FakeCallerContext : HubCallerContext
    {
        public FakeCallerContext(ClaimsPrincipal user) { User = user; }
        public override string ConnectionId => "conn-1";
        public override string? UserIdentifier => User?.FindFirstValue(ClaimTypes.NameIdentifier);
        public override ClaimsPrincipal? User { get; }
        public override IDictionary<object, object?> Items { get; } = new Dictionary<object, object?>();
        public override IFeatureCollection Features { get; } = new FeatureCollection();
        public override CancellationToken ConnectionAborted => CancellationToken.None;
        public override void Abort() { }
    }

    private static ClaimsPrincipal Caller(Guid userId, PlanType plan, string? scope = null)
    {
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, userId.ToString()), new("Plan", plan.ToString()) };
        if (scope != null) claims.Add(new Claim(TokenScopes.ClaimType, scope));
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));
    }

    private static async Task<(SimTelemetryHub hub, TurnOneDbContext db, Guid sessionId)> SetupAsync(
        string name, TelemetryVisibility visibility, ClaimsPrincipal caller)
    {
        var db = new TurnOneDbContext(new DbContextOptionsBuilder<TurnOneDbContext>().UseInMemoryDatabase(name).Options);
        var owner = new User { Id = Guid.NewGuid(), Email = "o@t.t", Username = "owner", Password = "x" };
        db.Users.Add(owner);
        var session = new TelemetrySession
        {
            Id = Guid.NewGuid(), UserId = owner.Id, CarModel = "c", Track = "t", DriverName = "d",
            SessionType = "race", Visibility = visibility,
        };
        db.TelemetrySessions.Add(session);
        await db.SaveChangesAsync();

        var hub = new SimTelemetryHub(new TelemetrySessionService(db)) { Context = new FakeCallerContext(caller) };
        return (hub, db, session.Id);
    }

    [Fact]
    public async Task Private_Session_Of_Someone_Else_Cannot_Be_Spectated()
    {
        var (hub, db, sessionId) = await SetupAsync(nameof(Private_Session_Of_Someone_Else_Cannot_Be_Spectated),
            TelemetryVisibility.Private, Caller(Guid.NewGuid(), PlanType.ELITE));
        using (db)
        {
            var act = () => hub.SpectateSession(sessionId);
            await act.Should().ThrowAsync<HubException>();
        }
    }

    [Fact]
    public async Task Public_Session_Needs_A_Plan_With_Spectating()
    {
        var (hub, db, sessionId) = await SetupAsync(nameof(Public_Session_Needs_A_Plan_With_Spectating),
            TelemetryVisibility.Public, Caller(Guid.NewGuid(), PlanType.BASIC));
        using (db)
        {
            var act = () => hub.SpectateSession(sessionId);
            await act.Should().ThrowAsync<HubException>().WithMessage("*PRO*");
        }
    }

    [Fact]
    public async Task Overlay_Token_Cannot_Spectate()
    {
        var (hub, db, sessionId) = await SetupAsync(nameof(Overlay_Token_Cannot_Spectate),
            TelemetryVisibility.Public, Caller(Guid.NewGuid(), PlanType.ELITE, TokenScopes.Overlay));
        using (db)
        {
            var act = () => hub.SpectateSession(sessionId);
            await act.Should().ThrowAsync<HubException>();
        }
    }

    [Fact]
    public async Task Unknown_Session_Cannot_Be_Spectated()
    {
        var (hub, db, _) = await SetupAsync(nameof(Unknown_Session_Cannot_Be_Spectated),
            TelemetryVisibility.Public, Caller(Guid.NewGuid(), PlanType.ELITE));
        using (db)
        {
            var act = () => hub.SpectateSession(Guid.NewGuid());
            await act.Should().ThrowAsync<HubException>();
        }
    }

    [Theory]
    [InlineData("203.0.113.7", "198.51.100.1, 10.0.0.1", "203.0.113.7")]
    [InlineData(null, "198.51.100.1, 10.0.0.1", "198.51.100.1")]
    [InlineData(null, null, "127.0.0.1")]
    public void Client_Ip_Prefers_Cloudflare_Then_Forwarded_Then_Peer(string? cf, string? xff, string expected)
    {
        var ctx = new DefaultHttpContext();
        ctx.Connection.RemoteIpAddress = System.Net.IPAddress.Loopback;
        if (cf != null) ctx.Request.Headers["CF-Connecting-IP"] = cf;
        if (xff != null) ctx.Request.Headers["X-Forwarded-For"] = xff;

        RateLimits.ClientIp(ctx).Should().Be(expected);
    }
}
