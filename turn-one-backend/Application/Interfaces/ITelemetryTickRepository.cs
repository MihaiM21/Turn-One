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

public static class TelemetryChannels
{
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

    public static readonly IReadOnlyList<string> All = new[]
    {
        SpeedKmh, Rpms, Gas, Brake, Clutch, Gear, SteerAngle, AccG_X, AccG_Y, AccG_Z, Fuel
    };

    public static IReadOnlyList<string> AllowedFor(PlanType plan) => plan switch
    {
        PlanType.BASIC => new[] { SpeedKmh, Rpms },
        PlanType.PRO => All.ToArray(),
        PlanType.ELITE => All.ToArray(),
        _ => new[] { SpeedKmh, Rpms }
    };

    public static int SampleWindowSeconds(PlanType plan) => plan switch
    {
        PlanType.BASIC => 2,
        PlanType.PRO => 1,
        PlanType.ELITE => 1,
        _ => 2
    };
}
