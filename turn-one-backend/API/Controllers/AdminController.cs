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

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
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
}

public class UpdatePlanRequest
{
    public PlanType PlanType { get; set; }
}

public class UpdateRoleRequest
{
    public Role Role { get; set; }
}