using System.Buffers.Binary;
using System.IO.Compression;
using Application.Interfaces;
using Application.Telemetry;
using Domain.Entities;
using Domain.Enums;
using Domain.Telemetry;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Turns one lap's ticks into persisted analysis: normalise the distance axis, resample onto the 2 m
/// grid, summarise, detect corners, match them to the track's reference set, and write
/// <see cref="TelemetryLap"/> + <see cref="LapTelemetry"/> + <see cref="LapCorner"/> rows in one transaction.
/// All maths lives in <c>Application/Telemetry</c>; this class only orchestrates and persists.
/// </summary>
public class LapProcessor : ILapProcessor
{
    /// <summary>Bump when the algorithm changes in a way that should trigger reprocessing.</summary>
    public const int Version = 1;

    private readonly TurnOneDbContext _db;
    private readonly ILogger<LapProcessor> _logger;

    public LapProcessor(TurnOneDbContext db, ILogger<LapProcessor> logger)
    {
        _db = db;
        _logger = logger;
    }

    public int ProcessorVersion => Version;

    public async Task<LapProcessResult> ProcessAsync(LapJob job, CancellationToken ct = default)
    {
        LapProcessResult result;
        try
        {
            result = await ProcessCoreAsync(job, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lap processor failed for session {SessionId} lap {Lap}", job.Track.SessionId, job.LapNumber);
            result = await MarkFailedAsync(job, Truncate(ex.Message), ct);
        }
        job.Completion?.TrySetResult(result);
        return result;
    }

    private async Task<LapProcessResult> ProcessCoreAsync(LapJob job, CancellationToken ct)
    {
        var track = job.Track;
        var session = await _db.TelemetrySessions
            .Include(s => s.TrackProfile)
            .FirstOrDefaultAsync(s => s.Id == track.SessionId, ct)
            ?? throw new InvalidOperationException($"Session {track.SessionId} not found");

        // Resolve / create the track profile so corners can be matched across laps.
        var profile = session.TrackProfile ?? await ResolveProfileAsync(session, track, ct);

        var lap = await _db.TelemetryLaps
            .Include(l => l.Telemetry)
            .Include(l => l.Corners)
            .FirstOrDefaultAsync(l => l.SessionId == session.Id && l.LapNumber == job.LapNumber, ct);
        var isNewLap = lap == null;
        lap ??= new TelemetryLap { Id = Guid.NewGuid(), SessionId = session.Id, LapNumber = job.LapNumber, RecordedAt = DateTime.UtcNow };
        lap.LapStartedAt = job.LapStartedAt == default ? lap.LapStartedAt : job.LapStartedAt;
        lap.ProcessorVersion = Version;

        if (job.SkipReason != null)
        {
            lap.ProcessingStatus = LapProcessingStatus.Skipped;
            lap.ProcessingError = Truncate(job.SkipReason);
            lap.Kind = job.SkipReason.Contains("overflow", StringComparison.OrdinalIgnoreCase) ? LapKind.Partial : LapKind.Aborted;
            lap.IsValid = false;
            if (isNewLap) _db.TelemetryLaps.Add(lap);
            await _db.SaveChangesAsync(ct);
            return new LapProcessResult(lap.Id, lap.ProcessingStatus, lap.Kind, false, lap.LapTimeMs, 0, lap.ProcessingError);
        }

        var trackLength = FirstPositive(track.TrackLengthM, session.TrackLengthM, profile?.LengthM);
        if (trackLength is null && track.Source == SimSource.Acc)
            trackLength = Infrastructure.Data.AccTrackLengths.Lookup(track.TrackId);
        var normalized = LapDistanceNormalizer.Normalize(job.Ticks, trackLength);

        if (normalized.Kind == LapKind.Aborted || normalized.Ticks.Count < 2)
        {
            lap.ProcessingStatus = LapProcessingStatus.Skipped;
            lap.ProcessingError = Truncate(normalized.Reason ?? "aborted");
            lap.Kind = LapKind.Aborted;
            lap.IsValid = false;
            lap.LapDistanceM = normalized.LengthM;
            if (isNewLap) _db.TelemetryLaps.Add(lap);
            await _db.SaveChangesAsync(ct);
            return new LapProcessResult(lap.Id, lap.ProcessingStatus, lap.Kind, false, lap.LapTimeMs, 0, lap.ProcessingError);
        }

        // Self-calibrate an unknown track length from the first full lap that has sim distance.
        if (trackLength is null or <= 0 && normalized.DistanceSource == DistanceSource.LapDistance && normalized.LengthM > 500)
            trackLength = normalized.LengthM;

        var samples = LapResampler.Resample(normalized);
        var summary = LapSummaryCalculator.Compute(samples, normalized, job.Complete, track.Source, job.LapTimeOverrideMs);

        var options = ResolveDetectorOptions(track.Source, profile);
        var corners = CornerDetector.Detect(samples, options);

        // --- track profile: reference corners, sector boundaries, length ---
        if (profile != null)
        {
            var reference = TrackProfileBuilder.ParseReference(profile.ReferenceCorners);
            // A lap teaches the profile once, when it is first processed — reprocessing must not double-count it.
            var feedsProfile = isNewLap && summary.IsValid && summary.Kind == LapKind.Flying && corners.Count > 0 && !job.IsLegacy;

            if (feedsProfile && profile.Status != TrackProfileStatus.Curated)
            {
                var samplesSet = TrackProfileBuilder.ParseSamples(profile.CornerSamples);
                TrackProfileBuilder.AddSample(samplesSet, corners);
                profile.LapSampleCount++;

                if (reference.Count == 0)
                {
                    reference = TrackProfileBuilder.FromSingleLap(corners);
                    profile.ReferenceCorners = TrackProfileBuilder.SerializeReference(reference);
                }
                else if (profile.Status == TrackProfileStatus.Provisional && profile.LapSampleCount >= TrackProfileBuilder.StableAfterLaps)
                {
                    var rebuilt = TrackProfileBuilder.Rebuild(samplesSet, profile.LengthM);
                    if (rebuilt.Count > 0)
                    {
                        reference = rebuilt;
                        profile.ReferenceCorners = TrackProfileBuilder.SerializeReference(reference);
                        profile.Status = TrackProfileStatus.Stable;
                        profile.Version++;
                        profile.CornerSamples = null;
                    }
                }

                if (profile.Status == TrackProfileStatus.Provisional)
                    profile.CornerSamples = TrackProfileBuilder.SerializeSamples(samplesSet);

                if (summary.SectorBoundariesM.Length == profile.SectorCount - 1 && profile.SectorBoundariesM.Length == 0)
                    profile.SectorBoundariesM = summary.SectorBoundariesM;

                if (profile.LengthM <= 0 && trackLength is > 0) profile.LengthM = trackLength.Value;

                if (profile.Centerline == null && samples.Has(ChannelRegistry.PosX) && samples.Has(ChannelRegistry.PosY))
                    profile.Centerline = EncodeCenterline(samples);

                profile.UpdatedAt = DateTime.UtcNow;
            }

            TrackProfileBuilder.Match(corners, reference);
        }

        // --- persist ---
        var (data, index, rawBytes) = LapChannelCodec.Encode(
            PlanFilter(samples, track.Plan),
            new LapContainerMeta { Quality = job.IsLegacy ? "legacy" : null, Gaps = normalized.Gaps, Coverage = normalized.Coverage });

        ApplySummary(lap, summary);
        lap.ProcessingStatus = LapProcessingStatus.Processed;
        lap.ProcessingError = null;

        if (lap.Telemetry == null)
        {
            lap.Telemetry = new LapTelemetry { Id = Guid.NewGuid(), TelemetryLapId = lap.Id };
            _db.LapTelemetries.Add(lap.Telemetry);
        }
        var tel = lap.Telemetry;
        tel.SessionId = session.Id;
        tel.StepM = samples.StepM;
        tel.SampleCount = samples.Count;
        tel.Codec = LapChannelCodec.CodecFloat32Brotli;
        tel.DistanceSource = normalized.DistanceSource;
        tel.ChannelIndex = index;
        tel.Data = data;
        tel.UncompressedBytes = rawBytes;
        tel.ProcessorVersion = Version;
        tel.CreatedAt = DateTime.UtcNow;

        if (lap.Corners.Count > 0) _db.LapCorners.RemoveRange(lap.Corners);
        // Add explicitly: entities reached through the navigation with a pre-set Guid key would be
        // inferred as Modified (→ UPDATE of rows that don't exist) when the lap is already tracked.
        var newCorners = corners.Select(c => ToEntity(c, lap, session.Id, profile)).ToList();
        lap.Corners = newCorners;
        _db.LapCorners.AddRange(newCorners);

        if (isNewLap) _db.TelemetryLaps.Add(lap);

        // Session aggregates from valid laps only.
        if (lap.IsValid && lap.LapTimeMs is > 0 && (session.BestLapMs <= 0 || lap.LapTimeMs < session.BestLapMs))
            session.BestLapMs = lap.LapTimeMs.Value;
        if (lap.LapNumber > session.LapCount) session.LapCount = lap.LapNumber;
        if (session.TrackLengthM is null or <= 0 && trackLength is > 0) session.TrackLengthM = trackLength;
        if (session.TrackProfileId == null && profile != null) session.TrackProfileId = profile.Id;

        if (isNewLap && !job.IsLegacy)
            await BumpSimUserAsync(session.UserId, summary, ct);

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Processed lap {Lap} of {Session}: {Kind}, valid={Valid}, {Time} ms, {Corners} corners, {Bytes} B",
            lap.LapNumber, session.Id, lap.Kind, lap.IsValid, lap.LapTimeMs, corners.Count, data.Length);

        return new LapProcessResult(lap.Id, lap.ProcessingStatus, lap.Kind, lap.IsValid, lap.LapTimeMs, corners.Count, null);
    }

