using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services
{
    public class NotificationService : INotificationService
    {
        private readonly TurnOneDbContext _context;

        public NotificationService(TurnOneDbContext context)
        {
            _context = context;
        }

        public async Task<NotificationDto> CreateNotificationAsync(Guid createdByUserId, CreateNotificationDto notificationDto)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                Title = notificationDto.Title,
                Message = notificationDto.Message,
                Type = notificationDto.Type,
                TargetAudience = notificationDto.TargetAudience,
                TargetPlans = notificationDto.TargetPlans != null ? string.Join(",", notificationDto.TargetPlans) : null,
                TargetRoles = notificationDto.TargetRoles != null ? string.Join(",", notificationDto.TargetRoles) : null,
                CreatedById = createdByUserId,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();

            // Determine target users based on audience
            var targetUsers = await GetTargetUsersAsync(notificationDto);

            // Create UserNotification entries for each target user
            var userNotifications = targetUsers.Select(user => new UserNotification
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                NotificationId = notification.Id,
                IsRead = false,
                ReceivedAt = DateTime.UtcNow
            }).ToList();

            await _context.UserNotifications.AddRangeAsync(userNotifications);
            await _context.SaveChangesAsync();

            var creator = await _context.Users.FindAsync(createdByUserId);

            return new NotificationDto
            {
                Id = notification.Id,
                Title = notification.Title,
                Message = notification.Message,
                Type = notification.Type,
                TargetAudience = notification.TargetAudience,
                TargetPlans = notification.TargetPlans,
                TargetRoles = notification.TargetRoles,
                CreatedAt = notification.CreatedAt,
                CreatedByUsername = creator?.Username ?? "Admin",
                IsRead = false
            };
        }

        private async Task<List<User>> GetTargetUsersAsync(CreateNotificationDto notificationDto)
        {
            var query = _context.Users.AsQueryable();

            if (notificationDto.TargetAudience == "PLAN" && notificationDto.TargetPlans != null && notificationDto.TargetPlans.Any())
            {
                query = query.Where(u => notificationDto.TargetPlans.Contains(u.Plan.ToString()));
            }
            else if (notificationDto.TargetAudience == "ROLE" && notificationDto.TargetRoles != null && notificationDto.TargetRoles.Any())
            {
                query = query.Where(u => notificationDto.TargetRoles.Contains(u.Role.ToString()));
            }
            // If "ALL", no filter - returns all users

            return await query.ToListAsync();
        }

        public async Task<List<UserNotificationDto>> GetUserNotificationsAsync(Guid userId, int limit = 50)
        {
            var notifications = await _context.UserNotifications
                .Include(un => un.Notification)
                .Where(un => un.UserId == userId && un.Notification.IsActive)
                .OrderByDescending(un => un.ReceivedAt)
                .Take(limit)
                .Select(un => new UserNotificationDto
                {
                    Id = un.Id,
                    NotificationId = un.NotificationId,
                    Title = un.Notification.Title,
                    Message = un.Notification.Message,
                    Type = un.Notification.Type,
                    IsRead = un.IsRead,
                    ReadAt = un.ReadAt,
                    ReceivedAt = un.ReceivedAt,
                    CreatedAt = un.Notification.CreatedAt
                })
                .ToListAsync();

            return notifications;
        }

        public async Task<NotificationStatsDto> GetUserNotificationStatsAsync(Guid userId)
        {
            var stats = await _context.UserNotifications
                .Where(un => un.UserId == userId && un.Notification.IsActive)
                .GroupBy(un => un.IsRead)
                .Select(g => new { IsRead = g.Key, Count = g.Count() })
                .ToListAsync();

            var unreadCount = stats.FirstOrDefault(s => !s.IsRead)?.Count ?? 0;
            var readCount = stats.FirstOrDefault(s => s.IsRead)?.Count ?? 0;

            return new NotificationStatsDto
            {
                TotalNotifications = unreadCount + readCount,
                UnreadCount = unreadCount,
                ReadCount = readCount
            };
        }

        public async Task<bool> MarkAsReadAsync(Guid userId, Guid notificationId)
        {
            var userNotification = await _context.UserNotifications
                .FirstOrDefaultAsync(un => un.UserId == userId && un.NotificationId == notificationId);

            if (userNotification == null)
                return false;

            userNotification.IsRead = true;
            userNotification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> MarkAllAsReadAsync(Guid userId)
        {
            var userNotifications = await _context.UserNotifications
                .Where(un => un.UserId == userId && !un.IsRead)
                .ToListAsync();

            if (!userNotifications.Any())
                return false;

            foreach (var notification in userNotifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteNotificationAsync(Guid notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification == null)
                return false;

            notification.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<NotificationDto>> GetAllNotificationsAsync()
        {
            var notifications = await _context.Notifications
                .Include(n => n.CreatedBy)
                .Include(n => n.UserNotifications)
                .Where(n => n.IsActive)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    Message = n.Message,
                    Type = n.Type,
                    TargetAudience = n.TargetAudience,
                    TargetPlans = n.TargetPlans,
                    TargetRoles = n.TargetRoles,
                    CreatedAt = n.CreatedAt,
                    CreatedByUsername = n.CreatedBy.Username,
                    IsRead = false // Admin view doesn't need read status
                })
                .ToListAsync();

            return notifications;
        }
    }
}
