using Domain.Enums;
using Domain.Telemetry;

namespace Application.Telemetry;

/// <summary>Sim-authoritative lap timing from a <c>lap_complete</c> frame, when one arrived.</summary>
public sealed class LapCompleteInfo
{
    public int Lap { get; init; }
    public int LapTimeMs { get; init; }
    public int[]? SectorsMs { get; init; }
    public bool? Valid { get; init; }
    public bool Pit { get; init; }
    public float? LapDistM { get; init; }
    public float? FuelUsedL { get; init; }
    public int? TyreCompound { get; init; }
}

public sealed class LapSummary
{
    public int? LapTimeMs { get; init; }
    /// <summary>Sector times, ms. Null entries when unknown.</summary>
    public int?[] SectorsMs { get; init; } = Array.Empty<int?>();
    /// <summary>Distances (m) at which sector 2, 3, … began on this lap — feeds the track profile.</summary>
    public float[] SectorBoundariesM { get; init; } = Array.Empty<float>();
    public bool IsValid { get; init; }
    public LapKind Kind { get; init; }
    public float LapDistanceM { get; init; }
    public float AverageThrottle { get; init; }
    public float AverageBrake { get; init; }
    public float FullThrottlePct { get; init; }
    public float BrakingPct { get; init; }
    public float CoastingPct { get; init; }
    public float MaxSpeedKmh { get; init; }
    public float MinSpeedKmh { get; init; }
    public float AverageSpeedKmh { get; init; }
    public int MaxRpm { get; init; }
    public float FuelUsedL { get; init; }
    public int GearShifts { get; init; }
    public float PeakGLat { get; init; }
    public float PeakGLong { get; init; }
    public float? BrakingScore { get; init; }
    public float? ThrottleScore { get; init; }
    public float? ConsistencyScore { get; init; }
}

public static class LapSummaryCalculator
{
    public static LapSummary Compute(LapSamples s, NormalizedLap lap, LapCompleteInfo? complete, SimSource source, int? lapTimeOverrideMs = null)
    {
        var time = s.Get(ChannelRegistry.TimeMs) ?? Array.Empty<float>();
        var speed = s.Get(ChannelRegistry.Speed);
        var throttle = s.Get(ChannelRegistry.Throttle);
        var brake = s.Get(ChannelRegistry.Brake);
        var gear = s.Get(ChannelRegistry.Gear);
        var rpm = s.Get(ChannelRegistry.Rpm);
        var gLat = s.Get(ChannelRegistry.GLat);
        var gLong = s.Get(ChannelRegistry.GLong);
        var sector = s.Get(ChannelRegistry.Sector);
        var fuel = s.Get(ChannelRegistry.Fuel);
        var valid = s.Get(ChannelRegistry.Valid);
        var n = s.Count;

        // --- timing ---
        int? lapTimeMs = complete?.LapTimeMs > 0 ? complete.LapTimeMs
            : lapTimeOverrideMs > 0 ? lapTimeOverrideMs
            : time.Length > 0 ? (int)MathF.Round(time[^1]) : null;

        var boundaries = new List<float>();
        if (sector != null) FindBoundaries(sector, s.StepM, boundaries);
        var sectors = complete?.SectorsMs is { Length: > 0 } cs
            ? cs.Select(v => (int?)v).ToArray()
            : DeriveSectors(sector, time, lapTimeMs);

        // --- pedals ---
        float sumT = 0, sumB = 0; int full = 0, braking = 0, coasting = 0, cnt = 0;
        for (var i = 0; i < n; i++)
        {
            var t = throttle != null ? throttle[i] : float.NaN;
            var b = brake != null ? brake[i] : float.NaN;
            if (float.IsNaN(t) && float.IsNaN(b)) continue;
            cnt++;
            var tt = float.IsNaN(t) ? 0 : t;
            var bb = float.IsNaN(b) ? 0 : b;
            sumT += tt; sumB += bb;
            if (tt > 0.95f) full++;
            if (bb > 0.05f) braking++;
            var moving = speed == null || float.IsNaN(speed[i]) || speed[i] > 30f;
            if (tt < 0.05f && bb < 0.05f && moving) coasting++;
        }
        var pct = (int x) => cnt == 0 ? 0f : 100f * x / cnt;

        // --- speed / rpm / g ---
        float maxSpeed = 0, minSpeed = float.MaxValue, maxRpm = 0, peakLat = 0, peakLong = 0;
        for (var i = 0; i < n; i++)
        {
            if (speed != null && !float.IsNaN(speed[i])) { maxSpeed = MathF.Max(maxSpeed, speed[i]); minSpeed = MathF.Min(minSpeed, speed[i]); }
            if (rpm != null && !float.IsNaN(rpm[i])) maxRpm = MathF.Max(maxRpm, rpm[i]);
            if (gLat != null && !float.IsNaN(gLat[i])) peakLat = MathF.Max(peakLat, MathF.Abs(gLat[i]));
            if (gLong != null && !float.IsNaN(gLong[i])) peakLong = MathF.Max(peakLong, MathF.Abs(gLong[i]));
        }
        if (minSpeed == float.MaxValue) minSpeed = 0;

        // --- gear shifts ---
        var shifts = 0;
        if (gear != null)
            for (var i = 1; i < n; i++)
                if (!float.IsNaN(gear[i]) && !float.IsNaN(gear[i - 1]) && gear[i] != gear[i - 1] && gear[i] > 0 && gear[i - 1] > 0) shifts++;

        // --- fuel ---
        var fuelUsed = complete?.FuelUsedL ?? 0f;
        if (fuelUsed <= 0 && fuel != null)
        {
            var first = fuel.FirstOrDefault(v => !float.IsNaN(v), float.NaN);
            var last = fuel.LastOrDefault(v => !float.IsNaN(v), float.NaN);
            if (!float.IsNaN(first) && !float.IsNaN(last))
            {
                var used = first - last;
                if (used is >= 0 and < 20) fuelUsed = used;
            }
        }

        // --- validity ---
        bool? tickValid = null;
        if (valid != null)
        {
            var any = valid.Any(v => !float.IsNaN(v));
            if (any) tickValid = valid.Where(v => !float.IsNaN(v)).All(v => v >= 0.5f);
        }
        var declaredValid = complete?.Valid ?? tickValid ?? (source == SimSource.IRacing ? lap.Kind == LapKind.Flying : false);
        var isValid = declaredValid && lap.Kind == LapKind.Flying && lap.Coverage >= LapDistanceNormalizer.MinCoverage;

        var lengthM = lap.LengthM;
        var avgSpeed = lapTimeMs is > 0 ? lengthM / (lapTimeMs.Value / 1000f) * 3.6f : 0f;

        return new LapSummary
        {
            LapTimeMs = lapTimeMs,
            SectorsMs = sectors,
            SectorBoundariesM = boundaries.ToArray(),
            IsValid = isValid,
            Kind = lap.Kind,
            LapDistanceM = lengthM,
            AverageThrottle = cnt == 0 ? 0 : sumT / cnt,
            AverageBrake = cnt == 0 ? 0 : sumB / cnt,
            FullThrottlePct = pct(full),
            BrakingPct = pct(braking),
            CoastingPct = pct(coasting),
            MaxSpeedKmh = maxSpeed,
            MinSpeedKmh = minSpeed,
            AverageSpeedKmh = avgSpeed,
            MaxRpm = (int)maxRpm,
            FuelUsedL = fuelUsed,
            GearShifts = shifts,
            PeakGLat = peakLat,
            PeakGLong = peakLong,
            BrakingScore = brake == null ? null : BrakingScore(brake),
            ThrottleScore = throttle == null ? null : ThrottleScore(throttle),
            ConsistencyScore = speed == null ? null : ConsistencyScore(speed),
        };
    }

