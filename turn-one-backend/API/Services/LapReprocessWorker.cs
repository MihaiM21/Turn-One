using System.Threading.Channels;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure;
using Infrastructure.Data;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

/// <summary>
/// Drains the reprocess-job channel: resolves which sessions/laps a request covers, then reprocesses
/// them one session at a time (newest first), pulling raw ticks back out of the archive and handing
/// them to <see cref="ILapProcessor"/> exactly as live ingestion would. See Task C4 in the lap-telemetry
/// API work item and <c>docs/architecture/sim-telemetry-protocol-v2.md</c>.
/// </summary>
public class LapReprocessWorker : BackgroundService
{
    private static readonly TimeSpan InterLapDelay = TimeSpan.FromMilliseconds(50);

    private readonly Channel<ReprocessJob> _channel;
    private readonly LapReprocessJobStore _store;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<LapReprocessWorker> _logger;

    public LapReprocessWorker(
        Channel<ReprocessJob> channel,
        LapReprocessJobStore store,
        IServiceScopeFactory scopeFactory,
        ILogger<LapReprocessWorker> logger)
    {
        _channel = channel;
        _store = store;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Lap Reprocess Worker started");

        while (!stoppingToken.IsCancellationRequested)
        {
            ReprocessJob job;
            try
            {
                job = await _channel.Reader.ReadAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            try
            {
                await RunJobAsync(job, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Reprocess job {JobId} failed", job.JobId);
                _store.Update(job.JobId, s =>
                {
                    s.State = "Failed";
                    s.LastError = ex.Message;
                    s.FinishedAt = DateTime.UtcNow;
                });
            }
        }
    }

    private async Task RunJobAsync(ReprocessJob job, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TurnOneDbContext>();
        var tickRepo = scope.ServiceProvider.GetRequiredService<ITelemetryTickRepository>();
        var processor = scope.ServiceProvider.GetRequiredService<ILapProcessor>();

        var req = job.Request;
        IQueryable<TelemetrySession> query = db.TelemetrySessions.Include(s => s.TrackProfile);
        if (job.RestrictToUser is { } uid) query = query.Where(s => s.UserId == uid);
        if (req.SessionIds is { Length: > 0 } ids) query = query.Where(s => ids.Contains(s.Id));
        if (req.From is { } from) query = query.Where(s => s.StartedAt >= from);
        if (req.To is { } to) query = query.Where(s => s.StartedAt <= to);

        var sessions = await query.OrderByDescending(s => s.StartedAt).ToListAsync(ct);

        _store.Update(job.JobId, s =>
        {
            s.State = "Running";
            s.SessionsTotal = sessions.Count;
        });

        foreach (var session in sessions)
        {
            if (ct.IsCancellationRequested) break;
            await ReprocessSessionAsync(session, req, db, tickRepo, processor, job.JobId, ct);
            _store.Update(job.JobId, s => s.SessionsDone++);
        }

        _store.Update(job.JobId, s =>
        {
            s.State = "Completed";
            s.FinishedAt = DateTime.UtcNow;
        });
    }

    private async Task ReprocessSessionAsync(
        TelemetrySession session,
        Application.DTOs.ReprocessRequestDto req,
        TurnOneDbContext db,
        ITelemetryTickRepository tickRepo,
        ILapProcessor processor,
        Guid jobId,
        CancellationToken ct)
    {
        var laps = await db.TelemetryLaps
            .Where(l => l.SessionId == session.Id)
            .Where(l => req.Force || l.ProcessingStatus == LapProcessingStatus.Legacy || l.ProcessingStatus == LapProcessingStatus.Failed)
            .OrderBy(l => l.LapNumber)
            .ToListAsync(ct);
        if (laps.Count == 0) return;

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == session.UserId, ct);
        var plan = user?.Plan ?? PlanType.BASIC;
        var isLegacy = session.SchemaVersion == 1;

        // v2 lap bounds are derived once per session (index i == lap number i+1: v2 lap numbering starts at 1
        // and increments contiguously, so the i-th ascending bound belongs to lap i+1).
        List<(DateTime start, DateTime end)>? v2Bounds = null;
        if (!isLegacy) v2Bounds = await tickRepo.GetV2LapBoundsAsync(session.Id);

        float? legacyLength = session.TrackLengthM ?? session.TrackProfile?.LengthM;
        if (legacyLength is <= 0) legacyLength = null;
        legacyLength ??= AccTrackLengths.Lookup(session.TrackId);

        foreach (var lap in laps)
        {
            if (ct.IsCancellationRequested) break;
            try
            {
                var lapJob = await BuildJobAsync(session, lap, isLegacy, plan, legacyLength, v2Bounds, tickRepo, ct);
                if (lapJob == null)
                {
                    _store.Update(jobId, s => s.LapsFailed++);
                    continue;
                }

                var result = await processor.ProcessAsync(lapJob, ct);
                _store.Update(jobId, s =>
                {
                    if (result.Status == LapProcessingStatus.Failed) s.LapsFailed++;
                    else s.LapsProcessed++;
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Reprocess failed for session {SessionId} lap {Lap}", session.Id, lap.LapNumber);
                _store.Update(jobId, s =>
                {
                    s.LapsFailed++;
                    s.LastError = ex.Message;
                });
            }

            try { await Task.Delay(InterLapDelay, ct); } catch (OperationCanceledException) { break; }
        }
    }

    private static async Task<LapJob?> BuildJobAsync(
        TelemetrySession session,
        TelemetryLap lap,
        bool isLegacy,
        PlanType plan,
        float? legacyLength,
        List<(DateTime start, DateTime end)>? v2Bounds,
        ITelemetryTickRepository tickRepo,
        CancellationToken ct)
    {
        var track = new LapTrackContext
        {
            SessionId = session.Id,
            UserId = session.UserId,
            Plan = plan,
            Source = session.Source,
            TrackId = session.TrackId,
            TrackName = session.Track,
            TrackLengthM = session.TrackLengthM,
            SectorCount = session.SectorCount,
            CarId = session.CarId,
        };

        if (isLegacy)
        {
            var (start, end) = await tickRepo.GetLapBoundsAsync(plan, session.Id, lap.LapNumber);
            if (start == null || end == null) return null;

            var raw = await tickRepo.GetLapTicksRawAsync(session.Id, start.Value, end.Value);
            if (raw.Count == 0) return null;

            var ticks = LegacyTickAdapter.Convert(raw, legacyLength);
            if (ticks.Count < 2) return null;

            return new LapJob
            {
                Track = track,
                LapNumber = lap.LapNumber,
                Ticks = ticks,
                LapStartedAt = start.Value,
                LapTimeOverrideMs = lap.LapTimeMs,
                IsLegacy = true,
            };
        }

        if (v2Bounds == null || lap.LapNumber < 1 || lap.LapNumber > v2Bounds.Count) return null;
        var bound = v2Bounds[lap.LapNumber - 1];

        var rawTicks = await tickRepo.GetLapTicksRawAsync(session.Id, bound.start, bound.end);
        var tickRows = rawTicks.Where(t => t.MsgType == Domain.Telemetry.ChannelRegistry.Tick).OrderBy(t => t.Time).ToList();
        if (tickRows.Count < 2) return null;

        var v2Ticks = tickRows.Select(ToTickV2).ToList();

        // The raw archive has no lap_complete frame; carry the sim-authoritative timing the row
        // already holds so a reprocess never degrades lap/sector times to the tick clock.
        Application.Telemetry.LapCompleteInfo? stored = null;
        if (lap.LapTimeMs is > 0)
        {
            var sectors = lap.SectorsMs;
            stored = new Application.Telemetry.LapCompleteInfo
            {
                Lap = lap.LapNumber,
                LapTimeMs = lap.LapTimeMs.Value,
                SectorsMs = sectors.All(v => v is > 0) ? sectors.Select(v => v!.Value).ToArray() : null,
                Valid = null,
                Pit = lap.Kind is LapKind.Pit or LapKind.InLap or LapKind.OutLap,
            };
        }

        return new LapJob
        {
            Track = track,
            LapNumber = lap.LapNumber,
            Ticks = v2Ticks,
            LapStartedAt = bound.start,
            LapTimeOverrideMs = lap.LapTimeMs,
            Complete = stored,
            IsLegacy = false,
        };
    }

    private static Application.Telemetry.TickV2 ToTickV2(RawTick raw)
    {
        var tick = Application.Telemetry.TickV2.Empty(new DateTimeOffset(raw.Time, TimeSpan.Zero).ToUnixTimeMilliseconds());
        foreach (var (key, value) in raw.Fields)
            if (Application.Telemetry.TickLayout.TryOrdinal(key, out var ordinal))
                tick.V[ordinal] = (float)value;
        return tick;
    }
}
