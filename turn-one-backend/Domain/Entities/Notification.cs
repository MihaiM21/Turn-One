namespace Domain.Entities
{
    public class Notification
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = "INFO"; // INFO, SUCCESS, WARNING, ERROR
        public string TargetAudience { get; set; } = "ALL"; // ALL, PLAN, ROLE
        public string? TargetPlans { get; set; } // Comma-separated: "BASIC,PRO" or null for ALL
        public string? TargetRoles { get; set; } // Comma-separated: "USER,CONTENT_CREATOR" or null for ALL
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Guid CreatedById { get; set; }
        public User CreatedBy { get; set; } = null!;
        public bool IsActive { get; set; } = true;
        
        // Navigation
        public ICollection<UserNotification> UserNotifications { get; set; } = new List<UserNotification>();
    }
    
    public class UserNotification
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public Guid NotificationId { get; set; }
        public Notification Notification { get; set; } = null!;
        public bool IsRead { get; set; } = false;
        public DateTime? ReadAt { get; set; }
        public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
    }
}
