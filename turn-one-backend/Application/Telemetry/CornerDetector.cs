using Domain.Enums;
using Domain.Telemetry;

namespace Application.Telemetry;

/// <summary>Thresholds for <see cref="CornerDetector"/>. Defaults are tuned for GT3-class grip; F1 cars need higher g thresholds.</summary>
public sealed class CornerDetectorOptions
{
    /// <summary>|gLat| above which a corner segment starts.</summary>
    public float EnterG { get; init; } = 0.55f;
    /// <summary>|gLat| below which (held for <see cref="ExitHoldM"/>) a segment ends.</summary>
    public float ExitG { get; init; } = 0.30f;
    /// <summary>Fallback thresholds on |steer| (−1..1) when lateral g is not available.</summary>
    public float EnterSteer { get; init; } = 0.12f;
    public float ExitSteer { get; init; } = 0.06f;
    /// <summary>Centred moving-average window, metres.</summary>
    public float SmoothM { get; init; } = 22f;
    public float ExitHoldM { get; init; } = 10f;
    /// <summary>Segments shorter than this are noise (kerb strikes, bumps).</summary>
    public float MinCornerM { get; init; } = 30f;
    /// <summary>Same-direction segments closer than this merge into one (double apex).</summary>
    public float MergeGapM { get; init; } = 24f;
    /// <summary>How far back from the apex to look for the braking point.</summary>
    public float BrakeSearchM { get; init; } = 450f;
    public float BrakeOnThreshold { get; init; } = 0.08f;
    public float BrakeOffThreshold { get; init; } = 0.05f;
    public float ThrottleOnThreshold { get; init; } = 0.5f;
    public float FullThrottleThreshold { get; init; } = 0.95f;
    public float ThrottleHoldM { get; init; } = 10f;
    /// <summary>A corner whose min speed stays above this fraction of entry speed with no braking is a kink.</summary>
    public float KinkSpeedRatio { get; init; } = 0.9f;

    public static readonly CornerDetectorOptions Default = new();

    public static CornerDetectorOptions ForSource(SimSource source) => source switch
    {
        SimSource.F1_25 or SimSource.F1_26 => new CornerDetectorOptions { EnterG = 1.2f, ExitG = 0.6f },
        _ => Default
    };
}

/// <summary>A corner found in one lap. Distances in metres on the lap's grid.</summary>
public sealed class DetectedCorner
{
    public int Index { get; set; }
    public int Direction { get; init; }
    public bool IsKink { get; init; }
    public CornerSignalSource Source { get; init; }
    public float EntryM { get; init; }
    public float ApexM { get; init; }
    public float ExitM { get; init; }
    public float? BrakingPointM { get; init; }
    public float? BrakeReleaseM { get; init; }
    public float? ThrottleOnM { get; init; }
    public float? FullThrottleM { get; init; }
    public float EntrySpeedKmh { get; init; }
    public float MinSpeedKmh { get; init; }
    public float ExitSpeedKmh { get; init; }
    public float PeakBrake { get; init; }
    public float PeakGLat { get; init; }
    public int GearAtApex { get; init; }
    public int MinGear { get; init; }
    public int TimeInCornerMs { get; init; }
    public int? BrakeToThrottleMs { get; init; }
    public float? TrailBrakeM { get; init; }
    /// <summary>Set by <see cref="TrackProfileBuilder"/> when matched to a reference corner.</summary>
    public int? RefIndex { get; set; }
}

