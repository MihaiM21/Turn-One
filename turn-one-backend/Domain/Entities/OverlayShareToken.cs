using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities;

public class OverlayShareToken
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    [Required]
    [MaxLength(128)]
    public string Token { get; set; } = "";

    [MaxLength(64)]
    public string? Label { get; set; }

    [MaxLength(256)]
    public string? Scopes { get; set; } // comma-separated: cockpit,lap,leaderboard

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
}
