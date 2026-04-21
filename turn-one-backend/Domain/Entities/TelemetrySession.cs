using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domain.Enums;

namespace Domain.Entities;

public class TelemetrySession
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    public Guid UserId { get; set; }
    
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
    
    [Required]
    [MaxLength(100)]
    public string CarModel { get; set; } = "";
    
    [Required]
    [MaxLength(100)]
    public string Track { get; set; } = "";
    
    [Required]
    [MaxLength(100)]
    public string DriverName { get; set; } = "";
    
    [Required]
    [MaxLength(50)]
    public string SessionType { get; set; } = ""; 
    
    public TelemetryMode Mode { get; set; } = TelemetryMode.Normal;
    public TelemetryVisibility Visibility { get; set; } = TelemetryVisibility.Private;
    public bool IsActive { get; set; } = true;
    public int LapCount { get; set; } = 0;
    
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAt { get; set; }
    
    public ICollection<TelemetryLap> Laps { get; set; } = new List<TelemetryLap>();
}
