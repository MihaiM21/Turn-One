using System.Text.Json;
using Domain.Enums;

namespace Application.Interfaces;

public interface ITelemetryTickRepository
{
    Task BatchWriteTicksAsync(PlanType planType, IEnumerable<TickRecord> ticks);
    Task<List<ChartPoint>> GetSessionPhysicsChartAsync(PlanType planType, Guid sessionId);

    Task<MultiChannelChart> GetSessionChannelsAsync(
        PlanType planType,
        Guid sessionId,
        IReadOnlyCollection<string> channels,
        DateTime? from = null,
        DateTime? to = null);

    Task<(DateTime? start, DateTime? end)> GetLapBoundsAsync(PlanType planType, Guid sessionId, int lapNumber);
}

public class ChartPoint
{
    public long Timestamp { get; set; }
    public double SpeedKmh { get; set; }
    public double Rpms { get; set; }
    public double Gas { get; set; }
    public double Brake { get; set; }
    public int Gear { get; set; }
}

public class MultiChannelChart
{
    public List<string> Channels { get; set; } = new();
    public List<MultiChannelPoint> Points { get; set; } = new();
}

public class MultiChannelPoint
{
    public long Timestamp { get; set; }
    public Dictionary<string, double?> Values { get; set; } = new();
}

public class TickRecord
{
    public Guid SessionId { get; set; }
    public DateTime Timestamp { get; set; }
    public string MessageType { get; set; } = "";
    public JsonElement Payload { get; set; }
}

/// <summary>How a channel should be collapsed inside an aggregation window.</summary>
public enum ChannelAggregation
{
    /// <summary>Continuous signals (speed, throttle, temperatures).</summary>
    Mean,
    /// <summary>Discrete/state signals where averaging produces nonsense (gear, sector index, flags).</summary>
    Last
}

/// <summary>
/// A telemetry channel as it is stored in the tick store. <paramref name="MsgType"/> matches the
/// <c>msgType</c> tag written by the ingestion pipeline ("physics" or "graphics").
/// </summary>
public sealed record ChannelDef(string Key, string MsgType, ChannelAggregation Agg, PlanType MinPlan);

public static class TelemetryChannels
{
    public const string Physics = "physics";
    public const string Graphics = "graphics";

    // --- physics ---
    public const string SpeedKmh = "speedKmh";
    public const string Rpms = "rpms";
    public const string Gas = "gas";
    public const string Brake = "brake";
    public const string Clutch = "clutch";
    public const string Gear = "gear";
    public const string SteerAngle = "steerAngle";
    public const string AccG_X = "accG_x";
    public const string AccG_Y = "accG_y";
    public const string AccG_Z = "accG_z";
    public const string Fuel = "fuel";
    public const string BrakeBias = "brakeBias";
    public const string Tc = "tc";
    public const string Abs = "abs";
    /// <summary>Car heading in radians. Combined with speed it reconstructs the racing line.</summary>
    public const string Heading = "heading";

    // --- graphics ---
    public const string NormalizedCarPosition = "normalizedCarPosition";
    public const string DistanceTraveled = "distanceTraveled";
    public const string CurrentTimeMs = "iCurrentTime";
    public const string DeltaLapTimeMs = "iDeltaLapTime";
    public const string IsValidLap = "isValidLap";
    public const string CurrentSectorIndex = "currentSectorIndex";
    public const string IsInPitLane = "isInPitLane";
    public const string FuelPerLap = "fuelXLap";
    public const string SurfaceGrip = "surfaceGrip";

    /// <summary>Per-corner suffixes for 4-element [FL, FR, RL, RR] arrays.</summary>
    public static readonly IReadOnlyList<string> CornerSuffixes = new[] { "_fl", "_fr", "_rl", "_rr" };

    /// <summary>Per-axis suffixes for 3-element [X, Y, Z] vectors.</summary>
    public static readonly IReadOnlyList<string> AxisSuffixes = new[] { "_x", "_y", "_z" };

    /// <summary>Physics array fields that are flattened per corner on write.</summary>
    public static readonly IReadOnlyList<string> CornerArrayFields = new[]
    {
        "tyreCoreTemperature", "tyreWear", "wheelSlip", "brakeTemp", "wheelsPressure"
    };

