namespace Domain.Entities;

public class ApiWishlist
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public DateTime SubscribedAt { get; set; } = DateTime.UtcNow;
    public bool IsNotified { get; set; } = false;
    public string? IpAddress { get; set; }
}
