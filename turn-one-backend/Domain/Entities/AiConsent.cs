using System.ComponentModel.DataAnnotations;

namespace Domain.Entities;

/// <summary>
/// HCR-015 — a driver's separate, opt-in consent to their laps and coaching feedback being used to
/// train Turn One's own model later (plan D8 / D12). Off unless granted; versioned so a changed
/// purpose needs a new yes.
/// </summary>
public class AiConsent
{
    /// <summary>Bump when what the data is used for changes; older grants then no longer count.</summary>
    public const string CurrentVersion = "2026-11";

    [Key]
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    [Required, MaxLength(20)]
    public string Version { get; set; } = CurrentVersion;

    public bool Granted { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? GrantedAt { get; set; }
    public DateTime? WithdrawnAt { get; set; }
}
