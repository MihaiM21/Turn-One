using System.Text.Json;
using System.Text.Json.Serialization;

namespace Application.Telemetry;

/// <summary>One entry of <c>TrackProfile.ReferenceCorners</c>.</summary>
public sealed class ReferenceCorner
{
    [JsonPropertyName("index")] public int Index { get; set; }
    [JsonPropertyName("name")] public string? Name { get; set; }
    [JsonPropertyName("entryM")] public float EntryM { get; set; }
    [JsonPropertyName("apexM")] public float ApexM { get; set; }
    [JsonPropertyName("exitM")] public float ExitM { get; set; }
    [JsonPropertyName("direction")] public int Direction { get; set; }
    [JsonPropertyName("isKink")] public bool IsKink { get; set; }

    public float LengthM => MathF.Max(0, ExitM - EntryM);
}

/// <summary>Accumulator stored in <c>TrackProfile.CornerSamples</c> while the profile is Provisional.</summary>
public sealed class CornerSampleSet
{
    /// <summary>One entry per contributing lap: the detected corners' (apexM, entryM, exitM, direction).</summary>
    [JsonPropertyName("laps")] public List<List<float[]>> Laps { get; set; } = new();
}

/// <summary>
/// Pure functions for building and using a track's reference corner set. Persistence is the caller's job.
/// </summary>
public static class TrackProfileBuilder
{
    public const int StableAfterLaps = 10;
    public const int MaxSampleLaps = 25;
    /// <summary>1-D clustering linkage on apex distance.</summary>
    public const float ClusterLinkageM = 40f;
    /// <summary>A cluster must appear in this fraction of contributing laps to become a reference corner.</summary>
    public const float MinPresence = 0.6f;

    private static readonly JsonSerializerOptions Json = new() { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull };

    public static List<ReferenceCorner> ParseReference(string? json) =>
        string.IsNullOrWhiteSpace(json) ? new() : JsonSerializer.Deserialize<List<ReferenceCorner>>(json, Json) ?? new();

    public static string SerializeReference(IEnumerable<ReferenceCorner> corners) => JsonSerializer.Serialize(corners, Json);

    public static CornerSampleSet ParseSamples(string? json) =>
        string.IsNullOrWhiteSpace(json) ? new() : JsonSerializer.Deserialize<CornerSampleSet>(json, Json) ?? new();

    public static string SerializeSamples(CornerSampleSet set) => JsonSerializer.Serialize(set, Json);

    /// <summary>Reference set straight from one lap's detected corners (used when a profile is first created).</summary>
    public static List<ReferenceCorner> FromSingleLap(IReadOnlyList<DetectedCorner> corners) =>
        corners.OrderBy(c => c.ApexM).Select((c, i) => new ReferenceCorner
        {
            Index = i, EntryM = c.EntryM, ApexM = c.ApexM, ExitM = c.ExitM, Direction = c.Direction, IsKink = c.IsKink
        }).ToList();

    /// <summary>Appends a lap's corners to the accumulator, keeping at most <see cref="MaxSampleLaps"/> laps.</summary>
    public static void AddSample(CornerSampleSet set, IReadOnlyList<DetectedCorner> corners)
    {
        set.Laps.Add(corners.Select(c => new[] { c.ApexM, c.EntryM, c.ExitM, c.Direction }).ToList());
        while (set.Laps.Count > MaxSampleLaps) set.Laps.RemoveAt(0);
    }

    /// <summary>
    /// Rebuilds the reference set from the accumulated laps: single-linkage 1-D clustering of apex
    /// distances, keep clusters present in ≥ 60 % of laps, medians for the geometry.
    /// </summary>
    public static List<ReferenceCorner> Rebuild(CornerSampleSet set, float trackLengthM)
    {
        var lapCount = set.Laps.Count;
        if (lapCount == 0) return new();

        // Flatten (apex, entry, exit, dir, lapIndex) and sort by apex.
        var pts = new List<(float apex, float entry, float exit, int dir, int lap)>();
        for (var l = 0; l < lapCount; l++)
            foreach (var c in set.Laps[l])
                pts.Add((c[0], c[1], c[2], (int)c[3], l));
        pts.Sort((a, b) => a.apex.CompareTo(b.apex));

        var clusters = new List<List<(float apex, float entry, float exit, int dir, int lap)>>();
        foreach (var p in pts)
        {
            if (clusters.Count > 0 && p.apex - clusters[^1][^1].apex <= ClusterLinkageM)
                clusters[^1].Add(p);
            else
                clusters.Add(new() { p });
        }

        var refs = new List<ReferenceCorner>();
        foreach (var cl in clusters)
        {
            var presence = (float)cl.Select(p => p.lap).Distinct().Count() / lapCount;
            if (presence < MinPresence) continue;
            var dir = cl.Sum(p => p.dir) >= 0 ? 1 : -1;
            refs.Add(new ReferenceCorner
            {
                EntryM = Median(cl.Select(p => p.entry)),
                ApexM = Median(cl.Select(p => p.apex)),
                ExitM = Median(cl.Select(p => p.exit)),
                Direction = dir,
            });
        }

        refs = refs.OrderBy(r => r.ApexM).ToList();
        for (var i = 0; i < refs.Count; i++) refs[i].Index = i;
        return refs;
    }

    /// <summary>
    /// Greedy one-to-one nearest-apex matching of a lap's corners to the reference set, in track order.
    /// Sets <see cref="DetectedCorner.RefIndex"/>; unmatched corners keep null.
    /// </summary>
    public static void Match(IReadOnlyList<DetectedCorner> corners, IReadOnlyList<ReferenceCorner> reference)
    {
        foreach (var c in corners) c.RefIndex = null;
        if (reference.Count == 0) return;

        var used = new bool[reference.Count];
        foreach (var c in corners.OrderBy(c => c.ApexM))
        {
            var best = -1; var bestDist = float.MaxValue;
            for (var r = 0; r < reference.Count; r++)
            {
                if (used[r]) continue;
                var tol = MathF.Max(ClusterLinkageM, 0.4f * reference[r].LengthM);
                var d = MathF.Abs(reference[r].ApexM - c.ApexM);
                if (d <= tol && d < bestDist) { best = r; bestDist = d; }
            }
            if (best >= 0) { used[best] = true; c.RefIndex = reference[best].Index; }
        }
    }

    /// <summary>Median of observed sector boundaries across laps (each lap contributes one array).</summary>
    public static float[] MedianBoundaries(IEnumerable<float[]> perLap, int sectorCount)
    {
        var want = Math.Max(0, sectorCount - 1);
        var lists = Enumerable.Range(0, want).Select(_ => new List<float>()).ToArray();
        foreach (var b in perLap)
        {
            if (b.Length != want) continue;
            for (var i = 0; i < want; i++) lists[i].Add(b[i]);
        }
        return lists.Select(l => l.Count == 0 ? 0f : Median(l)).ToArray();
    }

    public static float Median(IEnumerable<float> values)
    {
        var arr = values.OrderBy(v => v).ToArray();
        if (arr.Length == 0) return 0;
        var mid = arr.Length / 2;
        return arr.Length % 2 == 1 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2f;
    }
}
