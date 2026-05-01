using System.Text.Json;
using Domain.Enums;

namespace Application.Interfaces;

public interface ITelemetryTickRepository
{
    Task BatchWriteTicksAsync(PlanType planType, IEnumerable<TickRecord> ticks);
    Task<List<ChartPoint>> GetSessionPhysicsChartAsync(PlanType planType, Guid sessionId);
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

public class TickRecord
{
    public Guid SessionId { get; set; }
    public DateTime Timestamp { get; set; }
    public string MessageType { get; set; } = "";
    public JsonElement Payload { get; set; }
}
