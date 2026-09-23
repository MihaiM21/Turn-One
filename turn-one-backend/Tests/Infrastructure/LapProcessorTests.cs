using Application.Interfaces;
using Application.Telemetry;
using Domain.Entities;
using Domain.Enums;
using Domain.Telemetry;
using FluentAssertions;
using Infrastructure;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Tests.Fixtures;

namespace Tests.Infrastructure;

public class LapProcessorTests
{
    private static TurnOneDbContext NewDb(string name) =>
        new(new DbContextOptionsBuilder<TurnOneDbContext>().UseInMemoryDatabase(name).Options);

    private static async Task<(TelemetrySession session, User user)> SeedSessionAsync(TurnOneDbContext db, float? trackLength = 4000f)
    {
        var user = new User { Id = Guid.NewGuid(), Email = "t@t.t", Username = "tester", Password = "x", Plan = PlanType.PRO };
        db.Users.Add(user);
        db.SimUsers.Add(new SimUser { Id = Guid.NewGuid(), UserId = user.Id });
        var session = new TelemetrySession
        {
            Id = Guid.NewGuid(), UserId = user.Id, CarModel = "ferrari_296_gt3", Track = "Synth Ring", DriverName = "T",
            SessionType = "practice", Source = SimSource.Acc, TrackId = "synth", TrackLengthM = trackLength, SectorCount = 3, SchemaVersion = 2,
        };
        db.TelemetrySessions.Add(session);
        await db.SaveChangesAsync();
        return (session, user);
    }

    private static LapJob JobFor(TelemetrySession s, int lap, float speedScale = 1f, LapCompleteInfo? complete = null) => new()
    {
        Track = new LapTrackContext
        {
            SessionId = s.Id, UserId = s.UserId, Plan = PlanType.PRO, Source = s.Source,
            TrackId = s.TrackId, TrackName = s.Track, TrackLengthM = s.TrackLengthM, SectorCount = s.SectorCount, CarId = s.CarModel
        },
        LapNumber = lap,
        Ticks = new SyntheticLap { LapNumber = lap, SpeedScale = speedScale }.Generate(),
        LapStartedAt = DateTime.UtcNow,
        Complete = complete,
    };

    [Fact]
    public async Task Processes_A_Lap_Into_Telemetry_Corners_And_Profile()
    {
        await using var db = NewDb(nameof(Processes_A_Lap_Into_Telemetry_Corners_And_Profile));
        var (session, _) = await SeedSessionAsync(db);
        var processor = new LapProcessor(db, NullLogger<LapProcessor>.Instance);

        var result = await processor.ProcessAsync(JobFor(session, 3));

        result.Status.Should().Be(LapProcessingStatus.Processed);
        result.IsValid.Should().BeTrue();
        result.CornerCount.Should().Be(8);

        var lap = await db.TelemetryLaps.Include(l => l.Telemetry).Include(l => l.Corners).SingleAsync();
        lap.LapNumber.Should().Be(3);
        lap.Kind.Should().Be(LapKind.Flying);
        lap.Sector1Ms.Should().BePositive();
        lap.LapDistanceM.Should().BeApproximately(4000f, 2f);
        lap.Telemetry!.SampleCount.Should().Be(2001);
        lap.Telemetry.StepM.Should().Be(2f);
        lap.Telemetry.Data.Length.Should().BeGreaterThan(1000);
        lap.Corners.Should().HaveCount(8);
        lap.Corners.Should().OnlyContain(c => c.RefCornerIndex != null, "the first lap defines the reference set and matches itself");

        var decoded = LapChannelCodec.Decode(lap.Telemetry.Data, lap.Telemetry.ChannelIndex, lap.Telemetry.StepM, lap.Telemetry.SampleCount);
        decoded.Has(ChannelRegistry.Speed).Should().BeTrue();
        decoded.Has(ChannelRegistry.GLat).Should().BeTrue("PRO laps keep every channel");

        var profile = await db.TrackProfiles.SingleAsync();
        profile.Source.Should().Be(SimSource.Acc);
        profile.TrackId.Should().Be("synth");
        profile.Status.Should().Be(TrackProfileStatus.Provisional);
        profile.LapSampleCount.Should().Be(1);
        TrackProfileBuilder.ParseReference(profile.ReferenceCorners).Should().HaveCount(8);
        profile.SectorBoundariesM.Should().HaveCount(2);
        profile.Centerline.Should().NotBeNull();
        LapProcessor.DecodeCenterline(profile.Centerline)!.Length.Should().BeGreaterThan(100);

        var refreshed = await db.TelemetrySessions.SingleAsync();
        refreshed.TrackProfileId.Should().Be(profile.Id);
        refreshed.BestLapMs.Should().Be(lap.LapTimeMs);
        refreshed.LapCount.Should().Be(3);

        (await db.SimUsers.SingleAsync()).TotalLaps.Should().Be(1);
    }

