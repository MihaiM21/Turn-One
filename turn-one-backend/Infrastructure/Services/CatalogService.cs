using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

/// <summary>
/// HCR-008 — canonical track layouts and cars across sims. <see cref="ResolveAsync"/> maps a session's
/// sim-native ids to catalog rows, creating provisional ones for ids it has never seen so an upload is
/// never blocked. <see cref="SeedAsync"/> installs the curated ACC and F1 aliases. iRacing ids are only
/// known from real sessions, so iRacing entries start provisional and an admin curates or merges them
/// (<see cref="CatalogAdminService"/>).
/// </summary>
public class CatalogService
{
    private readonly TurnOneDbContext _db;

    public CatalogService(TurnOneDbContext db)
    {
        _db = db;
    }

    public sealed record Resolved(Guid? TrackLayoutId, Guid? CarId, Guid? CarClassId);

    /// <param name="simCarClass">The sim's own class name for the car (v2 <c>car.class</c>), when it sends one.</param>
    public async Task<Resolved> ResolveAsync(SimSource source, string? simTrackId, string? trackName, float? lengthM, string? simCarId, string? carName, string? simCarClass = null)
    {
        Guid? layoutId = null, carId = null, classId = null;

        var trackKey = Normalize(simTrackId);
        if (trackKey != null)
        {
            var alias = await _db.TrackAliases.FirstOrDefaultAsync(a => a.Source == source && a.SimTrackId == trackKey);
            if (alias == null)
            {
                var layout = new TrackLayout
                {
                    Id = Guid.NewGuid(),
                    Slug = $"{SourceSlug(source)}:{trackKey}",
                    Name = string.IsNullOrWhiteSpace(trackName) ? trackKey : trackName.Trim(),
                    LengthM = lengthM is > 0 ? lengthM : null,
                    Status = CatalogStatus.Provisional,
                };
                alias = new TrackAlias { Id = Guid.NewGuid(), Source = source, SimTrackId = trackKey, TrackLayoutId = layout.Id };
                _db.TrackLayouts.Add(layout);
                _db.TrackAliases.Add(alias);
            }
            layoutId = alias.TrackLayoutId;
        }

        var carKey = Normalize(simCarId);
        if (carKey != null)
        {
            var alias = await _db.CarAliases.Include(a => a.Car).FirstOrDefaultAsync(a => a.Source == source && a.SimCarId == carKey);
            if (alias == null)
            {
                var carClass = await FindClassAsync(InferClass(source, carKey, simCarClass));
                var car = new Car
                {
                    Id = Guid.NewGuid(),
                    Slug = $"{SourceSlug(source)}:{carKey}",
                    Name = string.IsNullOrWhiteSpace(carName) ? carKey : carName.Trim(),
                    CarClassId = carClass?.Id,
                    Status = CatalogStatus.Provisional,
                };
                alias = new CarAlias { Id = Guid.NewGuid(), Source = source, SimCarId = carKey, CarId = car.Id, Car = car };
                _db.Cars.Add(car);
                _db.CarAliases.Add(alias);
            }
            else if (alias.Car.CarClassId == null && alias.Car.Status == CatalogStatus.Provisional
                     && await FindClassAsync(InferClass(source, carKey, simCarClass)) is { } lateClass)
            {
                // First seen from a Link build that didn't send car.class; fill it in now. Curated cars are left alone.
                alias.Car.CarClassId = lateClass.Id;
            }
            carId = alias.CarId;
            classId = alias.Car.CarClassId;
        }

        await _db.SaveChangesAsync();
        return new Resolved(layoutId, carId, classId);
    }

    private async Task<CarClass?> FindClassAsync(string? slug) =>
        slug == null ? null : await _db.CarClasses.FirstOrDefaultAsync(c => c.Slug == slug);

