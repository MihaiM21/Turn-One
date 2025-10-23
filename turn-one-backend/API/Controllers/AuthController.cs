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
    private readonly IDailyGiftService _dailyGiftService;
    private readonly IEmailService _emailService;

    public AuthController(
        IAuthService authService, 
        TurnOneDbContext context, 
        IDailyGiftService dailyGiftService,
        IEmailService emailService)
    {
        _authService = authService;
        _context = context;
        _dailyGiftService = dailyGiftService;
        _emailService = emailService;
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

        // Check if the user can claim a daily gift
        bool canClaimDailyGift = await _dailyGiftService.CanClaimDailyGiftAsync(userGuid);
        
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
            Level = user.Level,
            Experience = user.Experience,
            Role = user.Role.ToString(),
            PlanStartDate = user.PlanStartDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            PlanEndDate = user.PlanEndDate?.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            AutoRenew = user.AutoRenew,
            LastTokenRefillDate = user.LastTokenRefillDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            LastLogin = user.LastLogin?.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            LastDailyGiftDate = user.LastDailyGiftDate?.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            CanClaimDailyGift = canClaimDailyGift,
            IsEmailConfirmed = user.IsEmailConfirmed
        });
    }
    
    [HttpGet("confirm-email")]
    public async Task<ActionResult<object>> ConfirmEmail([FromQuery] string token)
    {
        if (string.IsNullOrEmpty(token))
        {
            return BadRequest(new { success = false, message = "Token is required" });
        }
        
        var result = await _authService.ConfirmEmailAsync(token);
        
        if (!result)
        {
            return BadRequest(new { success = false, message = "Invalid or expired token" });
        }
        
        return Ok(new { success = true, message = "Email confirmed successfully" });
    }
    
    [HttpPost("forgot-password")]
    public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordDto forgotPasswordDto)
    {
        if (string.IsNullOrEmpty(forgotPasswordDto.Email))
        {
            return BadRequest(new { success = false, message = "Email is required" });
        }
        
        await _authService.RequestPasswordResetAsync(forgotPasswordDto.Email);
        
        // Always return success to prevent email enumeration attacks
        return Ok(new { 
            success = true, 
            message = "If your email is registered with us, you will receive a password reset link shortly." 
        });
    }
    
    [HttpPost("reset-password")]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordDto resetPasswordDto)
    {
        if (string.IsNullOrEmpty(resetPasswordDto.Token) || string.IsNullOrEmpty(resetPasswordDto.Password))
        {
            return BadRequest(new { success = false, message = "Token and password are required" });
        }
        
        if (resetPasswordDto.Password != resetPasswordDto.ConfirmPassword)
        {
            return BadRequest(new { success = false, message = "Passwords do not match" });
        }
        
        var result = await _authService.ResetPasswordAsync(resetPasswordDto.Token, resetPasswordDto.Password);
        
        if (!result)
        {
            return BadRequest(new { success = false, message = "Invalid or expired token" });
        }
        
        return Ok(new { success = true, message = "Password has been reset successfully" });
    }
}