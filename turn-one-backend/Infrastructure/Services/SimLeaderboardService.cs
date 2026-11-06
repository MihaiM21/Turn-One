using Application.Telemetry;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

/// <summary>
/// HCR-009 — sim-racing lap-time leaderboards (the existing <c>LeaderboardService</c> is predictions
/// and trivia). Validates each processed lap (<see cref="LapValidator"/>), files it under its board
/// (sim × track layout × car / class) and answers board queries: the best eligible lap per driver for
/// a period. Respects each driver's leaderboard visibility.
/// </summary>
public class SimLeaderboardService
{
    private readonly TurnOneDbContext _db;
    private readonly CatalogService _catalog;

    public SimLeaderboardService(TurnOneDbContext db, CatalogService catalog)
    {
        _db = db;
        _catalog = catalog;
    }

    // ── Write side ────────────────────────────────────────────────────────────

    /// <summary>Called after the lap processor; safe to call again (reprocessing, backfill).</summary>
    public async Task<LapValidation?> OnLapProcessedAsync(Guid lapId)
    {
        var lap = await _db.TelemetryLaps.Include(l => l.Session).FirstOrDefaultAsync(l => l.Id == lapId);
        if (lap == null) return null;

        CatalogService.Resolved ids;
        try
        {
            ids = await ResolveAsync(lap.Session);
        }
        catch (DbUpdateException)
        {
            // Another lap created the same provisional catalog entry at the same moment; it exists now.
            _db.ChangeTracker.Clear();
            lap = await _db.TelemetryLaps.Include(l => l.Session).FirstAsync(l => l.Id == lapId);
            ids = await ResolveAsync(lap.Session);
        }

        var layoutLength = ids.TrackLayoutId is { } layoutId
            ? await _db.TrackLayouts.Where(t => t.Id == layoutId).Select(t => t.LengthM).FirstOrDefaultAsync()
            : null;

        var reasons = LapValidator.Check(new LapValidationInput(
            lap.ProcessingStatus, lap.Kind, lap.IsValid, lap.LapTimeMs, lap.SectorsMs,
            lap.LapDistanceM, layoutLength ?? lap.Session.TrackLengthM, lap.MaxSpeedKmh)).ToList();
        if (ids.TrackLayoutId == null) reasons.Add("unknown_track");
        if (ids.CarId == null) reasons.Add("unknown_car");

        var row = await _db.LapValidations.FirstOrDefaultAsync(v => v.LapId == lapId);
        if (row?.Reasons.Contains("excluded_by_admin") == true) reasons.Add("excluded_by_admin");

        row ??= _db.LapValidations.Add(new LapValidation { Id = Guid.NewGuid(), LapId = lapId }).Entity;
        row.UserId = lap.Session.UserId;
        row.Source = lap.Session.Source;
        row.TrackLayoutId = ids.TrackLayoutId;
        row.CarId = ids.CarId;
        row.CarClassId = ids.CarClassId;
        row.ConditionKey = "all";
        row.LapTimeMs = lap.LapTimeMs;
        row.RecordedAt = lap.LapStartedAt ?? lap.RecordedAt;
        row.Eligible = reasons.Count == 0;
        row.Reasons = string.Join(",", reasons.Distinct());
        row.ValidatorVersion = LapValidator.Version;
        row.CheckedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return row;
    }

    private Task<CatalogService.Resolved> ResolveAsync(TelemetrySession s) =>
        _catalog.ResolveAsync(s.Source, s.TrackId, s.Track, s.TrackLengthM, s.CarId ?? s.CarModel, s.CarModel);

    public async Task<bool> ExcludeAsync(Guid lapId)
    {
        var row = await _db.LapValidations.FirstOrDefaultAsync(v => v.LapId == lapId);
        if (row == null) return false;
        row.Eligible = false;
        row.Reasons = string.Join(",", row.Reasons.Split(',', StringSplitOptions.RemoveEmptyEntries).Append("excluded_by_admin").Distinct());
        await _db.SaveChangesAsync();
        return true;
    }

