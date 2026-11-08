using System.Reflection;
using System.Security.Claims;
using System.Text.Json;
using API.Controllers;
using API.Services;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Infrastructure;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Tests.Infrastructure;

/// <summary>HCR-008/009 iRacing catalog: class inference from <c>car.class</c> and the admin Catalog review.</summary>
public class CatalogReviewTests
{
    // ── Class inference ───────────────────────────────────────────────────────

    [Theory]
    [InlineData("GT3 Class", "gt3")]
    [InlineData("GT3", "gt3")]
    [InlineData("GT4 Class", "gt4")]
    [InlineData("GTP", "gtp")]
    [InlineData("Hypercar", "gtp")]
    [InlineData("LMP2", "lmp2")]
    [InlineData("LMP3", "lmp3")]
    [InlineData("F4", "f4")]
    [InlineData("FIA F4", "f4")]
    [InlineData("SF23", "super_formula")]
    [InlineData("Super Formula", "super_formula")]
    [InlineData("Super Formula Lights", null)]
    [InlineData("TCR", "tcr")]
    [InlineData("MX-5 Cup", "mx5")]
    [InlineData("MX5", "mx5")]
    [InlineData("PCup", "gtc")]
    [InlineData("Porsche 992 Cup", "gtc")]
    [InlineData("Porsche 911 GT3 Cup", "gtc")]
    [InlineData("Dallara IR18", null)]
    [InlineData("", null)]
    [InlineData(null, null)]
    public void IRacing_Class_Comes_From_Car_Class_Short_Name(string? carClass, string? expected) =>
        CatalogService.InferClass(SimSource.IRacing, "143", carClass).Should().Be(expected);

    [Fact]
    public void Acc_And_F1_Ignore_The_Class_Name()
    {
        CatalogService.InferClass(SimSource.Acc, "bmw_m4_gt4", "GT3").Should().Be("gt4");
        CatalogService.InferClass(SimSource.F1_25, "f1_team_0", "GT3").Should().Be("f1");
    }

    [Fact]
    public void Session_Start_Parses_Car_Class()
    {
        using var doc = JsonDocument.Parse("""
            { "source": "iracing", "trackId": "163:grand prix pits", "trackName": "Spa",
              "car": { "id": "132", "name": "BMW M4 GT3", "class": " GT3 Class " }, "sessionType": "practice" }
            """);
        var req = TelemetryIngestionService.BuildSessionStartV2(Guid.NewGuid(), Guid.NewGuid(), PlanType.PRO, TelemetryMode.Normal, doc.RootElement, 1_700_000_000_000);

        req.CarClass.Should().Be("GT3 Class");
        req.CarId.Should().Be("132");
    }

    [Fact]
    public async Task IRacing_Car_Gets_Its_Class_From_The_Session_Even_If_First_Seen_Without_One()
    {
        using var db = NewDb(nameof(IRacing_Car_Gets_Its_Class_From_The_Session_Even_If_First_Seen_Without_One));
        await CatalogService.SeedAsync(db);
        var catalog = new CatalogService(db);

        (await catalog.ResolveAsync(SimSource.IRacing, "163:gp", "Spa", 7004, "132", "BMW M4 GT3")).CarClassId.Should().BeNull();
        var later = await catalog.ResolveAsync(SimSource.IRacing, "163:gp", "Spa", 7004, "132", "BMW M4 GT3", "GT3 Class");

        var classId = later.CarClassId!.Value;
        (await db.CarClasses.FirstAsync(c => c.Id == classId)).Slug.Should().Be("gt3");
        (await catalog.ResolveAsync(SimSource.IRacing, "163:gp", null, null, "132", null)).CarClassId.Should().Be(classId);
    }

    // ── Review ────────────────────────────────────────────────────────────────

    private static TurnOneDbContext NewDb(string name) =>
        new(new DbContextOptionsBuilder<TurnOneDbContext>().UseInMemoryDatabase(name).Options);

    private sealed class World(TurnOneDbContext db)
    {
        public TurnOneDbContext Db { get; } = db;
        public SimLeaderboardService Boards { get; } = new(db, new CatalogService(db));
        public CatalogAdminService Admin => new(Db, Boards);

        public async Task<User> DriverAsync(string name)
        {
            var user = new User { Id = Guid.NewGuid(), Email = $"{name}@t.t", Username = name, Password = "x" };
            Db.Users.Add(user);
            await Db.SaveChangesAsync();
            return user;
        }