    [Fact]
    public async Task Profile_Becomes_Stable_After_Ten_Laps_And_Later_Laps_Match_It()
    {
        await using var db = NewDb(nameof(Profile_Becomes_Stable_After_Ten_Laps_And_Later_Laps_Match_It));
        var (session, _) = await SeedSessionAsync(db);
        var processor = new LapProcessor(db, NullLogger<LapProcessor>.Instance);

        for (var lap = 1; lap <= 11; lap++)
            (await processor.ProcessAsync(JobFor(session, lap, 0.93f + 0.01f * (lap % 6)))).Status.Should().Be(LapProcessingStatus.Processed);

        var profile = await db.TrackProfiles.SingleAsync();
        profile.Status.Should().Be(TrackProfileStatus.Stable);
        profile.Version.Should().Be(2);
        profile.CornerSamples.Should().BeNull();
        TrackProfileBuilder.ParseReference(profile.ReferenceCorners).Should().HaveCount(8);

        var last = await db.TelemetryLaps.Include(l => l.Corners).SingleAsync(l => l.LapNumber == 11);
        last.Corners.Should().OnlyContain(c => c.RefCornerIndex != null && c.ProfileVersion == 2);
        (await db.TelemetryLaps.CountAsync()).Should().Be(11);
        (await db.LapTelemetries.CountAsync()).Should().Be(11);
        (await db.LapCorners.CountAsync()).Should().Be(88);
    }

    [Fact]
    public async Task Reprocessing_Replaces_Corners_Without_Duplicating_Rows_Or_Stats()
    {
        await using var db = NewDb(nameof(Reprocessing_Replaces_Corners_Without_Duplicating_Rows_Or_Stats));
        var (session, _) = await SeedSessionAsync(db);
        var processor = new LapProcessor(db, NullLogger<LapProcessor>.Instance);

        await processor.ProcessAsync(JobFor(session, 2));
        await processor.ProcessAsync(JobFor(session, 2));

        (await db.TelemetryLaps.CountAsync()).Should().Be(1);
        (await db.LapTelemetries.CountAsync()).Should().Be(1);
        (await db.LapCorners.CountAsync()).Should().Be(8);
        (await db.SimUsers.SingleAsync()).TotalLaps.Should().Be(1, "stats only bump when the lap row is first created");
    }

