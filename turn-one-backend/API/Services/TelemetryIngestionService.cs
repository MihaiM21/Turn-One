using API.Hubs;
using Application.DTOs;
using Application.Interfaces;
using Application.Telemetry;
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

    // --- protocol v2 ---

    /// <summary>1 = legacy physics/graphics frames, 2 = ticks. Set from the frame envelope on session_start.</summary>
    public int SchemaVersion { get; set; } = 1;
    public SimSource Source { get; set; } = SimSource.Acc;
    public string? TrackId { get; set; }
    public string? TrackName { get; set; }
    public float? TrackLengthM { get; set; }
    public int? SectorCount { get; set; }
    public string? CarId { get; set; }

    /// <summary>Lap number the open <see cref="Buffer"/> belongs to; 0 = no lap started yet.</summary>
    public int CurrentLap { get; set; }
    public LapBuffer? Buffer { get; set; }
    public DateTime? CurrentLapStartedAt { get; set; }

    /// <summary>Laps cut from the buffer and enqueued to the lap processor, awaiting a <c>lap_complete</c> frame (or the worker's grace-period timeout).</summary>
    public ConcurrentDictionary<int, LapJob> PendingJobs { get; set; } = new();

    /// <summary>
    /// A <c>lap_complete</c> that arrived for a lap the buffer has not been cut for yet (the client
    /// sent it before the first tick of the next lap). Attached to the job when the cut happens.
    /// </summary>
    public ConcurrentDictionary<int, Application.Telemetry.LapCompleteInfo> EarlyCompletes { get; set; } = new();
}

public class TelemetryIngestionService
{
    /// <summary>A lap covering at least this fraction of the track length at session end / sweep is worth processing even without a clean lap-cut.</summary>
    private const float PartialLapMinCoverage = 0.9f;

    private readonly IHubContext<SimTelemetryHub> _hubContext;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly Channel<TickItem> _tickChannel;
    private readonly Channel<LapJob> _lapJobChannel;
    private readonly LapBufferRegistry _bufferRegistry;
    private readonly ILogger<TelemetryIngestionService> _logger;

    // Keyed by client-supplied sessionId
    private readonly ConcurrentDictionary<Guid, TelemetrySessionContext> _activeSessions = new();
    // userId → current active sessionId (for SignalR group routing)
    private readonly ConcurrentDictionary<Guid, Guid> _userToSession = new();

    public TelemetryIngestionService(
        IHubContext<SimTelemetryHub> hubContext,
        IServiceScopeFactory scopeFactory,
        Channel<TickItem> tickChannel,
        Channel<LapJob> lapJobChannel,
        LapBufferRegistry bufferRegistry,
        ILogger<TelemetryIngestionService> logger)
    {
        _hubContext = hubContext;
        _scopeFactory = scopeFactory;
        _tickChannel = tickChannel;
        _lapJobChannel = lapJobChannel;
        _bufferRegistry = bufferRegistry;
        _logger = logger;
    }

