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

    public async Task<TelemetrySession> StartSessionAsync(Guid userId, PlanType plan, string car, string track, string driver, string sessionType, TelemetryMode mode)
    {
        // Enforce Plan Limits
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

        // If at or above limit, delete oldest
        if (userSessions.Count >= sessionLimit)
        {
            var sessionsToDelete = userSessions.Skip(sessionLimit - 1).ToList();
            _context.TelemetrySessions.RemoveRange(sessionsToDelete);
        }

        var newSession = new TelemetrySession
        {
            UserId = userId,
            CarModel = car,
            Track = track,
            DriverName = driver,
            SessionType = sessionType,
            Mode = mode,
            Visibility = TelemetryVisibility.Private,
            IsActive = true,
            StartedAt = DateTime.UtcNow
        };

        _context.TelemetrySessions.Add(newSession);

        // Ensure SimUser exists
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

    public async Task EndSessionAsync(Guid sessionId)
    {
        var session = await _context.TelemetrySessions.FindAsync(sessionId);
        if (session != null)
        {
            session.IsActive = false;
            session.EndedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
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
            .Select(s => new TelemetrySessionDto
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
                IsActive = s.IsActive,
                LapCount = s.LapCount,
                StartedAt = s.StartedAt,
                EndedAt = s.EndedAt
            })
            .ToListAsync();
    }

    public async Task<List<TelemetrySessionDto>> GetPublicLiveSessionsAsync()
    {
         return await _context.TelemetrySessions
            .Where(s => s.Visibility == TelemetryVisibility.Public && s.IsActive)
            .OrderByDescending(s => s.StartedAt)
            .Select(s => new TelemetrySessionDto
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
                IsActive = s.IsActive,
                LapCount = s.LapCount,
                StartedAt = s.StartedAt,
                EndedAt = s.EndedAt
            })
            .ToListAsync();
    }

    public async Task<List<TelemetrySessionDto>> GetPublicSessionsAsync()
    {
         return await _context.TelemetrySessions
            .Where(s => s.Visibility == TelemetryVisibility.Public)
            .OrderByDescending(s => s.StartedAt)
            .Select(s => new TelemetrySessionDto
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
                IsActive = s.IsActive,
                LapCount = s.LapCount,
                StartedAt = s.StartedAt,
                EndedAt = s.EndedAt
            })
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
            IsActive = session.IsActive,
            LapCount = session.LapCount,
            StartedAt = session.StartedAt,
            EndedAt = session.EndedAt
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
            if (highestSpeedKmh > simUser.HighestSpeedKmh)
            {
                simUser.HighestSpeedKmh = highestSpeedKmh;
            }
            // Laps are aggregated via RecordLapAsync or we can just ++ here
            simUser.TotalLaps++;
            await _context.SaveChangesAsync();
        }
    }
}
