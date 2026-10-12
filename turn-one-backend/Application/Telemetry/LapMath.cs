using Domain.Telemetry;

namespace Application.Telemetry;

/// <summary>Small shared maths used by the overlay API and tests.</summary>
public static class LapMath
{
    /// <summary>
    /// Cumulative time delta of <paramref name="lap"/> against <paramref name="reference"/> on the shared grid:
    /// <c>delta[i] = lap.timeMs[i] − ref.timeMs[i]</c>. Positive = slower. Length = min of the two.
    /// The final value equals the lap-time difference, which is the identity tests assert.
    /// </summary>
    public static float[] DeltaMs(LapSamples lap, LapSamples reference)
    {
        var a = lap.Get(ChannelRegistry.TimeMs);
        var b = reference.Get(ChannelRegistry.TimeMs);
        if (a == null || b == null) return Array.Empty<float>();
        var n = Math.Min(a.Length, b.Length);
        var d = new float[n];
        for (var i = 0; i < n; i++) d[i] = a[i] - b[i];
        return d;
    }

    /// <summary>Time (ms) spent between two distances on a lap, by linear interpolation of the lap clock.</summary>
    public static float TimeBetweenMs(LapSamples lap, float fromM, float toM)
    {
        var t = lap.Get(ChannelRegistry.TimeMs);
        if (t == null || t.Length < 2) return 0;
        return At(t, lap.StepM, toM) - At(t, lap.StepM, fromM);
    }

    public static float At(float[] arr, float stepM, float distanceM)
    {
        if (arr.Length == 0) return float.NaN;
        var x = distanceM / stepM;
        var i = (int)MathF.Floor(x);
        if (i < 0) return arr[0];
        if (i >= arr.Length - 1) return arr[^1];
        var w = x - i;
        return arr[i] + (arr[i + 1] - arr[i]) * w;
    }
}