        public async Task<Guid> LapAsync(User driver, int lapTimeMs, SimSource source, string trackId, string carId, string? carClass = null)
        {
            var session = new TelemetrySession
            {
                Id = Guid.NewGuid(), UserId = driver.Id, Source = source, TrackId = trackId, Track = "Spa",
                TrackLengthM = 7004, CarId = carId, CarModel = carId, CarClass = carClass, DriverName = driver.Username, SessionType = "practice",
            };
            var lap = new TelemetryLap
            {
                Id = Guid.NewGuid(), SessionId = session.Id, LapNumber = 1, LapTimeMs = lapTimeMs,
                Sector1Ms = 40_000, Sector2Ms = 50_000, Sector3Ms = lapTimeMs - 90_000, IsValid = true, Kind = LapKind.Flying,
                ProcessingStatus = LapProcessingStatus.Processed, LapDistanceM = 7_000, MaxSpeedKmh = 280, LapStartedAt = DateTime.UtcNow,
            };
            Db.TelemetrySessions.Add(session);
            Db.TelemetryLaps.Add(lap);
            await Db.SaveChangesAsync();
            await Boards.OnLapProcessedAsync(lap.Id);
            return lap.Id;
        }

        public Task<SimLeaderboardService.Board?> BoardAsync(SimSource source, string track, string? car = null, string? cls = null) =>
            Boards.GetBoardAsync(new SimLeaderboardService.BoardQuery(source, track, car, cls, "all", 1, 50, null));
    }

    private static async Task<World> WorldAsync(string name)
    {
        var db = NewDb(name);
        await CatalogService.SeedAsync(db);
        return new World(db);
    }

    [Fact]
    public async Task Review_Lists_Provisional_Entries_With_Aliases_And_Lap_Counts()
    {
        var w = await WorldAsync(nameof(Review_Lists_Provisional_Entries_With_Aliases_And_Lap_Counts));
        var a = await w.DriverAsync("a");
        await w.LapAsync(a, 138_000, SimSource.IRacing, "163:grand prix pits", "132", "GT3 Class");
        await w.LapAsync(a, 137_500, SimSource.IRacing, "163:grand prix pits", "132", "GT3 Class");

        var review = await w.Admin.GetProvisionalAsync();

        var track = review.Tracks.Should().ContainSingle().Subject;
        track.Slug.Should().Be("iracing:163:grand prix pits");
        track.Aliases.Should().Equal(new CatalogAdminService.AliasRef("iracing", "163:grand prix pits"));
        track.LapCount.Should().Be(2);
        var car = review.Cars.Should().ContainSingle().Subject;
        car.ClassSlug.Should().Be("gt3");
        car.LapCount.Should().Be(2);
    }

    [Fact]
    public async Task Merging_IRacing_Spa_Moves_Its_Laps_Onto_The_Canonical_Spa_Board()
    {
        var w = await WorldAsync(nameof(Merging_IRacing_Spa_Moves_Its_Laps_Onto_The_Canonical_Spa_Board));
        var a = await w.DriverAsync("a");
        var b = await w.DriverAsync("b");
        await w.LapAsync(a, 138_000, SimSource.IRacing, "163:grand prix pits", "132", "GT3 Class");
        await w.LapAsync(b, 139_000, SimSource.IRacing, "163:grand prix pits", "132", "GT3 Class");
        (await w.BoardAsync(SimSource.IRacing, "spa", cls: "gt3"))!.Entries.Should().BeEmpty();

        var provisional = (await w.Admin.GetProvisionalAsync()).Tracks.Single();
        var result = await w.Admin.MergeTrackAsync(provisional.Id, "spa");

        result.Should().Be(new CatalogAdminService.MergeResult(CatalogAdminService.Outcome.Ok, AliasesMoved: 1, LapsMoved: 2));
        (await w.Db.TrackLayouts.AnyAsync(t => t.Id == provisional.Id)).Should().BeFalse();
        (await w.BoardAsync(SimSource.IRacing, "spa", cls: "gt3"))!.Entries.Select(e => e.Driver).Should().Equal("a", "b");
        (await w.BoardAsync(SimSource.IRacing, "iracing:163:grand prix pits")).Should().BeNull();

        // New laps on the same iRacing id now land on Spa directly, and ACC Spa stays its own board.
        var c = await w.DriverAsync("c");
        await w.LapAsync(c, 137_000, SimSource.IRacing, "163:grand prix pits", "132", "GT3 Class");
        (await w.BoardAsync(SimSource.IRacing, "spa", cls: "gt3"))!.Entries.First().Driver.Should().Be("c");
        (await w.BoardAsync(SimSource.Acc, "spa", cls: "gt3"))!.Entries.Should().BeEmpty();
    }

    [Fact]
    public async Task Merging_A_Car_Moves_Laps_And_Takes_The_Target_Class()
    {
        var w = await WorldAsync(nameof(Merging_A_Car_Moves_Laps_And_Takes_The_Target_Class));
        var a = await w.DriverAsync("a");
        await w.LapAsync(a, 138_000, SimSource.IRacing, "163:gp", "132");      // old Link: no class
        await w.LapAsync(a, 138_500, SimSource.IRacing, "163:gp", "999");
        var cars = (await w.Admin.GetProvisionalAsync()).Cars;
        var target = cars.Single(c => c.Slug == "iracing:132");
        var dupe = cars.Single(c => c.Slug == "iracing:999");
        (await w.Admin.ApproveCarAsync(target.Id, "bmw_m4_gt3", "BMW M4 GT3", "gt3")).Should().Be(CatalogAdminService.Outcome.Ok);

        (await w.Admin.MergeCarAsync(dupe.Id, "bmw_m4_gt3")).Outcome.Should().Be(CatalogAdminService.Outcome.Ok);

        (await w.Db.CarAliases.Where(x => x.Source == SimSource.IRacing).Select(x => x.Car.Slug).ToListAsync())
            .Should().AllBe("bmw_m4_gt3");
        var gt3 = await w.Db.CarClasses.FirstAsync(c => c.Slug == "gt3");
        (await w.Db.LapValidations.ToListAsync()).Should().OnlyContain(v => v.CarClassId == gt3.Id);
        (await w.Db.Cars.AnyAsync(c => c.Id == dupe.Id)).Should().BeFalse();
    }

