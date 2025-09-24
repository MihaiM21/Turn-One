using Domain.Enums;

namespace Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string Username { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public Role Role { get; set; } = Role.USER;
    
    public PlanType Plan { get; set; } = PlanType.BASIC;
    public DateTime PlanStartDate { get; set; } = DateTime.UtcNow;
    public DateTime? PlanEndDate { get; set; }
    public bool AutoRenew { get; set; } = false;
    
    public int Tokens { get; set; } = 30;
    public DateTime LastTokenRefillDate { get; set; } = DateTime.UtcNow;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLogin { get; set; }
}