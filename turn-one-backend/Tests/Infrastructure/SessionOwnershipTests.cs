using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Infrastructure;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Tests.Infrastructure;

public class SessionOwnershipTests
{
    private static TurnOneDbContext NewDb(string name) =>
        new(new DbContextOptionsBuilder<TurnOneDbContext>().UseInMemoryDatabase(name).Options);

    private static async Task<(TelemetrySession session, User owner)> SeedEndedSessionAsync(TurnOneDbContext db)
    {
        var owner = new User { Id = Guid.NewGuid(), Email = "o@t.t", Username = "owner", Password = "x", Plan = PlanType.PRO };
        db.Users.Add(owner);
        var session = new TelemetrySession
        {
            Id = Guid.NewGuid(), UserId = owner.Id, CarModel = "car", Track = "Original Track", DriverName = "Owner",
            SessionType = "practice", Source = SimSource.Acc, TrackId = "spa", Status = TelemetrySessionStatus.Ended,
            IsActive = false, EndedAt = DateTime.UtcNow, Visibility = TelemetryVisibility.Public,
        };
        db.TelemetrySessions.Add(session);
        await db.SaveChangesAsync();
        return (session, owner);
    }

    [Fact]
    public async Task V1_Start_On_Another_Users_Session_Is_Rejected_And_Changes_Nothing()
    {
        using var db = NewDb(nameof(V1_Start_On_Another_Users_Session_Is_Rejected_And_Changes_Nothing));
        var (session, _) = await SeedEndedSessionAsync(db);
        var svc = new TelemetrySessionService(db);

        var act = () => svc.StartOrUpsertSessionAsync(session.Id, Guid.NewGuid(), PlanType.ELITE,
            "hijack", "Hijacked Track", "Attacker", "race", TelemetryMode.Normal, DateTime.UtcNow);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        var reloaded = await db.TelemetrySessions.AsNoTracking().SingleAsync(s => s.Id == session.Id);
        reloaded.Track.Should().Be("Original Track");
        reloaded.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task V2_Start_On_Another_Users_Session_Is_Rejected()
    {
        using var db = NewDb(nameof(V2_Start_On_Another_Users_Session_Is_Rejected));
        var (session, _) = await SeedEndedSessionAsync(db);
        var svc = new TelemetrySessionService(db);

        var act = () => svc.StartOrUpsertSessionV2Async(new StartSessionV2Request
        {
            SessionId = session.Id, UserId = Guid.NewGuid(), Plan = PlanType.ELITE, Mode = TelemetryMode.Normal,
            Source = SimSource.Acc, TrackId = "monza", TrackName = "Hijacked", StartedAt = DateTime.UtcNow,
        });

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        (await db.TelemetrySessions.AsNoTracking().SingleAsync(s => s.Id == session.Id)).Track.Should().Be("Original Track");
    }

    [Fact]
    public async Task Owner_Can_Resume_Own_Session()
    {
        using var db = NewDb(nameof(Owner_Can_Resume_Own_Session));
        var (session, owner) = await SeedEndedSessionAsync(db);
        var svc = new TelemetrySessionService(db);

        var resumed = await svc.StartOrUpsertSessionAsync(session.Id, owner.Id, PlanType.PRO,
            "", "", "", "", TelemetryMode.Normal, DateTime.UtcNow);

        resumed.IsActive.Should().BeTrue();
        resumed.UserId.Should().Be(owner.Id);
    }

    [Fact]
    public async Task GetSessionOwner_Returns_Owner_Or_Null()
    {
        using var db = NewDb(nameof(GetSessionOwner_Returns_Owner_Or_Null));
        var (session, owner) = await SeedEndedSessionAsync(db);
        var svc = new TelemetrySessionService(db);

        (await svc.GetSessionOwnerAsync(session.Id)).Should().Be(owner.Id);
        (await svc.GetSessionOwnerAsync(Guid.NewGuid())).Should().BeNull();
    }

    [Fact]
    public async Task New_Sessions_Never_Delete_Older_Ones_On_Any_Plan()
    {
        using var db = NewDb(nameof(New_Sessions_Never_Delete_Older_Ones_On_Any_Plan));
        var (_, owner) = await SeedEndedSessionAsync(db);
        var svc = new TelemetrySessionService(db);

        for (var i = 0; i < 3; i++)
        {
            await svc.StartOrUpsertSessionAsync(Guid.NewGuid(), owner.Id, PlanType.BASIC,
                "car", "track", "d", "practice", TelemetryMode.Normal, DateTime.UtcNow.AddMinutes(i));
            await svc.StartOrUpsertSessionV2Async(new StartSessionV2Request
            {
                SessionId = Guid.NewGuid(), UserId = owner.Id, Plan = PlanType.BASIC, Mode = TelemetryMode.Normal,
                Source = SimSource.Acc, StartedAt = DateTime.UtcNow.AddMinutes(i),
            });
        }

        (await db.TelemetrySessions.CountAsync(s => s.UserId == owner.Id)).Should().Be(7);
    }
}
