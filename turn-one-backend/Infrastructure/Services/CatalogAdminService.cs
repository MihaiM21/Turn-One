using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

/// <summary>
/// HCR-008/009 admin "Catalog review". Sims we have no curated aliases for (iRacing today) create
/// provisional track layouts and cars on first sight; an admin either approves one as it is (optionally
/// renaming it) or merges it into an existing curated entry, which repoints the alias and the laps
/// already filed under it so they join that board.
/// </summary>
public class CatalogAdminService
{
    private readonly TurnOneDbContext _db;
    private readonly SimLeaderboardService _boards;

    public CatalogAdminService(TurnOneDbContext db, SimLeaderboardService boards)
    {
        _db = db;
        _boards = boards;
    }

    public sealed record AliasRef(string Source, string SimId);

    public sealed record ProvisionalTrack(Guid Id, string Slug, string Name, string? Country, float? LengthM, List<AliasRef> Aliases, int LapCount);

    public sealed record ProvisionalCar(Guid Id, string Slug, string Name, string? ClassSlug, List<AliasRef> Aliases, int LapCount);

    public sealed record Review(List<ProvisionalTrack> Tracks, List<ProvisionalCar> Cars);

    public enum Outcome { Ok, NotFound, NotProvisional, TargetNotFound, TargetNotCurated, SameEntry, SlugTaken, UnknownClass }

    public sealed record MergeResult(Outcome Outcome, int AliasesMoved = 0, int LapsMoved = 0);