    public async Task ApplyLapCompleteAsync(Guid sessionId, LapCompleteInfo complete, CancellationToken ct = default)
    {
        var lap = await _db.TelemetryLaps.FirstOrDefaultAsync(l => l.SessionId == sessionId && l.LapNumber == complete.Lap, ct);
        if (lap == null) return;

        if (complete.LapTimeMs > 0) lap.LapTimeMs = complete.LapTimeMs;
        if (complete.SectorsMs is { Length: >= 3 })
        {
            lap.Sector1Ms = complete.SectorsMs[0];
            lap.Sector2Ms = complete.SectorsMs[1];
            lap.Sector3Ms = complete.SectorsMs[2];
        }
        if (complete.Valid is { } v) lap.IsValid = v && lap.Kind == LapKind.Flying;
        if (complete.FuelUsedL is > 0) lap.FuelUsed = complete.FuelUsedL.Value;

        var session = await _db.TelemetrySessions.FirstOrDefaultAsync(s => s.Id == sessionId, ct);
        if (session != null && lap.IsValid && lap.LapTimeMs is > 0 && (session.BestLapMs <= 0 || lap.LapTimeMs < session.BestLapMs))
            session.BestLapMs = lap.LapTimeMs.Value;

        await _db.SaveChangesAsync(ct);
    }

