using Application.DTOs;
using Domain.Entities;
using Domain.Enums;

namespace Application.Interfaces;

public interface ITelemetrySessionService
{
    Task<TelemetrySession> StartSessionAsync(Guid userId, PlanType plan, string car, string track, string driver, string sessionType, TelemetryMode mode);
    Task EndSessionAsync(Guid sessionId);
    Task<TelemetrySession?> GetActiveSessionAsync(Guid userId);
    Task<List<TelemetrySessionDto>> GetUserSessionsAsync(Guid userId);
    Task<List<TelemetrySessionDto>> GetPublicLiveSessionsAsync();
    Task<List<TelemetrySessionDto>> GetPublicSessionsAsync();
    Task<TelemetrySessionDto?> GetSessionDetailAsync(Guid sessionId, Guid requestingUserId);
    Task UpdateVisibilityAsync(Guid sessionId, Guid userId, TelemetryVisibility visibility);
    Task DeleteSessionAsync(Guid sessionId, Guid userId);
    
    Task<List<SimUser>> GetLeaderboardsAsync(int limit = 50);

    // Lap and SimUser stats
    Task RecordLapAsync(TelemetryLap lap);
    Task UpdateSimUserStatsAsync(Guid userId, double distanceKm, int playTimeSeconds, float highestSpeedKmh);
}
