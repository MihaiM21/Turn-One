using API.Hubs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Text.Json;
using System.Threading.Channels;

namespace API.Services;

public class TelemetrySessionContext
{
    public Guid SessionId { get; set; }
    public Guid UserId { get; set; }
    public PlanType Plan { get; set; }
    public TelemetryMode Mode { get; set; }
    public TelemetryVisibility Visibility { get; set; }
    public int LapCount { get; set; }
    public int BestLapMs { get; set; }
    public int FrameCounter { get; set; }
    public float MaxSpeedKmh { get; set; }
    public int MaxRpm { get; set; }

    /// <summary>
    /// Validity of the lap currently in progress. ACC reports <c>isValidLap</c> per frame and clears
    /// it the moment the driver cuts, so it has to be latched across the whole lap and reset at the
    /// lap boundary — reading it only at the boundary would describe the *next* lap.
    /// </summary>
    public bool CurrentLapValid { get; set; } = true;
}

public class TelemetryIngestionService
{
    private readonly IHubContext<SimTelemetryHub> _hubContext;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly Channel<TickItem> _tickChannel;
    private readonly ILogger<TelemetryIngestionService> _logger;

    // Keyed by client-supplied sessionId
    private readonly ConcurrentDictionary<Guid, TelemetrySessionContext> _activeSessions = new();
    // userId → current active sessionId (for SignalR group routing)
    private readonly ConcurrentDictionary<Guid, Guid> _userToSession = new();

    public TelemetryIngestionService(
        IHubContext<SimTelemetryHub> hubContext,
        IServiceScopeFactory scopeFactory,
        Channel<TickItem> tickChannel,
        ILogger<TelemetryIngestionService> logger)
    {
        _hubContext = hubContext;
        _scopeFactory = scopeFactory;
        _tickChannel = tickChannel;
        _logger = logger;
    }

    public async Task ProcessFrameAsync(Guid userId, PlanType plan, TelemetryMode mode, Guid? sessionId, string messageType, JsonElement payload, long clientTs)
    {
        // Always push to the private user SignalR group
        await _hubContext.Clients.Group($"telemetry_{userId}").SendAsync("ReceiveTelemetry", messageType, payload, clientTs);

        switch (messageType)
        {
            case "session_start":
                await HandleSessionStartAsync(userId, plan, mode, sessionId, payload, clientTs);
                return;

            case "session_end":
                await HandleSessionEndAsync(userId, sessionId, payload, clientTs);
                return;

            case "session_pause":
                await HandleSessionPauseAsync(sessionId, clientTs);
                return;

            case "session_resume":
                await HandleSessionResumeAsync(sessionId, clientTs);
                return;

            case "client_heartbeat":
                await HandleHeartbeatAsync(sessionId, payload, clientTs);
                return;
        }

        // physics / graphics / static frames
        var context = await GetOrCreateContextAsync(userId, plan, mode, sessionId, messageType, payload);
        if (context == null) return;

        // Spectator push
        if (context.Visibility == TelemetryVisibility.Public)
            await _hubContext.Clients.Group($"spectate_{context.SessionId}").SendAsync("ReceiveTelemetry", messageType, payload, clientTs);

        if (messageType == "graphics")
        {
            // Latch invalidity for the lap in progress (a cut anywhere in the lap invalidates it).
            if (payload.TryGetProperty("isValidLap", out var validProp))
            {
                var stillValid = validProp.ValueKind switch
                {
                    JsonValueKind.Number => validProp.GetInt32() != 0,
                    JsonValueKind.True => true,
                    JsonValueKind.False => false,
                    _ => true
                };
                if (!stillValid) context.CurrentLapValid = false;
            }

            if (payload.TryGetProperty("completedLaps", out var lapsProp) && lapsProp.ValueKind == JsonValueKind.Number)
            {
                int currentLaps = lapsProp.GetInt32();
                if (currentLaps > context.LapCount)
                {
                    await RecordLapAsync(context, payload);
                    context.LapCount = currentLaps;
                    context.MaxSpeedKmh = 0;
                    context.MaxRpm = 0;
                    context.CurrentLapValid = true;
                }
            }

            if (payload.TryGetProperty("status", out var statusProp) && statusProp.GetString() == "AC_OFF")
            {
                var now = DateTimeOffset.UtcNow.DateTime;
                await EndSessionInternalAsync(context, now, context.LapCount, context.BestLapMs);
                return;
            }
        }
        else if (messageType == "physics")
        {
            if (payload.TryGetProperty("speedKmh", out var speedProp) && speedProp.ValueKind == JsonValueKind.Number)
                context.MaxSpeedKmh = Math.Max(context.MaxSpeedKmh, speedProp.GetSingle());

            if (payload.TryGetProperty("rpms", out var rpmProp) && rpmProp.ValueKind == JsonValueKind.Number)
                context.MaxRpm = Math.Max(context.MaxRpm, rpmProp.GetInt32());
        }

        // Tick persistence
        if (mode == TelemetryMode.Normal)
        {
            context.FrameCounter++;
            if (messageType != "physics" || context.FrameCounter % 10 == 0)
            {
                var record = new TickRecord
                {
                    SessionId = context.SessionId,
                    Timestamp = DateTimeOffset.FromUnixTimeMilliseconds(clientTs).UtcDateTime,
                    MessageType = messageType,
                    Payload = payload
                };
                await _tickChannel.Writer.WriteAsync(new TickItem { Plan = plan, Record = record });
            }
        }
    }

