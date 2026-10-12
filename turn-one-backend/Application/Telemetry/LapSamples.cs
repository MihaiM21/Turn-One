namespace Application.Telemetry;

/// <summary>
/// A lap on the fixed distance grid: sample <c>i</c> is at <c>i × StepM</c> metres from the line.
/// Channels are float32 arrays of length <see cref="Count"/>; absent values are NaN.
/// Always contains <c>timeMs</c> (lap time at each grid point) — that is what makes two laps comparable.
/// </summary>
public sealed class LapSamples
{
    public float StepM { get; }
    public int Count { get; }
    public Dictionary<string, float[]> Channels { get; }

    public LapSamples(float stepM, int count, Dictionary<string, float[]> channels)
    {
        StepM = stepM;
        Count = count;
        Channels = channels;
    }

    public float DistanceAt(int i) => i * StepM;

    /// <summary>Total distance represented, metres.</summary>
    public float LengthM => Count <= 1 ? 0 : (Count - 1) * StepM;

    public float[]? Get(string key) => Channels.TryGetValue(key, out var a) ? a : null;

    public bool Has(string key) => Channels.TryGetValue(key, out var a) && a.Any(v => !float.IsNaN(v));

    /// <summary>Grid index nearest to <paramref name="distanceM"/>, clamped.</summary>
    public int IndexAt(float distanceM) => Math.Clamp((int)MathF.Round(distanceM / StepM), 0, Math.Max(0, Count - 1));

    /// <summary>Copy with only the requested channels (unknown keys ignored), optionally decimated by an integer factor.</summary>
    public LapSamples Select(IEnumerable<string>? keys, int decimate = 1)
    {
        decimate = Math.Max(1, decimate);
        var wanted = keys?.ToHashSet(StringComparer.Ordinal);
        var n = decimate == 1 ? Count : (Count + decimate - 1) / decimate;
        var dict = new Dictionary<string, float[]>(StringComparer.Ordinal);
        foreach (var (k, arr) in Channels)
        {
            if (wanted != null && !wanted.Contains(k)) continue;
            if (decimate == 1) { dict[k] = arr; continue; }
            var o = new float[n];
            for (var i = 0; i < n; i++) o[i] = arr[i * decimate];
            dict[k] = o;
        }
        return new LapSamples(StepM * decimate, n, dict);
    }
}