    /// <summary>
    /// The class a car most likely races in. F1 and ACC from the sim id; other sims (iRacing ids are
    /// numeric) from the class name the sim reports (<paramref name="simCarClass"/>). Null when we can't tell.
    /// </summary>
    public static string? InferClass(SimSource source, string simCarId, string? simCarClass = null)
    {
        if (source is SimSource.F1_25 or SimSource.F1_26) return "f1";
        if (source != SimSource.Acc) return ClassFromName(simCarClass);

        var id = simCarId.ToLowerInvariant();
        if (id.Contains("gt4")) return "gt4";
        if (id.Contains("gt2")) return "gt2";
        if (id.Contains("m2_cs")) return "tcx";
        if (id.Contains("cup") || id.Contains("_st_") || id.EndsWith("_st") || id.Contains("challenge") || id.Contains("supertrofeo")) return "gtc";
        return "gt3"; // most of ACC's roster
    }

    /// <summary>
    /// Maps a sim's class name to a <see cref="CarClass"/> slug. Written for iRacing's
    /// <c>CarClassShortName</c> ("GT3 Class", "GTP", "LMP2", "PCup", "MX5 Cup", "SF23", "F4"...), tolerant of
    /// case, spaces, dashes and a trailing "Class". Unknown names -> null (the admin sets it on approve).
    /// </summary>
    public static string? ClassFromName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;
        var n = new string(name.ToLowerInvariant().Where(char.IsLetterOrDigit).ToArray());
        if (n.EndsWith("class") && n.Length > 5) n = n[..^5];