    public async Task ProcessFrameAsync(Guid userId, PlanType plan, TelemetryMode mode, Guid? sessionId, string messageType, JsonElement payload, long clientTs, int schemaVersion = 1)
    {
        // Always push to the private user SignalR group
        await _hubContext.Clients.Group($"telemetry_{userId}").SendAsync("ReceiveTelemetry", messageType, payload, clientTs);

        if (schemaVersion == 2)
        {
            await ProcessV2FrameAsync(userId, plan, mode, sessionId, messageType, payload, clientTs);
            return;
        }

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

        // Tick persistence — every physics/graphics frame, no decimation.
        if (mode == TelemetryMode.Normal)
        {
            context.FrameCounter++;
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

    // ==================================================================================
    // Protocol v2
    // ==================================================================================

    private async Task ProcessV2FrameAsync(Guid userId, PlanType plan, TelemetryMode mode, Guid? sessionId, string messageType, JsonElement payload, long clientTs)
    {
        switch (messageType)
        {
            case "session_start":
                await HandleSessionStartV2Async(userId, plan, mode, sessionId, payload, clientTs);
                return;

            case "tick":
                if (sessionId.HasValue) await HandleTickV2Async(userId, sessionId.Value, payload, clientTs);
                else _logger.LogWarning("v2 tick with no sessionId from user {UserId}", userId);
                return;

            case "lap_complete":
                if (sessionId.HasValue) await HandleLapCompleteV2Async(sessionId.Value, payload);
                return;

            case "session_end":
                if (sessionId.HasValue) await HandleSessionEndV2Async(userId, sessionId.Value, payload, clientTs);
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

            default:
                _logger.LogWarning("Unhandled v2 message type {MessageType} from user {UserId}", messageType, userId);
                return;
        }
    }

    private async Task HandleSessionStartV2Async(Guid userId, PlanType plan, TelemetryMode mode, Guid? sessionId, JsonElement payload, long clientTs)
    {
        if (sessionId == null)
        {
            _logger.LogWarning("v2 session_start received with no sessionId from user {UserId}", userId);
            return;
        }

        string? source = payload.TryGetProperty("source", out var srcProp) ? srcProp.GetString() : null;
        string? trackId = payload.TryGetProperty("trackId", out var tidProp) ? tidProp.GetString() : null;
        string? trackName = payload.TryGetProperty("trackName", out var tnProp) ? tnProp.GetString() : null;
        float? trackLengthM = payload.TryGetProperty("trackLengthM", out var tlProp) && tlProp.ValueKind == JsonValueKind.Number ? tlProp.GetSingle() : null;
        int? sectorCount = payload.TryGetProperty("sectorCount", out var scProp) && scProp.ValueKind == JsonValueKind.Number ? scProp.GetInt32() : null;

        float[]? sectorBoundariesM = null;
        if (payload.TryGetProperty("sectorBoundariesM", out var sbProp) && sbProp.ValueKind == JsonValueKind.Array)
            sectorBoundariesM = sbProp.EnumerateArray()
                .Where(e => e.ValueKind == JsonValueKind.Number)
                .Select(e => e.GetSingle())
                .ToArray();

        string? carId = null, carName = null;
        if (payload.TryGetProperty("car", out var carProp) && carProp.ValueKind == JsonValueKind.Object)
        {
            carId = carProp.TryGetProperty("id", out var cIdP) ? cIdP.GetString() : null;
            carName = carProp.TryGetProperty("name", out var cNameP) ? cNameP.GetString() : null;
        }

        string sessionType = payload.TryGetProperty("sessionType", out var stProp) ? (stProp.GetString() ?? "other") : "other";
        string? sessionTypeRaw = payload.TryGetProperty("sessionTypeRaw", out var strProp) ? strProp.GetString() : null;
        string driver = payload.TryGetProperty("driver", out var dProp) ? (dProp.GetString() ?? "") : "";
        int? tickRateHz = payload.TryGetProperty("tickRateHz", out var trProp) && trProp.ValueKind == JsonValueKind.Number ? trProp.GetInt32() : null;
        var startedAt = payload.TryGetProperty("startedAt", out var saProp) && saProp.ValueKind == JsonValueKind.Number
            ? DateTimeOffset.FromUnixTimeMilliseconds(saProp.GetInt64()).UtcDateTime
            : DateTimeOffset.FromUnixTimeMilliseconds(clientTs).UtcDateTime;

        var simSource = WireEnums.ParseSource(source);
        var normalizedType = WireEnums.ParseSessionType(sessionType);

        // ACC shared memory has no track length; older Link builds send 0 for tracks they don't know.
        if (trackLengthM is null or <= 0 && simSource == SimSource.Acc)
            trackLengthM = Infrastructure.Data.AccTrackLengths.Lookup(trackId);

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var svc = scope.ServiceProvider.GetRequiredService<ITelemetrySessionService>();
            var session = await svc.StartOrUpsertSessionV2Async(new StartSessionV2Request
            {
                SessionId = sessionId.Value,
                UserId = userId,
                Plan = plan,
                Mode = mode,
                Source = simSource,
                TrackId = trackId,
                TrackName = trackName,
                TrackLengthM = trackLengthM,
                SectorCount = sectorCount,
                SectorBoundariesM = sectorBoundariesM,
                CarId = carId,
                CarName = carName,
                SessionKind = normalizedType,
                SessionTypeRaw = sessionTypeRaw ?? sessionType,
                Driver = driver,
                TickRateHz = tickRateHz,
                StartedAt = startedAt
            });

            var context = new TelemetrySessionContext
            {
                SessionId = sessionId.Value,
                UserId = userId,
                Plan = plan,
                Mode = mode,
                Visibility = session.Visibility,
                LapCount = session.LapCount,
                BestLapMs = session.BestLapMs,
                FrameCounter = 0,
                SchemaVersion = 2,
                Source = simSource,
                TrackId = trackId ?? session.TrackId,
                TrackName = trackName ?? session.Track,
                TrackLengthM = trackLengthM ?? session.TrackLengthM,
                SectorCount = sectorCount ?? session.SectorCount,
                CarId = carId ?? session.CarId,
            };

            // session_start is an upsert — a late/repeated one shouldn't blow away an in-progress buffer.
            if (_activeSessions.TryGetValue(sessionId.Value, out var existing))
            {
                context.CurrentLap = existing.CurrentLap;
                context.Buffer = existing.Buffer;
                context.CurrentLapStartedAt = existing.CurrentLapStartedAt;
                context.MaxSpeedKmh = existing.MaxSpeedKmh;
                context.MaxRpm = existing.MaxRpm;
                context.PendingJobs = existing.PendingJobs;
                context.EarlyCompletes = existing.EarlyCompletes;
            }

            _activeSessions[sessionId.Value] = context;
            _userToSession[userId] = sessionId.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to handle v2 session_start for session {SessionId}", sessionId);
        }
    }

    private async Task HandleTickV2Async(Guid userId, Guid sessionId, JsonElement payload, long clientTs)
    {
        if (!_activeSessions.TryGetValue(sessionId, out var context))
        {
            _logger.LogWarning("v2 tick for unknown session {SessionId} from user {UserId} — dropped (no session_start seen yet)", sessionId, userId);
            return;
        }

        var tick = TickV2.FromJson(clientTs, payload);

        // Spectator push
        if (context.Visibility == TelemetryVisibility.Public)
            await _hubContext.Clients.Group($"spectate_{sessionId}").SendAsync("ReceiveTelemetry", "tick", payload, clientTs);

        // Persist every tick to Influx — no decimation — Normal mode only, as today.
        if (context.Mode == TelemetryMode.Normal)
        {
            var record = new TickRecord
            {
                SessionId = sessionId,
                Timestamp = DateTimeOffset.FromUnixTimeMilliseconds(clientTs).UtcDateTime,
                MessageType = "tick",
                Payload = payload
            };
            await _tickChannel.Writer.WriteAsync(new TickItem { Plan = context.Plan, Record = record });
        }

        if (!float.IsNaN(tick.Speed)) context.MaxSpeedKmh = Math.Max(context.MaxSpeedKmh, tick.Speed);
        var rpm = tick.Get(Domain.Telemetry.ChannelRegistry.Rpm);
        if (!float.IsNaN(rpm)) context.MaxRpm = Math.Max(context.MaxRpm, (int)rpm);

        var lastLapTime = context.Buffer?.Last?.LapTimeMs ?? float.NaN;
        var decision = LapCutRule.Decide(context.CurrentLap, tick.Lap, tick.LapDistM, context.TrackLengthM, lastLapTime, tick.LapTimeMs);
        switch (decision)
        {
            case LapCutDecision.Restart:
                _logger.LogInformation("Lap clock restarted within lap {Lap} of session {SessionId} ({From} -> {To} ms) — pit-exit out-lap stub, restarting buffer", context.CurrentLap, sessionId, lastLapTime, tick.LapTimeMs);
                StartNewBuffer(context, tick.Lap, tick);
                break;

            case LapCutDecision.CutAndStart:
                if (context.CurrentLap > 0 && context.Buffer != null)
                    await EnqueueLapJobAsync(context, context.CurrentLap, context.Buffer, context.CurrentLapStartedAt ?? DateTime.UtcNow, context.Buffer.Overflowed ? "overflow" : null);
                StartNewBuffer(context, tick.Lap, tick);
                break;

            case LapCutDecision.Discard:
                _logger.LogInformation("Lap counter went backwards for session {SessionId} ({From} -> {To}) — restart/flashback, discarding buffer", sessionId, context.CurrentLap, tick.Lap);
                StartNewBuffer(context, tick.Lap, tick);
                break;

            case LapCutDecision.Continue:
            default:
                context.Buffer ??= NewBuffer(context);
                context.Buffer.Add(tick);
                break;
        }

        _bufferRegistry.EnforceLimit();
    }

    private async Task HandleLapCompleteV2Async(Guid sessionId, JsonElement payload)
    {
        if (!_activeSessions.TryGetValue(sessionId, out var context)) return;

        var info = ParseLapCompleteInfo(payload);

        if (context.PendingJobs.TryRemove(info.Lap, out var job))
        {
            // The worker (up to a 3 s grace period) picks this up before processing.
            job.Complete = info;
            return;
        }

        if (info.Lap >= context.CurrentLap)
        {
            // Arrived before the next lap's first tick cut the buffer; hold it for the cut.
            context.EarlyCompletes[info.Lap] = info;
            return;
        }

        // Lap was already processed (late lap_complete) — patch the persisted row.
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var processor = scope.ServiceProvider.GetRequiredService<ILapProcessor>();
            await processor.ApplyLapCompleteAsync(sessionId, info);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to apply late lap_complete for session {SessionId} lap {Lap}", sessionId, info.Lap);
        }
    }

