using System.Security.Claims;
using Application.DTOs;
using Application.Interfaces;
using Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly TurnOneDbContext _context;

    public UserController(IUserService userService, TurnOneDbContext context)
    {
        _userService = userService;
        _context = context;
    }

    [Authorize]
    [HttpPut("update-profile")]
    public async Task<ActionResult> UpdateUsername([FromBody] UpdatedUserDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var result = await _userService.UpdateUserProfile(userId, dto);
        if (!result)
        {
            return BadRequest(new { Message = "Failed to update user profile." });
        }

        return NoContent();
    }
}