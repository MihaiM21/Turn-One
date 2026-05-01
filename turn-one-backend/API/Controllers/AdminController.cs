using System.Security.Claims;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "ADMIN")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IPageStatusService _pageStatusService;

    public AdminController(IAdminService adminService, IPageStatusService pageStatusService)
    {
        _adminService = adminService;
        _pageStatusService = pageStatusService;
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<User>>> GetAllUsers()
    {
        try
        {
            var users = await _adminService.GetAllUsersAsync();
            return Ok(users);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to retrieve users", error = ex.Message });
        }
    }

    [HttpGet("users/{userId:guid}")]
    public async Task<ActionResult<User>> GetUser(Guid userId)
    {
        try
        {
            var user = await _adminService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }
            return Ok(user);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to retrieve user", error = ex.Message });
        }
    }

    [HttpPut("users/{userId:guid}/plan")]
    public async Task<ActionResult> UpdateUserPlan(Guid userId, [FromBody] UpdatePlanRequest request)
    {
        try
        {
            var success = await _adminService.UpdateUserPlanAsync(userId, request.PlanType);
            if (!success)
            {
                return NotFound(new { message = "User not found" });
            }
            return Ok(new { message = "User plan updated successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to update user plan", error = ex.Message });
        }
    }

    [HttpPut("users/{userId:guid}/role")]
    public async Task<ActionResult> UpdateUserRole(Guid userId, [FromBody] UpdateRoleRequest request)
    {
        try
        {
            var success = await _adminService.UpdateUserRoleAsync(userId, request.Role);
            if (!success)
            {
                return NotFound(new { message = "User not found" });
            }
            return Ok(new { message = "User role updated successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to update user role", error = ex.Message });
        }
    }

    [HttpPut("users/{userId:guid}/tokens")]
    public async Task<ActionResult> UpdateUserTokens(Guid userId, [FromBody] int tokens)
    {
        try
        {
            var success = await _adminService.UpdateUserTokensAsync(userId, tokens);
            if (!success)
            {
                return NotFound(new { message = "User not found" });
            }
            return Ok(new { message = "User tokens updated successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to update user tokens", error = ex.Message });
        }
    }

    [HttpPut("users/{userId:guid}/coins")]
    public async Task<ActionResult> UpdateUserCoins(Guid userId, [FromBody] int coins)
    {
        try
        {
            var success = await _adminService.UpdateUserCoinsAsync(userId, coins);
            if (!success)
            {
                return NotFound(new { message = "User not found" });
            }
            return Ok(new { message = "User coins updated successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to update user tokens", error = ex.Message });
        }
    }

    [HttpDelete("users/{userId:guid}")]
    public async Task<ActionResult> DeleteUser(Guid userId)
    {
        try
        {
            // Prevent admin from deleting themselves
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId != null && Guid.Parse(currentUserId) == userId)
            {
                return BadRequest(new { message = "Cannot delete your own account" });
            }

            var success = await _adminService.DeleteUserAsync(userId);
            if (!success)
            {
                return NotFound(new { message = "User not found" });
            }
            return Ok(new { message = "User deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to delete user", error = ex.Message });
        }
    }

    [HttpGet("check")]
    public async Task<ActionResult> CheckAdminStatus()
    {
        try
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == null)
            {
                return Unauthorized();
            }

            var isAdmin = await _adminService.IsUserAdminAsync(Guid.Parse(currentUserId));
            return Ok(new { isAdmin });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to check admin status", error = ex.Message });
        }
    }

    [HttpGet("online-users")]
    public async Task<ActionResult> GetOnlineUsers([FromQuery] int minutes = 30)
    {
        try
        {
            var onlineUsers = await _adminService.GetOnlineUsersAsync(minutes);
            return Ok(new { 
                count = onlineUsers.Count,
                users = onlineUsers.Select(u => new {
                    id = u.Id,
                    username = u.Username,
                    email = u.Email,
                    role = u.Role.ToString(),
                    lastLogin = u.LastLogin,
                    avatarUrl = u.AvatarUrl
                })
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to retrieve online users", error = ex.Message });
        }
    }

    // ── Page Maintenance Endpoints ─────────────────────────────────────────

    /// <summary>Returns maintenance status for all managed pages. Admin only.</summary>
    [HttpGet("page-status")]
    public async Task<ActionResult> GetAllPageStatuses()
    {
        try
        {
            var statuses = await _pageStatusService.GetAllPageStatusesAsync();
            return Ok(statuses.Select(MapPageStatus));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to retrieve page statuses", error = ex.Message });
        }
    }

    /// <summary>Updates the maintenance status for a page. Admin only.</summary>
    [HttpPut("page-status/{slug}")]
    public async Task<ActionResult> SetPageStatus(string slug, [FromBody] SetPageStatusRequest request)
    {
        try
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            string username = "admin";
            if (currentUserId != null)
            {
                var user = await _adminService.GetUserByIdAsync(Guid.Parse(currentUserId));
                username = user?.Username ?? "admin";
            }

            var status = await _pageStatusService.SetPageStatusAsync(
                slug,
                request.IsDisabled,
                request.MaintenanceMessage,
                username);

            return Ok(MapPageStatus(status));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to update page status", error = ex.Message });
        }
    }

    private static object MapPageStatus(Domain.Entities.PageStatus s) => new
    {
        pageSlug = s.PageSlug,
        isDisabled = s.IsDisabled,
        maintenanceMessage = s.MaintenanceMessage,
        updatedAt = s.UpdatedAt,
        updatedByUsername = s.UpdatedByUsername,
    };
}

/// <summary>Public endpoint — no ADMIN role required, exposes no sensitive data.</summary>
[ApiController]
[Route("api/pages")]
public class PageStatusPublicController : ControllerBase
{
    private readonly IPageStatusService _pageStatusService;

    public PageStatusPublicController(IPageStatusService pageStatusService)
    {
        _pageStatusService = pageStatusService;
    }

    /// <summary>Returns the maintenance status for a single page. No auth required.</summary>
    [HttpGet("{slug}")]
    public async Task<ActionResult> GetPageStatus(string slug)
    {
        try
        {
            var status = await _pageStatusService.GetPageStatusAsync(slug);
            return Ok(new
            {
                pageSlug = status.PageSlug,
                isDisabled = status.IsDisabled,
                maintenanceMessage = status.MaintenanceMessage,
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to retrieve page status", error = ex.Message });
        }
    }
}

public class UpdatePlanRequest
{
    public PlanType PlanType { get; set; }
}

public class UpdateRoleRequest
{
    public Role Role { get; set; }
}

public class SetPageStatusRequest
{
    public bool IsDisabled { get; set; }
    public string? MaintenanceMessage { get; set; }
}