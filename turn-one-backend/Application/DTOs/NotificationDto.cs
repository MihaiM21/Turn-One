namespace Application.DTOs
{
    public class NotificationDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = "INFO";
        public string TargetAudience { get; set; } = "ALL";
        public string? TargetPlans { get; set; }
        public string? TargetRoles { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedByUsername { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
    }

    public class CreateNotificationDto
    {
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = "INFO"; // INFO, SUCCESS, WARNING, ERROR
        public string TargetAudience { get; set; } = "ALL"; // ALL, PLAN, ROLE
        public List<string>? TargetPlans { get; set; } // ["BASIC", "PRO", "ELITE"]
        public List<string>? TargetRoles { get; set; } // ["USER", "CONTENT_CREATOR", "ADMIN"]
    }

    public class UserNotificationDto
    {
        public Guid Id { get; set; }
        public Guid NotificationId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = "INFO";
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime ReceivedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class NotificationStatsDto
    {
        public int TotalNotifications { get; set; }
        public int UnreadCount { get; set; }
        public int ReadCount { get; set; }
    }
}
