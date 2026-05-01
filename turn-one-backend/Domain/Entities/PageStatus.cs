namespace Domain.Entities;

public class PageStatus
{
    public int Id { get; set; }

    /// <summary>Unique slug identifying the page, e.g. "live", "generator"</summary>
    public string PageSlug { get; set; } = string.Empty;

    public bool IsDisabled { get; set; } = false;

    /// <summary>Optional custom message shown to users when the page is disabled.</summary>
    public string? MaintenanceMessage { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public string? UpdatedByUsername { get; set; }
}
