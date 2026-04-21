using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities;

public class TelemetryLap
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    public Guid SessionId { get; set; }
    
    [ForeignKey("SessionId")]
    public TelemetrySession Session { get; set; } = null!;
    
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
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}
