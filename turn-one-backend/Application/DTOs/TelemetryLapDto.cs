namespace Application.DTOs;

public class TelemetryLapDto
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public int LapNumber { get; set; }
    public int? LapTimeMs { get; set; }
    public int? Sector1Ms { get; set; }
    public int? Sector2Ms { get; set; }
    public int? Sector3Ms { get; set; }
    public bool IsValid { get; set; }
    public float MaxSpeedKmh { get; set; }
    public int MaxRpm { get; set; }
    public float AverageThrottle { get; set; }
    public float AverageBrake { get; set; }
    public float FuelUsed { get; set; }
    public DateTime RecordedAt { get; set; }
}