/// <summary>
/// Segments a lap into corners from lateral g (or steering), then finds the apex, braking point,
/// brake release and throttle-on for each. Deterministic and pure so it can be unit-tested on synthetic laps.
/// </summary>
public static class CornerDetector
{
    public static List<DetectedCorner> Detect(LapSamples s, CornerDetectorOptions? options = null)
    {
        options ??= CornerDetectorOptions.Default;
        var n = s.Count;
        var result = new List<DetectedCorner>();
        if (n < 10) return result;

        var speed = s.Get(ChannelRegistry.Speed);
        var brake = s.Get(ChannelRegistry.Brake);
        var throttle = s.Get(ChannelRegistry.Throttle);
        var gear = s.Get(ChannelRegistry.Gear);
        var time = s.Get(ChannelRegistry.TimeMs);
        var gLat = s.Get(ChannelRegistry.GLat);
        var steer = s.Get(ChannelRegistry.Steer);

        // Pick the segmentation signal.
        float[] signal; float enter, exit; CornerSignalSource source;
        if (gLat != null && Coverage(gLat) > 0.5f) { signal = gLat; enter = options.EnterG; exit = options.ExitG; source = CornerSignalSource.LateralG; }
        else if (steer != null && Coverage(steer) > 0.5f) { signal = steer; enter = options.EnterSteer; exit = options.ExitSteer; source = CornerSignalSource.Steer; }
        else return result;

        var window = Math.Max(1, (int)MathF.Round(options.SmoothM / s.StepM));
        var smooth = MovingAverage(signal, window);
        var holdSamples = Math.Max(1, (int)MathF.Round(options.ExitHoldM / s.StepM));

        // --- 1. hysteresis segmentation ---
        var segments = new List<(int start, int end, int sign)>();
        var inCorner = false; var start = 0; var below = 0; var sign = 0;
        for (var i = 0; i < n; i++)
        {
            var a = smooth[i];
            if (float.IsNaN(a)) a = 0;
            var mag = MathF.Abs(a);
            if (!inCorner)
            {
                if (mag > enter) { inCorner = true; start = i; below = 0; sign = MathF.Sign(a); }
            }
            else
            {
                if (mag < exit) { below++; if (below >= holdSamples) { segments.Add((start, i - holdSamples, sign)); inCorner = false; } }
                else below = 0;
            }
        }
        if (inCorner) segments.Add((start, n - 1, sign));

        // --- 2. drop noise, merge double apexes ---
        var minLen = Math.Max(1, (int)MathF.Round(options.MinCornerM / s.StepM));
        segments = segments.Where(seg => seg.end - seg.start + 1 >= minLen).ToList();
        var mergeGap = (int)MathF.Round(options.MergeGapM / s.StepM);
        var merged = new List<(int start, int end, int sign)>();
        foreach (var seg in segments)
        {
            if (merged.Count > 0)
            {
                var last = merged[^1];
                if (seg.sign == last.sign && seg.start - last.end <= mergeGap)
                {
                    merged[^1] = (last.start, seg.end, last.sign);
                    continue;
                }
            }
            merged.Add(seg);
        }

        // --- 3. per-corner features ---
        var prevExit = -1;
        foreach (var (segStart, segEnd, dir) in merged)
        {
            // Apex = min speed inside the segment; tie-break on max |signal|.
            var apex = segStart; var apexSpeed = float.MaxValue; var apexMag = -1f;
            for (var i = segStart; i <= segEnd; i++)
            {
                var v = speed != null && !float.IsNaN(speed[i]) ? speed[i] : float.MaxValue;
                var mag = MathF.Abs(smooth[i]);
                if (v < apexSpeed - 0.01f || (MathF.Abs(v - apexSpeed) <= 0.01f && mag > apexMag)) { apex = i; apexSpeed = v; apexMag = mag; }
            }
            if (apexSpeed == float.MaxValue) apexSpeed = 0;

            // Braking point: within the search window before the apex, find the brake>on run containing the max brake.
            int? brakeOn = null, brakeRelease = null; var peakBrake = 0f;
            if (brake != null)
            {
                var searchFrom = Math.Max(prevExit + 1, apex - (int)MathF.Round(options.BrakeSearchM / s.StepM));
                var maxIdx = -1; var maxVal = 0f;
                for (var i = searchFrom; i <= apex; i++)
                {
                    var b = brake[i];
                    if (!float.IsNaN(b) && b > maxVal) { maxVal = b; maxIdx = i; }
                }
                if (maxIdx >= 0 && maxVal > options.BrakeOnThreshold)
                {
                    peakBrake = maxVal;
                    var j = maxIdx;
                    while (j > searchFrom && !float.IsNaN(brake[j - 1]) && brake[j - 1] > options.BrakeOnThreshold) j--;
                    brakeOn = j;
                    var k = maxIdx;
                    while (k < n - 1 && !float.IsNaN(brake[k]) && brake[k] >= options.BrakeOffThreshold) k++;
                    brakeRelease = k;
                }
            }

            // Throttle-on / full throttle after the apex (allow 20 m before it — early pick-up).
            int? throttleOn = null, fullThrottle = null;
            if (throttle != null)
            {
                var hold = Math.Max(1, (int)MathF.Round(options.ThrottleHoldM / s.StepM));
                var from = Math.Max(segStart, apex - (int)MathF.Round(20f / s.StepM));
                throttleOn = FirstSustained(throttle, from, n, options.ThrottleOnThreshold, hold);
                fullThrottle = FirstSustained(throttle, from, n, options.FullThrottleThreshold, hold);
            }

            var entryIdx = brakeOn ?? segStart;
            var entrySpeed = speed != null ? Sample(speed, entryIdx) : 0f;
            var exitSpeed = speed != null ? Sample(speed, segEnd) : 0f;
            var isKink = brakeOn == null && entrySpeed > 0 && apexSpeed > options.KinkSpeedRatio * entrySpeed;

            var gearAtApex = gear != null ? (int)Sample(gear, apex) : 0;
            var minGear = gearAtApex;
            if (gear != null)
                for (var i = segStart; i <= segEnd; i++)
                    if (!float.IsNaN(gear[i]) && gear[i] > 0) minGear = minGear == 0 ? (int)gear[i] : Math.Min(minGear, (int)gear[i]);

            var peakG = 0f;
            if (gLat != null) for (var i = segStart; i <= segEnd; i++) if (!float.IsNaN(gLat[i])) peakG = MathF.Max(peakG, MathF.Abs(gLat[i]));

            int timeIn = 0; int? brakeToThrottle = null;
            if (time != null)
            {
                timeIn = (int)MathF.Round(Sample(time, segEnd) - Sample(time, segStart));
                if (brakeOn != null && throttleOn != null) brakeToThrottle = (int)MathF.Round(Sample(time, throttleOn.Value) - Sample(time, brakeOn.Value));
            }

            float? trail = null;
            if (brakeRelease != null && brakeRelease > segStart) trail = (brakeRelease.Value - segStart) * s.StepM;

            result.Add(new DetectedCorner
            {
                Direction = dir,
                IsKink = isKink,
                Source = source,
                EntryM = segStart * s.StepM,
                ApexM = apex * s.StepM,
                ExitM = segEnd * s.StepM,
                BrakingPointM = brakeOn * s.StepM,
                BrakeReleaseM = brakeRelease * s.StepM,
                ThrottleOnM = throttleOn * s.StepM,
                FullThrottleM = fullThrottle * s.StepM,
                EntrySpeedKmh = entrySpeed,
                MinSpeedKmh = apexSpeed,
                ExitSpeedKmh = exitSpeed,
                PeakBrake = peakBrake,
                PeakGLat = peakG,
                GearAtApex = gearAtApex,
                MinGear = minGear,
                TimeInCornerMs = timeIn,
                BrakeToThrottleMs = brakeToThrottle,
                TrailBrakeM = trail,
            });
            prevExit = segEnd;
        }

        for (var i = 0; i < result.Count; i++) result[i].Index = i;
        return result;
    }

