using Application.Telemetry;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Infrastructure;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace Tests.Infrastructure;

/// <summary>BUG-019: an impossible lap time must never become a session's best, whichever path writes it.</summary>
public class SessionBestLapTests
{
    private static TurnOneDbContext NewDb(string name) =>
        new(new DbContextOptionsBuilder<TurnOneDbContext>().UseInMemoryDatabase(name).Options);

    private static async Task<TelemetrySession> SeedAsync(TurnOneDbContext db, int bestLapMs = 0, float? trackLengthM = 5842f)
    {
        var session = new TelemetrySession
        {
            Id = Guid.NewGuid(), UserId = Guid.NewGuid(), CarModel = "ferrari_488_gt3", Track = "Paul Ricard", DriverName = "T",
            SessionType = "practice", Source = SimSource.Acc, TrackLengthM = trackLengthM, BestLapMs = bestLapMs, SchemaVersion = 2,
        };
        db.TelemetrySessions.Add(session);
        await db.SaveChangesAsync();
        return session;
    }

    private static TelemetryLap Lap(Guid sessionId, int number, int? ms, bool valid = true) => new()
    {
        SessionId = sessionId, LapNumber = number, LapTimeMs = ms, IsValid = valid, RecordedAt = DateTime.UtcNow,
    };

    [Fact]
    public async Task A_30ms_Lap_Does_Not_Replace_A_Real_Best()
    {
        await using var db = NewDb(nameof(A_30ms_Lap_Does_Not_Replace_A_Real_Best));
        var session = await SeedAsync(db);
        var svc = new TelemetrySessionService(db);

        await svc.RecordLapAsync(Lap(session.Id, 1, 127_390));
        await svc.RecordLapAsync(Lap(session.Id, 2, 30));
        await svc.RecordLapAsync(Lap(session.Id, 3, 125_610));

        (await db.TelemetrySessions.SingleAsync()).BestLapMs.Should().Be(125_610);
    }

    [Fact]
    public async Task Invalid_Laps_Do_Not_Count_Towards_The_Best()
    {
        await using var db = NewDb(nameof(Invalid_Laps_Do_Not_Count_Towards_The_Best));
        var session = await SeedAsync(db);
        var svc = new TelemetrySessionService(db);

        await svc.RecordLapAsync(Lap(session.Id, 1, 127_390));
        await svc.RecordLapAsync(Lap(session.Id, 2, 120_000, valid: false));

        (await db.TelemetrySessions.SingleAsync()).BestLapMs.Should().Be(127_390);
    }

    [Fact]
    public async Task End_Of_Session_Best_From_The_Client_Does_Not_Overwrite_The_Server_Best()
    {
        await using var db = NewDb(nameof(End_Of_Session_Best_From_The_Client_Does_Not_Overwrite_The_Server_Best));
        var session = await SeedAsync(db, bestLapMs: 125_610);

        await new TelemetrySessionService(db).EndSessionAsync(session.Id, DateTime.UtcNow, 4, 30);

        (await db.TelemetrySessions.SingleAsync()).BestLapMs.Should().Be(125_610);
    }

    [Fact]
    public async Task End_Of_Session_Best_Fills_A_Gap_Only_When_Believable()
    {
        await using var db = NewDb(nameof(End_Of_Session_Best_Fills_A_Gap_Only_When_Believable));
        var empty = await SeedAsync(db);
        var other = await SeedAsync(db);
        var svc = new TelemetrySessionService(db);

        await svc.EndSessionAsync(empty.Id, DateTime.UtcNow, 3, 126_000);
        await svc.EndSessionAsync(other.Id, DateTime.UtcNow, 3, 30);

        (await db.TelemetrySessions.SingleAsync(s => s.Id == empty.Id)).BestLapMs.Should().Be(126_000);
        (await db.TelemetrySessions.SingleAsync(s => s.Id == other.Id)).BestLapMs.Should().Be(0);
    }

    [Fact]
    public async Task Lap_Complete_With_An_Impossible_Time_Leaves_The_Best_Alone()
    {
        await using var db = NewDb(nameof(Lap_Complete_With_An_Impossible_Time_Leaves_The_Best_Alone));
        var session = await SeedAsync(db, bestLapMs: 125_610);
        db.TelemetryLaps.Add(Lap(session.Id, 4, 126_000));
        await db.SaveChangesAsync();
        var processor = new LapProcessor(db, NullLogger<LapProcessor>.Instance);

        await processor.ApplyLapCompleteAsync(session.Id, new LapCompleteInfo { Lap = 4, LapTimeMs = 30, Valid = true });

        (await db.TelemetrySessions.SingleAsync()).BestLapMs.Should().Be(125_610);
    }
}
