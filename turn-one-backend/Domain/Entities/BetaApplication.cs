using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// A driver's application to the sim-racing closed beta (Jan 2027, 20–50 pilots). One per user;
/// the user edits their answers, only an admin moves <see cref="Status"/>. Accepted rows are the
/// "free sim users" milestone count.
/// </summary>
public class BetaApplication
{
    public const int NoteMaxLength = 500;

    [Key]
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>The sims the driver plays and would test with. Never contains <see cref="SimSource.Unknown"/>.</summary>
    public List<SimSource> Sims { get; set; } = new();

    public BetaPlatform Platform { get; set; } = BetaPlatform.Pc;
    public BetaInput Input { get; set; } = BetaInput.Wheel;

    [MaxLength(NoteMaxLength)]
    public string? Note { get; set; }

    public BetaApplicationStatus Status { get; set; } = BetaApplicationStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    /// <summary>When an admin last accepted or declined; null while pending.</summary>
    public DateTime? ReviewedAt { get; set; }
}