    [Fact]
    public async Task Approve_Curates_Renames_And_Sets_Length_And_Class()
    {
        var w = await WorldAsync(nameof(Approve_Curates_Renames_And_Sets_Length_And_Class));
        var a = await w.DriverAsync("a");
        await w.LapAsync(a, 98_000, SimSource.IRacing, "47:full course", "67");
        var review = await w.Admin.GetProvisionalAsync();
        var track = review.Tracks.Single();
        var car = review.Cars.Single();

        (await w.Admin.ApproveTrackAsync(track.Id, "lime_rock", "Lime Rock Park", "United States", 2_460)).Should().Be(CatalogAdminService.Outcome.Ok);
        (await w.Admin.ApproveCarAsync(car.Id, null, "Global Mazda MX-5 Cup", "mx5")).Should().Be(CatalogAdminService.Outcome.Ok);

        var layout = await w.Db.TrackLayouts.FirstAsync(t => t.Id == track.Id);
        layout.Should().Match<TrackLayout>(t => t.Status == CatalogStatus.Curated && t.Slug == "lime_rock" && t.Name == "Lime Rock Park" && t.LengthM == 2_460);
        (await w.Db.Cars.Include(c => c.CarClass).FirstAsync(c => c.Id == car.Id)).CarClass!.Slug.Should().Be("mx5");
        (await w.Admin.GetProvisionalAsync()).Tracks.Should().BeEmpty();

        // The lap was 7 km on a 2.46 km layout: re-checked against the approved length.
        (await w.Db.LapValidations.SingleAsync()).Reasons.Should().Contain("distance_long");
        (await w.Admin.ApproveTrackAsync(track.Id, null, null, null, null)).Should().Be(CatalogAdminService.Outcome.NotProvisional);
    }

    [Fact]
    public async Task Merge_Refuses_Bad_Targets()
    {
        var w = await WorldAsync(nameof(Merge_Refuses_Bad_Targets));
        var a = await w.DriverAsync("a");
        await w.LapAsync(a, 138_000, SimSource.IRacing, "163:gp", "132");
        await w.LapAsync(a, 138_000, SimSource.IRacing, "164:gp", "133");
        var tracks = (await w.Admin.GetProvisionalAsync()).Tracks;

        (await w.Admin.MergeTrackAsync(tracks[0].Id, "nowhere")).Outcome.Should().Be(CatalogAdminService.Outcome.TargetNotFound);
        (await w.Admin.MergeTrackAsync(tracks[0].Id, tracks[1].Slug)).Outcome.Should().Be(CatalogAdminService.Outcome.TargetNotCurated);
        (await w.Admin.MergeTrackAsync(Guid.NewGuid(), "spa")).Outcome.Should().Be(CatalogAdminService.Outcome.NotFound);
        var spa = await w.Db.TrackLayouts.FirstAsync(t => t.Slug == "spa");
        (await w.Admin.MergeTrackAsync(spa.Id, "monza")).Outcome.Should().Be(CatalogAdminService.Outcome.NotProvisional);
    }

    // ── Authorization ─────────────────────────────────────────────────────────

    private static async Task<bool> AllowedAsync(string? role)
    {
        var services = new ServiceCollection().AddLogging().AddAuthorization().BuildServiceProvider();
        var attributes = typeof(AdminCatalogController).GetCustomAttributes<AuthorizeAttribute>(inherit: true);
        var policy = await AuthorizationPolicy.CombineAsync(services.GetRequiredService<IAuthorizationPolicyProvider>(), attributes);
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()) };
        if (role != null) claims.Add(new Claim(ClaimTypes.Role, role));
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        return (await services.GetRequiredService<IAuthorizationService>().AuthorizeAsync(user, policy!)).Succeeded;
    }

    [Fact]
    public async Task Catalog_Review_Is_Admin_Only()
    {
        (await AllowedAsync("ADMIN")).Should().BeTrue();
        (await AllowedAsync("USER")).Should().BeFalse();
        (await AllowedAsync(null)).Should().BeFalse();
        typeof(AdminCatalogController).GetMethods().Should()
            .NotContain(m => m.GetCustomAttributes<AllowAnonymousAttribute>().Any(), "no review endpoint may opt out of the admin policy");
    }
}
