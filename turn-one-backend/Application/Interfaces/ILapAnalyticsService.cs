using Domain.Enums;

namespace Application.Interfaces;

public interface ILapAnalyticsService
{
    Task<LapMetrics?> ComputeLapMetricsAsync(PlanType plan, Guid sessionId, int lapNumber, bool persist = true);
    Task<List<LapMetrics>> ComputeSessionMetricsAsync(PlanType plan, Guid sessionId);
}

public class LapMetrics
{
    public int LapNumber { get; set; }
    public int? LapTimeMs { get; set; }
    public float BrakingScore { get; set; }
    public float ThrottleScore { get; set; }
    public float ConsistencyScore { get; set; }
    public int? DeltaToBestMs { get; set; }
    public int? Sector1DeltaMs { get; set; }
    public int? Sector2DeltaMs { get; set; }
    public int? Sector3DeltaMs { get; set; }
}
