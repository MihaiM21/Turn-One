using Application.DTOs;

namespace Application.Interfaces
{
    public interface INotificationService
    {
        Task<NotificationDto> CreateNotificationAsync(Guid createdByUserId, CreateNotificationDto notificationDto);
        Task<List<UserNotificationDto>> GetUserNotificationsAsync(Guid userId, int limit = 50);
        Task<NotificationStatsDto> GetUserNotificationStatsAsync(Guid userId);
        Task<bool> MarkAsReadAsync(Guid userId, Guid notificationId);
        Task<bool> MarkAllAsReadAsync(Guid userId);
        Task<bool> DeleteNotificationAsync(Guid notificationId);
        Task<List<NotificationDto>> GetAllNotificationsAsync();
    }
}