    [Fact]
    public async Task Lap_Complete_Timing_Wins_And_Late_Arrival_Patches_The_Row()
    {
        await using var db = NewDb(nameof(Lap_Complete_Timing_Wins_And_Late_Arrival_Patches_The_Row));
        var (session, _) = await SeedSessionAsync(db);
        var processor = new LapProcessor(db, NullLogger<LapProcessor>.Instance);

        var complete = new LapCompleteInfo { Lap = 4, LapTimeMs = 88_000, SectorsMs = new[] { 29_000, 30_000, 29_000 }, Valid = true };
        await processor.ProcessAsync(JobFor(session, 4, complete: complete));
        var lap = await db.TelemetryLaps.SingleAsync();
        lap.LapTimeMs.Should().Be(88_000);
        lap.Sector2Ms.Should().Be(30_000);

        await processor.ApplyLapCompleteAsync(session.Id, new LapCompleteInfo { Lap = 4, LapTimeMs = 87_500, SectorsMs = new[] { 29_000, 29_500, 29_000 }, Valid = false });
        lap = await db.TelemetryLaps.SingleAsync();
        lap.LapTimeMs.Should().Be(87_500);
        lap.IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task Skipped_And_Aborted_Laps_Leave_An_Honest_Row()
    {
        await using var db = NewDb(nameof(Skipped_And_Aborted_Laps_Leave_An_Honest_Row));
        var (session, _) = await SeedSessionAsync(db);
        var processor = new LapProcessor(db, NullLogger<LapProcessor>.Instance);

        var overflow = JobFor(session, 1);
        var skipped = await processor.ProcessAsync(new LapJob { Track = overflow.Track, LapNumber = 1, Ticks = overflow.Ticks, SkipReason = "overflow", LapStartedAt = DateTime.UtcNow });
        skipped.Status.Should().Be(LapProcessingStatus.Skipped);

        var ticks = new SyntheticLap { LapNumber = 2 }.Generate();
        var idx = ticks.FindIndex(t => t.LapDistM > 2600f);
        for (var i = idx; i < ticks.Count; i++) ticks[i].V[TickLayout.LapDistM] -= 300f;
        var aborted = await processor.ProcessAsync(new LapJob { Track = overflow.Track, LapNumber = 2, Ticks = ticks, LapStartedAt = DateTime.UtcNow });
        aborted.Status.Should().Be(LapProcessingStatus.Skipped);
        aborted.Kind.Should().Be(LapKind.Aborted);

        (await db.TelemetryLaps.CountAsync()).Should().Be(2);
        (await db.LapTelemetries.CountAsync()).Should().Be(0);
        (await db.TelemetrySessions.SingleAsync()).BestLapMs.Should().Be(0);
    }

    [Fact]
    public async Task Basic_Plan_Stores_Reduced_Channel_Set()
    {
        await using var db = NewDb(nameof(Basic_Plan_Stores_Reduced_Channel_Set));
        var (session, _) = await SeedSessionAsync(db);
        var processor = new LapProcessor(db, NullLogger<LapProcessor>.Instance);

        var job = JobFor(session, 1);
        var basicJob = new LapJob
        {
            Track = new LapTrackContext { SessionId = session.Id, UserId = session.UserId, Plan = PlanType.BASIC, Source = SimSource.Acc, TrackId = "synth", TrackLengthM = 4000f },
            LapNumber = 1, Ticks = job.Ticks, LapStartedAt = DateTime.UtcNow
        };
        await processor.ProcessAsync(basicJob);

        var tel = await db.LapTelemetries.SingleAsync();
        var decoded = LapChannelCodec.Decode(tel.Data, tel.ChannelIndex, tel.StepM, tel.SampleCount);
        decoded.Has(ChannelRegistry.Speed).Should().BeTrue();
        decoded.Has(ChannelRegistry.Throttle).Should().BeTrue();
        decoded.Channels.Should().NotContainKey(ChannelRegistry.GLat);
        decoded.Channels.Should().NotContainKey(ChannelRegistry.Steer);
    }

    [Fact]
    public async Task Unknown_Track_Length_Self_Calibrates_From_First_Lap()
    {
        await using var db = NewDb(nameof(Unknown_Track_Length_Self_Calibrates_From_First_Lap));
        var (session, _) = await SeedSessionAsync(db, trackLength: null);
        var processor = new LapProcessor(db, NullLogger<LapProcessor>.Instance);

        var job = JobFor(session, 1);
        await processor.ProcessAsync(job);

        (await db.TelemetrySessions.SingleAsync()).TrackLengthM.Should().BeApproximately(4000f, 2f);
        (await db.TrackProfiles.SingleAsync()).LengthM.Should().BeApproximately(4000f, 2f);
    }
}
