using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Domain.Entities;

public enum CatalogStatus { Provisional = 0, Curated = 1 }

/// <summary>
/// A canonical track layout (HCR-008), e.g. "spa" or "silverstone_short". Sims name the same layout
/// differently; <see cref="TrackAlias"/> maps each sim's id here. Unknown sim ids get a provisional
/// layout of their own (slug "<c>source:simId</c>") until an admin curates it — never a guessed merge.
/// </summary>
public class TrackLayout
{
    [Key]
    public Guid Id { get; set; }

    [Required, MaxLength(80)]
    public string Slug { get; set; } = "";

    [Required, MaxLength(120)]
    public string Name { get; set; } = "";

    [MaxLength(60)]
    public string? Country { get; set; }

    public float? LengthM { get; set; }

    public CatalogStatus Status { get; set; } = CatalogStatus.Provisional;
}

public class TrackAlias
{
    [Key]
    public Guid Id { get; set; }

    public SimSource Source { get; set; }

    /// <summary>Sim-native track id, lower-case (ACC "spa", F1 "spa", iRacing "spa/gp").</summary>
    [Required, MaxLength(120)]
    public string SimTrackId { get; set; } = "";

    public Guid TrackLayoutId { get; set; }
    public TrackLayout TrackLayout { get; set; } = null!;
}

public class CarClass
{
    [Key]
    public Guid Id { get; set; }

    [Required, MaxLength(40)]
    public string Slug { get; set; } = "";

    [Required, MaxLength(80)]
    public string Name { get; set; } = "";
}

public class Car
{
    [Key]
    public Guid Id { get; set; }

    [Required, MaxLength(120)]
    public string Slug { get; set; } = "";

    [Required, MaxLength(120)]
    public string Name { get; set; } = "";

    public Guid? CarClassId { get; set; }
    public CarClass? CarClass { get; set; }

    public CatalogStatus Status { get; set; } = CatalogStatus.Provisional;
}

public class CarAlias
{
    [Key]
    public Guid Id { get; set; }

    public SimSource Source { get; set; }

    [Required, MaxLength(120)]
    public string SimCarId { get; set; } = "";

    public Guid CarId { get; set; }
    public Car Car { get; set; } = null!;
}

/// <summary>
/// HCR-009 — one row per processed lap: which board it belongs to (sim × layout × car, plus the car's
/// class for class boards), whether it is leaderboard-eligible and why not. Boards are "best eligible
/// lap per driver" queries over this table, for any period.
/// </summary>
public class LapValidation
{
    [Key]
    public Guid Id { get; set; }

    public Guid LapId { get; set; }
    public TelemetryLap Lap { get; set; } = null!;

    public Guid UserId { get; set; }

    public SimSource Source { get; set; }
    public Guid? TrackLayoutId { get; set; }
    public Guid? CarId { get; set; }
    public Guid? CarClassId { get; set; }

    /// <summary>Separate boards for different conditions; "all" until sims report weather / assists.</summary>
    [MaxLength(40)]
    public string ConditionKey { get; set; } = "all";

    public int? LapTimeMs { get; set; }
    public DateTime RecordedAt { get; set; }

    public bool Eligible { get; set; }

    /// <summary>Comma-separated reasons the lap doesn't rank (empty when eligible).</summary>
    [MaxLength(300)]
    public string Reasons { get; set; } = "";

    public int ValidatorVersion { get; set; }
    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
}

public enum LeaderboardVisibility { Public = 0, Anonymous = 1, Hidden = 2 }
