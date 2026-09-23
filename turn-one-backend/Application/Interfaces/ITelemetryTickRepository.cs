using System.Text.Json;
using Domain.Enums;
using Domain.Telemetry;

namespace Application.Interfaces;

public interface ITelemetryTickRepository
{
    /// <summary>Appends raw ticks to the archive. All plans share one bucket; plan gating is applied on read via <see cref="ChannelRegistry"/>.</summary>
    Task BatchWriteTicksAsync(IEnumerable<TickRecord> ticks);
    Task<List<ChartPoint>> GetSessionPhysicsChartAsync(PlanType planType, Guid sessionId);

    Task<MultiChannelChart> GetSessionChannelsAsync(
        PlanType planType,
        Guid sessionId,
        IReadOnlyCollection<string> channels,
        DateTime? from = null,
        DateTime? to = null);

    Task<(DateTime? start, DateTime? end)> GetLapBoundsAsync(PlanType planType, Guid sessionId, int lapNumber);

    /// <summary>
    /// Un-aggregated raw rows for backfill: every field pivoted onto its own timestamp, no
    /// <c>aggregateWindow</c>. Used to rebuild processed lap telemetry from the archive.
    /// </summary>
    Task<List<RawTick>> GetLapTicksRawAsync(Guid sessionId, DateTime from, DateTime to);

    /// <summary>
    /// Per-lap time bounds for a protocol-v2 session, derived from transitions of the <c>lap</c> field
    /// under <c>msgType == "tick"</c> (min/max <c>_time</c> per lap value). Ordered by lap number.
    /// </summary>
    Task<List<(DateTime start, DateTime end)>> GetV2LapBoundsAsync(Guid sessionId);
}

/// <summary>One un-aggregated archive row: every field the tick carried, at its own timestamp.</summary>
public class RawTick
{
    public DateTime Time { get; set; }
    public string MsgType { get; set; } = "";
    public Dictionary<string, double> Fields { get; set; } = new();
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
