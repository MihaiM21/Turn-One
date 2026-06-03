using Application.Interfaces;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class LapAnalyticsService : ILapAnalyticsService
{
    private readonly TurnOneDbContext _context;
    private readonly ITelemetryTickRepository _ticks;
    private readonly ILogger<LapAnalyticsService> _logger;

    public LapAnalyticsService(
        TurnOneDbContext context,
        ITelemetryTickRepository ticks,
        ILogger<LapAnalyticsService> logger)
    {
        _context = context;
        _ticks = ticks;
        _logger = logger;
    }

    public async Task<LapMetrics?> ComputeLapMetricsAsync(PlanType plan, Guid sessionId, int lapNumber, bool persist = true)
    {
        var lap = await _context.TelemetryLaps
            .FirstOrDefaultAsync(l => l.SessionId == sessionId && l.LapNumber == lapNumber);
        if (lap == null) return null;

        var bestLap = await _context.TelemetryLaps
            .Where(l => l.SessionId == sessionId && l.IsValid && l.LapTimeMs != null && l.LapTimeMs > 0)
            .OrderBy(l => l.LapTimeMs)
            .FirstOrDefaultAsync();

        var (start, end) = await _ticks.GetLapBoundsAsync(plan, sessionId, lapNumber);

        var channels = new[]
        {
            TelemetryChannels.Brake,
            TelemetryChannels.Gas,
            TelemetryChannels.SpeedKmh
        };

        var data = (start != null && end != null)
            ? await _ticks.GetSessionChannelsAsync(plan, sessionId, channels, start, end)
            : new MultiChannelChart { Channels = channels.ToList() };

        var metrics = new LapMetrics
        {
            LapNumber = lap.LapNumber,
            LapTimeMs = lap.LapTimeMs,
            BrakingScore = ComputeBrakingScore(data),
            ThrottleScore = ComputeThrottleScore(data),
            ConsistencyScore = ComputeConsistencyScore(data),
            DeltaToBestMs = (bestLap != null && lap.LapTimeMs.HasValue && bestLap.LapTimeMs.HasValue)
                ? lap.LapTimeMs - bestLap.LapTimeMs
                : null,
            Sector1DeltaMs = (bestLap?.Sector1Ms != null && lap.Sector1Ms != null) ? lap.Sector1Ms - bestLap.Sector1Ms : null,
            Sector2DeltaMs = (bestLap?.Sector2Ms != null && lap.Sector2Ms != null) ? lap.Sector2Ms - bestLap.Sector2Ms : null,
            Sector3DeltaMs = (bestLap?.Sector3Ms != null && lap.Sector3Ms != null) ? lap.Sector3Ms - bestLap.Sector3Ms : null,
        };

        if (persist)
        {
            lap.BrakingScore = metrics.BrakingScore;
            lap.ThrottleScore = metrics.ThrottleScore;
            lap.ConsistencyScore = metrics.ConsistencyScore;
            await _context.SaveChangesAsync();
        }

        return metrics;
    }

    public async Task<List<LapMetrics>> ComputeSessionMetricsAsync(PlanType plan, Guid sessionId)
    {
        var lapNumbers = await _context.TelemetryLaps
            .Where(l => l.SessionId == sessionId)
            .OrderBy(l => l.LapNumber)
            .Select(l => l.LapNumber)
            .ToListAsync();

        var results = new List<LapMetrics>();
        foreach (var n in lapNumbers)
        {
            var m = await ComputeLapMetricsAsync(plan, sessionId, n, persist: true);
            if (m != null) results.Add(m);
        }
        return results;
    }

    // Braking score: rewards strong (>0.6), short, decisive brake applications;
    // penalises trailing/feathered braking variance during release.
    private static float ComputeBrakingScore(MultiChannelChart data)
    {
        var brakes = data.Points
            .Select(p => p.Values.TryGetValue(TelemetryChannels.Brake, out var v) ? v : null)
            .Where(v => v.HasValue)
            .Select(v => v!.Value)
            .ToList();

        if (brakes.Count < 8) return 50f;

        var avgPeak = brakes.Where(b => b > 0.6).DefaultIfEmpty(0).Average();
        var feather = SlidingStdDev(brakes, 5);
        var score = (float)Math.Clamp((avgPeak * 100) - (feather * 60), 0, 100);
        return score;
    }

    // Throttle score: rewards smooth, progressive throttle application
    // (low first-derivative variance when applying).
    private static float ComputeThrottleScore(MultiChannelChart data)
    {
        var gas = data.Points
            .Select(p => p.Values.TryGetValue(TelemetryChannels.Gas, out var v) ? v : null)
            .Where(v => v.HasValue)
            .Select(v => v!.Value)
            .ToList();

        if (gas.Count < 8) return 50f;

        var deltas = new List<double>();
        for (int i = 1; i < gas.Count; i++) deltas.Add(Math.Abs(gas[i] - gas[i - 1]));
        var jitter = deltas.DefaultIfEmpty(0).Average();
        var score = (float)Math.Clamp(100 - jitter * 250, 0, 100);
        return score;
    }

    // Consistency score: low overall speed variance relative to mean.
    private static float ComputeConsistencyScore(MultiChannelChart data)
    {
        var speed = data.Points
            .Select(p => p.Values.TryGetValue(TelemetryChannels.SpeedKmh, out var v) ? v : null)
            .Where(v => v.HasValue)
            .Select(v => v!.Value)
            .ToList();

        if (speed.Count < 8) return 50f;

        var mean = speed.Average();
        if (mean <= 1) return 0;
        var variance = speed.Average(s => (s - mean) * (s - mean));
        var coeff = Math.Sqrt(variance) / mean;
        var score = (float)Math.Clamp(100 - coeff * 200, 0, 100);
        return score;
    }

    private static double SlidingStdDev(List<double> values, int window)
    {
        if (values.Count < window) return 0;
        var stddevs = new List<double>();
        for (int i = 0; i + window <= values.Count; i++)
        {
            var slice = values.GetRange(i, window);
            var m = slice.Average();
            var v = slice.Average(x => (x - m) * (x - m));
            stddevs.Add(Math.Sqrt(v));
        }
        return stddevs.DefaultIfEmpty(0).Average();
    }
}