    private async Task HandleSessionEndV2Async(Guid userId, Guid sessionId, JsonElement payload, long clientTs)
    {
        var endedAt = payload.TryGetProperty("endedAt", out var eaProp) && eaProp.ValueKind == JsonValueKind.Number
            ? DateTimeOffset.FromUnixTimeMilliseconds(eaProp.GetInt64()).UtcDateTime
            : DateTimeOffset.FromUnixTimeMilliseconds(clientTs).UtcDateTime;

        int lapsCompleted = payload.TryGetProperty("lapsCompleted", out var lcProp) && lcProp.ValueKind == JsonValueKind.Number ? lcProp.GetInt32() : 0;
        int bestLapMs = payload.TryGetProperty("bestLapMs", out var blProp) && blProp.ValueKind == JsonValueKind.Number ? blProp.GetInt32() : 0;

        if (_activeSessions.TryRemove(sessionId, out var context))
        {
            _userToSession.TryRemove(userId, out _);
            await FlushOpenBufferIfSignificantAsync(context);
            _bufferRegistry.Unregister(sessionId);
            await EndSessionInternalAsync(context, endedAt, lapsCompleted, bestLapMs);
        }
        else
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var svc = scope.ServiceProvider.GetRequiredService<ITelemetrySessionService>();
                await svc.EndSessionAsync(sessionId, endedAt, lapsCompleted, bestLapMs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to persist v2 session_end for {SessionId}", sessionId);
            }
        }

