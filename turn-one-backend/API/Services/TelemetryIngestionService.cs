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
    public int FrameCounter { get; set; }
    
    // For tracking lap metrics
    public float MaxSpeedKmh { get; set; }
    public int MaxRpm { get; set; }
    public int LapStartRealTime { get; set; }
}

public class TelemetryIngestionService
{
    private readonly IHubContext<SimTelemetryHub> _hubContext;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly Channel<TickItem> _tickChannel;
    private readonly ILogger<TelemetryIngestionService> _logger;

    private readonly ConcurrentDictionary<Guid, TelemetrySessionContext> _activeSessions = new();

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

    public async Task ProcessFrameAsync(Guid userId, PlanType plan, TelemetryMode mode, string messageType, JsonElement payload)
    {
        long timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        // 1. ALWAYS push to the private user SignalR group for Live Dashboard
        var group1 = $"telemetry_{userId}";
        await _hubContext.Clients.Group(group1).SendAsync("ReceiveTelemetry", messageType, payload, timestamp);

        if (!_activeSessions.TryGetValue(userId, out var context))
        {
            // First frame received - wait for static to init session
            if (messageType == "static")
            {
                context = await InitializeSessionAsync(userId, plan, mode, payload);
                if (context != null)
                {
                    _activeSessions[userId] = context;
                }
            }
            if (context == null) return; // Drop from persistence/laps until static arrives
        }

        // 2. Spectator push
        if (context.Visibility == TelemetryVisibility.Public)
        {
            var group2 = $"spectate_{context.SessionId}";
            await _hubContext.Clients.Group(group2).SendAsync("ReceiveTelemetry", messageType, payload, timestamp);
        }

        // 2. Track logical lap splits
        if (messageType == "graphics")
        {
            if (payload.TryGetProperty("completedLaps", out var completedLapsProp) && completedLapsProp.ValueKind == JsonValueKind.Number)
            {
                int currentLaps = completedLapsProp.GetInt32();
                if (currentLaps > context.LapCount)
                {
                    await RecordLapAsync(context, payload);
                    context.LapCount = currentLaps;
                    context.MaxSpeedKmh = 0;
                    context.MaxRpm = 0;
                }
            }
            
            if (payload.TryGetProperty("status", out var statusProp) && statusProp.ValueKind == JsonValueKind.String)
            {
                var statusStr = statusProp.GetString();
                if (statusStr == "AC_OFF")
                {
                    await EndSessionAsync(userId);
                    return; // session ended
                }
            }
        }
        else if (messageType == "physics")
        {
            if (payload.TryGetProperty("speedKmh", out var speedProp) && speedProp.ValueKind == JsonValueKind.Number)
            {
                context.MaxSpeedKmh = Math.Max(context.MaxSpeedKmh, speedProp.GetSingle());
            }
            if (payload.TryGetProperty("rpms", out var rpmProp) && rpmProp.ValueKind == JsonValueKind.Number)
            {
                context.MaxRpm = Math.Max(context.MaxRpm, rpmProp.GetInt32());
            }
        }

        // 3. Persistence mapping
        if (mode == TelemetryMode.Normal)
        {
            context.FrameCounter++;
            // Downsample physics to ~10Hz (Assuming 100hz input, send every 10th frame)
            if (messageType != "physics" || context.FrameCounter % 10 == 0)
            {
                var record = new TickRecord
                {
                    SessionId = context.SessionId,
                    Timestamp = DateTime.UtcNow,
                    MessageType = messageType,
                    Payload = payload
                };
                
                await _tickChannel.Writer.WriteAsync(new TickItem { Plan = plan, Record = record });
            }
        }
    }

    private async Task<TelemetrySessionContext?> InitializeSessionAsync(Guid userId, PlanType plan, TelemetryMode mode, JsonElement staticPayload)
    {
        try
        {
            string car = staticPayload.GetProperty("carModel").GetString() ?? "Unknown Car";
            string track = staticPayload.GetProperty("track").GetString() ?? "Unknown Track";
            string driver = staticPayload.GetProperty("playerName").GetString() ?? "Player";
            
            using var scope = _scopeFactory.CreateScope();
            var sessionService = scope.ServiceProvider.GetRequiredService<ITelemetrySessionService>();

            var session = await sessionService.StartSessionAsync(userId, plan, car, track, driver, "LIVE", mode);

            return new TelemetrySessionContext
            {
                SessionId = session.Id,
                UserId = userId,
                Plan = plan,
                Mode = mode,
                Visibility = TelemetryVisibility.Private,
                LapCount = 0,
                FrameCounter = 0
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize telemetry session");
            return null;
        }
    }

    private async Task RecordLapAsync(TelemetrySessionContext context, JsonElement graphicsPayload)
    {
        try
        {
            int? lastTime = graphicsPayload.GetProperty("iLastTime").GetInt32();
            if (lastTime == 2147483647) lastTime = null;

            var lap = new TelemetryLap
            {
                SessionId = context.SessionId,
                LapNumber = context.LapCount + 1,
                LapTimeMs = lastTime,
                MaxSpeedKmh = context.MaxSpeedKmh,
                MaxRpm = context.MaxRpm,
                RecordedAt = DateTime.UtcNow
            };

            using var scope = _scopeFactory.CreateScope();
            var sessionService = scope.ServiceProvider.GetRequiredService<ITelemetrySessionService>();
            await sessionService.RecordLapAsync(lap);
            
            // Increment SimUser stats
            // Approximate distance per lap based on track length if we had it, but simplified here
            double distanceKm = 5.0; // dummy value
            await sessionService.UpdateSimUserStatsAsync(context.UserId, distanceKm, (lastTime ?? 0) / 1000, context.MaxSpeedKmh);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed saving lap");
        }
    }

    public async Task EndSessionAsync(Guid userId)
    {
        if (_activeSessions.TryRemove(userId, out var context))
        {
            using var scope = _scopeFactory.CreateScope();
            var sessionService = scope.ServiceProvider.GetRequiredService<ITelemetrySessionService>();
            await sessionService.EndSessionAsync(context.SessionId);
            
            await _hubContext.Clients.Group($"telemetry_{userId}").SendAsync("SessionEnded", context.SessionId);
        }
    }
}
