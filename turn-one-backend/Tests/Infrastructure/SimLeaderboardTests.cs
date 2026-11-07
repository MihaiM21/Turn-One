using Application.Telemetry;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Infrastructure;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Tests.Infrastructure;

/// <summary>HCR-008 catalog + HCR-009 validation and boards.</summary>
public class SimLeaderboardTests
{
    // ── Validator ─────────────────────────────────────────────────────────────

    private static LapValidationInput Clean() => new(
        LapProcessingStatus.Processed, LapKind.Flying, SimValid: true, LapTimeMs: 138_000,
        SectorsMs: new int?[] { 40_000, 50_000, 48_000 }, LapDistanceM: 7_000, TrackLengthM: 7_004, MaxSpeedKmh: 280);

    [Fact]
    public void Clean_Lap_Is_Eligible() => LapValidator.Check(Clean()).Should().BeEmpty();

    [Fact]
    public void Each_Rule_Names_Its_Reason()
    {
        LapValidator.Check(Clean() with { SimValid = false }).Should().Contain("sim_invalid");
        LapValidator.Check(Clean() with { Kind = LapKind.OutLap }).Should().Contain("not_flying_lap");
        LapValidator.Check(Clean() with { Status = LapProcessingStatus.Skipped }).Should().Contain("not_processed");
        LapValidator.Check(Clean() with { LapTimeMs = null }).Should().Contain("no_lap_time");
        LapValidator.Check(Clean() with { SectorsMs = new int?[] { 40_000, 50_000, 48_100 } }).Should().Contain("sector_sum_mismatch");
        LapValidator.Check(Clean() with { LapDistanceM = 6_500 }).Should().Contain("distance_short");
        LapValidator.Check(Clean() with { LapDistanceM = 7_400 }).Should().Contain("distance_long");
        LapValidator.Check(Clean() with { MaxSpeedKmh = 500 }).Should().Contain("speed_implausible");
    }

    [Fact]
    public void Missing_Sectors_Or_Track_Length_Skip_Those_Checks()
    {
        LapValidator.Check(Clean() with { SectorsMs = new int?[] { null, null, null }, TrackLengthM = null }).Should().BeEmpty();
    }

    // ── Catalog ───────────────────────────────────────────────────────────────

    private static TurnOneDbContext NewDb(string name) =>
        new(new DbContextOptionsBuilder<TurnOneDbContext>().UseInMemoryDatabase(name).Options);

    [Fact]
    public async Task Acc_And_F1_Spa_Are_The_Same_Layout_And_Unknown_Ids_Stay_Apart()
    {
        using var db = NewDb(nameof(Acc_And_F1_Spa_Are_The_Same_Layout_And_Unknown_Ids_Stay_Apart));
        await CatalogService.SeedAsync(db);
        await CatalogService.SeedAsync(db); // idempotent
        var catalog = new CatalogService(db);

        var acc = await catalog.ResolveAsync(SimSource.Acc, "Spa", "Spa", 7004, "ferrari_296_gt3", "Ferrari 296 GT3");
        var f1 = await catalog.ResolveAsync(SimSource.F1_25, "spa", "Spa-Francorchamps", 7004, "f1_team_0", "F1 25 car");
        acc.TrackLayoutId.Should().Be(f1.TrackLayoutId);

        var unknown = await catalog.ResolveAsync(SimSource.IRacing, "spa/endurance", "Spa", 7004, "143", "Porsche");
        unknown.TrackLayoutId.Should().NotBe(acc.TrackLayoutId!.Value);
        var unknownId = unknown.TrackLayoutId!.Value;
        var provisional = await db.TrackLayouts.FirstAsync(t => t.Id == unknownId);
        provisional.Slug.Should().Be("iracing:spa/endurance");

        (await catalog.ResolveAsync(SimSource.IRacing, "spa/endurance", null, null, "143", null)).TrackLayoutId
            .Should().Be(unknown.TrackLayoutId);
        var accClass = acc.CarClassId!.Value;
        var f1Class = f1.CarClassId!.Value;
        (await db.CarClasses.FirstAsync(c => c.Id == accClass)).Slug.Should().Be("gt3");
        (await db.CarClasses.FirstAsync(c => c.Id == f1Class)).Slug.Should().Be("f1");
    }