        if (n is "pcup" or "porschecup" || n.Contains("gt3cup") || n.Contains("911cup") || n.Contains("992cup") || n.Contains("supercup")) return "gtc";
        if (n.Contains("gtp") || n.Contains("hypercar") || n.Contains("lmdh") || n.Contains("lmh")) return "gtp";
        if (n.Contains("lmp2")) return "lmp2";
        if (n.Contains("lmp3")) return "lmp3";
        if (n.Contains("gt3")) return "gt3";
        if (n.Contains("gt4")) return "gt4";
        if (n.Contains("tcr")) return "tcr";
        if (n.Contains("mx5") || n.Contains("miata")) return "mx5";
        if (n is "sf" or "sf23" or "sf19" || (n.StartsWith("superformula") && !n.Contains("lights"))) return "super_formula";
        if (n.StartsWith("f4") || n.StartsWith("formula4") || n.StartsWith("fiaf4")) return "f4";
        return null;
    }

    private static string? Normalize(string? id) =>
        string.IsNullOrWhiteSpace(id) ? null : id.Trim().ToLowerInvariant();

    public static string SourceSlug(SimSource source) => source switch
    {
        SimSource.Acc => "acc",
        SimSource.Ac => "ac",
        SimSource.IRacing => "iracing",
        SimSource.F1_25 => "f1_25",
        SimSource.F1_26 => "f1_26",
        _ => source.ToString().ToLowerInvariant(),
    };

    public static SimSource? ParseSource(string? slug) => slug?.ToLowerInvariant() switch
    {
        "acc" => SimSource.Acc,
        "ac" => SimSource.Ac,
        "iracing" => SimSource.IRacing,
        "f1_25" or "f125" => SimSource.F1_25,
        "f1_26" or "f126" => SimSource.F1_26,
        _ => null,
    };

    // ── Seed ─────────────────────────────────────────────────────────────────

    private static readonly (string Slug, string Name)[] Classes =
    {
        ("gt3", "GT3"), ("gt4", "GT4"), ("gt2", "GT2"), ("gtc", "GTC / Cup"), ("tcx", "TCX"), ("f1", "Formula 1"),
        ("gtp", "GTP / Hypercar"), ("lmp2", "LMP2"), ("lmp3", "LMP3"), ("tcr", "TCR"), ("mx5", "MX-5 Cup"),
        ("super_formula", "Super Formula"), ("f4", "Formula 4"),
    };

    /// <summary>
    /// iRacing aliases (sim track id "<c>TrackID:TrackConfigName</c>", lower-case) -> curated layout slug. Left
    /// empty on purpose: iRacing's official id list needs a member OAuth Data API, so entries are taken from
    /// real sessions and normally added through the admin Catalog review (merge) instead of here.
    /// </summary>
    private static readonly (string SimTrackId, string LayoutSlug)[] IRacingTracks =
    {
        // ("163:grand prix pits", "spa"),   // example shape: Spa-Francorchamps GP Pits; verify the id from a real session
    };

    /// <summary>iRacing CarID -> curated car slug. Empty for the same reason as <see cref="IRacingTracks"/>.</summary>
    private static readonly (string SimCarId, string CarSlug)[] IRacingCars =
    {
        // ("132", "bmw_m4_gt3"),   // example shape: verify the CarID from a real session
    };

    /// <summary>(layout slug, name, country, length m, ACC id, F1 id).</summary>
    private static readonly (string Slug, string Name, string? Country, float? Length, string? Acc, string? F1)[] Layouts =
    {
        ("monza", "Monza", "Italy", 5793, "monza", "monza"),
        ("spa", "Spa-Francorchamps", "Belgium", 7004, "spa", "spa"),
        ("silverstone", "Silverstone", "United Kingdom", 5891, "silverstone", "silverstone"),
        ("paul_ricard", "Paul Ricard", "France", 5842, "paul_ricard", "paul_ricard"),
        ("barcelona", "Barcelona-Catalunya", "Spain", 4655, "barcelona", "catalunya"),
        ("hungaroring", "Hungaroring", "Hungary", 4381, "hungaroring", "hungaroring"),
        ("zandvoort", "Zandvoort", "Netherlands", 4259, "zandvoort", "zandvoort"),
        ("suzuka", "Suzuka", "Japan", 5807, "suzuka", "suzuka"),
        ("imola", "Imola", "Italy", 4909, "imola", "imola"),
        ("cota", "Circuit of the Americas", "United States", 5513, "cota", "texas"),
        ("red_bull_ring", "Red Bull Ring", "Austria", 4318, "red_bull_ring", "austria"),
        ("zolder", "Zolder", "Belgium", 4011, "zolder", null),
        ("brands_hatch", "Brands Hatch", "United Kingdom", 3908, "brands_hatch", null),
        ("misano", "Misano", "Italy", 4226, "misano", null),
        ("nurburgring", "Nürburgring GP", "Germany", 5137, "nurburgring", null),
        ("nurburgring_24h", "Nürburgring 24h", "Germany", 25378, "nurburgring_24h", null),
        ("kyalami", "Kyalami", "South Africa", 4522, "kyalami", null),
        ("mount_panorama", "Mount Panorama (Bathurst)", "Australia", 6213, "mount_panorama", null),
        ("laguna_seca", "Laguna Seca", "United States", 3602, "laguna_seca", null),
        ("oulton_park", "Oulton Park", "United Kingdom", 4307, "oulton_park", null),
        ("donington", "Donington Park", "United Kingdom", 4020, "donington", null),
        ("snetterton", "Snetterton", "United Kingdom", 4779, "snetterton", null),
        ("indianapolis", "Indianapolis", "United States", 3925, "indianapolis", null),
        ("watkins_glen", "Watkins Glen", "United States", 5552, "watkins_glen", null),
        ("valencia", "Valencia", "Spain", 4005, "valencia", null),
        ("melbourne", "Melbourne", "Australia", 5278, null, "melbourne"),
        ("shanghai", "Shanghai", "China", 5451, null, "shanghai"),
        ("sakhir", "Bahrain (Sakhir)", "Bahrain", 5412, null, "sakhir"),
        ("monaco", "Monaco", "Monaco", 3337, null, "monaco"),
        ("montreal", "Montreal", "Canada", 4361, null, "montreal"),
        ("hockenheim", "Hockenheim", "Germany", 4574, null, "hockenheim"),
        ("singapore", "Singapore", "Singapore", 4940, null, "singapore"),
        ("abu_dhabi", "Yas Marina", "United Arab Emirates", 5281, null, "abu_dhabi"),
        ("interlagos", "Interlagos", "Brazil", 4309, null, "brazil"),
        ("mexico", "Mexico City", "Mexico", 4304, null, "mexico"),
        ("baku", "Baku", "Azerbaijan", 6003, null, "baku"),
        ("portimao", "Portimão", "Portugal", 4653, null, "portimao"),
        ("jeddah", "Jeddah", "Saudi Arabia", 6174, null, "jeddah"),
        ("miami", "Miami", "United States", 5412, null, "miami"),
        ("las_vegas", "Las Vegas", "United States", 6201, null, "las_vegas"),
        ("losail", "Lusail", "Qatar", 5419, null, "losail"),
        ("sakhir_short", "Bahrain Short", "Bahrain", null, null, "sakhir_short"),
        ("silverstone_short", "Silverstone Short", "United Kingdom", null, null, "silverstone_short"),
        ("cota_short", "COTA Short", "United States", null, null, "texas_short"),
        ("suzuka_short", "Suzuka Short", "Japan", null, null, "suzuka_short"),
        ("silverstone_reverse", "Silverstone Reverse", "United Kingdom", null, null, "silverstone_reverse"),
        ("red_bull_ring_reverse", "Red Bull Ring Reverse", "Austria", null, null, "austria_reverse"),
        ("zandvoort_reverse", "Zandvoort Reverse", "Netherlands", null, null, "zandvoort_reverse"),
    };

    /// <summary>Idempotent: adds what is missing, never changes what an admin edited.</summary>
    public static async Task SeedAsync(TurnOneDbContext db)
    {
        foreach (var (slug, name) in Classes)
        {
            if (!await db.CarClasses.AnyAsync(c => c.Slug == slug))
                db.CarClasses.Add(new CarClass { Id = Guid.NewGuid(), Slug = slug, Name = name });
        }

        foreach (var l in Layouts)
        {
            var layout = await db.TrackLayouts.FirstOrDefaultAsync(t => t.Slug == l.Slug);
            if (layout == null)
            {
                layout = new TrackLayout { Id = Guid.NewGuid(), Slug = l.Slug, Name = l.Name, Country = l.Country, LengthM = l.Length, Status = CatalogStatus.Curated };
                db.TrackLayouts.Add(layout);
            }

            foreach (var (source, simId) in new[] { (SimSource.Acc, l.Acc), (SimSource.F1_25, l.F1), (SimSource.F1_26, l.F1) })
            {
                if (simId == null) continue;
                if (!await db.TrackAliases.AnyAsync(a => a.Source == source && a.SimTrackId == simId))
                    db.TrackAliases.Add(new TrackAlias { Id = Guid.NewGuid(), Source = source, SimTrackId = simId, TrackLayoutId = layout.Id });
            }
        }
        await db.SaveChangesAsync();

        foreach (var (simId, layoutSlug) in IRacingTracks)
        {
            var layout = await db.TrackLayouts.FirstOrDefaultAsync(t => t.Slug == layoutSlug);
            if (layout != null && !await db.TrackAliases.AnyAsync(a => a.Source == SimSource.IRacing && a.SimTrackId == simId))
                db.TrackAliases.Add(new TrackAlias { Id = Guid.NewGuid(), Source = SimSource.IRacing, SimTrackId = simId, TrackLayoutId = layout.Id });
        }
        foreach (var (simId, carSlug) in IRacingCars)
        {
            var car = await db.Cars.FirstOrDefaultAsync(c => c.Slug == carSlug);
            if (car != null && !await db.CarAliases.AnyAsync(a => a.Source == SimSource.IRacing && a.SimCarId == simId))
                db.CarAliases.Add(new CarAlias { Id = Guid.NewGuid(), Source = SimSource.IRacing, SimCarId = simId, CarId = car.Id });
        }

        await db.SaveChangesAsync();
    }
}
