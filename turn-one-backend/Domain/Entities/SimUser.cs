using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities;

public class SimUser
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    public Guid UserId { get; set; }
    
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
    
    public int TotalSessions { get; set; } = 0;
    public int TotalLaps { get; set; } = 0;
    public double TotalDistanceKm { get; set; } = 0;
    public int TotalPlayTimeSeconds { get; set; } = 0;
    public float HighestSpeedKmh { get; set; } = 0;
    public DateTime LastSessionAt { get; set; } = DateTime.UtcNow;
}