    // Called by the sweeper to close stale sessions
    public async Task SweepSessionAsync(Guid sessionId)
    {
        if (_activeSessions.TryRemove(sessionId, out var context))
        {
            _userToSession.TryRemove(context.UserId, out _);
            await EndSessionInternalAsync(context, DateTime.UtcNow, context.LapCount, context.BestLapMs);
        }
    }

    private async Task HandleSessionStartAsync(Guid userId, PlanType plan, TelemetryMode mode, Guid? sessionId, JsonElement payload, long clientTs)
    {
        if (sessionId == null)
        {
            _logger.LogWarning("session_start received with no sessionId from user {UserId}", userId);
            return;
        }

        string car = payload.TryGetProperty("carModel", out var cProp) ? (cProp.GetString() ?? "") : "";
        string track = payload.TryGetProperty("track", out var tProp) ? (tProp.GetString() ?? "") : "";
        string driver = payload.TryGetProperty("driver", out var dProp) ? (dProp.GetString() ?? "") : "";
        string sessionType = payload.TryGetProperty("sessionType", out var stProp) ? (stProp.GetString() ?? "AC_UNKNOWN") : "AC_UNKNOWN";
        var startedAt = payload.TryGetProperty("startedAt", out var saProp) && saProp.ValueKind == JsonValueKind.Number
            ? DateTimeOffset.FromUnixTimeMilliseconds(saProp.GetInt64()).UtcDateTime
            : DateTimeOffset.FromUnixTimeMilliseconds(clientTs).UtcDateTime;

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var svc = scope.ServiceProvider.GetRequiredService<ITelemetrySessionService>();
            var session = await svc.StartOrUpsertSessionAsync(sessionId.Value, userId, plan, car, track, driver, sessionType, mode, startedAt);

            // Always (re-)register in-memory context on session_start
            var context = new TelemetrySessionContext
            {
                SessionId = sessionId.Value,
                UserId = userId,
                Plan = plan,
                Mode = mode,
                Visibility = session.Visibility,
                LapCount = session.LapCount,
                BestLapMs = session.BestLapMs,
                FrameCounter = 0
            };

            _activeSessions[sessionId.Value] = context;
            _userToSession[userId] = sessionId.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to handle session_start for session {SessionId}", sessionId);
        }
    }

    private async Task HandleSessionEndAsync(Guid userId, Guid? sessionId, JsonElement payload, long clientTs)
    {
        var endedAt = payload.TryGetProperty("endedAt", out var eaProp) && eaProp.ValueKind == JsonValueKind.Number
            ? DateTimeOffset.FromUnixTimeMilliseconds(eaProp.GetInt64()).UtcDateTime
            : DateTimeOffset.FromUnixTimeMilliseconds(clientTs).UtcDateTime;

        int completedLaps = payload.TryGetProperty("completedLaps", out var clProp) ? clProp.GetInt32() : 0;
        int bestLapMs = payload.TryGetProperty("bestLapMs", out var blProp) ? blProp.GetInt32() : 0;

        if (sessionId.HasValue && _activeSessions.TryRemove(sessionId.Value, out var ctx))
        {
            _userToSession.TryRemove(userId, out _);
            await EndSessionInternalAsync(ctx, endedAt, completedLaps, bestLapMs);
        }
        else if (sessionId.HasValue)
        {
            // Session may have been ended by sweeper; still persist final stats
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var svc = scope.ServiceProvider.GetRequiredService<ITelemetrySessionService>();
                await svc.EndSessionAsync(sessionId.Value, endedAt, completedLaps, bestLapMs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to persist session_end for {SessionId}", sessionId);
            }
        }

        if (sessionId.HasValue)
            await _hubContext.Clients.Group($"telemetry_{userId}").SendAsync("SessionEnded", sessionId.Value);
    }

    private async Task HandleSessionPauseAsync(Guid? sessionId, long clientTs)
    {
        if (sessionId == null) return;
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var svc = scope.ServiceProvider.GetRequiredService<ITelemetrySessionService>();
            await svc.SetSessionStatusAsync(sessionId.Value, TelemetrySessionStatus.Paused);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to handle session_pause for {SessionId}", sessionId);
        }
    }

    private async Task HandleSessionResumeAsync(Guid? sessionId, long clientTs)
    {
        if (sessionId == null) return;
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var svc = scope.ServiceProvider.GetRequiredService<ITelemetrySessionService>();
            await svc.SetSessionStatusAsync(sessionId.Value, TelemetrySessionStatus.Active);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to handle session_resume for {SessionId}", sessionId);
        }
    }

    private async Task HandleHeartbeatAsync(Guid? sessionId, JsonElement payload, long clientTs)
    {
        if (sessionId == null) return;
        string? clientVersion = payload.TryGetProperty("clientVersion", out var cvProp) ? cvProp.GetString() : null;
        var at = DateTimeOffset.FromUnixTimeMilliseconds(clientTs).UtcDateTime;

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var svc = scope.ServiceProvider.GetRequiredService<ITelemetrySessionService>();
            await svc.TouchHeartbeatAsync(sessionId.Value, clientVersion, at);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to handle client_heartbeat for {SessionId}", sessionId);
        }
    }

    private async Task<TelemetrySessionContext?> GetOrCreateContextAsync(Guid userId, PlanType plan, TelemetryMode mode, Guid? sessionId, string messageType, JsonElement payload)
    {
        // Fast path: already tracking this session
        if (sessionId.HasValue && _activeSessions.TryGetValue(sessionId.Value, out var ctx))
            return ctx;

        // Fallback: create a session from a static frame (older clients or packet-loss scenario)
        var effectiveId = sessionId ?? Guid.NewGuid();

        string car = "", track = "", driver = "", sessionType = "LIVE";
        if (messageType == "static")
        {
            car = payload.TryGetProperty("carModel", out var c) ? (c.GetString() ?? "") : "";
            track = payload.TryGetProperty("track", out var t) ? (t.GetString() ?? "") : "";
            driver = payload.TryGetProperty("playerName", out var d) ? (d.GetString() ?? "") : "";
        }

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var svc = scope.ServiceProvider.GetRequiredService<ITelemetrySessionService>();
            var session = await svc.StartOrUpsertSessionAsync(effectiveId, userId, plan, car, track, driver, sessionType, mode, DateTime.UtcNow);

            var context = new TelemetrySessionContext
            {
                SessionId = effectiveId,
                UserId = userId,
                Plan = plan,
                Mode = mode,
                Visibility = session.Visibility,
                LapCount = session.LapCount,
                BestLapMs = session.BestLapMs,
                FrameCounter = 0
            };

            _activeSessions[effectiveId] = context;
            _userToSession[userId] = effectiveId;
            return context;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create fallback session for user {UserId}", userId);
            return null;
        }
    }

    private async Task RecordLapAsync(TelemetrySessionContext context, JsonElement graphicsPayload)
    {
        try
        {
            int? lastTime = graphicsPayload.TryGetProperty("iLastTime", out var lt) ? lt.GetInt32() : null;
            if (lastTime == 2147483647) lastTime = null;

            // Only valid laps count towards the session best.
            if (lastTime.HasValue && lastTime.Value > 0 && context.CurrentLapValid)
            {
                context.BestLapMs = context.BestLapMs == 0
                    ? lastTime.Value
                    : Math.Min(context.BestLapMs, lastTime.Value);
            }

            var lap = new TelemetryLap
            {
                SessionId = context.SessionId,
                LapNumber = context.LapCount + 1,
                LapTimeMs = lastTime,
                IsValid = context.CurrentLapValid && lastTime is > 0,
                MaxSpeedKmh = context.MaxSpeedKmh,
                MaxRpm = context.MaxRpm,
                RecordedAt = DateTime.UtcNow
            };

            using var scope = _scopeFactory.CreateScope();
            var svc = scope.ServiceProvider.GetRequiredService<ITelemetrySessionService>();
            await svc.RecordLapAsync(lap);

            double distanceKm = 5.0;
            await svc.UpdateSimUserStatsAsync(context.UserId, distanceKm, (lastTime ?? 0) / 1000, context.MaxSpeedKmh);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed saving lap");
        }
    }

    private async Task EndSessionInternalAsync(TelemetrySessionContext context, DateTime endedAt, int completedLaps, int bestLapMs)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var svc = scope.ServiceProvider.GetRequiredService<ITelemetrySessionService>();
            await svc.EndSessionAsync(context.SessionId, endedAt, completedLaps, bestLapMs);
            await _hubContext.Clients.Group($"telemetry_{context.UserId}").SendAsync("SessionEnded", context.SessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to end session {SessionId}", context.SessionId);
        }
    }
}