    [Theory]
    [InlineData(SimSource.Acc, "bmw_m4_gt4", "gt4")]
    [InlineData(SimSource.Acc, "porsche_991ii_gt3_cup", "gtc")]
    [InlineData(SimSource.Acc, "lamborghini_huracan_st_evo2", "gtc")]
    [InlineData(SimSource.Acc, "bmw_m2_cs_racing", "tcx")]
    [InlineData(SimSource.Acc, "mercedes_amg_gt3_evo", "gt3")]
    [InlineData(SimSource.F1_26, "f1_team_3", "f1")]
    [InlineData(SimSource.IRacing, "143", null)]
    public void Car_Class_Is_Inferred_From_The_Sim_Id(SimSource source, string id, string? expected) =>
        CatalogService.InferClass(source, id).Should().Be(expected);

    // ── Boards ────────────────────────────────────────────────────────────────

    private sealed class World(TurnOneDbContext db, SimLeaderboardService boards)
    {
        public TurnOneDbContext Db { get; } = db;
        public SimLeaderboardService Boards { get; } = boards;

        public async Task<User> DriverAsync(string name, LeaderboardVisibility visibility = LeaderboardVisibility.Public)
        {
            var user = new User { Id = Guid.NewGuid(), Email = $"{name}@t.t", Username = name, Password = "x" };
            Db.Users.Add(user);
            Db.SimUsers.Add(new SimUser { Id = Guid.NewGuid(), UserId = user.Id, LeaderboardVisibility = visibility });
            await Db.SaveChangesAsync();
            return user;
        }

        public async Task<Guid> LapAsync(User driver, int lapTimeMs, string car = "ferrari_296_gt3", bool valid = true, DateTime? at = null)
        {
            var session = new TelemetrySession
            {
                Id = Guid.NewGuid(), UserId = driver.Id, Source = SimSource.Acc, TrackId = "spa", Track = "Spa",
                TrackLengthM = 7004, CarId = car, CarModel = car, DriverName = driver.Username, SessionType = "practice",
            };
            var third = lapTimeMs - 90_000;
            var lap = new TelemetryLap
            {
                Id = Guid.NewGuid(), SessionId = session.Id, LapNumber = 1, LapTimeMs = lapTimeMs,
                Sector1Ms = 40_000, Sector2Ms = 50_000, Sector3Ms = third, IsValid = valid, Kind = LapKind.Flying,
                ProcessingStatus = LapProcessingStatus.Processed, LapDistanceM = 7_000, MaxSpeedKmh = 280,
                LapStartedAt = at ?? DateTime.UtcNow,
            };
            Db.TelemetrySessions.Add(session);
            Db.TelemetryLaps.Add(lap);
            await Db.SaveChangesAsync();
            await Boards.OnLapProcessedAsync(lap.Id);
            return lap.Id;
        }

        public Task<SimLeaderboardService.Board?> BoardAsync(string? car = "acc:ferrari_296_gt3", string? cls = null, string period = "all", Guid? viewer = null) =>
            Boards.GetBoardAsync(new SimLeaderboardService.BoardQuery(SimSource.Acc, "spa", car, cls, period, 1, 50, viewer));
    }

    private static async Task<World> WorldAsync(string name)
    {
        var db = NewDb(name);
        await CatalogService.SeedAsync(db);
        return new World(db, new SimLeaderboardService(db, new CatalogService(db)));
    }

    [Fact]
    public async Task Board_Ranks_Each_Drivers_Best_Valid_Lap()
    {
        var w = await WorldAsync(nameof(Board_Ranks_Each_Drivers_Best_Valid_Lap));
        var alice = await w.DriverAsync("alice");
        var bob = await w.DriverAsync("bob");
        await w.LapAsync(alice, 139_000);
        await w.LapAsync(alice, 138_200);             // new PB
        await w.LapAsync(alice, 141_000);             // slower lap doesn't replace it
        await w.LapAsync(bob, 138_500);
        await w.LapAsync(bob, 137_000, valid: false); // track limits: doesn't rank

        var board = (await w.BoardAsync())!;

        board.Entries.Select(e => (e.Rank, e.Driver, e.LapTimeMs)).Should().Equal((1, "alice", 138_200), (2, "bob", 138_500));
        board.Entries[1].GapMs.Should().Be(300);
        board.Total.Should().Be(2);
    }