    /// <summary>Validates processed laps that have no validation row yet (rollout of this feature).</summary>
    public async Task<int> BackfillAsync(int max = 5000)
    {
        var ids = await _db.TelemetryLaps
            .Where(l => l.ProcessingStatus == LapProcessingStatus.Processed && !_db.LapValidations.Any(v => v.LapId == l.Id))
            .Select(l => l.Id).Take(max).ToListAsync();
        foreach (var id in ids) await OnLapProcessedAsync(id);
        return ids.Count;
    }

    public async Task SetVisibilityAsync(Guid userId, LeaderboardVisibility visibility)
    {
        var simUser = await _db.SimUsers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (simUser == null)
        {
            simUser = new SimUser { Id = Guid.NewGuid(), UserId = userId };
            _db.SimUsers.Add(simUser);
        }
        simUser.LeaderboardVisibility = visibility;
        await _db.SaveChangesAsync();
    }

    // ── Read side ─────────────────────────────────────────────────────────────

    public sealed record BoardQuery(SimSource Source, string TrackSlug, string? CarSlug, string? ClassSlug, string Period, int Page, int Size, Guid? ViewerId);

    public sealed record BoardEntry(int Rank, string Driver, string? AvatarUrl, bool IsViewer, Guid LapId, int LapTimeMs, int?[] SectorsMs, int GapMs, DateTime SetAt);

    public sealed record Board(string TrackSlug, string TrackName, string? CarSlug, string? CarName, string? ClassSlug, int Total, List<BoardEntry> Entries, BoardEntry? Me);

    public static DateTime? PeriodStart(string period, DateTime now) => period switch
    {
        "week" => now.AddDays(-7),
        "month" => now.AddDays(-30),
        _ => null,
    };

