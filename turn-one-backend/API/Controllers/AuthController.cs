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
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly TurnOneDbContext _context;

    public AuthController(IAuthService authService, TurnOneDbContext context)
    {
        _authService = authService;
        _context = context;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto registerDto)
    {
        var response = await _authService.Register(registerDto);
        
        if (!response.Success)
        {
            return BadRequest(response);
        }
        
        return Ok(response);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
    {
        var response = await _authService.Login(loginDto);
        
        if (!response.Success)
        {
            return Unauthorized(response);
        }
        
        return Ok(response);
    }
    
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<object>> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
        {
            return Unauthorized("Invalid user ID in token");
        }
        
        // Fetch complete user data from database to ensure we have latest information
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userGuid);
        
        if (user == null)
        {
            return NotFound("User not found");
        }
        
        return Ok(new
        {
            Id = user.Id.ToString(),
            Username = user.Username,
            Email = user.Email,
            Plan = user.Plan.ToString(),
            CreatedAt = user.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            AvatarUrl = user.AvatarUrl,
            Tokens = user.Tokens,
            Coins = user.Coins,
            Role = user.Role.ToString(),
            PlanStartDate = user.PlanStartDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            PlanEndDate = user.PlanEndDate?.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            AutoRenew = user.AutoRenew,
            LastTokenRefillDate = user.LastTokenRefillDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            LastLogin = user.LastLogin?.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        });
    }
    
}