    [Fact]
    public async Task Hidden_Drivers_Are_Left_Out_But_See_Their_Own_Rank_And_Anonymous_Ones_Get_A_Pseudonym()
    {
        var w = await WorldAsync(nameof(Hidden_Drivers_Are_Left_Out_But_See_Their_Own_Rank_And_Anonymous_Ones_Get_A_Pseudonym));
        var hidden = await w.DriverAsync("hidden", LeaderboardVisibility.Hidden);
        var anon = await w.DriverAsync("anon", LeaderboardVisibility.Anonymous);
        var pub = await w.DriverAsync("pub");
        await w.LapAsync(hidden, 137_000);
        await w.LapAsync(anon, 138_000);
        await w.LapAsync(pub, 139_000);

        var board = (await w.BoardAsync(viewer: hidden.Id))!;

        board.Entries.Should().HaveCount(2);
        board.Entries[0].Driver.Should().StartWith("Anonymous driver #").And.NotContain("anon");
        board.Entries[1].Driver.Should().Be("pub");
        board.Me!.Rank.Should().Be(1);
        board.Me.Driver.Should().Be("hidden");
    }

    [Fact]
    public async Task Class_Board_Combines_Cars_And_Period_Filters_Old_Laps()
    {
        var w = await WorldAsync(nameof(Class_Board_Combines_Cars_And_Period_Filters_Old_Laps));
        var a = await w.DriverAsync("a");
        var b = await w.DriverAsync("b");
        await w.LapAsync(a, 138_000, car: "ferrari_296_gt3", at: DateTime.UtcNow.AddDays(-20));
        await w.LapAsync(b, 138_500, car: "mercedes_amg_gt3_evo");

        (await w.BoardAsync(car: null, cls: "gt3"))!.Entries.Should().HaveCount(2);
        (await w.BoardAsync(car: null, cls: "gt3", period: "week"))!.Entries.Should().ContainSingle(e => e.Driver == "b");
    }

    [Fact]
    public async Task Excluded_Lap_Leaves_The_Board_And_Stays_Excluded_After_Reprocessing()
    {
        var w = await WorldAsync(nameof(Excluded_Lap_Leaves_The_Board_And_Stays_Excluded_After_Reprocessing));
        var cheater = await w.DriverAsync("cheater");
        var lap = await w.LapAsync(cheater, 120_000);

        (await w.Boards.ExcludeAsync(lap)).Should().BeTrue();
        await w.Boards.OnLapProcessedAsync(lap);

        (await w.BoardAsync())!.Entries.Should().BeEmpty();
        (await w.Boards.GetValidationAsync(lap))!.Reasons.Should().Contain("excluded_by_admin");
    }

    [Fact]
    public async Task Personal_Bests_List_Each_Board_With_Rank()
    {
        var w = await WorldAsync(nameof(Personal_Bests_List_Each_Board_With_Rank));
        var alice = await w.DriverAsync("alice");
        var bob = await w.DriverAsync("bob");
        await w.LapAsync(bob, 137_500);
        await w.LapAsync(alice, 138_000);
        await w.LapAsync(alice, 139_000, car: "bmw_m4_gt4");

        var pbs = (await w.Boards.GetPersonalBestsAsync("alice", viewerId: null))!;

        pbs.Should().HaveCount(2);
        pbs.Single(p => p.CarSlug == "acc:ferrari_296_gt3").Should().Match<SimLeaderboardService.PersonalBest>(p => p.Rank == 2 && p.Total == 2);
        (await w.Boards.GetPersonalBestsAsync("nobody", null)).Should().BeNull();
    }
}