    /// <summary>Sector times from sector-index transitions on the grid; last sector = lap time − sum of the others.</summary>
    private static int?[] DeriveSectors(float[]? sector, float[] time, int? lapTimeMs)
    {
        if (sector == null || time.Length == 0) return new int?[] { null, null, null };

        var starts = new List<float>();
        var prev = -1f;
        for (var i = 0; i < sector.Length; i++)
        {
            var v = sector[i];
            if (float.IsNaN(v)) continue;
            if (prev >= 0 && v > prev) starts.Add(time[i]);
            prev = v;
        }
        if (starts.Count == 0) return new int?[] { null, null, null };

        var result = new List<int?>();
        var prevT = 0f;
        foreach (var t in starts)
        {
            result.Add((int)MathF.Round(t - prevT));
            prevT = t;
        }
        result.Add(lapTimeMs is > 0 ? (int?)MathF.Round(lapTimeMs.Value - prevT) : null);
        return result.ToArray();
    }

    private static void FindBoundaries(float[] sector, float stepM, List<float> boundaries)
    {
        var prev = -1f;
        for (var i = 0; i < sector.Length; i++)
        {
            var v = sector[i];
            if (float.IsNaN(v)) continue;
            if (prev >= 0 && v > prev) boundaries.Add(i * stepM);
            prev = v;
        }
    }

    // ---- scores (0..100) — same formulas as the legacy LapAnalyticsService, now over the distance grid ----

    private static float? BrakingScore(float[] brake)
    {
        var vals = brake.Where(v => !float.IsNaN(v)).ToArray();
        if (vals.Length < 8) return 50f;
        var hard = vals.Where(v => v > 0.6f).ToArray();
        var hardAvg = hard.Length > 0 ? hard.Average() : 0f;
        var jitter = SlidingStdDev(vals, 5);
        return Math.Clamp(hardAvg * 100f - jitter * 60f, 0f, 100f);
    }

    private static float? ThrottleScore(float[] throttle)
    {
        var vals = throttle.Where(v => !float.IsNaN(v)).ToArray();
        if (vals.Length < 2) return null;
        var sum = 0f;
        for (var i = 1; i < vals.Length; i++) sum += MathF.Abs(vals[i] - vals[i - 1]);
        var meanDelta = sum / (vals.Length - 1);
        return Math.Clamp(100f - meanDelta * 250f, 0f, 100f);
    }

    private static float? ConsistencyScore(float[] speed)
    {
        var vals = speed.Where(v => !float.IsNaN(v) && v > 1f).ToArray();
        if (vals.Length < 2) return null;
        var mean = vals.Average();
        if (mean <= 0) return null;
        var sd = MathF.Sqrt(vals.Sum(v => (v - mean) * (v - mean)) / (vals.Length - 1));
        return Math.Clamp(100f - (sd / mean) * 200f, 0f, 100f);
    }

    private static float SlidingStdDev(float[] vals, int window)
    {
        if (vals.Length < window) return 0f;
        var acc = 0f; var count = 0;
        for (var i = 0; i + window <= vals.Length; i++)
        {
            var seg = vals.AsSpan(i, window);
            var m = 0f; foreach (var v in seg) m += v; m /= window;
            var s = 0f; foreach (var v in seg) s += (v - m) * (v - m);
            acc += MathF.Sqrt(s / window); count++;
        }
        return count == 0 ? 0f : acc / count;
    }
}
