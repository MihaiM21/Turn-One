using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// One corner of one lap as detected by the lap processor. Rows (not JSON) because the useful
/// questions are cross-lap: "my braking point into T5 over the last 30 laps here".
/// Distances are metres from the start/finish line on the lap's own distance axis.
/// </summary>
public class LapCorner
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid TelemetryLapId { get; set; }

    [ForeignKey("TelemetryLapId")]
    public TelemetryLap Lap { get; set; } = null!;

    public Guid SessionId { get; set; }

    public Guid? TrackProfileId { get; set; }

    /// <summary><see cref="TrackProfile.Version"/> the reference match was made against; a newer profile triggers a lazy re-match.</summary>
    public int? ProfileVersion { get; set; }

    /// <summary>Ordinal within this lap, by apex distance (0-based).</summary>
    public short CornerIndex { get; set; }

    /// <summary>Index of the matched <see cref="TrackProfile"/> reference corner, or null when unmatched.</summary>
    public short? RefCornerIndex { get; set; }

    /// <summary>+1 right-hand, −1 left-hand.</summary>
    public short Direction { get; set; }

    /// <summary>Flat-out or near flat-out bend (min speed &gt; 90 % of entry speed, no braking).</summary>
    public bool IsKink { get; set; }

    public CornerSignalSource Source { get; set; }

    public float EntryM { get; set; }
    public float ApexM { get; set; }
    public float ExitM { get; set; }

    public float? BrakingPointM { get; set; }
    public float? BrakeReleaseM { get; set; }
    public float? ThrottleOnM { get; set; }
    public float? FullThrottleM { get; set; }

    public float EntrySpeedKmh { get; set; }
    public float MinSpeedKmh { get; set; }
    public float ExitSpeedKmh { get; set; }

    /// <summary>Max brake input 0..1 between braking point and apex.</summary>
    public float PeakBrake { get; set; }
    public float PeakGLat { get; set; }

    public short GearAtApex { get; set; }
    public short MinGear { get; set; }

    public int TimeInCornerMs { get; set; }
    public int? BrakeToThrottleMs { get; set; }
    /// <summary>Distance from corner entry to brake release — how far the driver trail-braked.</summary>
    public float? TrailBrakeM { get; set; }
}
