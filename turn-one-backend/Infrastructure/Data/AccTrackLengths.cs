namespace Infrastructure.Data;

/// <summary>
/// Fallback ACC track lengths (metres), used by the legacy backfill path when a v1 session has no
/// client-reported or track-profile length to scale <c>normalizedCarPosition</c> by. Mirrors the
/// client's table in <c>turn-one-client/lib/simracing</c>.
/// </summary>
public static class AccTrackLengths
{
    private static readonly IReadOnlyDictionary<string, float> Lengths = new Dictionary<string, float>(StringComparer.OrdinalIgnoreCase)
    {
        ["monza"] = 5793f,
        ["zolder"] = 4011f,
        ["brands_hatch"] = 3908f,
        ["silverstone"] = 5891f,
        ["paul_ricard"] = 5842f,
        ["misano"] = 4226f,
        ["spa"] = 7004f,
        ["nurburgring"] = 5137f,
        ["barcelona"] = 4655f,
        ["hungaroring"] = 4381f,
        ["zandvoort"] = 4252f,
        ["kyalami"] = 4522f,
        ["mount_panorama"] = 6213f,
        ["suzuka"] = 5807f,
        ["laguna_seca"] = 3602f,
        ["imola"] = 4909f,
        ["oulton_park"] = 4307f,
        ["donington"] = 4020f,
        ["snetterton"] = 4779f,
        ["cota"] = 5513f,
        ["indianapolis"] = 3925f,
        ["watkins_glen"] = 5552f,
        ["valencia"] = 4005f,
        ["red_bull_ring"] = 4318f,
        ["nurburgring_24h"] = 25378f,
    };

    /// <summary>Length in metres for a known ACC track id, or null when not in the table.</summary>
    public static float? Lookup(string? trackId) =>
        !string.IsNullOrWhiteSpace(trackId) && Lengths.TryGetValue(trackId, out var m) ? m : null;
}
