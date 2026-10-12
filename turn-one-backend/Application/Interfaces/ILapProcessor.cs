using Application.Telemetry;
using Domain.Enums;

namespace Application.Interfaces;

/// <summary>Everything the lap processor needs about the session a lap belongs to.</summary>
public sealed class LapTrackContext
{
    public required Guid SessionId { get; init; }
    public required Guid UserId { get; init; }
    public required PlanType Plan { get; init; }
    public required SimSource Source { get; init; }
    /// <summary>Sim-native track id from <c>session_start</c>; null for legacy sessions without one.</summary>
    public string? TrackId { get; init; }
    public string? TrackName { get; init; }
    /// <summary>Client-reported track length, metres; null/0 when unknown.</summary>
    public float? TrackLengthM { get; init; }
    public int? SectorCount { get; init; }
    public string? CarId { get; init; }
}

/// <summary>One completed lap's worth of ticks, handed from ingestion (or backfill) to the processor.</summary>
public sealed class LapJob
{
    public required LapTrackContext Track { get; init; }
    public required int LapNumber { get; init; }
    /// <summary>Ticks in time order; first tick is the first sample after the line.</summary>
    public required IReadOnlyList<TickV2> Ticks { get; init; }
    /// <summary>Sim-authoritative timing when a <c>lap_complete</c> arrived in time; the worker may set this up to a few seconds after enqueueing.</summary>
    public LapCompleteInfo? Complete { get; set; }
    /// <summary>Wall-clock start of the lap (first tick).</summary>
    public DateTime LapStartedAt { get; init; }
    /// <summary>For backfill: lap time already stored on the legacy <c>TelemetryLap</c> row, used when no lap clock is available.</summary>
    public int? LapTimeOverrideMs { get; init; }
    /// <summary>True when the ticks came from decimated protocol-v1 data.</summary>
    public bool IsLegacy { get; init; }
    /// <summary>Set by ingestion when the buffer overflowed or the lap was discarded; the processor records a Skipped row instead of processing.</summary>
    public string? SkipReason { get; init; }
    /// <summary>Completed when the processor is done, for callers that need to await (tests, backfill).</summary>
    public TaskCompletionSource<LapProcessResult>? Completion { get; init; }
}

public sealed record LapProcessResult(Guid LapId, LapProcessingStatus Status, LapKind Kind, bool IsValid, int? LapTimeMs, int CornerCount, string? Error);

public interface ILapProcessor
{
    /// <summary>Current algorithm version; stored on each record so a bump can trigger reprocessing.</summary>
    int ProcessorVersion { get; }

    /// <summary>Resamples, summarises, detects corners and persists one lap. Never throws for data problems — those become a Failed/Skipped row.</summary>
    Task<LapProcessResult> ProcessAsync(LapJob job, CancellationToken ct = default);

    /// <summary>Applies late <c>lap_complete</c> timing to an already-persisted lap.</summary>
    Task ApplyLapCompleteAsync(Guid sessionId, LapCompleteInfo complete, CancellationToken ct = default);
}
