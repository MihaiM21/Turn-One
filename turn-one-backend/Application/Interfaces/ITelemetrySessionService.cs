using Application.DTOs;
using Domain.Entities;
using Domain.Enums;

namespace Application.Interfaces;

public interface ITelemetrySessionService
{
    Task<TelemetrySession> StartOrUpsertSessionAsync(
        Guid sessionId, Guid userId, PlanType plan,
        string car, string track, string driver,
        string sessionType, TelemetryMode mode,
        DateTime startedAt);

    /// <summary>Protocol-v2 <c>session_start</c>: sets the v2 session columns and upserts the (Source, TrackId) <see cref="TrackProfile"/>.</summary>
    Task<TelemetrySession> StartOrUpsertSessionV2Async(StartSessionV2Request request);

    Task EndSessionAsync(Guid sessionId, DateTime endedAt, int completedLaps, int bestLapMs);
    Task SetSessionStatusAsync(Guid sessionId, TelemetrySessionStatus status);
    Task TouchHeartbeatAsync(Guid sessionId, string? clientVersion, DateTime at);
    Task<List<TelemetrySession>> GetSessionsLastSeenBeforeAsync(DateTime cutoff);

    Task<TelemetrySession?> GetActiveSessionAsync(Guid userId);
    Task<List<TelemetrySessionDto>> GetUserSessionsAsync(Guid userId);
    Task<List<TelemetrySessionDto>> GetPublicLiveSessionsAsync();
    Task<List<TelemetrySessionDto>> GetPublicSessionsAsync();
    Task<TelemetrySessionDto?> GetSessionDetailAsync(Guid sessionId, Guid requestingUserId);
    Task UpdateVisibilityAsync(Guid sessionId, Guid userId, TelemetryVisibility visibility);
    Task DeleteSessionAsync(Guid sessionId, Guid userId);

    Task<List<SimUser>> GetLeaderboardsAsync(int limit = 50);
    Task RecordLapAsync(TelemetryLap lap);
    Task UpdateSimUserStatsAsync(Guid userId, double distanceKm, int playTimeSeconds, float highestSpeedKmh);
}
