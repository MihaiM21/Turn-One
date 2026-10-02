using System.Text.Json;
using Domain.Telemetry;

namespace Application.Telemetry;

/// <summary>
/// Fixed ordinal layout of the scalar channels a protocol-v2 tick can carry (corner arrays flattened).
/// The lap pipeline works on <c>float[]</c> indexed by these ordinals so resampling and encoding are
/// channel-agnostic loops rather than one property per field.
/// </summary>
public static class TickLayout
{
    /// <summary>Channel keys in ordinal order. Derived from <see cref="ChannelRegistry.V2"/> minus the processor-only <c>timeMs</c>.</summary>
    public static readonly IReadOnlyList<string> Keys = ChannelRegistry.V2
        .Select(d => d.Key)
        .Where(k => k != ChannelRegistry.TimeMs)
        .ToList();

    private static readonly Dictionary<string, int> Ordinals = Keys
        .Select((k, i) => (k, i))
        .ToDictionary(t => t.k, t => t.i, StringComparer.Ordinal);

    public static int Count => Keys.Count;

    public static int Ordinal(string key) => Ordinals.TryGetValue(key, out var i) ? i : -1;

    public static bool TryOrdinal(string key, out int ordinal) => Ordinals.TryGetValue(key, out ordinal);

    // Hot-path ordinals resolved once.
    public static readonly int Lap = Ordinal(ChannelRegistry.Lap);
    public static readonly int LapTimeMs = Ordinal(ChannelRegistry.LapTimeMs);
    public static readonly int LapDistM = Ordinal(ChannelRegistry.LapDistM);
    public static readonly int Sector = Ordinal(ChannelRegistry.Sector);
    public static readonly int Speed = Ordinal(ChannelRegistry.Speed);
    public static readonly int Rpm = Ordinal(ChannelRegistry.Rpm);
    public static readonly int Gear = Ordinal(ChannelRegistry.Gear);
    public static readonly int Throttle = Ordinal(ChannelRegistry.Throttle);
    public static readonly int Brake = Ordinal(ChannelRegistry.Brake);
    public static readonly int Steer = Ordinal(ChannelRegistry.Steer);
    public static readonly int GLat = Ordinal(ChannelRegistry.GLat);
    public static readonly int GLong = Ordinal(ChannelRegistry.GLong);
    public static readonly int PosX = Ordinal(ChannelRegistry.PosX);
    public static readonly int PosY = Ordinal(ChannelRegistry.PosY);
    public static readonly int Heading = Ordinal(ChannelRegistry.Heading);
    public static readonly int Valid = Ordinal(ChannelRegistry.Valid);
    public static readonly int Pit = Ordinal(ChannelRegistry.Pit);
    public static readonly int Fuel = Ordinal(ChannelRegistry.Fuel);
    public static readonly int Frame = Ordinal(ChannelRegistry.Frame);
}

/// <summary>
/// One protocol-v2 telemetry sample. <see cref="V"/> is indexed by <see cref="TickLayout"/> ordinals;
/// a channel the sim did not send is <see cref="float.NaN"/>, which the whole pipeline treats as "absent".
/// </summary>
public sealed class TickV2
{
    /// <summary>Client wall-clock timestamp, Unix ms (from the envelope).</summary>
    public long T { get; }

    public float[] V { get; }

    public TickV2(long t, float[] values)
    {
        if (values.Length != TickLayout.Count)
            throw new ArgumentException($"Expected {TickLayout.Count} values, got {values.Length}", nameof(values));
        T = t;
        V = values;
    }

    public static TickV2 Empty(long t)
    {
        var v = new float[TickLayout.Count];
        Array.Fill(v, float.NaN);
        return new TickV2(t, v);
    }

    public float this[int ordinal] => V[ordinal];

    public float Get(string key)
    {
        var o = TickLayout.Ordinal(key);
        return o < 0 ? float.NaN : V[o];
    }

    public bool Has(int ordinal) => !float.IsNaN(V[ordinal]);

    public int Lap => (int)V[TickLayout.Lap];
    public float LapTimeMs => V[TickLayout.LapTimeMs];
    public float LapDistM => V[TickLayout.LapDistM];
    public float Speed => V[TickLayout.Speed];
    public float Throttle => V[TickLayout.Throttle];
    public float Brake => V[TickLayout.Brake];
    public float Pit => V[TickLayout.Pit];

    /// <summary>
    /// Parses a v2 <c>tick.data</c> object. Unknown keys are ignored; 4-element arrays whose stem is a
    /// registered corner field are flattened to <c>_fl/_fr/_rl/_rr</c>; booleans become 0/1.
    /// </summary>
    public static TickV2 FromJson(long t, JsonElement data)
    {
        var tick = Empty(t);
        if (data.ValueKind != JsonValueKind.Object) return tick;

        foreach (var prop in data.EnumerateObject())
        {
            switch (prop.Value.ValueKind)
            {
                case JsonValueKind.Number:
                    if (TickLayout.TryOrdinal(prop.Name, out var o) && prop.Value.TryGetDouble(out var d))
                        tick.V[o] = (float)d;
                    break;
                case JsonValueKind.True:
                case JsonValueKind.False:
                    if (TickLayout.TryOrdinal(prop.Name, out var ob))
                        tick.V[ob] = prop.Value.ValueKind == JsonValueKind.True ? 1f : 0f;
                    break;
                case JsonValueKind.Array:
                    if (prop.Value.GetArrayLength() == 4 && ChannelRegistry.CornerArrayFields.Contains(prop.Name))
                    {
                        var i = 0;
                        foreach (var el in prop.Value.EnumerateArray())
                        {
                            if (el.ValueKind == JsonValueKind.Number
                                && TickLayout.TryOrdinal(prop.Name + ChannelRegistry.CornerSuffixes[i], out var oc)
                                && el.TryGetDouble(out var dc))
                                tick.V[oc] = (float)dc;
                            i++;
                        }
                    }
                    break;
            }
        }
        return tick;
    }
}
