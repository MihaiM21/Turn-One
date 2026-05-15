using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class TelemetrySessionService : ITelemetrySessionService
{
    private readonly TurnOneDbContext _context;

    public TelemetrySessionService(TurnOneDbContext context)
    {
        _context = context;
    }

    public async Task<TelemetrySession> StartOrUpsertSessionAsync(
        Guid sessionId, Guid userId, PlanType plan,
        string car, string track, string driver,
        string sessionType, TelemetryMode mode,
        DateTime startedAt)
    {
        var existing = await _context.TelemetrySessions.FindAsync(sessionId);

        if (existing != null)
        {
            // Upsert — only overwrite fields that are populated (late-static pattern)
            if (!string.IsNullOrEmpty(car)) existing.CarModel = car;
            if (!string.IsNullOrEmpty(track)) existing.Track = track;
            if (!string.IsNullOrEmpty(driver)) existing.DriverName = driver;
            if (!string.IsNullOrEmpty(sessionType)) existing.SessionType = sessionType;
            existing.Status = TelemetrySessionStatus.Active;
            existing.IsActive = true;
            existing.EndedAt = null;
            existing.LastSeenAt = startedAt;
            await _context.SaveChangesAsync();
            return existing;
        }

        // Enforce plan-based session limit (active sessions only)
        int sessionLimit = plan switch
        {
            PlanType.BASIC => 1,
            PlanType.PRO => 5,
            PlanType.ELITE => 15,
            _ => 1
        };

        var userSessions = await _context.TelemetrySessions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.StartedAt)
            .ToListAsync();

        if (userSessions.Count >= sessionLimit)
        {
            var toDelete = userSessions.Skip(sessionLimit - 1).ToList();
            _context.TelemetrySessions.RemoveRange(toDelete);
        }

        var newSession = new TelemetrySession
        {
            Id = sessionId,
            UserId = userId,
            CarModel = car,
            Track = track,
            DriverName = driver,
            SessionType = sessionType,
            Mode = mode,
            Visibility = TelemetryVisibility.Private,
            Status = TelemetrySessionStatus.Active,
            IsActive = true,
            StartedAt = startedAt,
            LastSeenAt = startedAt
        };

        _context.TelemetrySessions.Add(newSession);

        var simUser = await _context.SimUsers.FirstOrDefaultAsync(u => u.UserId == userId);
        if (simUser == null)
        {
            simUser = new SimUser { UserId = userId, TotalSessions = 1, LastSessionAt = DateTime.UtcNow };
            _context.SimUsers.Add(simUser);
        }
        else
        {
            simUser.TotalSessions++;
            simUser.LastSessionAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return newSession;
    }

    public async Task EndSessionAsync(Guid sessionId, DateTime endedAt, int completedLaps, int bestLapMs)
    {
        var session = await _context.TelemetrySessions.FindAsync(sessionId);
        if (session != null)
        {
            session.Status = TelemetrySessionStatus.Ended;
            session.IsActive = false;
            session.EndedAt = endedAt;
            if (completedLaps > 0) session.LapCount = completedLaps;
            if (bestLapMs > 0) session.BestLapMs = bestLapMs;
            await _context.SaveChangesAsync();
        }
    }

    public async Task SetSessionStatusAsync(Guid sessionId, TelemetrySessionStatus status)
    {
        var session = await _context.TelemetrySessions.FindAsync(sessionId);
        if (session != null)
        {
            session.Status = status;
            session.IsActive = status != TelemetrySessionStatus.Ended;
            await _context.SaveChangesAsync();
        }
    }

    public async Task TouchHeartbeatAsync(Guid sessionId, string? clientVersion, DateTime at)
    {
        var session = await _context.TelemetrySessions.FindAsync(sessionId);
        if (session != null)
        {
            session.LastSeenAt = at;
            if (!string.IsNullOrEmpty(clientVersion)) session.ClientVersion = clientVersion;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<TelemetrySession>> GetSessionsLastSeenBeforeAsync(DateTime cutoff)
    {
        return await _context.TelemetrySessions
            .Where(s => s.Status != TelemetrySessionStatus.Ended
                     && s.LastSeenAt != null
                     && s.LastSeenAt < cutoff)
            .ToListAsync();
    }

    public async Task<TelemetrySession?> GetActiveSessionAsync(Guid userId)
    {
        return await _context.TelemetrySessions
            .Where(s => s.UserId == userId && s.IsActive)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<List<TelemetrySessionDto>> GetUserSessionsAsync(Guid userId)
    {
        return await _context.TelemetrySessions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.StartedAt)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    public async Task<List<TelemetrySessionDto>> GetPublicLiveSessionsAsync()
    {
        return await _context.TelemetrySessions
            .Where(s => s.Visibility == TelemetryVisibility.Public && s.IsActive)
            .OrderByDescending(s => s.StartedAt)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    public async Task<List<TelemetrySessionDto>> GetPublicSessionsAsync()
    {
        return await _context.TelemetrySessions
            .Where(s => s.Visibility == TelemetryVisibility.Public)
            .OrderByDescending(s => s.StartedAt)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    public async Task<TelemetrySessionDto?> GetSessionDetailAsync(Guid sessionId, Guid requestingUserId)
    {
        var session = await _context.TelemetrySessions
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null) return null;
        if (session.UserId != requestingUserId && session.Visibility == TelemetryVisibility.Private) return null;

        return new TelemetrySessionDto
        {
            Id = session.Id,
            UserId = session.UserId,
            Username = session.User.Username,
            CarModel = session.CarModel,
            Track = session.Track,
            DriverName = session.DriverName,
            SessionType = session.SessionType,
            Mode = session.Mode,
            Visibility = session.Visibility,
            Status = session.Status,
            IsActive = session.IsActive,
            LapCount = session.LapCount,
            BestLapMs = session.BestLapMs,
            ClientVersion = session.ClientVersion,
            StartedAt = session.StartedAt,
            EndedAt = session.EndedAt,
            LastSeenAt = session.LastSeenAt
        };
    }

    public async Task UpdateVisibilityAsync(Guid sessionId, Guid userId, TelemetryVisibility visibility)
    {
        var session = await _context.TelemetrySessions.FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);
        if (session != null)
        {
            session.Visibility = visibility;
            await _context.SaveChangesAsync();
        }
    }

    public async Task DeleteSessionAsync(Guid sessionId, Guid userId)
    {
        var session = await _context.TelemetrySessions.FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);
        if (session != null)
        {
            _context.TelemetrySessions.Remove(session);
            await _context.SaveChangesAsync();
        }
    }

    public async Task RecordLapAsync(TelemetryLap lap)
    {
        _context.TelemetryLaps.Add(lap);

        var session = await _context.TelemetrySessions.FindAsync(lap.SessionId);
        if (session != null)
        {
            session.LapCount = Math.Max(session.LapCount, lap.LapNumber);
            if (lap.LapTimeMs.HasValue && lap.LapTimeMs.Value > 0)
            {
                session.BestLapMs = session.BestLapMs == 0
                    ? lap.LapTimeMs.Value
                    : Math.Min(session.BestLapMs, lap.LapTimeMs.Value);
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<SimUser>> GetLeaderboardsAsync(int limit = 50)
    {
        return await _context.SimUsers
            .Include(u => u.User)
            .OrderByDescending(u => u.TotalDistanceKm)
            .Take(limit)
            .ToListAsync();
    }

    public async Task UpdateSimUserStatsAsync(Guid userId, double distanceKm, int playTimeSeconds, float highestSpeedKmh)
    {
        var simUser = await _context.SimUsers.FirstOrDefaultAsync(u => u.UserId == userId);
        if (simUser != null)
        {
            simUser.TotalDistanceKm += distanceKm;
            simUser.TotalPlayTimeSeconds += playTimeSeconds;
            if (highestSpeedKmh > simUser.HighestSpeedKmh) simUser.HighestSpeedKmh = highestSpeedKmh;
            simUser.TotalLaps++;
            await _context.SaveChangesAsync();
        }
    }

    private static TelemetrySessionDto MapToDto(TelemetrySession s) => new()
    {
        Id = s.Id,
        UserId = s.UserId,
        Username = s.User.Username,
        CarModel = s.CarModel,
        Track = s.Track,
        DriverName = s.DriverName,
        SessionType = s.SessionType,
        Mode = s.Mode,
        Visibility = s.Visibility,
        Status = s.Status,
        IsActive = s.IsActive,
        LapCount = s.LapCount,
        BestLapMs = s.BestLapMs,
        ClientVersion = s.ClientVersion,
        StartedAt = s.StartedAt,
        EndedAt = s.EndedAt,
        LastSeenAt = s.LastSeenAt
    };
}
