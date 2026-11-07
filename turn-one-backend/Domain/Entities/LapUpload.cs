using System.ComponentModel.DataAnnotations;

namespace Domain.Entities;

/// <summary>
/// One lap Turn One Link uploaded after the fact (HCR-007). The idempotency key makes retries safe:
/// the same key from the same user is answered from this row instead of being processed twice.
/// </summary>
public class LapUpload
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid UserId { get; set; }

    public Guid? DeviceId { get; set; }

    [Required]
    public Guid SessionId { get; set; }

    public int LapNumber { get; set; }

    /// <summary>Client-chosen key, "&lt;sessionId&gt;:&lt;lap&gt;:&lt;sha256&gt;".</summary>
    [Required]
    [MaxLength(200)]
    public string IdempotencyKey { get; set; } = "";

    /// <summary>SHA-256 (hex) of the uncompressed body.</summary>
    [Required]
    [MaxLength(64)]
    public string ContentHash { get; set; } = "";

    public int SizeBytes { get; set; }
    public int TickCount { get; set; }

    /// <summary>queued · duplicate (the lap already existed) · rejected.</summary>
    [MaxLength(20)]
    public string Status { get; set; } = "queued";

    [MaxLength(300)]
    public string? Error { get; set; }

    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
}
