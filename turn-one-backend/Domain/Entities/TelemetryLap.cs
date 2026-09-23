using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domain.Enums;

namespace Domain.Entities;

public class TelemetryLap
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid SessionId { get; set; }

    [ForeignKey("SessionId")]
    public TelemetrySession Session { get; set; } = null!;

    public int LapNumber { get; set; }
    public int? LapTimeMs { get; set; }
    public int? Sector1Ms { get; set; }
    public int? Sector2Ms { get; set; }
    public int? Sector3Ms { get; set; }
    public bool IsValid { get; set; }
    public float MaxSpeedKmh { get; set; }
    public int MaxRpm { get; set; }
    /// <summary>Mean throttle over the lap, 0..1.</summary>
    public float AverageThrottle { get; set; }
    /// <summary>Mean brake over the lap, 0..1.</summary>
    public float AverageBrake { get; set; }
    public float FuelUsed { get; set; }

    // Lap analytics (0..100, null if not yet computed)
    public float? BrakingScore { get; set; }
    public float? ThrottleScore { get; set; }
    public float? ConsistencyScore { get; set; }

    // --- lap processor output (null / defaults on legacy laps) ---

    public LapKind Kind { get; set; } = LapKind.Flying;
    public LapProcessingStatus ProcessingStatus { get; set; } = LapProcessingStatus.Legacy;

    /// <summary>Distance actually covered, metres. Compare with the session's track length for coverage.</summary>
    public float? LapDistanceM { get; set; }
    public float? AverageSpeedKmh { get; set; }
    public float? MinSpeedKmh { get; set; }
    /// <summary>% of lap distance at &gt; 95 % throttle.</summary>
    public float? FullThrottlePct { get; set; }
    /// <summary>% of lap distance with brake &gt; 5 %.</summary>
    public float? BrakingPct { get; set; }
    /// <summary>% of lap distance with neither pedal above 5 % (and moving).</summary>
    public float? CoastingPct { get; set; }
    public float? PeakGLat { get; set; }
    public float? PeakGLong { get; set; }
    public int? GearShifts { get; set; }

    public DateTime? LapStartedAt { get; set; }
    /// <summary>Version of the lap processor that produced the record; bump + reprocess to roll out algorithm fixes.</summary>
    public int? ProcessorVersion { get; set; }

    [MaxLength(200)]
    public string? ProcessingError { get; set; }

    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

    public LapTelemetry? Telemetry { get; set; }
    public ICollection<LapCorner> Corners { get; set; } = new List<LapCorner>();

    [NotMapped]
    public int?[] SectorsMs => new[] { Sector1Ms, Sector2Ms, Sector3Ms };
}
