using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Telemetry;
using FluentAssertions;
using Infrastructure;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace Tests.Infrastructure;

/// <summary>Stub tick repository — corner tips never need to read the raw archive because the
/// seeded laps already carry their analytics scores.</summary>
file sealed class NotUsedTickRepository : ITelemetryTickRepository
{
    public Task BatchWriteTicksAsync(IEnumerable<TickRecord> ticks) => throw new NotImplementedException();
    public Task<List<ChartPoint>> GetSessionPhysicsChartAsync(PlanType planType, Guid sessionId) => throw new NotImplementedException();
    public Task<MultiChannelChart> GetSessionChannelsAsync(PlanType planType, Guid sessionId, IReadOnlyCollection<string> channels, DateTime? from = null, DateTime? to = null) => throw new NotImplementedException();
    public Task<(DateTime? start, DateTime? end)> GetLapBoundsAsync(PlanType planType, Guid sessionId, int lapNumber) => throw new NotImplementedException();
    public Task<List<RawTick>> GetLapTicksRawAsync(Guid sessionId, DateTime from, DateTime to) => throw new NotImplementedException();
    public Task<List<(DateTime start, DateTime end)>> GetV2LapBoundsAsync(Guid sessionId) => throw new NotImplementedException();
}

public class HeuristicCoachingCornerTests
{
    private static TurnOneDbContext NewDb(string name) =>
        new(new DbContextOptionsBuilder<TurnOneDbContext>().UseInMemoryDatabase(name).Options);

    private static HeuristicCoachingService NewService(TurnOneDbContext db) =>
        new(db, new LapAnalyticsService(db, new NotUsedTickRepository(), NullLogger<LapAnalyticsService>.Instance));

    private static LapCorner Corner(Guid lapId, Guid sessionId, short index, short? refIndex, float brakingPointM, float minSpeedKmh, float? throttleOnM = null, float? trailBrakeM = null, int timeInCornerMs = 2000) => new()
    {
        Id = Guid.NewGuid(),
        TelemetryLapId = lapId,
        SessionId = sessionId,
        CornerIndex = index,
        RefCornerIndex = refIndex,
        Direction = 1,
        Source = CornerSignalSource.LateralG,
        EntryM = brakingPointM - 20f,
        ApexM = brakingPointM + 40f,
        ExitM = brakingPointM + 100f,
        BrakingPointM = brakingPointM,
        BrakeReleaseM = brakingPointM + 30f,
        ThrottleOnM = throttleOnM ?? brakingPointM + 50f,
        FullThrottleM = brakingPointM + 90f,
        EntrySpeedKmh = 200f,
        MinSpeedKmh = minSpeedKmh,
        ExitSpeedKmh = 180f,
        PeakBrake = 0.9f,
        PeakGLat = 1.4f,
        GearAtApex = 3,
        MinGear = 2,
        TimeInCornerMs = timeInCornerMs,
        BrakeToThrottleMs = 300,
        TrailBrakeM = trailBrakeM ?? 30f
    };

    [Fact]
    public async Task Corner_Tips_Compare_Against_Session_Best_Lap()
    {
        await using var db = NewDb(nameof(Corner_Tips_Compare_Against_Session_Best_Lap));

        var user = new User { Id = Guid.NewGuid(), Email = "t@t.t", Username = "tester", Password = "x", Plan = PlanType.PRO };
        db.Users.Add(user);

        var session = new TelemetrySession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            CarModel = "ferrari_296_gt3",
            Track = "Synth Ring",
            DriverName = "T",
            SessionType = "practice",
            Source = SimSource.Acc,
            TrackId = "synth",
            TrackLengthM = 4000f,
            SectorCount = 3,
            SchemaVersion = 2
        };
        db.TelemetrySessions.Add(session);

