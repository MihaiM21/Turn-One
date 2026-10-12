namespace Application.DTOs;

// Columnar DTOs for the lap-telemetry API. Channel arrays are `float?[]` so NaN serialises as null.
// Mirrored on the client in `turn-one-client/lib/simracing/protocol.ts`.

public sealed class LapCornerDto
{
    public int Index { get; set; }
    public int? RefIndex { get; set; }
    public string? Name { get; set; }
    public int Direction { get; set; }
    public bool IsKink { get; set; }
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
    public float PeakBrake { get; set; }
    public float PeakGLat { get; set; }
    public int GearAtApex { get; set; }
    public int MinGear { get; set; }
    public int TimeInCornerMs { get; set; }
    public int? BrakeToThrottleMs { get; set; }
    public float? TrailBrakeM { get; set; }
}

public sealed class LapSummaryDto
{
    public int? LapTimeMs { get; set; }
    public int?[] SectorsMs { get; set; } = Array.Empty<int?>();
    public bool IsValid { get; set; }
    public string Kind { get; set; } = "";
    public float? LapDistanceM { get; set; }
    public float? AverageSpeedKmh { get; set; }
    public float MaxSpeedKmh { get; set; }
    public float? MinSpeedKmh { get; set; }
    public float AverageThrottle { get; set; }
    public float AverageBrake { get; set; }
    public float? FullThrottlePct { get; set; }
    public float? BrakingPct { get; set; }
    public float? CoastingPct { get; set; }
    public float FuelUsed { get; set; }
    public int? GearShifts { get; set; }
    public float? PeakGLat { get; set; }
    public float? PeakGLong { get; set; }
    public float? BrakingScore { get; set; }
    public float? ThrottleScore { get; set; }
    public float? ConsistencyScore { get; set; }
}

public sealed class LapTelemetryDto
{
    public Guid LapId { get; set; }
    public Guid SessionId { get; set; }
    public int LapNumber { get; set; }
    public float StepM { get; set; }
    public int SampleCount { get; set; }
    public float LapLengthM { get; set; }
    public string DistanceSource { get; set; } = "";
    /// <summary><c>"legacy"</c> when built from decimated v1 ticks; null otherwise.</summary>
    public string? Quality { get; set; }
    public Guid? TrackProfileId { get; set; }
    public int? ProfileVersion { get; set; }
    /// <summary>Channel key → SampleCount values; null = absent.</summary>
    public Dictionary<string, float?[]> Channels { get; set; } = new();
    public LapCornerDto[] Corners { get; set; } = Array.Empty<LapCornerDto>();
    public LapSummaryDto Summary { get; set; } = new();
}

public sealed class ReferenceCornerDto
{
    public int Index { get; set; }
    public string? Name { get; set; }
    public float EntryM { get; set; }
    public float ApexM { get; set; }
    public float ExitM { get; set; }
    public int Direction { get; set; }
    public bool IsKink { get; set; }
}

public sealed class TrackProfileDto
{
    public Guid Id { get; set; }
    public string Source { get; set; } = "";
    public string TrackId { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Status { get; set; } = "";
    public float LengthM { get; set; }
    public int SectorCount { get; set; }
    public float[] SectorBoundariesM { get; set; } = Array.Empty<float>();
    public ReferenceCornerDto[] Corners { get; set; } = Array.Empty<ReferenceCornerDto>();
    public int Version { get; set; }
    public int LapSampleCount { get; set; }
    /// <summary>XY centreline as [x0, y0, x1, y1, …] at 5 m spacing, when captured.</summary>
    public float[]? Centerline { get; set; }
}

public sealed class LapOverlayEntryDto
{
    public Guid LapId { get; set; }
    public Guid SessionId { get; set; }
    public int LapNumber { get; set; }
    public int? LapTimeMs { get; set; }
    public int?[] SectorsMs { get; set; } = Array.Empty<int?>();
    public bool IsValid { get; set; }
    public string Kind { get; set; } = "";
    public DateTime SessionStartedAt { get; set; }
    public string Car { get; set; } = "";
    public string Driver { get; set; } = "";
    public string? Quality { get; set; }
    public Dictionary<string, float?[]> Channels { get; set; } = new();
    /// <summary>Cumulative delta vs the reference lap, ms, positive = slower. Null for the reference itself.</summary>
    public float?[]? DeltaMs { get; set; }
    public LapCornerDto[] Corners { get; set; } = Array.Empty<LapCornerDto>();
}

public sealed class LapOverlayDto
{
    public float StepM { get; set; }
    /// <summary>Shared sample count = min over laps.</summary>
    public int SampleCount { get; set; }
    public Guid RefLapId { get; set; }
    public TrackProfileDto? Track { get; set; }
    public bool LengthMismatch { get; set; }
    public string[] Channels { get; set; } = Array.Empty<string>();
    public LapOverlayEntryDto[] Laps { get; set; } = Array.Empty<LapOverlayEntryDto>();
}

public sealed class CornerCompareRowDto
{
    public int RefIndex { get; set; }
    public string? Name { get; set; }
    /// <summary>Index-aligned with the request's lap ids; null when the lap had no matching corner.</summary>
    public LapCornerDto?[] PerLap { get; set; } = Array.Empty<LapCornerDto?>();
    /// <summary>Time in corner vs the first lap, ms.</summary>
    public int?[] DeltaTimeInCornerMs { get; set; } = Array.Empty<int?>();
}

public sealed class CornerCompareDto
{
    public TrackProfileDto? Track { get; set; }
    public Guid[] LapIds { get; set; } = Array.Empty<Guid>();
    public CornerCompareRowDto[] Rows { get; set; } = Array.Empty<CornerCompareRowDto>();
}

public sealed class TrackLapListItemDto
{
    public Guid LapId { get; set; }
    public Guid SessionId { get; set; }
    public int LapNumber { get; set; }
    public DateTime SessionStartedAt { get; set; }
    public string Car { get; set; } = "";
    public string? CarId { get; set; }
    public string Driver { get; set; } = "";
    public string SessionKind { get; set; } = "";
    public int? LapTimeMs { get; set; }
    public int?[] SectorsMs { get; set; } = Array.Empty<int?>();
    public bool IsValid { get; set; }
    public string Kind { get; set; } = "";
    public bool HasTelemetry { get; set; }
    public string? Quality { get; set; }
    public bool IsMine { get; set; }
}

public sealed class MyTrackDto
{
    public TrackProfileDto Profile { get; set; } = new();
    public int SessionCount { get; set; }
    public int LapCount { get; set; }
    public int ValidLapCount { get; set; }
    public int? BestLapMs { get; set; }
    public Guid? BestLapId { get; set; }
    public DateTime LastDrivenAt { get; set; }
    public string[] Cars { get; set; } = Array.Empty<string>();
}

public sealed class ReprocessRequestDto
{
    public Guid[]? SessionIds { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public bool OnlyLegacy { get; set; } = true;
    public bool Force { get; set; }
}

public sealed class ReprocessStatusDto
{
    public Guid JobId { get; set; }
    public string State { get; set; } = "";
    public int SessionsTotal { get; set; }
    public int SessionsDone { get; set; }
    public int LapsProcessed { get; set; }
    public int LapsFailed { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public string? LastError { get; set; }
}