    public async Task<Review> GetProvisionalAsync()
    {
        var layouts = await _db.TrackLayouts.AsNoTracking().Where(t => t.Status == CatalogStatus.Provisional).OrderBy(t => t.Name).ToListAsync();
        var layoutIds = layouts.Select(l => l.Id).ToList();
        var trackAliases = await _db.TrackAliases.AsNoTracking().Where(a => layoutIds.Contains(a.TrackLayoutId)).ToListAsync();
        var trackLaps = await _db.LapValidations.AsNoTracking()
            .Where(v => v.TrackLayoutId != null && layoutIds.Contains(v.TrackLayoutId.Value))
            .GroupBy(v => v.TrackLayoutId!.Value).Select(g => new { Id = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.Id, g => g.Count);

        var cars = await _db.Cars.AsNoTracking().Include(c => c.CarClass).Where(c => c.Status == CatalogStatus.Provisional).OrderBy(c => c.Name).ToListAsync();
        var carIds = cars.Select(c => c.Id).ToList();
        var carAliases = await _db.CarAliases.AsNoTracking().Where(a => carIds.Contains(a.CarId)).ToListAsync();
        var carLaps = await _db.LapValidations.AsNoTracking()
            .Where(v => v.CarId != null && carIds.Contains(v.CarId.Value))
            .GroupBy(v => v.CarId!.Value).Select(g => new { Id = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.Id, g => g.Count);

        return new Review(
            layouts.Select(l => new ProvisionalTrack(l.Id, l.Slug, l.Name, l.Country, l.LengthM,
                trackAliases.Where(a => a.TrackLayoutId == l.Id).Select(a => new AliasRef(CatalogService.SourceSlug(a.Source), a.SimTrackId)).ToList(),
                trackLaps.GetValueOrDefault(l.Id))).ToList(),
            cars.Select(c => new ProvisionalCar(c.Id, c.Slug, c.Name, c.CarClass?.Slug,
                carAliases.Where(a => a.CarId == c.Id).Select(a => new AliasRef(CatalogService.SourceSlug(a.Source), a.SimCarId)).ToList(),
                carLaps.GetValueOrDefault(c.Id))).ToList());
    }

    // ── Approve ───────────────────────────────────────────────────────────────

    public async Task<Outcome> ApproveTrackAsync(Guid id, string? slug, string? name, string? country, float? lengthM)
    {
        var layout = await _db.TrackLayouts.FirstOrDefaultAsync(t => t.Id == id);
        if (layout == null) return Outcome.NotFound;
        if (layout.Status != CatalogStatus.Provisional) return Outcome.NotProvisional;

        if (CleanSlug(slug) is { } newSlug && newSlug != layout.Slug)
        {
            if (await _db.TrackLayouts.AnyAsync(t => t.Slug == newSlug)) return Outcome.SlugTaken;
            layout.Slug = newSlug;
        }
        if (!string.IsNullOrWhiteSpace(name)) layout.Name = name.Trim();
        if (!string.IsNullOrWhiteSpace(country)) layout.Country = country.Trim();
        var lengthChanged = lengthM is > 0 && lengthM != layout.LengthM;
        if (lengthM is > 0) layout.LengthM = lengthM;
        layout.Status = CatalogStatus.Curated;
        await _db.SaveChangesAsync();

        // The distance checks use the layout length; re-check laps filed under it.
        if (lengthChanged) await _boards.RevalidateAsync(await LapsOnTrackAsync(id));
        return Outcome.Ok;
    }

    public async Task<Outcome> ApproveCarAsync(Guid id, string? slug, string? name, string? classSlug)
    {
        var car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == id);
        if (car == null) return Outcome.NotFound;
        if (car.Status != CatalogStatus.Provisional) return Outcome.NotProvisional;

        if (CleanSlug(slug) is { } newSlug && newSlug != car.Slug)
        {
            if (await _db.Cars.AnyAsync(c => c.Slug == newSlug)) return Outcome.SlugTaken;
            car.Slug = newSlug;
        }
        if (!string.IsNullOrWhiteSpace(classSlug))
        {
            var cls = await _db.CarClasses.FirstOrDefaultAsync(c => c.Slug == classSlug.Trim().ToLowerInvariant());
            if (cls == null) return Outcome.UnknownClass;
            car.CarClassId = cls.Id;
        }
        if (!string.IsNullOrWhiteSpace(name)) car.Name = name.Trim();
        car.Status = CatalogStatus.Curated;

        // Class boards read the class off each lap's row.
        await _db.LapValidations.Where(v => v.CarId == id).ForEachAsync(v => v.CarClassId = car.CarClassId);
        await _db.SaveChangesAsync();
        return Outcome.Ok;
    }

    // ── Merge ─────────────────────────────────────────────────────────────────

    /// <summary>Moves a provisional layout's aliases and laps onto a curated one, then deletes the provisional row.</summary>
    public async Task<MergeResult> MergeTrackAsync(Guid id, string targetSlug)
    {
        var layout = await _db.TrackLayouts.FirstOrDefaultAsync(t => t.Id == id);
        if (layout == null) return new(Outcome.NotFound);
        if (layout.Status != CatalogStatus.Provisional) return new(Outcome.NotProvisional);
        var target = await _db.TrackLayouts.FirstOrDefaultAsync(t => t.Slug == targetSlug.Trim().ToLowerInvariant());
        if (target == null) return new(Outcome.TargetNotFound);
        if (target.Id == layout.Id) return new(Outcome.SameEntry);
        if (target.Status != CatalogStatus.Curated) return new(Outcome.TargetNotCurated);

        var aliases = await _db.TrackAliases.Where(a => a.TrackLayoutId == id).ToListAsync();
        foreach (var a in aliases) a.TrackLayoutId = target.Id;
        var laps = await _db.LapValidations.Where(v => v.TrackLayoutId == id).ToListAsync();
        foreach (var v in laps) v.TrackLayoutId = target.Id;
        await _db.SaveChangesAsync();

        _db.TrackLayouts.Remove(layout);
        await _db.SaveChangesAsync();

        // Re-check against the canonical length, and pick up any lap of this alias that was never validated.
        await _boards.RevalidateAsync(laps.Select(v => v.LapId).ToList());
        await _boards.BackfillAsync();
        return new(Outcome.Ok, aliases.Count, laps.Count);
    }

    /// <summary>Moves a provisional car's aliases and laps onto a curated one (taking its class), then deletes the provisional row.</summary>
    public async Task<MergeResult> MergeCarAsync(Guid id, string targetSlug)
    {
        var car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == id);
        if (car == null) return new(Outcome.NotFound);
        if (car.Status != CatalogStatus.Provisional) return new(Outcome.NotProvisional);
        var target = await _db.Cars.FirstOrDefaultAsync(c => c.Slug == targetSlug.Trim().ToLowerInvariant());
        if (target == null) return new(Outcome.TargetNotFound);
        if (target.Id == car.Id) return new(Outcome.SameEntry);
        if (target.Status != CatalogStatus.Curated) return new(Outcome.TargetNotCurated);

        var aliases = await _db.CarAliases.Where(a => a.CarId == id).ToListAsync();
        foreach (var a in aliases) a.CarId = target.Id;
        var laps = await _db.LapValidations.Where(v => v.CarId == id).ToListAsync();
        foreach (var v in laps)
        {
            v.CarId = target.Id;
            v.CarClassId = target.CarClassId;
        }
        await _db.SaveChangesAsync();

        _db.Cars.Remove(car);
        await _db.SaveChangesAsync();

        await _boards.RevalidateAsync(laps.Select(v => v.LapId).ToList());
        await _boards.BackfillAsync();
        return new(Outcome.Ok, aliases.Count, laps.Count);
    }

    private async Task<List<Guid>> LapsOnTrackAsync(Guid layoutId) =>
        await _db.LapValidations.Where(v => v.TrackLayoutId == layoutId).Select(v => v.LapId).ToListAsync();

    /// <summary>Lower-case a-z 0-9 and <c>_ - : /</c>, at most 80 chars; null when nothing usable is left.</summary>
    public static string? CleanSlug(string? slug)
    {
        if (string.IsNullOrWhiteSpace(slug)) return null;
        var s = new string(slug.Trim().ToLowerInvariant().Select(ch => char.IsWhiteSpace(ch) ? '_' : ch)
            .Where(ch => ch is (>= 'a' and <= 'z') or (>= '0' and <= '9') or '_' or '-' or ':' or '/').ToArray());
        if (s.Length > 80) s = s[..80];
        return s.Length == 0 ? null : s;
    }
}
