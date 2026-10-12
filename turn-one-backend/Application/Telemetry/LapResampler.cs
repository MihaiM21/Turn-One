using Domain.Telemetry;

namespace Application.Telemetry;

public static class LapGrid
{
    /// <summary>
    /// Grid step. At 20 Hz a car at 250 km/h moves 3.5 m per tick, so 1 m would be pure interpolation;
    /// at 5 m a braking-point comparison is ±2.5 m, coarser than a driver can feel. 2 m is the compromise.
    /// </summary>
    public const float StepM = 2f;
}

public static class LapResampler
{
    /// <summary>
    /// Puts every channel of a normalised lap onto the fixed distance grid.
    /// Continuous channels are linearly interpolated; discrete/flag channels are sample-and-hold; angles are
    /// unwrapped before interpolating and re-wrapped to (−π, π]. Adds the derived <c>timeMs</c> channel
    /// (lap time at each grid point from <c>lapTimeMs</c>, falling back to wall-clock offset).
    /// Channels that are NaN for the whole lap are dropped.
    /// </summary>
    public static LapSamples Resample(NormalizedLap lap, float stepM = LapGrid.StepM, IEnumerable<string>? onlyChannels = null)
    {
        var ticks = lap.Ticks;
        var dist = lap.DistanceM;
        var n = ticks.Count;
        if (n < 2) return new LapSamples(stepM, 0, new Dictionary<string, float[]>(StringComparer.Ordinal));

        var count = (int)MathF.Floor(dist[^1] / stepM) + 1;
        var channels = new Dictionary<string, float[]>(StringComparer.Ordinal);
        var only = onlyChannels?.ToHashSet(StringComparer.Ordinal);

        // Precompute, for each grid point, the bracketing tick indices and the interpolation weight.
        var left = new int[count];
        var weight = new float[count];
        var j = 0;
        for (var g = 0; g < count; g++)
        {
            var d = g * stepM;
            while (j < n - 2 && dist[j + 1] < d) j++;
            left[g] = j;
            var span = dist[j + 1] - dist[j];
            weight[g] = span > 0 ? Math.Clamp((d - dist[j]) / span, 0f, 1f) : 0f;
        }

        for (var o = 0; o < TickLayout.Count; o++)
        {
            var key = TickLayout.Keys[o];
            if (only != null && !only.Contains(key)) continue;
            if (key == ChannelRegistry.LapDistM) continue; // implied by the grid

            var def = ChannelRegistry.Find(key);
            var kind = def?.Kind ?? ChannelKind.Continuous;

            // Skip channels the sim never sent.
            var any = false;
            for (var i = 0; i < n && !any; i++) any = !float.IsNaN(ticks[i].V[o]);
            if (!any) continue;

            var arr = new float[count];
            switch (kind)
            {
                case ChannelKind.Continuous:
                    for (var g = 0; g < count; g++)
                        arr[g] = LerpNan(ticks[left[g]].V[o], ticks[left[g] + 1].V[o], weight[g]);
                    break;
                case ChannelKind.Angle:
                    for (var g = 0; g < count; g++)
                    {
                        var a = ticks[left[g]].V[o];
                        var b = ticks[left[g] + 1].V[o];
                        if (float.IsNaN(a) || float.IsNaN(b)) { arr[g] = float.IsNaN(a) ? b : a; continue; }
                        // Unwrap b relative to a so we interpolate the short way round.
                        var delta = b - a;
                        while (delta > MathF.PI) delta -= 2 * MathF.PI;
                        while (delta < -MathF.PI) delta += 2 * MathF.PI;
                        var v = a + delta * weight[g];
                        while (v > MathF.PI) v -= 2 * MathF.PI;
                        while (v <= -MathF.PI) v += 2 * MathF.PI;
                        arr[g] = v;
                    }
                    break;
                default: // Discrete, Flag: hold the value in force at this distance
                    for (var g = 0; g < count; g++)
                    {
                        var idx = weight[g] >= 1f ? left[g] + 1 : left[g];
                        var v = ticks[idx].V[o];
                        if (float.IsNaN(v)) v = ticks[left[g]].V[o];
                        arr[g] = v;
                    }
                    break;
            }
            channels[key] = arr;
        }

        // timeMs: prefer the sim's lap clock; fall back to wall-clock offset from the first tick.
        var time = new float[count];
        var useLapClock = ticks.Count(t => t.Has(TickLayout.LapTimeMs)) >= n / 2;
        var t0 = ticks[0].T;
        for (var g = 0; g < count; g++)
        {
            var a = ticks[left[g]];
            var b = ticks[left[g] + 1];
            float ta, tb;
            if (useLapClock && a.Has(TickLayout.LapTimeMs) && b.Has(TickLayout.LapTimeMs))
            {
                ta = a.LapTimeMs; tb = b.LapTimeMs;
            }
            else
            {
                ta = a.T - t0; tb = b.T - t0;
            }
            time[g] = ta + (tb - ta) * weight[g];
        }
        // Make the lap clock monotonic (a stale lapTimeMs across the line would otherwise dip).
        for (var g = 1; g < count; g++) if (time[g] < time[g - 1]) time[g] = time[g - 1];
        channels[ChannelRegistry.TimeMs] = time;

        return new LapSamples(stepM, count, channels);
    }

    private static float LerpNan(float a, float b, float w)
    {
        if (float.IsNaN(a)) return b;
        if (float.IsNaN(b)) return a;
        return a + (b - a) * w;
    }
}