    private static int? FirstSustained(float[] arr, int from, int n, float threshold, int hold)
    {
        var run = 0;
        for (var i = from; i < n; i++)
        {
            if (!float.IsNaN(arr[i]) && arr[i] > threshold) { run++; if (run >= hold) return i - hold + 1; }
            else run = 0;
        }
        return null;
    }

    private static float Sample(float[] arr, int i)
    {
        i = Math.Clamp(i, 0, arr.Length - 1);
        if (!float.IsNaN(arr[i])) return arr[i];
        // Nearest non-NaN neighbour.
        for (var d = 1; d < arr.Length; d++)
        {
            if (i - d >= 0 && !float.IsNaN(arr[i - d])) return arr[i - d];
            if (i + d < arr.Length && !float.IsNaN(arr[i + d])) return arr[i + d];
        }
        return 0f;
    }

    private static float Coverage(float[] arr) => arr.Length == 0 ? 0 : (float)arr.Count(v => !float.IsNaN(v)) / arr.Length;

    /// <summary>Centred moving average ignoring NaN; odd window.</summary>
    public static float[] MovingAverage(float[] x, int window)
    {
        if (window % 2 == 0) window++;
        var half = window / 2;
        var n = x.Length;
        var out_ = new float[n];
        for (var i = 0; i < n; i++)
        {
            var sum = 0f; var cnt = 0;
            var lo = Math.Max(0, i - half); var hi = Math.Min(n - 1, i + half);
            for (var j = lo; j <= hi; j++) if (!float.IsNaN(x[j])) { sum += x[j]; cnt++; }
            out_[i] = cnt == 0 ? float.NaN : sum / cnt;
        }
        return out_;
    }
}
