using System.Security.Cryptography;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public enum LapUploadOutcome { Queued, Duplicate, Conflict, Invalid, QueueFull }

public sealed record LapUploadResult(LapUploadOutcome Outcome, Guid? UploadId = null, int? LapNumber = null, string? Error = null);

public sealed record LapStatusDto(int LapNumber, string Status, int? LapTimeMs, bool? IsValid, string? Error);

/// <summary>
/// HCR-007 — local-first upload: Link records every lap and sends each one when it closes. The lap is
/// fed into the same <see cref="ILapProcessor"/> pipeline live laps use, so an uploaded lap and a
/// streamed lap produce identical rows. Retries are idempotent; another user's session id is refused.
/// </summary>
public class LapUploadService
{
    private readonly TurnOneDbContext _db;
    private readonly ITelemetrySessionService _sessions;
    private readonly TelemetryIngestionService _ingestion;
    private readonly ILogger<LapUploadService> _logger;

    public LapUploadService(TurnOneDbContext db, ITelemetrySessionService sessions, TelemetryIngestionService ingestion, ILogger<LapUploadService> logger)
    {
        _db = db;
        _sessions = sessions;
        _ingestion = ingestion;
        _logger = logger;
    }

    public async Task<LapUploadResult> UploadLapAsync(Guid userId, PlanType plan, Guid? deviceId, string idempotencyKey, byte[] body)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey) || idempotencyKey.Length > 200)
            return new(LapUploadOutcome.Invalid, Error: "Idempotency-Key header is required.");

        var previous = await _db.LapUploads.AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId && u.IdempotencyKey == idempotencyKey);
        if (previous != null)
            return new(LapUploadOutcome.Duplicate, previous.Id, previous.LapNumber);

        ParsedLapUpload parsed;
        try
        {
            parsed = LapUploadParser.Parse(body);
        }
        catch (LapUploadParser.UploadFormatException ex)
        {
            return new(LapUploadOutcome.Invalid, Error: ex.Message);
        }

        var owner = await _sessions.GetSessionOwnerAsync(parsed.SessionId);
        if (owner is { } o && o != userId)
            return new(LapUploadOutcome.Conflict, Error: "This session belongs to another account.");

        var request = TelemetryIngestionService.BuildSessionStartV2(
            parsed.SessionId, userId, plan, TelemetryMode.Normal, parsed.SessionStart, parsed.SessionStartTimestamp);
        await _sessions.StartOrUpsertSessionV2Async(request);

        var upload = new LapUpload
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DeviceId = deviceId,
            SessionId = parsed.SessionId,
            LapNumber = parsed.Complete.Lap,
            IdempotencyKey = idempotencyKey,
            ContentHash = Convert.ToHexString(SHA256.HashData(body)),
            SizeBytes = body.Length,
            TickCount = parsed.Ticks.Count,
            ReceivedAt = DateTime.UtcNow,
        };

        // The live stream may already have produced this lap; keep that one (HCR-007 §Behaviour 3).
        var alreadyProcessed = await _db.TelemetryLaps.AnyAsync(l =>
            l.SessionId == parsed.SessionId && l.LapNumber == parsed.Complete.Lap &&
            l.ProcessingStatus == LapProcessingStatus.Processed);

        if (alreadyProcessed)
        {
            upload.Status = "duplicate";
        }
        else
        {
            var job = new LapJob
            {
                Track = new LapTrackContext
                {
                    SessionId = parsed.SessionId,
                    UserId = userId,
                    Plan = plan,
                    Source = request.Source,
                    TrackId = request.TrackId,
                    TrackName = request.TrackName,
                    TrackLengthM = request.TrackLengthM,
                    SectorCount = request.SectorCount,
                    CarId = request.CarId,
                },
                LapNumber = parsed.Complete.Lap,
                Ticks = parsed.Ticks,
                Complete = parsed.Complete,
                LapStartedAt = DateTimeOffset.FromUnixTimeMilliseconds(parsed.Ticks[0].T).UtcDateTime,
            };

            if (!_ingestion.EnqueueUploadedLap(job))
            {
                _logger.LogWarning("Lap job queue full — upload of lap {Lap} for session {SessionId} refused", job.LapNumber, job.Track.SessionId);
                return new(LapUploadOutcome.QueueFull, Error: "Server is busy, retry shortly.");
            }
        }

        _db.LapUploads.Add(upload);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Two retries raced with the same key; the other one won.
            return new(LapUploadOutcome.Duplicate, LapNumber: parsed.Complete.Lap);
        }

        return new(alreadyProcessed ? LapUploadOutcome.Duplicate : LapUploadOutcome.Queued, upload.Id, upload.LapNumber);
    }

    /// <summary>Closes an uploaded session and reports which of the laps Link holds the server has no record of.</summary>
    public async Task<(LapUploadOutcome Outcome, List<int> Missing)> EndSessionAsync(Guid userId, Guid sessionId, DateTime endedAt, int lapsCompleted, int bestLapMs, IReadOnlyCollection<int> clientLaps)
    {
        var owner = await _sessions.GetSessionOwnerAsync(sessionId);
        if (owner == null) return (LapUploadOutcome.Invalid, new());
        if (owner != userId) return (LapUploadOutcome.Conflict, new());

        await _sessions.EndSessionAsync(sessionId, endedAt, lapsCompleted, bestLapMs);

        var known = await _db.TelemetryLaps.Where(l => l.SessionId == sessionId).Select(l => l.LapNumber)
            .Union(_db.LapUploads.Where(u => u.SessionId == sessionId && u.UserId == userId).Select(u => u.LapNumber))
            .ToListAsync();
        var missing = clientLaps.Except(known).OrderBy(x => x).ToList();
        return (LapUploadOutcome.Queued, missing);
    }

    public async Task<List<LapStatusDto>?> GetStatusAsync(Guid userId, Guid sessionId)
    {
        var owner = await _sessions.GetSessionOwnerAsync(sessionId);
        if (owner != userId) return null;

        var laps = await _db.TelemetryLaps.AsNoTracking()
            .Where(l => l.SessionId == sessionId)
            .Select(l => new { l.LapNumber, l.ProcessingStatus, l.LapTimeMs, l.IsValid, l.ProcessingError })
            .ToListAsync();
        var pending = await _db.LapUploads.AsNoTracking()
            .Where(u => u.SessionId == sessionId && u.UserId == userId)
            .Select(u => u.LapNumber)
            .ToListAsync();

        var result = laps.Select(l => new LapStatusDto(
            l.LapNumber, l.ProcessingStatus.ToString().ToLowerInvariant(), l.LapTimeMs, l.IsValid, l.ProcessingError)).ToList();
        result.AddRange(pending.Except(laps.Select(l => l.LapNumber)).Distinct()
            .Select(n => new LapStatusDto(n, "queued", null, null, null)));
        return result.OrderBy(r => r.LapNumber).ToList();
    }
}
