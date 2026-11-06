using System.IdentityModel.Tokens.Jwt;
using API.Security;
using Application.Interfaces;
using Domain.Entities;
using FluentAssertions;
using Infrastructure;
using Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Tests.Infrastructure;

/// <summary>HCR-006 acceptance criteria: pairing, scope, rotation, reuse detection, revocation.</summary>
public class DeviceAuthServiceTests
{
    private DateTime _now = new(2026, 11, 6, 12, 0, 0, DateTimeKind.Utc);

    private static readonly IConfiguration Config = new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["JWT:Key"] = "unit-test-signing-key-unit-test-signing-key",
            ["JWT:Issuer"] = "test",
            ["JWT:Audience"] = "test",
        })
        .Build();

    private (DeviceAuthService svc, TurnOneDbContext db, User user) Setup(string name)
    {
        var db = new TurnOneDbContext(new DbContextOptionsBuilder<TurnOneDbContext>().UseInMemoryDatabase(name).Options);
        var user = new User { Id = Guid.NewGuid(), Email = "d@t.t", Username = "driver", Password = "x" };
        db.Users.Add(user);
        db.SaveChanges();
        return (new DeviceAuthService(db, Config, () => _now), db, user);
    }

    private async Task<DeviceTokens> PairAsync(DeviceAuthService svc, Guid userId)
    {
        var started = await svc.StartPairingAsync("DESKTOP-TEST", "windows", "1.2.0");
        (await svc.ApproveAsync(started.UserCode, userId)).Should().Be(ApproveResult.Approved);
        _now = _now.AddSeconds(6);
        var poll = await svc.PollAsync(started.DeviceCode);
        poll.Status.Should().Be(PollStatus.Approved);
        return poll.Tokens!;
    }

    [Fact]
    public async Task Full_Pairing_Flow_Issues_A_Link_Scoped_Token()
    {
        var (svc, db, user) = Setup(nameof(Full_Pairing_Flow_Issues_A_Link_Scoped_Token));
        using var _ = db;

        var started = await svc.StartPairingAsync("DESKTOP-TEST", "windows", "1.2.0");
        started.UserCode.Should().MatchRegex("^[A-Z0-9]{4}-[A-Z0-9]{4}$");

        (await svc.PollAsync(started.DeviceCode)).Status.Should().Be(PollStatus.Pending);

        // The website shows what is being approved.
        var pairing = await svc.FindPairingAsync(started.UserCode.ToLowerInvariant().Replace("-", ""));
        pairing!.DeviceName.Should().Be("DESKTOP-TEST");

        await svc.ApproveAsync(started.UserCode, user.Id);
        _now = _now.AddSeconds(6);
        var tokens = (await svc.PollAsync(started.DeviceCode)).Tokens!;

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(tokens.AccessToken);
        jwt.Claims.Should().Contain(c => c.Type == "Scope" && c.Value == "link");
        jwt.Claims.Should().Contain(c => c.Type == "DeviceId" && c.Value == tokens.DeviceId.ToString());
        (jwt.ValidTo - _now).Should().BeCloseTo(TimeSpan.FromMinutes(15), TimeSpan.FromSeconds(5));

        // The pairing can't be collected twice.
        (await svc.PollAsync(started.DeviceCode)).Status.Should().Be(PollStatus.Expired);
        (await svc.ListAsync(user.Id)).Should().ContainSingle(d => d.Name == "DESKTOP-TEST");
    }

    [Fact]
    public async Task Polling_Faster_Than_The_Interval_Is_Told_To_Slow_Down()
    {
        var (svc, db, _) = Setup(nameof(Polling_Faster_Than_The_Interval_Is_Told_To_Slow_Down));
        using var _ = db;
        var started = await svc.StartPairingAsync("PC", "windows", null);

        (await svc.PollAsync(started.DeviceCode)).Status.Should().Be(PollStatus.Pending);
        (await svc.PollAsync(started.DeviceCode)).Status.Should().Be(PollStatus.SlowDown);
    }

    [Fact]
    public async Task Expired_Pairing_Cannot_Be_Approved_Or_Collected()
    {
        var (svc, db, user) = Setup(nameof(Expired_Pairing_Cannot_Be_Approved_Or_Collected));
        using var _ = db;
        var started = await svc.StartPairingAsync("PC", "windows", null);
        _now = _now.AddMinutes(11);

        (await svc.ApproveAsync(started.UserCode, user.Id)).Should().Be(ApproveResult.NotFound);
        (await svc.PollAsync(started.DeviceCode)).Status.Should().Be(PollStatus.Expired);
    }

    [Fact]
    public async Task Refresh_Rotates_And_Reuse_Revokes_The_Device()
    {
        var (svc, db, user) = Setup(nameof(Refresh_Rotates_And_Reuse_Revokes_The_Device));
        using var _ = db;
        var first = await PairAsync(svc, user.Id);

        var second = await svc.RefreshAsync(first.DeviceToken);
        second.Should().NotBeNull();
        second!.DeviceToken.Should().NotBe(first.DeviceToken);

        // Presenting the rotated token again: treated as stolen, device revoked.
        (await svc.RefreshAsync(first.DeviceToken)).Should().BeNull();
        (await svc.RefreshAsync(second.DeviceToken)).Should().BeNull();
        (await svc.ListAsync(user.Id)).Should().BeEmpty();
    }

    [Fact]
    public async Task Revoked_Device_Cannot_Refresh_And_Others_Cannot_Revoke_It()
    {
        var (svc, db, user) = Setup(nameof(Revoked_Device_Cannot_Refresh_And_Others_Cannot_Revoke_It));
        using var _ = db;
        var tokens = await PairAsync(svc, user.Id);

        (await svc.RevokeAsync(tokens.DeviceId, Guid.NewGuid())).Should().BeFalse();
        (await svc.RevokeAsync(tokens.DeviceId, user.Id)).Should().BeTrue();
        (await svc.RefreshAsync(tokens.DeviceToken)).Should().BeNull();
    }

    [Fact]
    public async Task Expired_Device_Token_Is_Rejected()
    {
        var (svc, db, user) = Setup(nameof(Expired_Device_Token_Is_Rejected));
        using var _ = db;
        var tokens = await PairAsync(svc, user.Id);
        _now = _now.AddDays(181);

        (await svc.RefreshAsync(tokens.DeviceToken)).Should().BeNull();
    }

    [Theory]
    [InlineData("/api/simracing/uploads/laps", true)]
    [InlineData("/api/ws/telemetry", true)]
    [InlineData("/api/auth/me", true)]
    [InlineData("/api/telemetry/sessions/me", true)]
    [InlineData("/api/users/me", false)]
    [InlineData("/api/subscription/upgrade", false)]
    [InlineData("/api/admin/users", false)]
    [InlineData("/api/devices", false)]
    public void Link_Scope_Is_Limited_To_Link_Endpoints(string path, bool allowed)
    {
        TokenScopes.IsAllowedPath(TokenScopes.Link, new PathString(path)).Should().Be(allowed);
    }

    [Theory]
    [InlineData("k7qf2m9d", "K7QF-2M9D")]
    [InlineData(" K7QF-2M9D ", "K7QF-2M9D")]
    [InlineData("K7QF", null)]
    [InlineData("", null)]
    public void User_Codes_Are_Normalized(string input, string? expected)
    {
        DeviceAuthService.NormalizeUserCode(input).Should().Be(expected);
    }
}
