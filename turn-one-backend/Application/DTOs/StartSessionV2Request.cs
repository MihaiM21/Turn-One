using Domain.Enums;

namespace Application.DTOs;

/// <summary>Parsed protocol-v2 <c>session_start</c> frame, handed to <c>ITelemetrySessionService.StartOrUpsertSessionV2Async</c>.</summary>
public sealed class StartSessionV2Request
{
    public required Guid SessionId { get; init; }
    public required Guid UserId { get; init; }
    public required PlanType Plan { get; init; }
    public required TelemetryMode Mode { get; init; }
    public required SimSource Source { get; init; }
    public string? TrackId { get; init; }
    public string? TrackName { get; init; }
    public float? TrackLengthM { get; init; }
    public int? SectorCount { get; init; }
    public float[]? SectorBoundariesM { get; init; }
    public string? CarId { get; init; }
    public string? CarName { get; init; }
    public NormalizedSessionType SessionKind { get; init; }
    public string? SessionTypeRaw { get; init; }
    public string Driver { get; init; } = "";
    public int? TickRateHz { get; init; }
    public required DateTime StartedAt { get; init; }
}
