using Application.DTOs;
using Domain.Enums;

namespace Application.Interfaces;

/// <summary>Machine-checkable reason a lap-telemetry query didn't return data, so the controller can pick the right status code.</summary>
public enum LapQueryError
{
    None,
    NotFound,
    Forbidden,
    BadRequest,
}

public sealed record LapQueryResult<T>(T? Value, LapQueryError Error, string? Message = null, LapProcessingStatus? ProcessingStatus = null)
{
    public static LapQueryResult<T> Ok(T value) => new(value, LapQueryError.None);
    public static LapQueryResult<T> NotFound(string? message = null, LapProcessingStatus? status = null) => new(default, LapQueryError.NotFound, message, status);
    public static LapQueryResult<T> Forbidden(string message) => new(default, LapQueryError.Forbidden, message);
    public static LapQueryResult<T> BadRequest(string message) => new(default, LapQueryError.BadRequest, message);
}

/// <summary>
/// All query/mapping logic behind <c>LapTelemetryController</c> — decoding channel payloads, applying the
/// owner-or-public visibility rule, and mapping entities to <c>Application.DTOs</c> shapes. Kept out of the
/// controller so it stays a thin HTTP shell (see the D1 work item in the sim-racing telemetry plan).
/// </summary>
public interface ILapTelemetryQueryService
{
    Task<LapQueryResult<LapTelemetryDto>> GetLapTelemetryAsync(Guid userId, PlanType plan, Guid lapId, string[]? channels, int step, CancellationToken ct = default);

    Task<LapQueryResult<LapTelemetryDto>> GetLapTelemetryAsync(Guid userId, PlanType plan, Guid sessionId, int lapNumber, string[]? channels, int step, CancellationToken ct = default);

    Task<LapQueryResult<LapOverlayDto>> GetOverlayAsync(Guid userId, PlanType plan, Guid[] lapIds, Guid? refLapId, string[]? channels, int step, CancellationToken ct = default);

    Task<LapQueryResult<LapCornerDto[]>> GetLapCornersAsync(Guid userId, PlanType plan, Guid lapId, CancellationToken ct = default);

    Task<LapQueryResult<CornerCompareDto>> CompareCornersAsync(Guid userId, PlanType plan, Guid[] lapIds, CancellationToken ct = default);

    Task<MyTrackDto[]> GetMyTracksAsync(Guid userId, CancellationToken ct = default);

    Task<LapQueryResult<TrackProfileDto>> GetTrackProfileAsync(Guid profileId, CancellationToken ct = default);

    Task<LapQueryResult<TrackProfileDto>> GetTrackProfileAsync(string source, string trackId, CancellationToken ct = default);

    Task<LapQueryResult<TrackLapsPageDto>> GetTrackLapsAsync(
        Guid userId, PlanType plan, Guid profileId,
        bool? valid, string? kind, string? car,
        int limit, string? cursor, bool includePublic,
        CancellationToken ct = default);
}

public sealed class TrackLapsPageDto
{
    public TrackLapListItemDto[] Items { get; set; } = Array.Empty<TrackLapListItemDto>();
    public string? NextCursor { get; set; }
}