    public async Task<Board?> GetBoardAsync(BoardQuery q)
    {
        var layout = await _db.TrackLayouts.AsNoTracking().FirstOrDefaultAsync(t => t.Slug == q.TrackSlug);
        if (layout == null) return null;

        Car? car = null;
        CarClass? carClass = null;
        if (q.CarSlug != null)
        {
            car = await _db.Cars.AsNoTracking().FirstOrDefaultAsync(c => c.Slug == q.CarSlug);
            if (car == null) return null;
        }
        else if (q.ClassSlug != null)
        {
            carClass = await _db.CarClasses.AsNoTracking().FirstOrDefaultAsync(c => c.Slug == q.ClassSlug);
            if (carClass == null) return null;
        }

        var rows = _db.LapValidations.AsNoTracking()
            .Where(v => v.Eligible && v.Source == q.Source && v.TrackLayoutId == layout.Id && v.LapTimeMs != null);
        if (car != null) rows = rows.Where(v => v.CarId == car.Id);
        if (carClass != null) rows = rows.Where(v => v.CarClassId == carClass.Id);
        if (PeriodStart(q.Period, DateTime.UtcNow) is { } from) rows = rows.Where(v => v.RecordedAt >= from);

        // Best eligible lap per driver.
        var best = await rows
            .GroupBy(v => v.UserId)
            .Select(g => g.OrderBy(v => v.LapTimeMs).ThenBy(v => v.RecordedAt).First())
            .ToListAsync();

        var userIds = best.Select(b => b.UserId).ToList();
        var people = await _db.Users.AsNoTracking().Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Username, u.AvatarUrl }).ToDictionaryAsync(u => u.Id);
        var visibility = await _db.SimUsers.AsNoTracking().Where(s => userIds.Contains(s.UserId))
            .ToDictionaryAsync(s => s.UserId, s => s.LeaderboardVisibility);
        var lapIds = best.Select(b => b.LapId).ToList();
        var sectors = await _db.TelemetryLaps.AsNoTracking().Where(l => lapIds.Contains(l.Id))
            .Select(l => new { l.Id, l.Sector1Ms, l.Sector2Ms, l.Sector3Ms }).ToDictionaryAsync(l => l.Id);

        var ordered = best.OrderBy(b => b.LapTimeMs).ThenBy(b => b.RecordedAt).ToList();

        // Hidden drivers don't appear publicly and don't push others down; they still see their own rank.
        var publicRows = ordered.Where(b => visibility.GetValueOrDefault(b.UserId) != LeaderboardVisibility.Hidden).ToList();
        var leader = publicRows.FirstOrDefault()?.LapTimeMs ?? 0;

        BoardEntry ToEntry(LapValidation v, int rank)
        {
            var vis = visibility.GetValueOrDefault(v.UserId, LeaderboardVisibility.Public);
            var person = people.GetValueOrDefault(v.UserId);
            var isViewer = v.UserId == q.ViewerId;
            var name = vis == LeaderboardVisibility.Public || isViewer ? person?.Username ?? "Driver" : AnonymousName(v.UserId);
            var s = sectors.GetValueOrDefault(v.LapId);
            return new BoardEntry(rank, name, vis == LeaderboardVisibility.Public ? person?.AvatarUrl : null, isViewer,
                v.LapId, v.LapTimeMs!.Value, new[] { s?.Sector1Ms, s?.Sector2Ms, s?.Sector3Ms }, v.LapTimeMs.Value - leader, v.RecordedAt);
        }

        var page = publicRows.Skip((q.Page - 1) * q.Size).Take(q.Size)
            .Select((v, i) => ToEntry(v, (q.Page - 1) * q.Size + i + 1)).ToList();

        BoardEntry? me = null;
        if (q.ViewerId is { } viewer && ordered.FirstOrDefault(b => b.UserId == viewer) is { } mine)
        {
            var rank = publicRows.Count(b => b.UserId != viewer && b.LapTimeMs < mine.LapTimeMs) + 1;
            me = ToEntry(mine, rank);
        }

        return new Board(layout.Slug, layout.Name, car?.Slug, car?.Name, carClass?.Slug, publicRows.Count, page, me);
    }

    public sealed record PersonalBest(string Source, string TrackSlug, string TrackName, string? CarSlug, string? CarName, Guid LapId, int LapTimeMs, int Rank, int Total);

    public async Task<List<PersonalBest>?> GetPersonalBestsAsync(string username, Guid? viewerId)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return null;
        var vis = await _db.SimUsers.AsNoTracking().Where(s => s.UserId == user.Id).Select(s => s.LeaderboardVisibility).FirstOrDefaultAsync();
        if (vis != LeaderboardVisibility.Public && viewerId != user.Id) return new List<PersonalBest>();

        var mine = await _db.LapValidations.AsNoTracking()
            .Where(v => v.UserId == user.Id && v.Eligible && v.LapTimeMs != null && v.TrackLayoutId != null && v.CarId != null)
            .GroupBy(v => new { v.Source, v.TrackLayoutId, v.CarId })
            .Select(g => g.OrderBy(v => v.LapTimeMs).First())
            .ToListAsync();

        var result = new List<PersonalBest>();
        foreach (var pb in mine)
        {
            var layout = await _db.TrackLayouts.AsNoTracking().FirstAsync(t => t.Id == pb.TrackLayoutId);
            var car = await _db.Cars.AsNoTracking().FirstAsync(c => c.Id == pb.CarId);
            var board = await GetBoardAsync(new BoardQuery(pb.Source, layout.Slug, car.Slug, null, "all", 1, 1, user.Id));
            result.Add(new PersonalBest(CatalogService.SourceSlug(pb.Source), layout.Slug, layout.Name, car.Slug, car.Name,
                pb.LapId, pb.LapTimeMs!.Value, board?.Me?.Rank ?? 0, board?.Total ?? 0));
        }
        return result.OrderBy(r => r.TrackName).ToList();
    }

    public async Task<LapValidation?> GetValidationAsync(Guid lapId) =>
        await _db.LapValidations.AsNoTracking().FirstOrDefaultAsync(v => v.LapId == lapId);

    /// <summary>Stable per user, reveals nothing about the account.</summary>
    public static string AnonymousName(Guid userId) =>
        $"Anonymous driver #{Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(userId.ToByteArray()))[..4]}";
}
