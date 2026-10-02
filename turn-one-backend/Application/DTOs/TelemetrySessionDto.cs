using Domain.Enums;

namespace Application.DTOs;

public class TelemetrySessionDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = "";
    public string CarModel { get; set; } = "";
    public string Track { get; set; } = "";
    public string DriverName { get; set; } = "";
    public string SessionType { get; set; } = "";
    public TelemetryMode Mode { get; set; }
    public TelemetryVisibility Visibility { get; set; }
    public TelemetrySessionStatus Status { get; set; }
    public bool IsActive { get; set; }
    public int LapCount { get; set; }
    public int BestLapMs { get; set; }
    public string? ClientVersion { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public DateTime? LastSeenAt { get; set; }

    // Protocol v2 metadata (see Domain.Entities.TelemetrySession). Strings so the client mirror stays simple.
    public string Source { get; set; } = "Acc";
    public string? TrackId { get; set; }
    public Guid? TrackProfileId { get; set; }
    public float? TrackLengthM { get; set; }
    public string SessionKind { get; set; } = "Other";
    public int SchemaVersion { get; set; } = 1;
    public string? CarId { get; set; }
}
