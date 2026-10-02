using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domain.Enums;

namespace Domain.Entities;

public class TelemetrySession
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string CarModel { get; set; } = "";

    [Required]
    [MaxLength(100)]
    public string Track { get; set; } = "";

    [Required]
    [MaxLength(100)]
    public string DriverName { get; set; } = "";

    /// <summary>Raw sim session-type string (v1: <c>AC_PRACTICE</c>…; v2: <c>sessionTypeRaw</c>). See <see cref="SessionKind"/> for the normalized value.</summary>
    [Required]
    [MaxLength(50)]
    public string SessionType { get; set; } = "";

    public TelemetryMode Mode { get; set; } = TelemetryMode.Normal;
    public TelemetryVisibility Visibility { get; set; } = TelemetryVisibility.Private;
    public TelemetrySessionStatus Status { get; set; } = TelemetrySessionStatus.Active;
    public bool IsActive { get; set; } = true;
    public int LapCount { get; set; } = 0;
    public int BestLapMs { get; set; } = 0;

    [MaxLength(32)]
    public string? ClientVersion { get; set; }

    // --- protocol v2 metadata (defaults describe legacy v1 sessions) ---

    /// <summary>Which simulator produced the session. Legacy rows default to ACC.</summary>
    public SimSource Source { get; set; } = SimSource.Acc;

    /// <summary>Sim-native stable track id (ACC <c>spa</c>, iRacing <c>TrackID:Config</c>, F1 <c>12</c>). Half of the <see cref="TrackProfile"/> key.</summary>
    [MaxLength(64)]
    public string? TrackId { get; set; }

    public Guid? TrackProfileId { get; set; }

    [ForeignKey("TrackProfileId")]
    public TrackProfile? TrackProfile { get; set; }

    /// <summary>Track length reported by the client for this session, metres. Null when unknown (legacy or ACC without a table entry).</summary>
    public float? TrackLengthM { get; set; }

    public int? SectorCount { get; set; }

    public NormalizedSessionType SessionKind { get; set; } = NormalizedSessionType.Other;

    /// <summary>Wire protocol version the session was recorded with (1 = physics/graphics frames, 2 = ticks).</summary>
    public int SchemaVersion { get; set; } = 1;

    public int? TickRateHz { get; set; }

    [MaxLength(64)]
    public string? CarId { get; set; }

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAt { get; set; }
    public DateTime? LastSeenAt { get; set; }

    public ICollection<TelemetryLap> Laps { get; set; } = new List<TelemetryLap>();
}
