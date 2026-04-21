using System.Text.Json;
using Domain.Enums;

namespace Application.Interfaces;

public interface ITelemetryTickRepository
{
    Task BatchWriteTicksAsync(PlanType planType, IEnumerable<TickRecord> ticks);
}

public class TickRecord
{
    public Guid SessionId { get; set; }
    public DateTime Timestamp { get; set; }
    public string MessageType { get; set; } = "";
    public JsonElement Payload { get; set; }
}