        await _hubContext.Clients.Group($"telemetry_{userId}").SendAsync("SessionEnded", sessionId);
    }

    /// <summary>Enqueues the open buffer as a Partial-kind job when it covers ≥ 90% of the track length; otherwise drops it. Used by session_end and the sweeper.</summary>
    private async Task FlushOpenBufferIfSignificantAsync(TelemetrySessionContext context)
    {
        if (context.Buffer == null || context.CurrentLap <= 0) return;

        var buffer = context.Buffer;
        var length = context.TrackLengthM ?? 0f;
        var covered = EstimateCoverageM(buffer);

        if (length > 0 && covered >= PartialLapMinCoverage * length)
        {
            await EnqueueLapJobAsync(context, context.CurrentLap, buffer, context.CurrentLapStartedAt ?? DateTime.UtcNow, buffer.Overflowed ? "overflow" : null);
        }

        context.Buffer = null;
    }

    private static float EstimateCoverageM(LapBuffer buffer)
    {
        var ticks = buffer.Ticks;
        if (ticks.Count == 0) return 0f;
        var last = ticks[^1];
        // Sim distance when it moves; otherwise a cheap speed integration (a Link with an unknown
        // track length sends lapDistM = 0 on every tick, which would wrongly drop the final lap).
        if (!float.IsNaN(last.LapDistM) && last.LapDistM > LapDistanceNormalizer.MinDistanceSpanM) return last.LapDistM;
        if (buffer.Overflowed) return 0f;
        var d = 0f;
        for (var i = 1; i < ticks.Count; i++)
        {
            var dt = (ticks[i].T - ticks[i - 1].T) / 1000f;
            var v0 = float.IsNaN(ticks[i - 1].Speed) ? 0f : ticks[i - 1].Speed;
            var v1 = float.IsNaN(ticks[i].Speed) ? 0f : ticks[i].Speed;
            if (dt > 0) d += (v0 + v1) / 2f / 3.6f * dt;
        }
        return d;
    }

    private async Task EnqueueLapJobAsync(TelemetrySessionContext context, int lapNumber, LapBuffer buffer, DateTime lapStartedAt, string? skipReason)
    {
        var job = new LapJob
        {
            Track = new LapTrackContext
            {
                SessionId = context.SessionId,
                UserId = context.UserId,
                Plan = context.Plan,
                Source = context.Source,
                TrackId = context.TrackId,
                TrackName = context.TrackName,
                TrackLengthM = context.TrackLengthM,
                SectorCount = context.SectorCount,
                CarId = context.CarId
            },
            LapNumber = lapNumber,
            Ticks = buffer.Ticks,
            LapStartedAt = lapStartedAt,
            SkipReason = skipReason
        };

        if (context.EarlyCompletes.TryRemove(lapNumber, out var early))
            job.Complete = early;
        else
            context.PendingJobs[lapNumber] = job;

        if (!_lapJobChannel.Writer.TryWrite(job))
            _logger.LogWarning("Lap job channel full — dropping lap {Lap} for session {SessionId}", lapNumber, context.SessionId);

        await Task.CompletedTask;
    }

    private LapBuffer NewBuffer(TelemetrySessionContext context)
    {
        var buffer = new LapBuffer();
        _bufferRegistry.Register(context.SessionId, buffer);
        return buffer;
    }

    private void StartNewBuffer(TelemetrySessionContext context, int newLap, TickV2 firstTick)
    {
        var buffer = new LapBuffer();
        buffer.Add(firstTick);
        context.Buffer = buffer;
        _bufferRegistry.Register(context.SessionId, buffer);
        context.CurrentLap = newLap;
        context.CurrentLapStartedAt = DateTimeOffset.FromUnixTimeMilliseconds(firstTick.T).UtcDateTime;
    }

    private static LapCompleteInfo ParseLapCompleteInfo(JsonElement payload)
    {
        int lap = payload.TryGetProperty("lap", out var lapProp) && lapProp.ValueKind == JsonValueKind.Number ? lapProp.GetInt32() : 0;
        int lapTimeMs = payload.TryGetProperty("lapTimeMs", out var ltProp) && ltProp.ValueKind == JsonValueKind.Number ? ltProp.GetInt32() : 0;

        int[]? sectorsMs = null;
        if (payload.TryGetProperty("sectorsMs", out var sProp) && sProp.ValueKind == JsonValueKind.Array)
            sectorsMs = sProp.EnumerateArray().Where(e => e.ValueKind == JsonValueKind.Number).Select(e => e.GetInt32()).ToArray();

        bool? valid = payload.TryGetProperty("valid", out var vProp)
            ? vProp.ValueKind switch { JsonValueKind.True => true, JsonValueKind.False => false, _ => (bool?)null }
            : null;

        bool pit = payload.TryGetProperty("pit", out var pProp) && pProp.ValueKind == JsonValueKind.True;
        float? lapDistM = payload.TryGetProperty("lapDistM", out var ldProp) && ldProp.ValueKind == JsonValueKind.Number ? ldProp.GetSingle() : null;
        float? fuelUsedL = payload.TryGetProperty("fuelUsedL", out var fuProp) && fuProp.ValueKind == JsonValueKind.Number ? fuProp.GetSingle() : null;
        int? tyreCompound = payload.TryGetProperty("tyreCompound", out var tcProp) && tcProp.ValueKind == JsonValueKind.Number ? tcProp.GetInt32() : null;

        return new LapCompleteInfo
        {
            Lap = lap,
            LapTimeMs = lapTimeMs,
            SectorsMs = sectorsMs,
            Valid = valid,
            Pit = pit,
            LapDistM = lapDistM,
            FuelUsedL = fuelUsedL,
            TyreCompound = tyreCompound
        };
    }

    // ==================================================================================
    // Shared (v1 + v2) session lifecycle
    // ==================================================================================

    /// <summary>Called by <see cref="LapProcessingWorker"/> once a lap job is done (or given up on) so a lap_complete that never showed up doesn't leak a PendingJobs entry.</summary>
    public void RemovePendingJob(Guid sessionId, int lapNumber)
    {
        if (_activeSessions.TryGetValue(sessionId, out var context))
            context.PendingJobs.TryRemove(lapNumber, out _);
    }

    // Called by the sweeper to close stale sessions
    public async Task SweepSessionAsync(Guid sessionId)
    {
        if (_activeSessions.TryRemove(sessionId, out var context))
        {
            _userToSession.TryRemove(context.UserId, out _);
            if (context.SchemaVersion == 2)
            {
                await FlushOpenBufferIfSignificantAsync(context);
                _bufferRegistry.Unregister(sessionId);
            }
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

            double distanceKm = context.TrackLengthM is > 0 ? context.TrackLengthM.Value / 1000.0 : 5.0;
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
