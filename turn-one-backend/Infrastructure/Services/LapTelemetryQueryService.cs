using System.Text;
using Application.DTOs;
using Application.Interfaces;
using Application.Telemetry;
using Domain.Entities;
using Domain.Enums;
using Domain.Telemetry;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class LapTelemetryQueryService : ILapTelemetryQueryService
{
    private static readonly int[] AllowedSteps = { 2, 4, 6, 10 };

    private readonly TurnOneDbContext _db;

    public LapTelemetryQueryService(TurnOneDbContext db)
    {
        _db = db;
    }

    // ---------------------------------------------------------------------------------------- lap telemetry

    public async Task<LapQueryResult<LapTelemetryDto>> GetLapTelemetryAsync(Guid userId, PlanType plan, Guid lapId, string[]? channels, int step, CancellationToken ct = default)
    {
        var lap = await _db.TelemetryLaps
            .Include(l => l.Session)
            .Include(l => l.Telemetry)
            .Include(l => l.Corners)
            .FirstOrDefaultAsync(l => l.Id == lapId, ct);
        if (lap == null) return LapQueryResult<LapTelemetryDto>.NotFound();
        return await BuildLapTelemetryAsync(lap, userId, plan, channels, step, ct);
    }

    public async Task<LapQueryResult<LapTelemetryDto>> GetLapTelemetryAsync(Guid userId, PlanType plan, Guid sessionId, int lapNumber, string[]? channels, int step, CancellationToken ct = default)
    {
        var lap = await _db.TelemetryLaps
            .Include(l => l.Session)
            .Include(l => l.Telemetry)
            .Include(l => l.Corners)
            .FirstOrDefaultAsync(l => l.SessionId == sessionId && l.LapNumber == lapNumber, ct);
        if (lap == null) return LapQueryResult<LapTelemetryDto>.NotFound();
        return await BuildLapTelemetryAsync(lap, userId, plan, channels, step, ct);
    }

    private async Task<LapQueryResult<LapTelemetryDto>> BuildLapTelemetryAsync(TelemetryLap lap, Guid userId, PlanType plan, string[]? channels, int step, CancellationToken ct)
    {
        if (!IsVisible(lap.Session, userId, plan)) return LapQueryResult<LapTelemetryDto>.NotFound();
        if (!AllowedSteps.Contains(step)) return LapQueryResult<LapTelemetryDto>.BadRequest($"step must be one of {string.Join(",", AllowedSteps)}");
        if (lap.Telemetry == null) return LapQueryResult<LapTelemetryDto>.NotFound("lap has no processed telemetry", lap.ProcessingStatus);

        var tel = lap.Telemetry;
        var decimate = Math.Max(1, (int)MathF.Round(step / tel.StepM));

        var index = LapChannelCodec.ParseIndex(tel.ChannelIndex);
        var storedKeys = index.Channels.Select(c => c.Key).ToHashSet(StringComparer.Ordinal);

        HashSet<string> wanted;
        if (channels is { Length: > 0 })
        {
            wanted = ChannelRegistry.ResolveAllowed(plan, channels).Select(d => d.Key).ToHashSet(StringComparer.Ordinal);
        }
        else
        {
            wanted = ChannelRegistry.V2AllowedFor(plan).Where(storedKeys.Contains).ToHashSet(StringComparer.Ordinal);
        }
        wanted.Add(ChannelRegistry.TimeMs);

        var samples = LapChannelCodec.Decode(tel.Data, tel.ChannelIndex, tel.StepM, tel.SampleCount, wanted, decimate);

        TrackProfile? profile = lap.Session.TrackProfileId != null
            ? await _db.TrackProfiles.FirstOrDefaultAsync(p => p.Id == lap.Session.TrackProfileId, ct)
            : null;
        var reference = profile != null ? TrackProfileBuilder.ParseReference(profile.ReferenceCorners) : new List<ReferenceCorner>();

        var dto = new LapTelemetryDto
        {
            LapId = lap.Id,
            SessionId = lap.SessionId,
            LapNumber = lap.LapNumber,
            StepM = samples.StepM,
            SampleCount = samples.Count,
            LapLengthM = lap.LapDistanceM ?? samples.LengthM,
            DistanceSource = tel.DistanceSource.ToString(),
            Quality = index.Meta.Quality,
            TrackProfileId = lap.Session.TrackProfileId,
            ProfileVersion = profile?.Version,
            Channels = ToFloatNullableDict(samples),
            Corners = lap.Corners.OrderBy(c => c.CornerIndex).Select(c => ToCornerDto(c, reference)).ToArray(),
            Summary = ToSummaryDto(lap),
        };

        return LapQueryResult<LapTelemetryDto>.Ok(dto);
    }

    // ---------------------------------------------------------------------------------------- overlay

    public async Task<LapQueryResult<LapOverlayDto>> GetOverlayAsync(Guid userId, PlanType plan, Guid[] lapIds, Guid? refLapId, string[]? channels, int step, CancellationToken ct = default)
    {
        if (lapIds.Length == 0) return LapQueryResult<LapOverlayDto>.BadRequest("no laps requested");
        var maxLaps = plan == PlanType.BASIC ? 2 : 8;
        if (lapIds.Length > maxLaps) return LapQueryResult<LapOverlayDto>.Forbidden($"{maxLaps} laps max on your plan");
        if (!AllowedSteps.Contains(step)) return LapQueryResult<LapOverlayDto>.BadRequest($"step must be one of {string.Join(",", AllowedSteps)}");

        var laps = await _db.TelemetryLaps
            .Include(l => l.Session)
            .Include(l => l.Telemetry)
            .Include(l => l.Corners)
            .Where(l => lapIds.Contains(l.Id))
            .ToListAsync(ct);
        if (laps.Count != lapIds.Distinct().Count()) return LapQueryResult<LapOverlayDto>.NotFound("one or more laps not found");

        // Preserve caller order.
        laps = lapIds.Select(id => laps.First(l => l.Id == id)).ToList();

        foreach (var lap in laps)
        {
            if (!IsVisible(lap.Session, userId, plan)) return LapQueryResult<LapOverlayDto>.NotFound();
            if (plan == PlanType.BASIC && lap.Session.UserId != userId) return LapQueryResult<LapOverlayDto>.Forbidden("BASIC plan can only overlay your own sessions");
            if (lap.Telemetry == null) return LapQueryResult<LapOverlayDto>.NotFound($"lap {lap.Id} has no processed telemetry", lap.ProcessingStatus);
        }

        // Same-track rule.
        var profileIds = laps.Select(l => l.Session.TrackProfileId).Distinct().ToList();
        if (profileIds.Count > 1)
        {
            if (profileIds.Any(p => p != null))
                return LapQueryResult<LapOverlayDto>.BadRequest("laps are from different tracks");
        }
        if (profileIds.Count == 1 && profileIds[0] == null)
        {
            var sourceTrackPairs = laps.Select(l => (l.Session.Source, TrackId: l.Session.TrackId ?? l.Session.Track)).Distinct().ToList();
            if (sourceTrackPairs.Count > 1)
                return LapQueryResult<LapOverlayDto>.BadRequest("laps are from different tracks");
        }

        var refId = refLapId is { } r && lapIds.Contains(r) ? r : lapIds[0];
        var refLap = laps.First(l => l.Id == refId);

        var decimate = Math.Max(1, (int)MathF.Round(step / refLap.Telemetry!.StepM));

        var decodedByLap = new Dictionary<Guid, LapSamples>();
        foreach (var lap in laps)
        {
            var tel = lap.Telemetry!;
            var index = LapChannelCodec.ParseIndex(tel.ChannelIndex);
            var storedKeys = index.Channels.Select(c => c.Key).ToHashSet(StringComparer.Ordinal);
            HashSet<string> wanted = channels is { Length: > 0 }
                ? ChannelRegistry.ResolveAllowed(plan, channels).Select(d => d.Key).ToHashSet(StringComparer.Ordinal)
                : ChannelRegistry.V2AllowedFor(plan).Where(storedKeys.Contains).ToHashSet(StringComparer.Ordinal);
            wanted.Add(ChannelRegistry.TimeMs);
            var lapDecimate = Math.Max(1, (int)MathF.Round(step / tel.StepM));
            decodedByLap[lap.Id] = LapChannelCodec.Decode(tel.Data, tel.ChannelIndex, tel.StepM, tel.SampleCount, wanted, lapDecimate);
        }

        var sampleCount = decodedByLap.Values.Min(s => s.Count);
        var stepM = decodedByLap[refId].StepM;

        // Slice every lap's channels to the shared sample count.
        LapSamples Sliced(LapSamples s) => s.Count == sampleCount ? s : new LapSamples(s.StepM, sampleCount, s.Channels.ToDictionary(kv => kv.Key, kv => kv.Value.Take(sampleCount).ToArray(), StringComparer.Ordinal));
        foreach (var id in decodedByLap.Keys.ToList()) decodedByLap[id] = Sliced(decodedByLap[id]);

        var refSliced = decodedByLap[refId];

        var lengthMismatch = false;
        var lengths = laps.Select(l => l.Session.TrackLengthM).Where(v => v is > 0).Select(v => v!.Value).ToList();
        if (lengths.Count > 1)
        {
            var min = lengths.Min(); var max = lengths.Max();
            lengthMismatch = (max - min) / min > 0.01f;
        }

        TrackProfile? profile = null;
        var trackProfileId = laps.Select(l => l.Session.TrackProfileId).FirstOrDefault(p => p != null);
        if (trackProfileId != null) profile = await _db.TrackProfiles.FirstOrDefaultAsync(p => p.Id == trackProfileId, ct);
        var reference = profile != null ? TrackProfileBuilder.ParseReference(profile.ReferenceCorners) : new List<ReferenceCorner>();

        var entries = new List<LapOverlayEntryDto>();
        var allChannelKeys = decodedByLap.Values.SelectMany(s => s.Channels.Keys).Distinct(StringComparer.Ordinal).ToArray();
        foreach (var lap in laps)
        {
            var samples = decodedByLap[lap.Id];
            var index = LapChannelCodec.ParseIndex(lap.Telemetry!.ChannelIndex);
            float?[]? delta = null;
            if (lap.Id != refId)
            {
                var raw = LapMath.DeltaMs(samples, refSliced);
                delta = raw.Select(v => float.IsNaN(v) ? (float?)null : v).ToArray();
            }

            entries.Add(new LapOverlayEntryDto
            {
                LapId = lap.Id,
                SessionId = lap.SessionId,
                LapNumber = lap.LapNumber,
                LapTimeMs = lap.LapTimeMs,
                SectorsMs = lap.SectorsMs,
                IsValid = lap.IsValid,
                Kind = lap.Kind.ToString(),
                SessionStartedAt = lap.Session.StartedAt,
                Car = lap.Session.CarModel,
                Driver = lap.Session.DriverName,
                Quality = index.Meta.Quality,
                Channels = ToFloatNullableDict(samples),
                DeltaMs = delta,
                Corners = lap.Corners.OrderBy(c => c.CornerIndex).Select(c => ToCornerDto(c, reference)).ToArray(),
            });
        }

        var dto = new LapOverlayDto
        {
            StepM = stepM,
            SampleCount = sampleCount,
            RefLapId = refId,
            Track = profile != null ? ToTrackProfileDto(profile) : null,
            LengthMismatch = lengthMismatch,
            Channels = allChannelKeys,
            Laps = entries.ToArray(),
        };
        return LapQueryResult<LapOverlayDto>.Ok(dto);
    }

    // ---------------------------------------------------------------------------------------- corners

    public async Task<LapQueryResult<LapCornerDto[]>> GetLapCornersAsync(Guid userId, PlanType plan, Guid lapId, CancellationToken ct = default)
    {
        var lap = await _db.TelemetryLaps.Include(l => l.Session).Include(l => l.Corners).FirstOrDefaultAsync(l => l.Id == lapId, ct);
        if (lap == null || !IsVisible(lap.Session, userId, plan)) return LapQueryResult<LapCornerDto[]>.NotFound();

        var reference = new List<ReferenceCorner>();
        if (lap.Session.TrackProfileId != null)
        {
            var profile = await _db.TrackProfiles.FirstOrDefaultAsync(p => p.Id == lap.Session.TrackProfileId, ct);
            if (profile != null) reference = TrackProfileBuilder.ParseReference(profile.ReferenceCorners);
        }

        var corners = lap.Corners.OrderBy(c => c.CornerIndex).Select(c => ToCornerDto(c, reference)).ToArray();
        return LapQueryResult<LapCornerDto[]>.Ok(corners);
    }

    public async Task<LapQueryResult<CornerCompareDto>> CompareCornersAsync(Guid userId, PlanType plan, Guid[] lapIds, CancellationToken ct = default)
    {
        if (lapIds.Length == 0) return LapQueryResult<CornerCompareDto>.BadRequest("no laps requested");

        var laps = await _db.TelemetryLaps.Include(l => l.Session).Include(l => l.Corners).Where(l => lapIds.Contains(l.Id)).ToListAsync(ct);
        if (laps.Count != lapIds.Distinct().Count()) return LapQueryResult<CornerCompareDto>.NotFound("one or more laps not found");
        laps = lapIds.Select(id => laps.First(l => l.Id == id)).ToList();

        foreach (var lap in laps)
            if (!IsVisible(lap.Session, userId, plan)) return LapQueryResult<CornerCompareDto>.NotFound();

        TrackProfile? profile = null;
        var trackProfileId = laps.Select(l => l.Session.TrackProfileId).FirstOrDefault(p => p != null);
        if (trackProfileId != null) profile = await _db.TrackProfiles.FirstOrDefaultAsync(p => p.Id == trackProfileId, ct);
        var reference = profile != null ? TrackProfileBuilder.ParseReference(profile.ReferenceCorners) : new List<ReferenceCorner>();

        var refIndexes = laps.SelectMany(l => l.Corners).Select(c => c.RefCornerIndex).Where(i => i != null).Select(i => i!.Value).Distinct().OrderBy(i => i).ToList();

        var rows = new List<CornerCompareRowDto>();
        foreach (var refIndex in refIndexes)
        {
            var perLap = laps.Select(l => l.Corners.FirstOrDefault(c => c.RefCornerIndex == refIndex)).ToArray();
            var perLapDto = perLap.Select(c => c == null ? null : ToCornerDto(c, reference)).ToArray();
            var name = reference.FirstOrDefault(r => r.Index == refIndex)?.Name;
            var baseline = perLapDto[0]?.TimeInCornerMs;
            var deltas = perLapDto.Select(c => c == null || baseline == null ? (int?)null : c.TimeInCornerMs - baseline).ToArray();
            rows.Add(new CornerCompareRowDto { RefIndex = refIndex, Name = name, PerLap = perLapDto, DeltaTimeInCornerMs = deltas });
        }

        if (laps.Count == 1)
        {
            var unmatched = laps[0].Corners.Where(c => c.RefCornerIndex == null).OrderBy(c => c.CornerIndex).ToList();
            foreach (var c in unmatched)
            {
                var dto = ToCornerDto(c, reference);
                rows.Add(new CornerCompareRowDto
                {
                    RefIndex = -1 - c.CornerIndex,
                    Name = null,
                    PerLap = new[] { dto },
                    DeltaTimeInCornerMs = new int?[] { null },
                });
            }
        }

        var result = new CornerCompareDto
        {
            Track = profile != null ? ToTrackProfileDto(profile) : null,
            LapIds = lapIds,
            Rows = rows.ToArray(),
        };
        return LapQueryResult<CornerCompareDto>.Ok(result);
    }

    // ---------------------------------------------------------------------------------------- tracks

    public async Task<MyTrackDto[]> GetMyTracksAsync(Guid userId, CancellationToken ct = default)
    {
        var sessions = await _db.TelemetrySessions
            .Where(s => s.UserId == userId && s.TrackProfileId != null)
            .ToListAsync(ct);

        var byProfile = sessions.GroupBy(s => s.TrackProfileId!.Value).ToList();
        var result = new List<MyTrackDto>();

        foreach (var group in byProfile)
        {
            var profile = await _db.TrackProfiles.FirstOrDefaultAsync(p => p.Id == group.Key, ct);
            if (profile == null) continue;

            var sessionIds = group.Select(s => s.Id).ToList();
            var laps = await _db.TelemetryLaps.Where(l => sessionIds.Contains(l.SessionId)).ToListAsync(ct);
            var validLaps = laps.Where(l => l.IsValid && l.LapTimeMs is > 0).OrderBy(l => l.LapTimeMs).ToList();
            var best = validLaps.FirstOrDefault();

            result.Add(new MyTrackDto
            {
                Profile = ToTrackProfileDto(profile),
                SessionCount = group.Count(),
                LapCount = laps.Count,
                ValidLapCount = validLaps.Count,
                BestLapMs = best?.LapTimeMs,
                BestLapId = best?.Id,
                LastDrivenAt = group.Max(s => s.LastSeenAt ?? s.StartedAt),
                Cars = group.Select(s => s.CarModel).Where(c => !string.IsNullOrWhiteSpace(c)).Distinct().ToArray(),
            });
        }

        return result.OrderByDescending(t => t.LastDrivenAt).ToArray();
    }

    public async Task<LapQueryResult<TrackProfileDto>> GetTrackProfileAsync(Guid profileId, CancellationToken ct = default)
    {
        var profile = await _db.TrackProfiles.FirstOrDefaultAsync(p => p.Id == profileId, ct);
        return profile == null ? LapQueryResult<TrackProfileDto>.NotFound() : LapQueryResult<TrackProfileDto>.Ok(ToTrackProfileDto(profile));
    }

    public async Task<LapQueryResult<TrackProfileDto>> GetTrackProfileAsync(string source, string trackId, CancellationToken ct = default)
    {
        var sourceEnum = WireEnums.ParseSource(source);
        var profile = await _db.TrackProfiles.FirstOrDefaultAsync(p => p.Source == sourceEnum && p.TrackId == trackId, ct);
        return profile == null ? LapQueryResult<TrackProfileDto>.NotFound() : LapQueryResult<TrackProfileDto>.Ok(ToTrackProfileDto(profile));
    }

    public async Task<LapQueryResult<TrackLapsPageDto>> GetTrackLapsAsync(
        Guid userId, PlanType plan, Guid profileId,
        bool? valid, string? kind, string? car,
        int limit, string? cursor, bool includePublic,
        CancellationToken ct = default)
    {
        limit = Math.Clamp(limit <= 0 ? 200 : limit, 1, 500);

        var query = _db.TelemetryLaps
            .Include(l => l.Session)
            .Where(l => l.Session.TrackProfileId == profileId)
            .Where(l => l.Session.UserId == userId || (includePublic && l.Session.Visibility == TelemetryVisibility.Public && plan >= PlanType.PRO));

        if (valid.HasValue) query = query.Where(l => l.IsValid == valid.Value);
        if (!string.IsNullOrWhiteSpace(kind) && Enum.TryParse<LapKind>(kind, true, out var kindEnum)) query = query.Where(l => l.Kind == kindEnum);
        if (!string.IsNullOrWhiteSpace(car)) query = query.Where(l => l.Session.CarModel == car);

        (long startedAtTicks, int lapNumber, Guid sessionId)? after = ParseCursor(cursor);
        if (after is { } a)
        {
            query = query.Where(l =>
                l.Session.StartedAt.Ticks < a.startedAtTicks
                || (l.Session.StartedAt.Ticks == a.startedAtTicks && l.LapNumber < a.lapNumber)
                || (l.Session.StartedAt.Ticks == a.startedAtTicks && l.LapNumber == a.lapNumber && l.SessionId != a.sessionId && string.Compare(l.SessionId.ToString(), a.sessionId.ToString()) < 0));
        }

        var laps = await query
            .OrderByDescending(l => l.Session.StartedAt).ThenByDescending(l => l.LapNumber)
            .Take(limit + 1)
            .ToListAsync(ct);

        var hasMore = laps.Count > limit;
        var page = laps.Take(limit).ToList();

        // Quality (from lap telemetry channel index), cheap: project the index only.
        var lapIds = page.Select(l => l.Id).ToList();
        var indexByLap = await _db.LapTelemetries
            .Where(t => lapIds.Contains(t.TelemetryLapId))
            .Select(t => new { t.TelemetryLapId, t.ChannelIndex })
            .ToListAsync(ct);
        var qualityByLap = indexByLap.ToDictionary(x => x.TelemetryLapId, x => LapChannelCodec.ParseIndex(x.ChannelIndex).Meta.Quality);

        var items = page.Select(l => new TrackLapListItemDto
        {
            LapId = l.Id,
            SessionId = l.SessionId,
            LapNumber = l.LapNumber,
            SessionStartedAt = l.Session.StartedAt,
            Car = l.Session.CarModel,
            CarId = l.Session.CarId,
            Driver = l.Session.DriverName,
            SessionKind = l.Session.SessionKind.ToString(),
            LapTimeMs = l.LapTimeMs,
            SectorsMs = l.SectorsMs,
            IsValid = l.IsValid,
            Kind = l.Kind.ToString(),
            HasTelemetry = l.ProcessingStatus == LapProcessingStatus.Processed,
            Quality = qualityByLap.TryGetValue(l.Id, out var q) ? q : null,
            IsMine = l.Session.UserId == userId,
        }).ToArray();

        string? nextCursor = null;
        if (hasMore && page.Count > 0)
        {
            var last = page[^1];
            nextCursor = MakeCursor(last.Session.StartedAt.Ticks, last.LapNumber, last.SessionId);
        }

        return LapQueryResult<TrackLapsPageDto>.Ok(new TrackLapsPageDto { Items = items, NextCursor = nextCursor });
    }

    // ---------------------------------------------------------------------------------------- helpers

    private static bool IsVisible(TelemetrySession session, Guid userId, PlanType plan) =>
        session.UserId == userId || (session.Visibility == TelemetryVisibility.Public && plan >= PlanType.PRO);

    private static string MakeCursor(long startedAtTicks, int lapNumber, Guid sessionId) =>
        System.Convert.ToBase64String(Encoding.UTF8.GetBytes($"{startedAtTicks}:{lapNumber}:{sessionId}"));

    private static (long startedAtTicks, int lapNumber, Guid sessionId)? ParseCursor(string? cursor)
    {
        if (string.IsNullOrWhiteSpace(cursor)) return null;
        try
        {
            var raw = Encoding.UTF8.GetString(System.Convert.FromBase64String(cursor));
            var parts = raw.Split(':', 3);
            if (parts.Length != 3) return null;
            return (long.Parse(parts[0]), int.Parse(parts[1]), Guid.Parse(parts[2]));
        }
        catch
        {
            return null;
        }
    }

    private static Dictionary<string, float?[]> ToFloatNullableDict(LapSamples samples) =>
        samples.Channels.ToDictionary(
            kv => kv.Key,
            kv => kv.Value.Select(v => float.IsNaN(v) ? (float?)null : v).ToArray(),
            StringComparer.Ordinal);

    public static TrackProfileDto ToTrackProfileDto(TrackProfile profile)
    {
        var reference = TrackProfileBuilder.ParseReference(profile.ReferenceCorners);
        return new TrackProfileDto
        {
            Id = profile.Id,
            Source = WireEnums.SourceName(profile.Source),
            TrackId = profile.TrackId,
            DisplayName = profile.DisplayName,
            Status = profile.Status.ToString(),
            LengthM = profile.LengthM,
            SectorCount = profile.SectorCount,
            SectorBoundariesM = profile.SectorBoundariesM,
            Corners = reference.Select(r => new ReferenceCornerDto
            {
                Index = r.Index,
                Name = r.Name,
                EntryM = r.EntryM,
                ApexM = r.ApexM,
                ExitM = r.ExitM,
                Direction = r.Direction,
                IsKink = r.IsKink,
            }).ToArray(),
            Version = profile.Version,
            LapSampleCount = profile.LapSampleCount,
            Centerline = LapProcessor.DecodeCenterline(profile.Centerline),
        };
    }

    private static LapCornerDto ToCornerDto(LapCorner c, List<ReferenceCorner> reference) => new()
    {
        Index = c.CornerIndex,
        RefIndex = c.RefCornerIndex,
        Name = c.RefCornerIndex is { } ri ? reference.FirstOrDefault(r => r.Index == ri)?.Name : null,
        Direction = c.Direction,
        IsKink = c.IsKink,
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
        GearAtApex = c.GearAtApex,
        MinGear = c.MinGear,
        TimeInCornerMs = c.TimeInCornerMs,
        BrakeToThrottleMs = c.BrakeToThrottleMs,
        TrailBrakeM = c.TrailBrakeM,
    };

    private static LapSummaryDto ToSummaryDto(TelemetryLap l) => new()
    {
        LapTimeMs = l.LapTimeMs,
        SectorsMs = l.SectorsMs,
        IsValid = l.IsValid,
        Kind = l.Kind.ToString(),
        LapDistanceM = l.LapDistanceM,
        AverageSpeedKmh = l.AverageSpeedKmh,
        MaxSpeedKmh = l.MaxSpeedKmh,
        MinSpeedKmh = l.MinSpeedKmh,
        AverageThrottle = l.AverageThrottle,
        AverageBrake = l.AverageBrake,
        FullThrottlePct = l.FullThrottlePct,
        BrakingPct = l.BrakingPct,
        CoastingPct = l.CoastingPct,
        FuelUsed = l.FuelUsed,
        GearShifts = l.GearShifts,
        PeakGLat = l.PeakGLat,
        PeakGLong = l.PeakGLong,
        BrakingScore = l.BrakingScore,
        ThrottleScore = l.ThrottleScore,
        ConsistencyScore = l.ConsistencyScore,
    };
}