    /// <summary>Physics vector fields that are flattened per axis on write.</summary>
    public static readonly IReadOnlyList<string> VectorArrayFields = new[] { "accG" };

    private static ChannelDef P(string key, ChannelAggregation agg = ChannelAggregation.Mean, PlanType min = PlanType.PRO)
        => new(key, Physics, agg, min);

    private static ChannelDef G(string key, ChannelAggregation agg = ChannelAggregation.Mean, PlanType min = PlanType.PRO)
        => new(key, Graphics, agg, min);

    private static IEnumerable<ChannelDef> Corners(string field, PlanType min = PlanType.PRO)
        => CornerSuffixes.Select(s => P(field + s, ChannelAggregation.Mean, min));

    public static readonly IReadOnlyList<ChannelDef> Definitions = new List<ChannelDef>
    {
        // Free tier: enough to draw a speed trace on a track map.
        P(SpeedKmh, ChannelAggregation.Mean, PlanType.BASIC),
        P(Rpms, ChannelAggregation.Mean, PlanType.BASIC),
        G(NormalizedCarPosition, ChannelAggregation.Last, PlanType.BASIC),
        // Heading wraps at ±π, so it must be sampled rather than averaged.
        P(Heading, ChannelAggregation.Last, PlanType.BASIC),

        P(Gas),
        P(Brake),
        P(Clutch),
        P(Gear, ChannelAggregation.Last),
        P(SteerAngle),
        P(AccG_X),
        P(AccG_Y),
        P(AccG_Z),
        P(Fuel),
        P(BrakeBias),
        P(Tc),
        P(Abs),

        G(DistanceTraveled),
        G(CurrentTimeMs, ChannelAggregation.Last),
        G(DeltaLapTimeMs, ChannelAggregation.Last),
        G(IsValidLap, ChannelAggregation.Last),
        G(CurrentSectorIndex, ChannelAggregation.Last),
        G(IsInPitLane, ChannelAggregation.Last),
        G(FuelPerLap),
        G(SurfaceGrip),
    }
    .Concat(Corners("tyreCoreTemperature"))
    .Concat(Corners("tyreWear"))
    .Concat(Corners("wheelSlip"))
    .Concat(Corners("brakeTemp"))
    .Concat(Corners("wheelsPressure"))
    .ToList();

    private static readonly Dictionary<string, ChannelDef> ByKey =
        Definitions.ToDictionary(d => d.Key, StringComparer.Ordinal);

    public static readonly IReadOnlyList<string> All = Definitions.Select(d => d.Key).ToList();

    public static ChannelDef? Find(string key) => ByKey.TryGetValue(key, out var def) ? def : null;

    public static IReadOnlyList<string> AllowedFor(PlanType plan) =>
        Definitions.Where(d => plan >= d.MinPlan).Select(d => d.Key).ToList();

    public static IReadOnlyList<ChannelDef> ResolveAllowed(PlanType plan, IEnumerable<string> requested) =>
        requested
            .Distinct(StringComparer.Ordinal)
            .Select(Find)
            .Where(d => d != null && plan >= d!.MinPlan)
            .Select(d => d!)
            .ToList();

    public static int SampleWindowSeconds(PlanType plan) => plan switch
    {
        PlanType.BASIC => 2,
        PlanType.PRO => 1,
        PlanType.ELITE => 1,
        _ => 2
    };

    /// <summary>
    /// Aggregation window in milliseconds. A 1s window is ~55m of track at 200km/h — far too coarse
    /// for a delta trace — so bounded (single-lap) queries get a much finer window. The row count
    /// stays bounded because a lap is only ~90s long.
    /// </summary>
    public static int SampleWindowMs(PlanType plan, DateTime? from, DateTime? to)
    {
        var bounded = from.HasValue && to.HasValue && (to.Value - from.Value) <= TimeSpan.FromMinutes(10);
        if (!bounded) return SampleWindowSeconds(plan) * 1000;
        return plan == PlanType.BASIC ? 250 : 100;
    }
}