        // Best lap: lap 1, faster overall, and the reference for corner comparisons.
        var bestLap = new TelemetryLap
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            LapNumber = 1,
            LapTimeMs = 90_000,
            IsValid = true,
            ProcessingStatus = LapProcessingStatus.Processed,
            BrakingScore = 80f,
            ThrottleScore = 80f,
            ConsistencyScore = 80f
        };

        // Target lap: lap 2, slower, with worse braking/apex speed at T3 (index 2).
        var targetLap = new TelemetryLap
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            LapNumber = 2,
            LapTimeMs = 91_500,
            IsValid = true,
            ProcessingStatus = LapProcessingStatus.Processed,
            BrakingScore = 80f,
            ThrottleScore = 80f,
            ConsistencyScore = 80f
        };

        db.TelemetryLaps.AddRange(bestLap, targetLap);

        // T1 (index 0) and T2 (index 1) roughly match; T3 (index 2) is where the target lap loses time.
        var bestCorners = new[]
        {
            Corner(bestLap.Id, session.Id, 0, 0, 400f, 120f, timeInCornerMs: 1800),
            Corner(bestLap.Id, session.Id, 1, 1, 900f, 140f, timeInCornerMs: 1900),
            Corner(bestLap.Id, session.Id, 2, 2, 1300f, 90f, timeInCornerMs: 2000),
        };
        var targetCorners = new[]
        {
            Corner(targetLap.Id, session.Id, 0, 0, 402f, 119f, timeInCornerMs: 1810),
            Corner(targetLap.Id, session.Id, 1, 1, 898f, 139f, timeInCornerMs: 1905),
            // Brakes 25 m earlier and is 8 km/h slower at the apex than the best lap's T3.
            Corner(targetLap.Id, session.Id, 2, 2, 1275f, 82f, timeInCornerMs: 2450),
        };

        db.LapCorners.AddRange(bestCorners);
        db.LapCorners.AddRange(targetCorners);
        await db.SaveChangesAsync();

        var service = NewService(db);
        var tips = await service.GenerateTipsAsync(PlanType.PRO, session.Id, targetLap.LapNumber);

        tips.Should().NotBeEmpty();
        var t3Tip = tips.Should().ContainSingle(t => t.CornerIndex == 2).Subject;
        t3Tip.CornerName.Should().Be("T3");
        t3Tip.DistanceM.Should().NotBeNull();
        // Biggest TimeInCornerMs delta is at T3 (450ms) vs T1/T2 (~10ms), so it should be the tip.
        t3Tip.Title.Should().ContainAny("brake", "apex");
    }

    [Fact]
    public async Task Single_Lap_Falls_Back_To_Absolute_Corner_Heuristics()
    {
        await using var db = NewDb(nameof(Single_Lap_Falls_Back_To_Absolute_Corner_Heuristics));

        var user = new User { Id = Guid.NewGuid(), Email = "t2@t.t", Username = "tester2", Password = "x", Plan = PlanType.PRO };
        db.Users.Add(user);

        var session = new TelemetrySession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            CarModel = "ferrari_296_gt3",
            Track = "Synth Ring",
            DriverName = "T",
            SessionType = "practice",
            Source = SimSource.Acc,
            TrackId = "synth",
            TrackLengthM = 4000f,
            SectorCount = 3,
            SchemaVersion = 2
        };
        db.TelemetrySessions.Add(session);

        var onlyLap = new TelemetryLap
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            LapNumber = 1,
            LapTimeMs = 90_000,
            IsValid = true,
            ProcessingStatus = LapProcessingStatus.Processed,
            BrakingScore = 80f,
            ThrottleScore = 80f,
            ConsistencyScore = 80f
        };
        db.TelemetryLaps.Add(onlyLap);

        var corner = Corner(onlyLap.Id, session.Id, 0, 0, 400f, 120f);
        corner.BrakeToThrottleMs = 900; // long coasting gap
        db.LapCorners.Add(corner);
        await db.SaveChangesAsync();

        var service = NewService(db);
        var tips = await service.GenerateTipsAsync(PlanType.PRO, session.Id, onlyLap.LapNumber);

        tips.Should().Contain(t => t.CornerIndex == 0 && t.Category == "Coasting");
    }
}
