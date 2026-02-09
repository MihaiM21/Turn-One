using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetUserNotifications([FromQuery] int limit = 50)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var notifications = await _notificationService.GetUserNotificationsAsync(userId, limit);
                return Ok(new { success = true, data = notifications });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetUserNotifications: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetNotificationStats()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var stats = await _notificationService.GetUserNotificationStatsAsync(userId);
                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetNotificationStats: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [HttpPost("{notificationId}/read")]
        public async Task<IActionResult> MarkAsRead(Guid notificationId)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var success = await _notificationService.MarkAsReadAsync(userId, notificationId);
                
                if (!success)
                    return NotFound(new { success = false, message = "Notification not found" });

                return Ok(new { success = true, message = "Notification marked as read" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in MarkAsRead: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                await _notificationService.MarkAllAsReadAsync(userId);
                return Ok(new { success = true, message = "All notifications marked as read" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in MarkAllAsRead: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        // Admin endpoints
        [Authorize(Roles = "ADMIN")]
        [HttpGet("all")]
        public async Task<IActionResult> GetAllNotifications()
        {
            try
            {
                var notifications = await _notificationService.GetAllNotificationsAsync();
                return Ok(new { success = true, data = notifications });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetAllNotifications: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [Authorize(Roles = "ADMIN")]
        [HttpPost]
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationDto notificationDto)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var notification = await _notificationService.CreateNotificationAsync(userId, notificationDto);
                return Ok(new { success = true, data = notification, message = "Notification created and sent successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in CreateNotification: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [Authorize(Roles = "ADMIN")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(Guid id)
        {
            try
            {
                var success = await _notificationService.DeleteNotificationAsync(id);
                if (!success)
                    return NotFound(new { success = false, message = "Notification not found" });

                return Ok(new { success = true, message = "Notification deleted successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in DeleteNotification: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }
    }
}