    // ---------------------------------------------------------------------------------------------

    private async Task<TrackProfile?> ResolveProfileAsync(TelemetrySession session, LapTrackContext track, CancellationToken ct)
    {
        var trackId = track.TrackId ?? session.TrackId;
        if (string.IsNullOrWhiteSpace(trackId)) return null;

        var profile = await _db.TrackProfiles.FirstOrDefaultAsync(p => p.Source == track.Source && p.TrackId == trackId, ct);
        if (profile == null)
        {
            profile = new TrackProfile
            {
                Id = Guid.NewGuid(),
                Source = track.Source,
                TrackId = trackId,
                DisplayName = track.TrackName ?? session.Track,
                LengthM = FirstPositive(track.TrackLengthM, session.TrackLengthM) ?? 0,
                SectorCount = (short)(track.SectorCount ?? session.SectorCount ?? 3),
                Status = TrackProfileStatus.Provisional,
            };
            _db.TrackProfiles.Add(profile);
        }
        session.TrackProfileId = profile.Id;
        session.TrackProfile = profile;
        return profile;
    }

    private static CornerDetectorOptions ResolveDetectorOptions(SimSource source, TrackProfile? profile)
    {
        var options = CornerDetectorOptions.ForSource(source);
        if (string.IsNullOrWhiteSpace(profile?.DetectorOverrides)) return options;
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(profile.DetectorOverrides);
            var root = doc.RootElement;
            float F(string name, float fallback) => root.TryGetProperty(name, out var p) && p.TryGetSingle(out var v) ? v : fallback;
            return new CornerDetectorOptions
            {
                EnterG = F("enterG", options.EnterG),
                ExitG = F("exitG", options.ExitG),
                MinCornerM = F("minCornerM", options.MinCornerM),
                MergeGapM = F("mergeGapM", options.MergeGapM),
                BrakeSearchM = F("brakeSearchM", options.BrakeSearchM),
            };
        }
        catch
        {
            return options;
        }
    }

    /// <summary>BASIC laps store only the channels that plan may read; storage cost follows the plan.</summary>
    private static LapSamples PlanFilter(LapSamples samples, PlanType plan)
    {
        if (plan >= PlanType.PRO) return samples;
        var allowed = ChannelRegistry.V2AllowedFor(plan);
        return samples.Select(allowed);
    }

    private static void ApplySummary(TelemetryLap lap, LapSummary s)
    {
        lap.LapTimeMs = s.LapTimeMs ?? lap.LapTimeMs;
        if (s.SectorsMs.Length >= 3)
        {
            lap.Sector1Ms = s.SectorsMs[0] ?? lap.Sector1Ms;
            lap.Sector2Ms = s.SectorsMs[1] ?? lap.Sector2Ms;
            lap.Sector3Ms = s.SectorsMs[2] ?? lap.Sector3Ms;
        }
        lap.IsValid = s.IsValid;
        lap.Kind = s.Kind;
        lap.MaxSpeedKmh = s.MaxSpeedKmh;
        lap.MaxRpm = s.MaxRpm;
        lap.AverageThrottle = s.AverageThrottle;
        lap.AverageBrake = s.AverageBrake;
        lap.FuelUsed = s.FuelUsedL;
        lap.LapDistanceM = s.LapDistanceM;
        lap.AverageSpeedKmh = s.AverageSpeedKmh;
        lap.MinSpeedKmh = s.MinSpeedKmh;
        lap.FullThrottlePct = s.FullThrottlePct;
        lap.BrakingPct = s.BrakingPct;
        lap.CoastingPct = s.CoastingPct;
        lap.PeakGLat = s.PeakGLat;
        lap.PeakGLong = s.PeakGLong;
        lap.GearShifts = s.GearShifts;
        lap.BrakingScore = s.BrakingScore ?? lap.BrakingScore;
        lap.ThrottleScore = s.ThrottleScore ?? lap.ThrottleScore;
        lap.ConsistencyScore = s.ConsistencyScore ?? lap.ConsistencyScore;
    }

    private static LapCorner ToEntity(DetectedCorner c, TelemetryLap lap, Guid sessionId, TrackProfile? profile) => new()
    {
        Id = Guid.NewGuid(),
        TelemetryLapId = lap.Id,
        SessionId = sessionId,
        TrackProfileId = profile?.Id,
        ProfileVersion = profile?.Version,
        CornerIndex = (short)c.Index,
        RefCornerIndex = (short?)c.RefIndex,
        Direction = (short)c.Direction,
        IsKink = c.IsKink,
        Source = c.Source,
        EntryM = c.EntryM,
        ApexM = c.ApexM,
        ExitM = c.ExitM,
        BrakingPointM = c.BrakingPointM,
        BrakeReleaseM = c.BrakeReleaseM,
        ThrottleOnM = c.ThrottleOnM,
        FullThrottleM = c.FullThrottleM,
        EntrySpeedKmh = c.EntrySpeedKmh,
        MinSpeedKmh = c.MinSpeedKmh,
        ExitSpeedKmh = c.ExitSpeedKmh,
        PeakBrake = c.PeakBrake,
        PeakGLat = c.PeakGLat,
        GearAtApex = (short)c.GearAtApex,
        MinGear = (short)c.MinGear,
        TimeInCornerMs = c.TimeInCornerMs,
        BrakeToThrottleMs = c.BrakeToThrottleMs,
        TrailBrakeM = c.TrailBrakeM,
    };

    private async Task BumpSimUserAsync(Guid userId, LapSummary summary, CancellationToken ct)
    {
        var simUser = await _db.SimUsers.FirstOrDefaultAsync(u => u.UserId == userId, ct);
        if (simUser == null) return;
        simUser.TotalDistanceKm += summary.LapDistanceM / 1000.0;
        simUser.TotalPlayTimeSeconds += (summary.LapTimeMs ?? 0) / 1000;
        if (summary.MaxSpeedKmh > simUser.HighestSpeedKmh) simUser.HighestSpeedKmh = summary.MaxSpeedKmh;
        simUser.TotalLaps++;
        simUser.LastSessionAt = DateTime.UtcNow;
    }

    private async Task<LapProcessResult> MarkFailedAsync(LapJob job, string error, CancellationToken ct)
    {
        try
        {
            _db.ChangeTracker.Clear();
            var lap = await _db.TelemetryLaps.FirstOrDefaultAsync(l => l.SessionId == job.Track.SessionId && l.LapNumber == job.LapNumber, ct);
            if (lap == null)
            {
                lap = new TelemetryLap { Id = Guid.NewGuid(), SessionId = job.Track.SessionId, LapNumber = job.LapNumber };
                _db.TelemetryLaps.Add(lap);
            }
            lap.ProcessingStatus = LapProcessingStatus.Failed;
            lap.ProcessingError = error;
            lap.ProcessorVersion = Version;
            await _db.SaveChangesAsync(ct);
            return new LapProcessResult(lap.Id, LapProcessingStatus.Failed, lap.Kind, lap.IsValid, lap.LapTimeMs, 0, error);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Could not record lap processing failure for {Session}/{Lap}", job.Track.SessionId, job.LapNumber);
            return new LapProcessResult(Guid.Empty, LapProcessingStatus.Failed, LapKind.Aborted, false, null, 0, error);
        }
    }

    /// <summary>XY polyline at 5 m spacing as float32 pairs, Brotli-compressed.</summary>
    private static byte[] EncodeCenterline(LapSamples s)
    {
        var x = s.Get(ChannelRegistry.PosX)!;
        var y = s.Get(ChannelRegistry.PosY)!;
        var stride = Math.Max(1, (int)MathF.Round(5f / s.StepM));
        var n = (s.Count + stride - 1) / stride;
        var raw = new byte[n * 2 * sizeof(float)];
        for (var i = 0; i < n; i++)
        {
            var src = i * stride;
            BinaryPrimitives.WriteSingleLittleEndian(raw.AsSpan(i * 8, 4), x[src]);
            BinaryPrimitives.WriteSingleLittleEndian(raw.AsSpan(i * 8 + 4, 4), y[src]);
        }
        using var ms = new MemoryStream();
        using (var br = new BrotliStream(ms, CompressionLevel.Optimal, leaveOpen: true)) br.Write(raw);
        return ms.ToArray();
    }

    public static float[]? DecodeCenterline(byte[]? blob)
    {
        if (blob == null || blob.Length == 0) return null;
        using var input = new MemoryStream(blob);
        using var br = new BrotliStream(input, CompressionMode.Decompress);
        using var output = new MemoryStream();
        br.CopyTo(output);
        var raw = output.ToArray();
        var result = new float[raw.Length / 4];
        for (var i = 0; i < result.Length; i++) result[i] = BinaryPrimitives.ReadSingleLittleEndian(raw.AsSpan(i * 4, 4));
        return result;
    }

    private static float? FirstPositive(params float?[] values) => values.FirstOrDefault(v => v is > 0);

    private static string Truncate(string s) => s.Length <= 200 ? s : s[..200];
}
