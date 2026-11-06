using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities;

/// <summary>A paired Turn One Link install (HCR-006). Revoking it ends all of its tokens.</summary>
public class Device
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = "";

    [MaxLength(20)]
    public string Platform { get; set; } = "windows";

    [MaxLength(40)]
    public string? AppVersion { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastSeenAt { get; set; }
    public DateTime? RevokedAt { get; set; }
}

/// <summary>
/// An open "sign in on the website" request: Link shows <see cref="UserCode"/>, the user approves it
/// at turnonehub.com/link, Link polls with the secret device code (stored hashed).
/// </summary>
public class DevicePairing
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(64)]
    public string DeviceCodeHash { get; set; } = "";

    [Required]
    [MaxLength(9)]
    public string UserCode { get; set; } = "";

    [Required]
    [MaxLength(100)]
    public string DeviceName { get; set; } = "";

    [MaxLength(20)]
    public string Platform { get; set; } = "windows";

    [MaxLength(40)]
    public string? AppVersion { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? LastPolledAt { get; set; }

    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }

    /// <summary>Set once the device has collected its tokens; the pairing can't be used again.</summary>
    public Guid? DeviceId { get; set; }
}

/// <summary>Rotating refresh token of a <see cref="Device"/> (stored hashed). Reuse of a rotated token revokes the device.</summary>
public class DeviceRefreshToken
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid DeviceId { get; set; }

    [ForeignKey("DeviceId")]
    public Device Device { get; set; } = null!;

    [Required]
    [MaxLength(64)]
    public string TokenHash { get; set; } = "";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public Guid? ReplacedById { get; set; }
}
