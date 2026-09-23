using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Everything we know about one track layout in one sim: length, sector boundaries and the
/// reference corner set that laps are matched against so "T5" means the same place in every lap
/// and session. Global (not per user) — one Spa is one Spa. Keyed by (<see cref="Source"/>, <see cref="TrackId"/>);
/// the same circuit in a different sim is a different profile because layouts and S/F lines differ.
/// </summary>
public class TrackProfile
{
    [Key]
    public Guid Id { get; set; }

    public SimSource Source { get; set; }

    [Required]
    [MaxLength(64)]
    public string TrackId { get; set; } = "";

    [Required]
    [MaxLength(100)]
    public string DisplayName { get; set; } = "";

    /// <summary>Median of client-reported lengths (or self-calibrated from the first full lap).</summary>
    public float LengthM { get; set; }

    public short SectorCount { get; set; } = 3;

    /// <summary>Distances (m) where sector 2, 3, … begin. Length = SectorCount − 1.</summary>
    public float[] SectorBoundariesM { get; set; } = Array.Empty<float>();

    /// <summary>JSON array of <c>{index, name?, entryM, apexM, exitM, direction, isKink}</c>.</summary>
    [Column(TypeName = "jsonb")]
    public string ReferenceCorners { get; set; } = "[]";

    /// <summary>JSON accumulator of detected apex distances per lap while <see cref="Status"/> is Provisional; nulled once Stable.</summary>
    [Column(TypeName = "jsonb")]
    public string? CornerSamples { get; set; }

    public TrackProfileStatus Status { get; set; } = TrackProfileStatus.Provisional;

    /// <summary>Valid flying laps that have contributed to the reference corner set.</summary>
    public int LapSampleCount { get; set; }

    /// <summary>Bumped whenever <see cref="ReferenceCorners"/> is rebuilt; <see cref="LapCorner.ProfileVersion"/> compares against it.</summary>
    public int Version { get; set; } = 1;

    /// <summary>Optional JSON overrides for the corner detector thresholds on this track.</summary>
    [Column(TypeName = "jsonb")]
    public string? DetectorOverrides { get; set; }

    /// <summary>Optional XY centreline (float32 pairs, 5 m spacing, Brotli) captured from the first lap with world position.</summary>
    public byte[]? Centerline { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
